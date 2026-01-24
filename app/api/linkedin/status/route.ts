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

    const { data: userData, error: fetchError } = await serviceClient
      .from('users')
      .select('linkedin_access_token, linkedin_profile_id')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      console.error('[LinkedIn Status] Error fetching user:', fetchError)
      return NextResponse.json({ connected: false })
    }

    const isConnected = !!(userData?.linkedin_access_token)

    return NextResponse.json({
      connected: isConnected,
      profileId: userData?.linkedin_profile_id || null,
    })
  } catch (e) {
    console.error('[LinkedIn Status] Exception:', e)
    return NextResponse.json({ connected: false })
  }
}
