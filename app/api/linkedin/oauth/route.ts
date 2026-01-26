import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { createClient } from '@supabase/supabase-js'

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
  // Based on your LinkedIn app's authorized scopes:
  // - openid: Use OpenID Connect (provides sub, name, picture, email)
  // - profile: Use name and photo  
  // - email: Primary email
  // - w_member_social: Create/modify/delete posts
  // - r_profile_basicinfo: Basic profile info (name, headline, photo, profile URL)
  const scopes = 'openid profile email w_member_social r_profile_basicinfo'

  // Generate state for CSRF protection (store user ID and selected workspace for callback)
  // Try to include the currently-selected workspace from cookies so callback can attach the LinkedIn
  // account to the correct workspace.
  const selectedWorkspace = request.cookies.get('selected_workspace_id')?.value || null

  // Prevent starting OAuth if workspace already has a linked LinkedIn profile
  try {
    if (selectedWorkspace) {
      const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )

      const { data: existing } = await serviceClient
        .from('workspace_linkedin_accounts')
        .select('linkedin_profile_id')
        .eq('workspace_id', selectedWorkspace)
        .limit(1)

      if (existing && existing.length > 0 && existing[0].linkedin_profile_id) {
        // Workspace already has a LinkedIn profile linked - instruct user to disconnect first
        return NextResponse.redirect(new URL('/settings?error=linkedin_already_connected', request.url))
      }
    }
  } catch (e) {
    console.error('[LinkedIn OAuth] Error checking existing workspace account:', e)
    // Fall through and allow OAuth flow if check fails
  }

  const state = Buffer.from(JSON.stringify({
    userId: user.id,
    workspaceId: selectedWorkspace,
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
