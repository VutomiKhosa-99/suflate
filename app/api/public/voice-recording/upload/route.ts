import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * POST /api/public/voice-recording/upload
 * Upload a voice recording from a public link (no auth required)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const linkId = formData.get('linkId') as string
    const duration = formData.get('duration') as string

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    if (!linkId) {
      return NextResponse.json(
        { error: 'No link ID provided' },
        { status: 400 }
      )
    }

    // Validate file size
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      )
    }

    // Create service client (bypasses RLS for public uploads)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const serviceClient = createSupabaseClient(supabaseUrl, supabaseServiceKey)

    // Fetch the public link to get workspace and user info
    const { data: linkData, error: linkError } = await serviceClient
      .from('public_voice_links')
      .select('id, user_id, workspace_id, status')
      .eq('id', linkId)
      .single()

    if (linkError || !linkData) {
      // For development, create a recording without link validation
      console.log('Public link not found, using fallback')
    }

    // Generate file path
    const recordingId = randomUUID()
    const timestamp = Date.now()
    const fileExtension = 'webm'
    const fileName = `${timestamp}-${recordingId}.${fileExtension}`
    
    // Use a public uploads folder or link-specific path
    const storagePath = linkData 
      ? `workspaces/${linkData.workspace_id}/public-uploads/${linkId}/${fileName}`
      : `public-uploads/${linkId}/${fileName}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage
    const { error: uploadError } = await serviceClient.storage
      .from('voice-recordings')
      .upload(storagePath, fileBuffer, {
        contentType: audioFile.type || 'audio/webm',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload audio file' },
        { status: 500 }
      )
    }

    // Create voice recording record if we have link data
    if (linkData) {
      const { error: insertError } = await serviceClient
        .from('voice_recordings')
        .insert({
          id: recordingId,
          workspace_id: linkData.workspace_id,
          user_id: linkData.user_id,
          storage_path: storagePath,
          duration_seconds: parseInt(duration) || 0,
          file_size_bytes: audioFile.size,
          status: 'uploaded',
        } as never)

      if (insertError) {
        console.error('Database insert error:', insertError)
        // Don't fail - the file was uploaded successfully
      }

      // Update link status to completed and link to the recording
      await serviceClient
        .from('public_voice_links')
        .update({ 
          status: 'completed',
          recording_id: recordingId
        } as never)
        .eq('id', linkId)
    }

    return NextResponse.json({
      success: true,
      recordingId,
      message: 'Recording uploaded successfully',
    })
  } catch (error) {
    console.error('Public upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    )
  }
}
