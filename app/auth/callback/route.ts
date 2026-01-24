import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * GET /auth/callback
 * Per architecture: Handle OAuth callbacks, create session, redirect to dashboard
 * 
 * Due to PKCE limitations with SSR, this route redirects to client handler
 * which has access to the code verifier stored in localStorage
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors from provider
  if (error) {
    console.error('[Auth Callback] OAuth error:', error, error_description)
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', error)
    if (error_description) {
      loginUrl.searchParams.set('error_description', error_description)
    }
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to client handler which can access localStorage for PKCE code verifier
  const callbackHandlerUrl = new URL('/auth/callback-handler', request.url)
  
  // Pass through all params
  if (code) callbackHandlerUrl.searchParams.set('code', code)
  if (token_hash) callbackHandlerUrl.searchParams.set('token_hash', token_hash)
  if (type) callbackHandlerUrl.searchParams.set('type', type)
  callbackHandlerUrl.searchParams.set('next', next)

  return NextResponse.redirect(callbackHandlerUrl)
}
