import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { transcribeAudioFromUrl } from '@/lib/integrations/assemblyai'
import { randomUUID } from 'crypto'
import { getAuthUser } from '@/utils/supabase/auth-helper'

/**
 * POST /api/suflate/voice/transcribe
 * Story 1.3: Transcribe Voice Note via AssemblyAI
 * 
 * Transcribes an uploaded voice recording using AssemblyAI
 * - Fetches recording from database
 * - Gets public URL from Supabase Storage
 * - Calls AssemblyAI transcription API
 * - Creates transcription record
 * - Updates recording status to 'transcribed'
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check using helper that handles cookie parsing
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service client to bypass RLS (we verify ownership manually)
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const body = await request.json()
    const { recordingId } = body

    if (!recordingId) {
      return NextResponse.json(
        { error: 'recordingId is required' },
        { status: 400 }
      )
    }

    // Fetch recording from database (verify user owns it)
    const { data: recording, error: recordingError } = await supabase
      .from('voice_recordings')
      .select('*')
      .eq('id', recordingId)
      .eq('user_id', user.id) // Ensure user owns this recording
      .single()

    if (recordingError || !recording) {
      console.error('Recording fetch error:', recordingError)
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      )
    }

    // Check if already transcribed
    if (recording.status === 'transcribed') {
      // Check for existing transcription
      const { data: existingTranscription } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('recording_id', recordingId)
        .single()

      if (existingTranscription) {
        return NextResponse.json({
          transcriptionId: existingTranscription.id,
          text: existingTranscription.raw_text,
          processedText: existingTranscription.processed_text,
          language: existingTranscription.detected_language,
          alreadyExists: true,
        })
      }
    }

    // Update recording status to 'transcribing'
    await supabase
      .from('voice_recordings')
      .update({ status: 'transcribing' })
      .eq('id', recordingId)

    // Get signed URL from Supabase Storage (valid for 1 hour)
    // Using signed URL because the bucket may not be public
    const { data: urlData, error: urlError } = await supabase.storage
      .from('voice-recordings')
      .createSignedUrl(recording.storage_path, 3600) // 1 hour expiry

    if (urlError || !urlData?.signedUrl) {
      console.error('Failed to create signed URL:', urlError)
      return NextResponse.json(
        { error: 'Failed to get audio file URL' },
        { status: 500 }
      )
    }

    console.log('Generated signed URL for audio file')

    // Transcribe audio via AssemblyAI
    let transcriptionResult
    try {
      transcriptionResult = await transcribeAudioFromUrl(urlData.signedUrl)
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)

      // Mark recording as failed
      try {
        await supabase
          .from('voice_recordings')
          .update({ status: 'failed' })
          .eq('id', recordingId)
      } catch (err) {
        console.error('Failed to update recording status to failed:', err)
      }

      // Persist a short error record in the cache table so the UI can show it
      try {
        const cacheKey = `workspace:${recording.workspace_id}:transcription_error:${recordingId}`
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        await supabase.from('cache').upsert({
          cache_key: cacheKey,
          cache_value: { message: errMsg },
          expires_at: expiresAt
        })
      } catch (err) {
        console.error('Failed to persist transcription error to cache:', err)
      }

      console.error('AssemblyAI transcription error:', error)
      return NextResponse.json(
        { error: 'Failed to transcribe audio', details: errMsg },
        { status: 500 }
      )
    }

    // TODO: Get workspace_id from user session once Epic 2 is implemented
    // Use recording's workspace_id
    const workspaceId = recording.workspace_id
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Recording has no workspace' },
        { status: 400 }
      )
    }

    const transcriptionId = randomUUID()

    // Create transcription record
    const { data: transcriptionData, error: transcriptionError } = await supabase
      .from('transcriptions')
      .insert({
        id: transcriptionId,
        recording_id: recordingId,
        workspace_id: workspaceId,
        raw_text: transcriptionResult.text,
        processed_text: transcriptionResult.text, // Same as raw for now, can be processed later
        detected_language: transcriptionResult.language_code || 'en',
        detected_content_type: null, // Will be detected in future enhancement
        transcription_model: 'assemblyai',
      })
      .select()
      .single()

    if (transcriptionError) {
      console.error('Database error creating transcription:', transcriptionError)
      
      // Update recording status back to 'uploaded' on error
      await supabase
        .from('voice_recordings')
        .update({ status: 'uploaded' })
        .eq('id', recordingId)

      return NextResponse.json(
        { error: 'Failed to create transcription record' },
        { status: 500 }
      )
    }

    // Update recording status to 'transcribed'
    await supabase
      .from('voice_recordings')
      .update({
        status: 'transcribed',
        // Update duration if available from transcription words
        // duration_seconds: transcriptionResult.words?.[transcriptionResult.words.length - 1]?.end || null,
      })
      .eq('id', recordingId)

    // TODO: Story 1.3 - Deduct credits (1 credit per minute, rounded up)
    // TODO: Story 1.3 - Cache transcription result for similar audio

    return NextResponse.json({
      transcriptionId: transcriptionData.id,
      text: transcriptionData.raw_text,
      processedText: transcriptionData.processed_text,
      language: transcriptionData.detected_language,
      status: 'completed',
    })
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
