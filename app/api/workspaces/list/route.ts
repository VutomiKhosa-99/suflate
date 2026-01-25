import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { listUserWorkspaces } from '@/lib/suflate/workspaces/service'

export async function GET(request: NextRequest) {
  const { user, error } = await getAuthUser(request)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const workspaces = await listUserWorkspaces(user.id)
  return NextResponse.json({ workspaces })
}
