import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const selectedWorkspace = request.cookies.get('selected_workspace_id')?.value
    if (!selectedWorkspace) {
      return NextResponse.json({ error: 'No workspace selected' }, { status: 400 })
    }

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { error } = await serviceClient
      .from('workspace_linkedin_accounts')
      .delete()
      .eq('workspace_id', selectedWorkspace)

    if (error) {
      console.error('[LinkedIn Disconnect] Failed to disconnect:', error)
      return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[LinkedIn Disconnect] Exception:', e)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
