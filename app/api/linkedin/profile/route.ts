import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/utils/supabase/auth-helper'

/**
 * GET /api/linkedin/profile
 * Get the connected LinkedIn user's profile information
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's LinkedIn credentials
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

    if (fetchError || !userData?.linkedin_access_token) {
      return NextResponse.json({ 
        connected: false,
        error: 'LinkedIn not connected' 
      })
    }

    const accessToken = userData.linkedin_access_token

    // Fetch profile from LinkedIn's userinfo endpoint (OpenID Connect)
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text()
      console.error('[LinkedIn Profile] Failed to fetch profile:', profileResponse.status, errorText)
      
      // Token might be expired
      if (profileResponse.status === 401) {
        return NextResponse.json({ 
          connected: false,
          error: 'LinkedIn token expired. Please reconnect your account.' 
        })
      }
      
      return NextResponse.json({ 
        connected: false,
        error: 'Failed to fetch LinkedIn profile' 
      })
    }

    const profileData = await profileResponse.json()

    // Try to get headline from different LinkedIn API endpoints
    let headline = ''
    
    // First try: /v2/me endpoint with headline projection (requires r_liteprofile or r_basicprofile)
    try {
      const basicProfileResponse = await fetch(
        'https://api.linkedin.com/v2/me?projection=(localizedHeadline)',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      
      if (basicProfileResponse.ok) {
        const basicProfile = await basicProfileResponse.json()
        headline = basicProfile.localizedHeadline || ''
        console.log('[LinkedIn Profile] Got headline from /v2/me:', headline)
      } else {
        console.log('[LinkedIn Profile] /v2/me headline failed:', basicProfileResponse.status)
      }
    } catch (e) {
      console.log('[LinkedIn Profile] Could not fetch headline from /v2/me:', e)
    }

    // Second try: If we have r_basicprofile scope, try the basic profile endpoint
    if (!headline) {
      try {
        const basicProfileResponse = await fetch(
          'https://api.linkedin.com/v2/me',
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'X-Restli-Protocol-Version': '2.0.0',
            },
          }
        )
        
        if (basicProfileResponse.ok) {
          const basicProfile = await basicProfileResponse.json()
          headline = basicProfile.headline?.localized?.en_US || 
                     basicProfile.localizedHeadline || 
                     ''
          console.log('[LinkedIn Profile] Got headline from /v2/me (2nd try):', headline)
        }
      } catch (e) {
        console.log('[LinkedIn Profile] Could not fetch headline (2nd try):', e)
      }
    }

    // If no headline from API, check if we have it stored in the database
    if (!headline) {
      const { data: storedUser } = await serviceClient
        .from('users')
        .select('linkedin_headline')
        .eq('id', user.id)
        .single()
      
      if (storedUser?.linkedin_headline) {
        headline = storedUser.linkedin_headline
        console.log('[LinkedIn Profile] Using stored headline:', headline)
      }
    }

    return NextResponse.json({
      connected: true,
      profile: {
        id: profileData.sub,
        name: profileData.name,
        firstName: profileData.given_name,
        lastName: profileData.family_name,
        email: profileData.email,
        picture: profileData.picture,
        headline: headline,
      }
    })

  } catch (e) {
    console.error('[LinkedIn Profile] Exception:', e)
    return NextResponse.json({ 
      connected: false,
      error: 'An error occurred' 
    })
  }
}
