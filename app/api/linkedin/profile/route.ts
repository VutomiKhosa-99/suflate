import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/utils/supabase/auth-helper'

/**
 * GET /api/linkedin/profile
 * Get the connected LinkedIn user's profile information (workspace-scoped)
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const selectedWorkspace = request.cookies.get('selected_workspace_id')?.value
    const { data: accountData, error: fetchError } = await serviceClient
      .from('workspace_linkedin_accounts')
      .select('linkedin_access_token, linkedin_profile_id, linkedin_headline')
      .eq('workspace_id', selectedWorkspace)
      .single()

    if (fetchError || !accountData?.linkedin_access_token) {
      return NextResponse.json({
        connected: false,
        error: 'LinkedIn not connected for this workspace',
      })
    }

    const accessToken = accountData.linkedin_access_token

    // Fetch profile from LinkedIn's userinfo endpoint (OpenID Connect)
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text()
      console.error('[LinkedIn Profile] Failed to fetch profile:', profileResponse.status, errorText)

      if (profileResponse.status === 401) {
        return NextResponse.json({
          connected: false,
          error: 'LinkedIn token expired. Please reconnect your account.',
        })
      }

      return NextResponse.json({
        connected: false,
        error: 'Failed to fetch LinkedIn profile',
      })
    }

    const profileData = await profileResponse.json()

    // Try to get headline from API responses; fallback to workspace-stored headline
    let headline = ''

    try {
      const basicProfileResponse = await fetch(
        'https://api.linkedin.com/v2/me?projection=(localizedHeadline)',
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        }
      )

      if (basicProfileResponse.ok) {
        const basicProfile = await basicProfileResponse.json()
        headline = basicProfile.localizedHeadline || ''
      }
    } catch (e) {
      console.log('[LinkedIn Profile] headline fetch failed:', e)
    }

    if (!headline && accountData.linkedin_headline) {
      headline = accountData.linkedin_headline
    }

    return NextResponse.json({
      connected: true,
      profile: {
        id: profileData.sub || accountData.linkedin_profile_id,
        name: profileData.name || profileData.localizedFirstName + ' ' + profileData.localizedLastName,
        firstName: profileData.given_name || profileData.localizedFirstName,
        lastName: profileData.family_name || profileData.localizedLastName,
        email: profileData.email || null,
        picture: profileData.picture || null,
        headline,
      },
    })
  } catch (e) {
    console.error('[LinkedIn Profile] Exception:', e)
    return NextResponse.json({ connected: false, error: 'An error occurred' })
  }
}
