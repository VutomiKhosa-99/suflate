import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Get all cookies and handle chunked cookies
  const allCookies = request.cookies.getAll()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return allCookies
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as CookieOptions)
          )
        },
      },
    }
  )

  // Try to get user from session
  let user = null
  
  // Debug: log cookies on protected routes
  const isProtectedRoute = request.nextUrl.pathname.includes('dashboard') || 
                           request.nextUrl.pathname.includes('record') ||
                           request.nextUrl.pathname.includes('editor')
  const authCookies = allCookies.filter(c => c.name.includes('sb-'))
  if (isProtectedRoute) {
    console.log('[Middleware] Checking auth for:', request.nextUrl.pathname)
    console.log('[Middleware] Auth cookies:', authCookies.map(c => `${c.name}=${c.value.substring(0, 50)}...`))
  }
  
  // First try the standard getUser approach
  const { data, error: userError } = await supabase.auth.getUser()
  user = data?.user
  
  if (isProtectedRoute) {
    console.log('[Middleware] getUser result:', user ? user.email : 'no user', userError?.message || '')
  }
  
  // If that fails, try to manually combine and parse chunked cookies
  if (!user && authCookies.length > 0) {
    try {
      // Find all chunks of the auth token cookie
      const tokenCookies = authCookies
        .filter(c => c.name.includes('-auth-token') && !c.name.includes('code-verifier'))
        .sort((a, b) => a.name.localeCompare(b.name))
      
      if (tokenCookies.length > 0) {
        // Combine chunked cookie values
        let combinedValue = ''
        
        // Check if cookies are chunked (.0, .1, etc.)
        const isChunked = tokenCookies.some(c => c.name.match(/\.\d+$/))
        
        if (isChunked) {
          // Sort by chunk number and combine
          const chunks = tokenCookies
            .filter(c => c.name.match(/\.\d+$/))
            .sort((a, b) => {
              const aNum = parseInt(a.name.match(/\.(\d+)$/)?.[1] || '0')
              const bNum = parseInt(b.name.match(/\.(\d+)$/)?.[1] || '0')
              return aNum - bNum
            })
          combinedValue = chunks.map(c => c.value).join('')
        } else {
          combinedValue = tokenCookies[0].value
        }
        
        // Handle base64 encoding
        if (combinedValue.startsWith('base64-')) {
          combinedValue = Buffer.from(combinedValue.replace('base64-', ''), 'base64').toString()
        }
        
        if (isProtectedRoute) {
          console.log('[Middleware] Combined cookie length:', combinedValue.length)
        }
        
        const sessionData = JSON.parse(combinedValue)
        if (sessionData.access_token) {
          const { data: sessionResult, error: setError } = await supabase.auth.setSession({
            access_token: sessionData.access_token,
            refresh_token: sessionData.refresh_token || '',
          })
          user = sessionResult?.user
          if (isProtectedRoute) {
            console.log('[Middleware] Fallback session result:', user ? user.email : 'no user', setError?.message || '')
          }
        }
      }
    } catch (e) {
      if (isProtectedRoute) {
        console.log('[Middleware] Cookie parse error:', e)
      }
    }
  }

  // Protect dashboard routes - redirect to login if not authenticated
  if (request.nextUrl.pathname.startsWith('/dashboard') || 
      request.nextUrl.pathname.startsWith('/record') ||
      request.nextUrl.pathname.startsWith('/editor')) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Redirect authenticated users away from auth pages
  if ((request.nextUrl.pathname === '/login' || 
       request.nextUrl.pathname === '/signup') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
