import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { getWorkspaceId } from '@/lib/suflate/workspaces/service'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Service client to bypass RLS for authorized operations
function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * POST /api/suflate/posts/[id]/schedule
 * Story 4.1, 4.2: Schedule a post for future publishing
 * 
 * Creates a scheduled_posts record and updates the post status to 'scheduled'
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { scheduledFor, notificationMethod = 'email', isCompanyPage = false } = body

    if (!scheduledFor) {
      return NextResponse.json(
        { error: 'scheduledFor is required' },
        { status: 400 }
      )
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledFor)
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()

    // Ensure selected workspace matches the post's workspace
    const workspaceId = await getWorkspaceId(request, { id: user.id, email: user.email })
    if (!workspaceId) return NextResponse.json({ error: 'No workspace selected' }, { status: 400 })

    // Verify the post exists and user owns it
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, workspace_id, status, content, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.workspace_id !== workspaceId) {
      return NextResponse.json({ error: 'Post does not belong to the selected workspace' }, { status: 403 })
    }

    // Check if post is already scheduled
    const { data: existingSchedule } = await supabase
      .from('scheduled_posts')
      .select('id')
      .eq('post_id', id)
      .single()

    if (existingSchedule) {
      return NextResponse.json(
        { error: 'Post is already scheduled. Use PATCH to reschedule.' },
        { status: 409 }
      )
    }

    // Create scheduled post record
    const { data: scheduledPost, error: scheduleError } = await supabase
      .from('scheduled_posts')
      .insert({
        post_id: id,
        workspace_id: post.workspace_id,
        user_id: user.id,
        scheduled_for: scheduledDate.toISOString(),
        notification_method: notificationMethod,
        is_company_page: isCompanyPage,
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

    // Update post status to 'scheduled'
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        status: 'scheduled',
        scheduled_at: scheduledDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Failed to update post status:', updateError)
      // Rollback: delete the scheduled post
      await supabase.from('scheduled_posts').delete().eq('id', scheduledPost.id)
      return NextResponse.json(
        { error: 'Failed to update post status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      scheduledPost,
      scheduledFor: scheduledDate.toISOString(),
    })
  } catch (error) {
    console.error('Schedule post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/suflate/posts/[id]/schedule
 * Story 4.5: Reschedule a post
 * 
 * Updates the scheduled_for time for an existing scheduled post
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { scheduledFor } = body

    if (!scheduledFor) {
      return NextResponse.json(
        { error: 'scheduledFor is required' },
        { status: 400 }
      )
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledFor)
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()

    // Get the scheduled post - verify user owns it
    const { data: scheduledPost, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select('*, posts(workspace_id, user_id)')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !scheduledPost) {
      return NextResponse.json(
        { error: 'Scheduled post not found' },
        { status: 404 }
      )
    }

    // Cannot reschedule if already posted
    if (scheduledPost.posted) {
      return NextResponse.json(
        { error: 'Cannot reschedule a post that has already been published' },
        { status: 400 }
      )
    }

    // Update scheduled post
    const { data: updatedSchedule, error: updateError } = await supabase
      .from('scheduled_posts')
      .update({
        scheduled_for: scheduledDate.toISOString(),
        notification_sent: false, // Reset notification flag for new time
        notification_sent_at: null,
      })
      .eq('id', scheduledPost.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to reschedule post:', updateError)
      return NextResponse.json(
        { error: 'Failed to reschedule post' },
        { status: 500 }
      )
    }

    // Update post scheduled_at
    await supabase
      .from('posts')
      .update({
        scheduled_at: scheduledDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    return NextResponse.json({
      success: true,
      scheduledPost: updatedSchedule,
      scheduledFor: scheduledDate.toISOString(),
    })
  } catch (error) {
    console.error('Reschedule post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/suflate/posts/[id]/schedule
 * Story 4.5: Cancel a scheduled post
 * 
 * Removes the scheduled_posts record and reverts post status to 'draft'
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()

    // Get the scheduled post - verify user owns it
    const { data: scheduledPost, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !scheduledPost) {
      return NextResponse.json(
        { error: 'Scheduled post not found' },
        { status: 404 }
      )
    }

    // Cannot cancel if already posted
    if (scheduledPost.posted) {
      return NextResponse.json(
        { error: 'Cannot cancel a post that has already been published' },
        { status: 400 }
      )
    }

    // Delete scheduled post record
    const { error: deleteError } = await supabase
      .from('scheduled_posts')
      .delete()
      .eq('id', scheduledPost.id)

    if (deleteError) {
      console.error('Failed to cancel scheduled post:', deleteError)
      return NextResponse.json(
        { error: 'Failed to cancel scheduled post' },
        { status: 500 }
      )
    }

    // Revert post status to 'draft'
    await supabase
      .from('posts')
      .update({
        status: 'draft',
        scheduled_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    return NextResponse.json({
      success: true,
      message: 'Scheduled post cancelled',
    })
  } catch (error) {
    console.error('Cancel scheduled post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/suflate/posts/[id]/schedule
 * Get schedule details for a post
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()

    // Get the scheduled post with post details - verify user owns it
    const { data: scheduledPost, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select('*, posts(*)')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !scheduledPost) {
      return NextResponse.json(
        { error: 'Scheduled post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ scheduledPost })
  } catch (error) {
    console.error('Get scheduled post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
