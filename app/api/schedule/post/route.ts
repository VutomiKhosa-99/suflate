import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { getAuthUser } from '@/utils/supabase/auth-helper'

/**
 * POST /api/schedule/post
 * Schedule a post for later publishing
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { postId, content, scheduledFor, imageUrl } = body

    if (!postId || !scheduledFor) {
      return NextResponse.json(
        { error: 'Missing required fields: postId, scheduledFor' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { error: 'No workspace found' },
        { status: 400 }
      )
    }

    // Verify the post belongs to the user
    const { data: post, error: postError } = await (serviceClient
      .from('posts') as any)
      .select('id, user_id')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if ((post as any).user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to schedule this post' },
        { status: 403 }
      )
    }

    // Create scheduled post entry
    const { data: scheduledPost, error: scheduleError } = await (serviceClient
      .from('scheduled_posts') as any)
      .insert({
        workspace_id: membership.workspace_id,
        user_id: user.id,
        post_id: postId,
        scheduled_for: scheduledFor,
        notification_method: 'email',
      })
      .select()
      .single()

    if (scheduleError) {
      console.error('Failed to create scheduled post:', scheduleError)
      return NextResponse.json(
        { error: 'Failed to schedule post' },
        { status: 500 }
      )
    }

    // Update the post status and content
    await (serviceClient
      .from('posts') as any)
      .update({
        status: 'scheduled',
        content: content || undefined,
        scheduled_at: scheduledFor,
      })
      .eq('id', postId)

    return NextResponse.json({
      success: true,
      scheduledPost,
      message: `Post scheduled for ${new Date(scheduledFor).toLocaleString()}`,
    })
  } catch (error) {
    console.error('Schedule post error:', error)
    return NextResponse.json(
      { error: 'Failed to schedule post' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/schedule/post
 * Get all scheduled posts for the current user
 */
export async function GET(request: NextRequest) {
  try {
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
      return NextResponse.json({ scheduledPosts: [] })
    }

    // Fetch scheduled posts
    const { data: scheduledPosts, error } = await (serviceClient
      .from('scheduled_posts') as any)
      .select(`
        *,
        posts (
          id,
          content,
          variation_type,
          status
        )
      `)
      .eq('workspace_id', membership.workspace_id)
      .order('scheduled_for', { ascending: true })

    if (error) {
      console.error('Failed to fetch scheduled posts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch scheduled posts' },
        { status: 500 }
      )
    }

    return NextResponse.json({ scheduledPosts: scheduledPosts || [] })
  } catch (error) {
    console.error('Fetch scheduled posts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled posts' },
      { status: 500 }
    )
  }
}
