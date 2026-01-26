import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { getWorkspaceId } from '@/lib/suflate/workspaces/service'

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

    // Resolve workspace (cookie or membership/owner). Do NOT create.
    const workspaceId = await getWorkspaceId(request, { id: user.id, email: user.email })
    if (!workspaceId) return NextResponse.json({ voiceNotes: [] })

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
      .eq('workspace_id', workspaceId)
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
        has_transcription: (recording.transcriptions && recording.transcriptions.length > 0) || false,
        duration_seconds: recording.duration_seconds,
        status: recording.status,
        created_at: recording.created_at,
        storage_path: recording.storage_path,
        type: 'recording' as const,
      }
    })

    // Fetch any cached transcription errors for these recordings (so UI can display)
    const recordingIds = voiceNotes.map(v => v.id)
    let errorMap: Record<string, string> = {}
    if (recordingIds.length > 0) {
      try {
        const keys = recordingIds.map(id => `workspace:${workspaceId}:transcription_error:${id}`)
        const { data: cacheRows } = await serviceClient
          .from('cache')
          .select('cache_key, cache_value')
          .in('cache_key', keys)

        if (cacheRows) {
          for (const row of cacheRows) {
            const keyParts = row.cache_key.split(':')
            const recId = keyParts[keyParts.length - 1]
            errorMap[recId] = row.cache_value?.message || ''
          }
        }
      } catch (err) {
        console.error('Error fetching transcription error cache:', err)
      }
    }

    // Attach error messages where present
    const voiceNotesWithErrors = voiceNotes.map(v => ({ ...v, transcription_error: errorMap[v.id] }))

    // Fetch public links that are still pending (no recording uploaded yet)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const { data: publicLinks, error: publicLinksError } = await serviceClient
      .from('public_voice_links')
      .select('*')
      .eq('workspace_id', workspaceId)
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
    const allNotes = [...voiceNotesWithErrors, ...publicLinkNotes]

    return NextResponse.json({ voiceNotes: allNotes })
  } catch (error) {
    console.error('Voice list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch voice notes' },
      { status: 500 }
    )
  }
}
