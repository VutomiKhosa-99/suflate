import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { getServiceClient } from '@/lib/suflate/workspaces/service'

export async function POST(request: NextRequest) {
  const { user, error } = await getAuthUser(request)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const workspaceId = body?.workspaceId as string
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })

  // Verify membership
  const supabase = getServiceClient()
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()
  if (!membership) return NextResponse.json({ error: 'Not a member of workspace' }, { status: 403 })

  const res = NextResponse.json({ success: true, workspaceId })
  // Set cookie for selection
  res.cookies.set('selected_workspace_id', workspaceId, { path: '/', httpOnly: false })
  return res
}
