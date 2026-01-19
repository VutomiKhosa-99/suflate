import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'audio/m4a',
  'audio/mp4',
]

export async function POST(request: NextRequest) {
  try {
    // Authentication check - Epic 2
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Validate file type (Story 1.2)
    if (!ALLOWED_MIME_TYPES.includes(audioFile.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: MP3, WAV, WebM, OGG, M4A' },
        { status: 400 }
      )
    }

    // Validate file size (Story 1.2)
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      )
    }

    // Note: Duration validation (1 second to 3 minutes) will be done during transcription
    // Client-side validation attempts to check duration, but server-side validation
    // happens during AssemblyAI transcription process

    // Get user's default workspace - Epic 2
    const userId = user.id
    
    // Get user's default workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Failed to get workspace. Please contact support.' },
        { status: 500 }
      )
    }

    const workspaceId = workspace.id

    const recordingId = randomUUID()
    const timestamp = Date.now()
    const fileExtension = audioFile.name.split('.').pop() || 'webm'
    const fileName = `${timestamp}-${recordingId}.${fileExtension}`
    const storagePath = `${workspaceId}/voice-recordings/${userId}/${fileName}`

    // Use service role client for storage uploads (bypasses RLS)
    // This is needed because we're using placeholder auth for testing
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Upload to Supabase Storage using service client (bypasses RLS)
    
    // Get actual file buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data: uploadData, error: uploadError } = await serviceClient.storage
      .from('voice-recordings')
      .upload(storagePath, buffer, {
        contentType: audioFile.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to upload file to storage'
      if (uploadError.message?.includes('Bucket not found')) {
        errorMessage = 'Storage bucket "voice-recordings" not found. Please create it in Supabase Storage.'
      } else if (uploadError.message?.includes('new row violates row-level security')) {
        errorMessage = 'Storage bucket permissions issue. Please check RLS policies in Supabase.'
      } else if (uploadError.message) {
        errorMessage = `Upload error: ${uploadError.message}`
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }

    // Get file duration (approximate - will be verified during transcription)
    // For now, we'll estimate or let AssemblyAI determine it
    const estimatedDuration = null // Will be determined during transcription

    // Create voice_recordings record
    const { data: recordingData, error: dbError } = await supabase
      .from('voice_recordings')
      .insert({
        id: recordingId,
        workspace_id: workspaceId,
        user_id: userId,
        storage_path: storagePath,
        file_size_bytes: audioFile.size,
        duration_seconds: estimatedDuration,
        status: 'uploaded',
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Clean up uploaded file if DB insert fails
      await serviceClient.storage.from('voice-recordings').remove([storagePath])
      
      return NextResponse.json(
        { error: 'Failed to create recording record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      recordingId,
      storagePath,
      fileSize: audioFile.size,
      status: 'uploaded',
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
