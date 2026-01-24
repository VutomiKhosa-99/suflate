import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getAuthUser } from '@/utils/supabase/auth-helper'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/suflate/posts/[id]/move
 * Story 3.8: Move Drafts Between Workspaces (Agency Feature)
 * 
 * Moves a draft from one workspace to another
 * User must be a member of both workspaces
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { targetWorkspaceId } = body

    if (!targetWorkspaceId) {
      return NextResponse.json(
        { error: 'targetWorkspaceId is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify the post exists and get current workspace
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, workspace_id')
      .eq('id', id)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Verify user has access to source workspace
    const { data: sourceMembership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', post.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!sourceMembership) {
      return NextResponse.json(
        { error: 'You do not have access to the source workspace' },
        { status: 403 }
      )
    }

    // Verify user has access to target workspace
    const { data: targetMembership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', targetWorkspaceId)
      .eq('user_id', user.id)
      .single()

    if (!targetMembership) {
      return NextResponse.json(
        { error: 'You do not have access to the target workspace' },
        { status: 403 }
      )
    }

    // Can't move to the same workspace
    if (post.workspace_id === targetWorkspaceId) {
      return NextResponse.json(
        { error: 'Post is already in the target workspace' },
        { status: 400 }
      )
    }

    // Move the post
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({
        workspace_id: targetWorkspaceId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Database error moving post:', updateError)
      return NextResponse.json(
        { error: 'Failed to move post' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      post: updatedPost,
      movedFrom: post.workspace_id,
      movedTo: targetWorkspaceId,
    })
  } catch (error) {
    console.error('Move post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
