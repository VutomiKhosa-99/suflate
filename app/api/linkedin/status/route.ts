import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/utils/supabase/auth-helper'

/**
 * GET /api/linkedin/status
 * Check if the current user has LinkedIn connected
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service client to read user's LinkedIn connection status
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

      // Resolve selected workspace from cookie. If missing or invalid, fall back
      // to the user's first workspace membership to avoid passing invalid values
      // into a UUID equality query which causes a Postgres 22P02 error.
      let selectedWorkspace: string | null | undefined = request.cookies.get('selected_workspace_id')?.value
      // Normalize common bad values
      if (!selectedWorkspace || selectedWorkspace === 'undefined' || selectedWorkspace === 'null') {
        try {
          const { data: memberships } = await serviceClient
            .from('workspace_members')
            .select('workspace_id')
            .eq('user_id', user.id)
            .limit(1)

          selectedWorkspace = memberships?.[0]?.workspace_id || null
        } catch (err) {
          console.error('[LinkedIn Status] Error fetching memberships:', err)
          selectedWorkspace = null
        }
      }

      // Validate UUID format to avoid passing invalid values into Postgres
      const isValidUuid = (s: any) => typeof s === 'string' && /^[0-9a-fA-F-]{36}$/.test(s)
      if (!selectedWorkspace || !isValidUuid(selectedWorkspace)) {
        return NextResponse.json({ connected: false })
      }

      const { data: accountData, error: fetchError } = await serviceClient
        .from('workspace_linkedin_accounts')
        .select('linkedin_access_token, linkedin_profile_id')
        .eq('workspace_id', selectedWorkspace)
        .maybeSingle()

    if (fetchError) {
      console.error('[LinkedIn Status] Error fetching user:', fetchError)
      return NextResponse.json({ connected: false })
    }

      const isConnected = !!(accountData?.linkedin_access_token)

    return NextResponse.json({
        connected: isConnected,
        profileId: accountData?.linkedin_profile_id || null,
    })
  } catch (e) {
    console.error('[LinkedIn Status] Exception:', e)
    return NextResponse.json({ connected: false })
  }
}
