import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { getAuthUser } from '@/utils/supabase/auth-helper'

/**
 * GET /api/suflate/voice/list
 * Fetch all voice recordings and public links for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = createServiceClient()

    // Get user's workspace
    const { data: membership } = await serviceClient
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)
      .single() as { data: { workspace_id: string } | null }

    if (!membership) {
      // Return empty array if no workspace
      return NextResponse.json({ voiceNotes: [] })
    }

    // Fetch voice recordings with transcription status (use service client to bypass RLS)
    const { data: recordings, error } = await serviceClient
      .from('voice_recordings')
      .select(`
        id,
        storage_path,
        duration_seconds,
        file_size_bytes,
        status,
        created_at,
        updated_at,
        transcriptions (
          id,
          raw_text,
          processed_text,
          detected_content_type
        )
      `)
      .eq('workspace_id', membership.workspace_id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }) as { data: any[] | null; error: any }

    if (error) {
      console.error('Error fetching voice recordings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch voice notes' },
        { status: 500 }
      )
    }

    // Transform to match VoiceNote interface
    const voiceNotes = (recordings || []).map(recording => {
      const transcriptionText = recording.transcriptions?.[0]?.processed_text || 
                                 recording.transcriptions?.[0]?.raw_text || ''
      
      // Generate title from first sentence
      const firstSentence = transcriptionText.split(/[.!?]/)[0]?.trim() || ''
      const title = firstSentence.length > 60 
        ? firstSentence.substring(0, 60) + '...'
        : firstSentence || undefined
      
      // Generate summary - take 2-3 sentences
      const sentences = transcriptionText.split(/[.!?]/).filter((s: string) => s.trim().length > 10)
      const summary = sentences.length > 1 
        ? sentences.slice(1, 3).join('. ').trim() + (sentences.length > 3 ? '...' : '')
        : undefined

      return {
        id: recording.id,
        title,
        summary,
        duration_seconds: recording.duration_seconds,
        status: recording.status,
        created_at: recording.created_at,
        storage_path: recording.storage_path,
        type: 'recording' as const,
      }
    })

    // Fetch public links that are still pending (no recording uploaded yet)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const { data: publicLinks, error: publicLinksError } = await serviceClient
      .from('public_voice_links')
      .select('*')
      .eq('workspace_id', membership.workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active') // Only active links (not completed)
      .order('created_at', { ascending: false }) as { data: any[] | null; error: any }

    if (publicLinksError) {
      console.error('Error fetching public links:', publicLinksError)
    }

    // Transform public links to match VoiceNote interface
    const publicLinkNotes = (publicLinks || []).map(link => ({
      id: link.id,
      title: 'Public Link',
      summary: link.questions || undefined,
      status: 'pending' as const,
      created_at: link.created_at,
      type: 'public_link' as const,
      public_link: `${baseUrl}/public/voice-recording/${link.id}`,
      questions: link.questions || undefined,
    }))

    // Combine both lists
    const allNotes = [...voiceNotes, ...publicLinkNotes]

    return NextResponse.json({ voiceNotes: allNotes })
  } catch (error) {
    console.error('Voice list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch voice notes' },
      { status: 500 }
    )
  }
}
