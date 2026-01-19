import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * GET /auth/callback
 * Handles OAuth callbacks (LinkedIn) and email verification from Supabase Auth
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  const supabase = await createClient()

  // Handle OAuth callback (LinkedIn)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // OAuth successful - redirect to dashboard
      const redirectUrl = new URL(next, request.url)
      return NextResponse.redirect(redirectUrl)
    } else {
      // OAuth failed - redirect to login with error
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'oauth_failed')
      return NextResponse.redirect(loginUrl)
    }
  }

  // Handle email verification callback
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (!error) {
      // Email verified successfully
      const redirectUrl = new URL(next, request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // If verification fails or no token, redirect to verify-email page
  const verifyUrl = new URL('/verify-email', request.url)
  return NextResponse.redirect(verifyUrl)
}
