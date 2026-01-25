import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { getServiceClient } from '@/lib/suflate/workspaces/service'

export async function POST(request: NextRequest) {
  const { user, error } = await getAuthUser(request)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const workspaceId = body?.workspaceId as string
  const newOwnerUserId = body?.newOwnerUserId as string
  if (!workspaceId || !newOwnerUserId) return NextResponse.json({ error: 'workspaceId and newOwnerUserId required' }, { status: 400 })

  const supabase = getServiceClient()
  // Verify current user is owner
  const { data: currentMember } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()
  if (!currentMember || currentMember.role !== 'owner') {
    return NextResponse.json({ error: 'Only owner can transfer ownership' }, { status: 403 })
  }

  // Ensure new owner is a member
  const { data: newOwnerMember } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', newOwnerUserId)
    .single()
  if (!newOwnerMember) {
    return NextResponse.json({ error: 'New owner must be a workspace member' }, { status: 400 })
  }

  // Update owner_id
  await supabase
    .from('workspaces')
    .update({ owner_id: newOwnerUserId })
    .eq('id', workspaceId)

  // Update roles
  await supabase
    .from('workspace_members')
    .update({ role: 'admin' })
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
  await supabase
    .from('workspace_members')
    .update({ role: 'owner' })
    .eq('workspace_id', workspaceId)
    .eq('user_id', newOwnerUserId)

  return NextResponse.json({ success: true })
}
