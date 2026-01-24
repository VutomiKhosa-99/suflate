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

  // Decode state to get user ID
  let userId: string
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    userId = stateData.userId
    
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
    try {
      const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        linkedinProfileId = profileData.sub // LinkedIn member ID from OIDC
        console.log('[LinkedIn Callback] Profile ID:', linkedinProfileId, 'Name:', profileData.name)
      } else {
        const errorText = await profileResponse.text()
        console.log('[LinkedIn Callback] Userinfo failed:', profileResponse.status, errorText)
      }
    } catch (e) {
      console.log('[LinkedIn Callback] Profile fetch error:', e)
    }

    // Store token in database using service role
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { error: updateError } = await serviceClient
      .from('users')
      .update({
        linkedin_access_token: accessToken,
        linkedin_profile_id: linkedinProfileId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      console.error('[LinkedIn Callback] Failed to store token:', updateError)
      return NextResponse.redirect(new URL('/dashboard?error=linkedin_storage_failed', request.url))
    }

    console.log('[LinkedIn Callback] LinkedIn connected successfully for user:', userId)
    
    return NextResponse.redirect(new URL('/dashboard?linkedin=connected', request.url))
  } catch (e) {
    console.error('[LinkedIn Callback] Exception:', e)
    return NextResponse.redirect(new URL('/dashboard?error=linkedin_exception', request.url))
  }
}
