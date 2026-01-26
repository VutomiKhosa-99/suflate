import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { repurposeContent } from '@/lib/integrations/openrouter'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { getWorkspaceId } from '@/lib/suflate/workspaces/service'
import { randomUUID } from 'crypto'

// Service client to bypass RLS
function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * POST /api/suflate/repurpose/tweet
 * Story 6.2: Repurpose Tweet Text into LinkedIn Posts
 * 
 * Expands tweet text into 3 LinkedIn post variations
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()
    const body = await request.json()
    const { text } = body

    if (!text) {
      return NextResponse.json(
        { error: 'Tweet text is required' },
        { status: 400 }
      )
    }

    // Validate text length
    if (text.trim().length < 10) {
      return NextResponse.json(
        { error: 'Text is too short. Please provide more content.' },
        { status: 400 }
      )
    }

    if (text.length > 1000) {
      return NextResponse.json(
        { error: 'Text is too long for tweet repurposing. Max 1000 characters.' },
        { status: 400 }
      )
    }

    // Resolve selected workspace (do NOT create)
    const workspaceId = await getWorkspaceId(request, { id: user.id, email: user.email })
    if (!workspaceId) {
      return NextResponse.json({ error: 'No workspace selected' }, { status: 400 })
    }

    // Generate LinkedIn post variations
    let repurposeResult
    try {
      repurposeResult = await repurposeContent(text, {
        sourceType: 'tweet',
      })
    } catch (error) {
      console.error('OpenRouter error:', error)
      return NextResponse.json(
        { error: 'Failed to generate posts: ' + (error instanceof Error ? error.message : 'Unknown error') },
        { status: 500 }
      )
    }

    const variations = repurposeResult.variations || []

    if (variations.length === 0) {
      return NextResponse.json(
        { error: 'No variations generated' },
        { status: 500 }
      )
    }

    // Create post records
    const posts: any[] = []
    // Use valid variation_type values from database constraint
    const variationTypes = ['professional', 'personal', 'actionable']

    for (let i = 0; i < Math.min(variations.length, 3); i++) {
      const postId = randomUUID()
      const content = variations[i]
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          id: postId,
          workspace_id: workspaceId,
          user_id: user.id,
          source_type: 'repurpose_tweet',
          content: content,
          title: `Tweet Expansion - Variation ${i + 1}`,
          variation_type: variationTypes[i] || 'professional',
          status: 'draft',
          word_count: content.split(/\s+/).length,
          character_count: content.length,
          tags: ['tweet', 'repurposed'],
        })
        .select()
        .single()

      if (postError) {
        console.error('Error creating post:', postError)
      } else if (post) {
        posts.push(post)
      }
    }

    if (posts.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create posts' },
        { status: 500 }
      )
    }

    // TODO: Deduct 3 credits (less than voice/blog)

    return NextResponse.json({
      success: true,
      posts,
      originalLength: text.length,
      usage: repurposeResult.usage,
    })
  } catch (error) {
    console.error('Tweet repurpose error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
