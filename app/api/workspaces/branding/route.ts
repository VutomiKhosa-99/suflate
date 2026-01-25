import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { getServiceClient } from '@/lib/suflate/workspaces/service'

export async function PUT(request: NextRequest) {
  const { user, error } = await getAuthUser(request)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const workspaceId = body?.workspaceId as string
  const branding = body?.branding || {}
  const logo_url = body?.logo_url || null
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })

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

  const { data, error: updError } = await supabase
    .from('workspaces')
    .update({ branding, logo_url })
    .eq('id', workspaceId)
    .select('id, name, branding, logo_url')
    .single()

  if (updError) return NextResponse.json({ error: updError.message }, { status: 500 })
  return NextResponse.json({ workspace: data })
}
