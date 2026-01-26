import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/linkedin/callback
 * Handles LinkedIn OAuth callback, exchanges code for token,
 * and stores the access token for posting
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('[LinkedIn Callback] OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/dashboard?error=linkedin_${error}&message=${encodeURIComponent(errorDescription || '')}`, request.url)
    )
  }

  if (!code || !state) {
    console.error('[LinkedIn Callback] Missing code or state')
    return NextResponse.redirect(new URL('/dashboard?error=linkedin_invalid_callback', request.url))
  }

  // Decode state to get user ID and optional workspaceId
  let userId: string
  let workspaceId: string | null = null
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    userId = stateData.userId
    workspaceId = stateData.workspaceId || null

    // Check state is not too old (5 minutes)
    if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
      console.error('[LinkedIn Callback] State expired')
      return NextResponse.redirect(new URL('/dashboard?error=linkedin_state_expired', request.url))
    }
  } catch (e) {
    console.error('[LinkedIn Callback] Invalid state:', e)
    return NextResponse.redirect(new URL('/dashboard?error=linkedin_invalid_state', request.url))
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/linkedin/callback`

  if (!clientId || !clientSecret) {
    console.error('[LinkedIn Callback] Missing LinkedIn credentials')
    return NextResponse.redirect(new URL('/dashboard?error=linkedin_not_configured', request.url))
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('[LinkedIn Callback] Token exchange failed:', errorText)
      return NextResponse.redirect(new URL('/dashboard?error=linkedin_token_failed', request.url))
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    const expiresIn = tokenData.expires_in // seconds

    console.log('[LinkedIn Callback] Token obtained, expires in:', expiresIn, 'seconds')

    // Get LinkedIn profile info using OpenID Connect userinfo endpoint
    let linkedinProfileId = null
    let linkedinHeadline = null
    let linkedinName = null
    let linkedinPicture = null
    
    try {
      const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        linkedinProfileId = profileData.sub // LinkedIn member ID from OIDC
        linkedinName = profileData.name
        linkedinPicture = profileData.picture
        console.log('[LinkedIn Callback] Profile ID:', linkedinProfileId, 'Name:', profileData.name)
        console.log('[LinkedIn Callback] Full userinfo response:', JSON.stringify(profileData))
      } else {
        const errorText = await profileResponse.text()
        console.log('[LinkedIn Callback] Userinfo failed:', profileResponse.status, errorText)
      }
    } catch (e) {
      console.log('[LinkedIn Callback] Profile fetch error:', e)
    }

    // Try multiple methods to get headline
    // Method 1: REST API with LinkedIn-Version header (for r_profile_basicinfo scope)
    try {
      const restResponse = await fetch(
        'https://api.linkedin.com/rest/me?fields=id,firstName,lastName,headline,vanityName,profilePicture',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'LinkedIn-Version': '202401',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      )

      console.log('[LinkedIn Callback] REST /me response status:', restResponse.status)
      
      if (restResponse.ok) {
        const restData = await restResponse.json()
        console.log('[LinkedIn Callback] REST /me response:', JSON.stringify(restData))
        // REST API returns headline directly or as localized object
        if (restData.headline) {
          linkedinHeadline = typeof restData.headline === 'string' 
            ? restData.headline 
            : restData.headline.localized?.en_US || restData.headline.preferredLocale?.value || null
        }
        if (linkedinHeadline) {
          console.log('[LinkedIn Callback] Got headline from REST /me:', linkedinHeadline)
        }
      } else {
        const errorText = await restResponse.text()
        console.log('[LinkedIn Callback] REST /me failed:', restResponse.status, errorText)
      }
    } catch (e) {
      console.log('[LinkedIn Callback] REST /me error:', e)
    }

    // Method 2: /v2/me with localizedHeadline projection (legacy)
    if (!linkedinHeadline) {
      try {
        const meResponse = await fetch(
          'https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,localizedHeadline,vanityName)',
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'X-Restli-Protocol-Version': '2.0.0',
            },
          }
        )

        console.log('[LinkedIn Callback] /v2/me response status:', meResponse.status)
        
        if (meResponse.ok) {
          const meData = await meResponse.json()
          console.log('[LinkedIn Callback] /v2/me response:', JSON.stringify(meData))
          linkedinHeadline = meData.localizedHeadline || null
          if (linkedinHeadline) {
            console.log('[LinkedIn Callback] Got headline from /v2/me:', linkedinHeadline)
          }
        } else {
          const errorText = await meResponse.text()
          console.log('[LinkedIn Callback] /v2/me failed:', meResponse.status, errorText)
        }
      } catch (e) {
        console.log('[LinkedIn Callback] /v2/me error:', e)
      }
    }

    // Method 3: Try with headline projection only if still not found
    if (!linkedinHeadline) {
      try {
        const liteResponse = await fetch(
          'https://api.linkedin.com/v2/me?projection=(headline)',
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'X-Restli-Protocol-Version': '2.0.0',
            },
          }
        )
        
        if (liteResponse.ok) {
          const liteData = await liteResponse.json()
          console.log('[LinkedIn Callback] Headline projection response:', JSON.stringify(liteData))
          // Headline might be nested in different formats
          if (liteData.headline) {
            linkedinHeadline = typeof liteData.headline === 'string' 
              ? liteData.headline 
              : liteData.headline.localized?.en_US || liteData.headline.preferredLocale || null
          }
        }
      } catch (e) {
        console.log('[LinkedIn Callback] Headline projection error:', e)
      }
    }

    // Store token in the new workspace_linkedin_accounts table using service role
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // If workspaceId not provided in state, attempt to find a default workspace for the user
    if (!workspaceId) {
      const { data: memberships } = await serviceClient
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', userId)
        .limit(1)
      workspaceId = memberships?.[0]?.workspace_id || null
    }

    if (!workspaceId) {
      console.error('[LinkedIn Callback] No workspace available to attach LinkedIn account')
      return NextResponse.redirect(new URL('/dashboard?error=linkedin_no_workspace', request.url))
    }

    // Prevent the same LinkedIn profile being linked to another workspace
    if (linkedinProfileId) {
      const { data: existing } = await serviceClient
        .from('workspace_linkedin_accounts')
        .select('workspace_id')
        .eq('linkedin_profile_id', linkedinProfileId)
        .limit(1)

      if (existing && existing.length > 0 && existing[0].workspace_id !== workspaceId) {
        console.error('[LinkedIn Callback] LinkedIn profile already linked to another workspace')
        return NextResponse.redirect(new URL('/dashboard?error=linkedin_already_linked', request.url))
      }
    }

    // Upsert into workspace_linkedin_accounts
    const upsertPayload: Record<string, any> = {
      workspace_id: workspaceId,
      linkedin_profile_id: linkedinProfileId,
      linkedin_access_token: accessToken,
      updated_at: new Date().toISOString(),
    }

    if (linkedinHeadline) upsertPayload.linkedin_headline = linkedinHeadline

    const { error: upsertError } = await serviceClient
      .from('workspace_linkedin_accounts')
      .upsert(upsertPayload, { onConflict: 'workspace_id' })

    if (upsertError) {
      console.error('[LinkedIn Callback] Failed to store workspace LinkedIn account:', upsertError)
      return NextResponse.redirect(new URL('/dashboard?error=linkedin_storage_failed', request.url))
    }

    console.log('[LinkedIn Callback] LinkedIn connected to workspace:', workspaceId, 'profile:', linkedinProfileId)

    // Redirect to settings if headline wasn't obtained so user can enter it manually
    if (!linkedinHeadline) {
      return NextResponse.redirect(new URL('/settings?linkedin=connected&needs_headline=true', request.url))
    }

    return NextResponse.redirect(new URL('/dashboard?linkedin=connected', request.url))
  } catch (e) {
    console.error('[LinkedIn Callback] Exception:', e)
    return NextResponse.redirect(new URL('/dashboard?error=linkedin_exception', request.url))
  }
}
