import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthUser } from '@/utils/supabase/auth-helper'

/**
 * GET /api/linkedin/oauth
 * Initiates LinkedIn OAuth flow for connecting account for posting
 * 
 * Note: This is different from Supabase LinkedIn auth (used for login).
 * This flow specifically requests posting scopes and stores the token
 * for later use when publishing posts to LinkedIn.
 */
export async function GET(request: NextRequest) {
  // Verify user is authenticated
  const { user, error: authError } = await getAuthUser(request)
  
  if (authError || !user) {
    return NextResponse.redirect(new URL('/login?error=unauthenticated', request.url))
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/linkedin/callback`
  
  if (!clientId) {
    console.error('[LinkedIn OAuth] Missing LINKEDIN_CLIENT_ID')
    return NextResponse.redirect(new URL('/dashboard?error=linkedin_not_configured', request.url))
  }

  // LinkedIn OAuth 2.0 scopes for posting
  // Available scopes from your LinkedIn app:
  // - openid: Use name and photo
  // - profile: Use name and photo  
  // - email: Primary email
  // - w_member_social: Create/modify/delete posts
  const scopes = 'openid profile email w_member_social'

  // Generate state for CSRF protection (store user ID for callback)
  const state = Buffer.from(JSON.stringify({
    userId: user.id,
    timestamp: Date.now(),
  })).toString('base64')

  // Build LinkedIn authorization URL
  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('scope', scopes)

  console.log('[LinkedIn OAuth] Redirecting to LinkedIn authorization')
  
  return NextResponse.redirect(authUrl.toString())
}
