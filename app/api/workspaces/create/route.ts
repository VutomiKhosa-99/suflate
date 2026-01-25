import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { createWorkspaceWithMembership } from '@/lib/suflate/workspaces/service'

export async function POST(request: NextRequest) {
  const { user, error } = await getAuthUser(request)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const name = (body?.name || `${user.email?.split('@')[0]}'s Workspace`).toString()
  try {
    const workspace = await createWorkspaceWithMembership(user.id, name)
    return NextResponse.json({ workspace })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create workspace' }, { status: 500 })
  }
}
