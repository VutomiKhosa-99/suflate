import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Get project ref from Supabase URL
const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1] || ''

/**
 * POST /api/auth/session
 * Syncs a session from client (localStorage) to server (cookies)
 * This is needed when using @supabase/supabase-js on client with @supabase/ssr on server
 */
export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token } = await request.json()

    if (!access_token) {
      return NextResponse.json({ error: 'Missing access_token' }, { status: 400 })
    }

    // Verify the token is valid by decoding it (basic check)
    let payload
    try {
      const parts = access_token.split('.')
      payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    // Create the session object that Supabase expects in cookies
    const sessionData = {
      access_token,
      refresh_token: refresh_token || '',
      token_type: 'bearer',
      expires_in: payload.exp ? payload.exp - Math.floor(Date.now() / 1000) : 3600,
      expires_at: payload.exp || Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: payload.sub,
        email: payload.email,
        app_metadata: payload.app_metadata || {},
        user_metadata: payload.user_metadata || {},
        aud: payload.aud,
        created_at: '',
      },
    }

    // Serialize the session data
    const sessionJson = JSON.stringify(sessionData)
    
    // Split into chunks if necessary (Supabase uses chunked cookies for large sessions)
    const chunkSize = 3180 // Safe size for cookies
    const chunks: string[] = []
    
    for (let i = 0; i < sessionJson.length; i += chunkSize) {
      chunks.push(sessionJson.slice(i, i + chunkSize))
    }

    // Create response
    const response = NextResponse.json({ success: true })
    
    // Cookie options
    const cookieOptions = {
      path: '/',
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    }

    // Set chunked cookies
    const cookieName = `sb-${projectRef}-auth-token`
    
    if (chunks.length === 1) {
      response.cookies.set(cookieName, chunks[0], cookieOptions)
    } else {
      chunks.forEach((chunk, index) => {
        response.cookies.set(`${cookieName}.${index}`, chunk, cookieOptions)
      })
    }

    console.log('[Session API] Session synced to cookies for:', payload.email)
    console.log('[Session API] Cookie chunks:', chunks.length)
    
    return response
  } catch (e) {
    console.error('[Session API] Exception:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
