import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { generatePostVariations, VariationType } from '@/lib/integrations/openrouter'
import { randomUUID } from 'crypto'
import { getAuthUser } from '@/utils/supabase/auth-helper'

/**
 * POST /api/suflate/amplify
 * Story 1.5: Amplify Voice Note into Post Variations
 * 
 * Generates LinkedIn post variations from a transcribed voice note
 * - If variationType is provided: generates 3 variations of that type
 * - If no variationType: generates 5 variations (one of each type)
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check using helper that handles cookie parsing
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service client to bypass RLS (we verify ownership via workspace membership)
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const body = await request.json()
    const { transcriptionId, variationType, replaceExisting = true } = body

    if (!transcriptionId) {
      return NextResponse.json(
        { error: 'transcriptionId is required' },
        { status: 400 }
      )
    }

    // Validate variationType if provided
    const validTypes: VariationType[] = ['professional', 'personal', 'actionable', 'discussion', 'bold']
    if (variationType && !validTypes.includes(variationType)) {
      return NextResponse.json(
        { error: 'Invalid variationType. Must be one of: professional, personal, actionable, discussion, bold' },
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
      console.error('Transcription fetch error:', transcriptionError)
      return NextResponse.json(
        { error: 'Transcription not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this transcription's workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', transcription.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Unauthorized access to this transcription' },
        { status: 403 }
      )
    }

    // Delete existing posts of this type before creating new ones (default behavior)
    if (replaceExisting) {
      if (variationType) {
        // Delete only posts of the specific variation type
        await supabase
          .from('posts')
          .delete()
          .eq('transcription_id', transcriptionId)
          .eq('user_id', user.id)
          .eq('variation_type', variationType)
          .eq('status', 'draft') // Only delete drafts, not published/scheduled
        
        console.log(`[Amplify] Deleted existing ${variationType} drafts for transcription ${transcriptionId}`)
      } else {
        // Delete all draft posts for this transcription (when generating all 5 types)
        await supabase
          .from('posts')
          .delete()
          .eq('transcription_id', transcriptionId)
          .eq('user_id', user.id)
          .eq('status', 'draft') // Only delete drafts, not published/scheduled
        
        console.log(`[Amplify] Deleted all existing drafts for transcription ${transcriptionId}`)
      }
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
    const expectedVariationCount = variationType ? 3 : 5
    
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
      variation_count: expectedVariationCount,
      started_at: new Date().toISOString(),
    })

    // Generate post variations via OpenRouter
    let amplificationResult
    try {
      amplificationResult = await generatePostVariations(transcriptText, {
        variationCount: expectedVariationCount,
        variationType: variationType as VariationType | undefined,
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
    // If specific type requested, all variations get that type
    // Otherwise, each gets a different type
    const allVariationTypes: Array<'professional' | 'personal' | 'actionable' | 'discussion' | 'bold'> = [
      'professional',
      'personal',
      'actionable',
      'discussion',
      'bold',
    ]

    // Create post records for each variation
    const posts: any[] = []
    const errors: any[] = []

    const maxVariations = variationType ? 3 : 5
    for (let i = 0; i < Math.min(variations.length, maxVariations); i++) {
      const variationText = variations[i]
      // If specific type, all get that type; otherwise, cycle through types
      const postVariationType = variationType || allVariationTypes[i] || 'professional'

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
          variation_type: postVariationType,
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
