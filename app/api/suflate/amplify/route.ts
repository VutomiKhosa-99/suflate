import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generatePostVariations } from '@/lib/integrations/openrouter'
import { randomUUID } from 'crypto'

/**
 * POST /api/suflate/amplify
 * Story 1.5: Amplify Voice Note into 5 Post Variations
 * 
 * Generates 5 LinkedIn post variations from a transcribed voice note
 * - Fetches transcription from database
 * - Calls OpenRouter API with voice preservation prompts
 * - Creates 5 post records with different variation types
 * - Creates amplification_jobs record to track processing
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check - Epic 2
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { transcriptionId } = body

    if (!transcriptionId) {
      return NextResponse.json(
        { error: 'transcriptionId is required' },
        { status: 400 }
      )
    }

    // Fetch transcription
    const { data: transcription, error: transcriptionError } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('id', transcriptionId)
      .single()

    if (transcriptionError || !transcription) {
      return NextResponse.json(
        { error: 'Transcription not found' },
        { status: 404 }
      )
    }

    // Use processed_text if available, otherwise raw_text
    const transcriptText = transcription.processed_text || transcription.raw_text

    if (!transcriptText || transcriptText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Transcription text is empty' },
        { status: 400 }
      )
    }

    // Create amplification_jobs record to track processing
    const jobId = randomUUID()
    const workspaceId = transcription.workspace_id
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Transcription has no workspace' },
        { status: 400 }
      )
    }

    await supabase.from('amplification_jobs').insert({
      id: jobId,
      workspace_id: workspaceId,
      transcription_id: transcriptionId,
      recording_id: transcription.recording_id,
      status: 'processing',
      variation_count: 5,
      started_at: new Date().toISOString(),
    })

    // Generate post variations via OpenRouter
    let amplificationResult
    try {
      amplificationResult = await generatePostVariations(transcriptText, {
        variationCount: 5,
        contentType: transcription.detected_content_type as any,
      })
    } catch (error) {
      // Update job status to failed
      await supabase
        .from('amplification_jobs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', jobId)

      console.error('OpenRouter API error:', error)
      return NextResponse.json(
        { error: 'Failed to generate post variations: ' + (error instanceof Error ? error.message : 'Unknown error') },
        { status: 500 }
      )
    }

    const variations = amplificationResult.variations || []

    if (variations.length === 0) {
      await supabase
        .from('amplification_jobs')
        .update({
          status: 'failed',
          error_message: 'No variations generated',
        })
        .eq('id', jobId)

      return NextResponse.json(
        { error: 'No variations generated' },
        { status: 500 }
      )
    }

    // Map variations to variation types
    const variationTypes: Array<'professional' | 'personal' | 'actionable' | 'discussion' | 'bold'> = [
      'professional',
      'personal',
      'actionable',
      'discussion',
      'bold',
    ]

    // Create post records for each variation
    const posts: any[] = []
    const errors: any[] = []

    for (let i = 0; i < Math.min(variations.length, 5); i++) {
      const variationText = variations[i]
      const variationType = variationTypes[i] || 'professional'

      const postId = randomUUID()

      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          id: postId,
          workspace_id: workspaceId,
          user_id: user.id,
          transcription_id: transcriptionId,
          source_type: 'voice',
          content: variationText,
          variation_type: variationType,
          status: 'draft',
        })
        .select()
        .single()

      if (postError) {
        console.error('Error creating post:', postError)
        errors.push({ variation: i + 1, error: postError.message })
      } else if (post) {
        posts.push(post)
      }
    }

    // Update amplification_jobs record
    await supabase
      .from('amplification_jobs')
      .update({
        status: posts.length > 0 ? 'complete' : 'failed',
        completed_variations: posts.length,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    if (posts.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create any posts', errors },
        { status: 500 }
      )
    }

    // TODO: Story 1.5 - Deduct credits (5 credits for 5 variations)
    // TODO: Story 1.5 - Cache results for similar transcriptions

    return NextResponse.json({
      success: true,
      posts,
      jobId,
      usage: amplificationResult.usage,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Amplification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
