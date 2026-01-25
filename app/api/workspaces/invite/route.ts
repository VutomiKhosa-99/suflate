import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { getServiceClient } from '@/lib/suflate/workspaces/service'

export async function POST(request: NextRequest) {
  const { user, error } = await getAuthUser(request)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const workspaceId = body?.workspaceId as string
  const email = body?.email as string
  const role = (body?.role as string) || 'editor'
  if (!workspaceId || !email) return NextResponse.json({ error: 'workspaceId and email required' }, { status: 400 })

  const supabase = getServiceClient()
  // Verify owner/admin
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()
  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const token = randomUUID()
  const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days

  const { data, error: insError } = await supabase
    .from('workspace_invitations')
    .insert({ workspace_id: workspaceId, email, role, token, expires_at, invited_by: user.id })
    .select('id, token, status, expires_at')
    .single()

  if (insError) return NextResponse.json({ error: insError.message }, { status: 500 })

  // TODO: Send email via notifications service (stub)
  return NextResponse.json({ invitation: data })
}
