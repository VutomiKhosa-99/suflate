import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getAuthUser } from '@/utils/supabase/auth-helper'

/**
 * PATCH /api/suflate/transcription/update
 * Story 1.4: Edit Transcription Before Amplification
 * 
 * Updates the processed_text field of a transcription
 * - Validates transcription exists
 * - Updates processed_text
 * - Preserves raw_text for reference
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authentication check using helper that handles cookie parsing
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create supabase client for database operations
    const supabase = await createClient()

    const body = await request.json()
    const { transcriptionId, processed_text } = body

    if (!transcriptionId) {
      return NextResponse.json(
        { error: 'transcriptionId is required' },
        { status: 400 }
      )
    }

    if (!processed_text || processed_text.trim().length === 0) {
      return NextResponse.json(
        { error: 'processed_text is required and cannot be empty' },
        { status: 400 }
      )
    }

    // Verify transcription exists
    const { data: existingTranscription, error: fetchError } = await supabase
      .from('transcriptions')
      .select('id')
      .eq('id', transcriptionId)
      .single()

    if (fetchError || !existingTranscription) {
      return NextResponse.json(
        { error: 'Transcription not found' },
        { status: 404 }
      )
    }

    // Update processed_text
    const { data: updatedTranscription, error: updateError } = await supabase
      .from('transcriptions')
      .update({
        processed_text: processed_text.trim(),
      })
      .eq('id', transcriptionId)
      .select()
      .single()

    if (updateError) {
      console.error('Database error updating transcription:', updateError)
      return NextResponse.json(
        { error: 'Failed to update transcription' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      transcription: updatedTranscription,
    })
  } catch (error) {
    console.error('Update transcription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
