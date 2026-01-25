import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { getServiceClient } from '@/lib/suflate/workspaces/service'

/**
 * GET /api/workspaces/members?workspaceId=<id>
 * List all members of a workspace
 */
export async function GET(request: NextRequest) {
  const { user, error } = await getAuthUser(request)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceId = request.nextUrl.searchParams.get('workspaceId')
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })

  const supabase = getServiceClient()

  // Verify user is a member
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()
  if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  // Get all members with user info
  const { data: members, error: membersError } = await supabase
    .from('workspace_members')
    .select('user_id, role, created_at, users(id, email, name)')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (membersError) return NextResponse.json({ error: membersError.message }, { status: 500 })

  return NextResponse.json({
    members: (members || []).map((m: any) => ({
      user_id: m.user_id,
      role: m.role,
      created_at: m.created_at,
      email: m.users?.email,
      name: m.users?.name,
    })),
  })
}

/**
 * DELETE /api/workspaces/members
 * Remove a member from workspace (owner/admin only)
 */
export async function DELETE(request: NextRequest) {
  const { user, error } = await getAuthUser(request)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const workspaceId = body?.workspaceId as string
  const memberUserId = body?.userId as string
  if (!workspaceId || !memberUserId) {
    return NextResponse.json({ error: 'workspaceId and userId required' }, { status: 400 })
  }

  const supabase = getServiceClient()

  // Verify caller is owner/admin
  const { data: callerMembership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()
  if (!callerMembership || !['owner', 'admin'].includes(callerMembership.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Can't remove the owner
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single()
  if (workspace?.owner_id === memberUserId) {
    return NextResponse.json({ error: 'Cannot remove workspace owner' }, { status: 400 })
  }

  // Remove membership
  const { error: delError } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', memberUserId)

  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

/**
 * PATCH /api/workspaces/members
 * Update a member's role (owner/admin only)
 */
export async function PATCH(request: NextRequest) {
  const { user, error } = await getAuthUser(request)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const workspaceId = body?.workspaceId as string
  const memberUserId = body?.userId as string
  const newRole = body?.role as string
  if (!workspaceId || !memberUserId || !newRole) {
    return NextResponse.json({ error: 'workspaceId, userId, and role required' }, { status: 400 })
  }
  if (!['admin', 'editor', 'viewer'].includes(newRole)) {
    return NextResponse.json({ error: 'Invalid role. Use admin, editor, or viewer.' }, { status: 400 })
  }

  const supabase = getServiceClient()

  // Verify caller is owner/admin
  const { data: callerMembership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()
  if (!callerMembership || !['owner', 'admin'].includes(callerMembership.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Can't change owner's role (must use transfer ownership)
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single()
  if (workspace?.owner_id === memberUserId) {
    return NextResponse.json({ error: 'Cannot change owner role. Use transfer ownership.' }, { status: 400 })
  }

  // Update role
  const { error: updError } = await supabase
    .from('workspace_members')
    .update({ role: newRole })
    .eq('workspace_id', workspaceId)
    .eq('user_id', memberUserId)

  if (updError) return NextResponse.json({ error: updError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
