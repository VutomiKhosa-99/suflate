import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { getServiceClient } from '@/lib/suflate/workspaces/service'

export async function POST(request: NextRequest) {
  const { user, error } = await getAuthUser(request)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const token = body?.token as string
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const supabase = getServiceClient()
  const { data: invite } = await supabase
    .from('workspace_invitations')
    .select('id, workspace_id, role, status, expires_at')
    .eq('token', token)
    .single()
  if (!invite) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
  if (invite.status !== 'pending') return NextResponse.json({ error: 'Invitation not valid' }, { status: 400 })
  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Invitation expired' }, { status: 400 })
  }

  // Add membership
  await supabase.from('workspace_members').upsert({
    workspace_id: invite.workspace_id,
    user_id: user.id,
    role: invite.role,
  }, { onConflict: 'workspace_id,user_id' })

  // Update invitation status
  await supabase
    .from('workspace_invitations')
    .update({ status: 'accepted' })
    .eq('id', invite.id)

  return NextResponse.json({ success: true, workspaceId: invite.workspace_id })
}
