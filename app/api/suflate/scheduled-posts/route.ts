import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getAuthUser } from '@/utils/supabase/auth-helper'

/**
 * GET /api/suflate/scheduled-posts
 * Story 4.4: Get scheduled posts for calendar view
 * 
 * Returns all scheduled posts for the user's workspace with optional date range filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const workspaceId = searchParams.get('workspaceId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const includePosted = searchParams.get('includePosted') === 'true'

    // Get user's workspace if not specified
    let targetWorkspaceId = workspaceId
    if (!targetWorkspaceId) {
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (!membership) {
        return NextResponse.json({
          scheduledPosts: [],
          count: 0,
        })
      }
      targetWorkspaceId = membership.workspace_id
    }

    // Verify user has access to workspace
    const { data: membershipCheck } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', targetWorkspaceId)
      .eq('user_id', user.id)
      .single()

    if (!membershipCheck) {
      return NextResponse.json(
        { error: 'You do not have access to this workspace' },
        { status: 403 }
      )
    }

    // Build query
    let query = supabase
      .from('scheduled_posts')
      .select(`
        *,
        posts(
          id,
          content,
          title,
          tags,
          source_type,
          variation_type,
          status
        )
      `)
      .eq('workspace_id', targetWorkspaceId)
      .order('scheduled_for', { ascending: true })

    // Filter by posted status
    if (!includePosted) {
      query = query.eq('posted', false)
    }

    // Filter by date range (for calendar view)
    if (startDate) {
      query = query.gte('scheduled_for', startDate)
    }
    if (endDate) {
      query = query.lte('scheduled_for', endDate)
    }

    const { data: scheduledPosts, error } = await query

    if (error) {
      console.error('Failed to fetch scheduled posts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch scheduled posts' },
        { status: 500 }
      )
    }

    // Group by date for calendar view
    const postsByDate: Record<string, typeof scheduledPosts> = {}
    for (const post of scheduledPosts || []) {
      const date = new Date(post.scheduled_for).toISOString().split('T')[0]
      if (!postsByDate[date]) {
        postsByDate[date] = []
      }
      postsByDate[date].push(post)
    }

    return NextResponse.json({
      scheduledPosts: scheduledPosts || [],
      postsByDate,
      count: scheduledPosts?.length || 0,
      workspaceId: targetWorkspaceId,
    })
  } catch (error) {
    console.error('Fetch scheduled posts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
