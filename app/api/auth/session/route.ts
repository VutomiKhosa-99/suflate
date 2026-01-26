import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Get project ref from Supabase URL
const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1] || ''

/**
 * POST /api/auth/session
 * Manually sets auth cookies for SSR middleware
 */
export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token } = await request.json()

    if (!access_token) {
      return NextResponse.json({ error: 'Missing access_token' }, { status: 400 })
    }

    // Decode token to get user info for logging
    let userEmail = 'unknown'
    try {
      const parts = access_token.split('.')
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
      userEmail = payload.email || 'unknown'
    } catch {
      // Ignore decode errors
    }

    // Create the session object that Supabase SSR expects
    const sessionData = JSON.stringify({
      access_token,
      refresh_token: refresh_token || '',
    })

    // Create response
    const response = NextResponse.json({ success: true })
    
    // Cookie options matching Supabase SSR defaults
    const cookieOptions = {
      path: '/',
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    }

    // Set the auth token cookie
    const cookieName = `sb-${projectRef}-auth-token`
    
    // Supabase SSR uses base64 encoding for the cookie value
    const encodedValue = `base64-${Buffer.from(sessionData).toString('base64')}`
    
    // Check if we need to chunk (cookies have ~4KB limit)
    const chunkSize = 3500
    if (encodedValue.length <= chunkSize) {
      response.cookies.set(cookieName, encodedValue, cookieOptions)
      console.log('[Session API] Session synced for:', userEmail, '| Cookie:', cookieName)
    } else {
      // Split into chunks
      const chunks = []
      for (let i = 0; i < encodedValue.length; i += chunkSize) {
        chunks.push(encodedValue.slice(i, i + chunkSize))
      }
      chunks.forEach((chunk, index) => {
        response.cookies.set(`${cookieName}.${index}`, chunk, cookieOptions)
      })
      console.log('[Session API] Session synced for:', userEmail, '| Chunks:', chunks.length)
    }
    
    return response
  } catch (e) {
    console.error('[Session API] Error:', e)
    return NextResponse.json({ error: 'Failed to sync session' }, { status: 500 })
  }
}
