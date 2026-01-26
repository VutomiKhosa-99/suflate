import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

interface CookieToSet {
  name: string
  value: string
  options?: Record<string, unknown>
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Try standard getUser first
  let user = null
  const { data } = await supabase.auth.getUser()
  user = data?.user

  // If no user, try to manually parse our custom cookie
  if (!user) {
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1] || ''
    const cookieName = `sb-${projectRef}-auth-token`
    
    // Check for chunked or single cookie
    const allCookies = request.cookies.getAll()
    const authCookies = allCookies.filter(c => c.name.startsWith(cookieName))
    
    if (authCookies.length > 0) {
      try {
        let cookieValue = ''
        
        // Check if chunked
        const isChunked = authCookies.some(c => c.name.match(/\.\d+$/))
        if (isChunked) {
          // Sort and combine chunks
          const chunks = authCookies
            .filter(c => c.name.match(/\.\d+$/))
            .sort((a, b) => {
              const aNum = parseInt(a.name.match(/\.(\d+)$/)?.[1] || '0')
              const bNum = parseInt(b.name.match(/\.(\d+)$/)?.[1] || '0')
              return aNum - bNum
            })
          cookieValue = chunks.map(c => c.value).join('')
        } else {
          cookieValue = authCookies[0].value
        }
        
        // Decode base64
        if (cookieValue.startsWith('base64-')) {
          cookieValue = Buffer.from(cookieValue.replace('base64-', ''), 'base64').toString()
        }
        
        const sessionData = JSON.parse(cookieValue)
        if (sessionData.access_token) {
          const { data: sessionResult } = await supabase.auth.setSession({
            access_token: sessionData.access_token,
            refresh_token: sessionData.refresh_token || '',
          })
          user = sessionResult?.user
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  // Debug logging for protected routes
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                           request.nextUrl.pathname.startsWith('/record') ||
                           request.nextUrl.pathname.startsWith('/editor') ||
                           request.nextUrl.pathname.startsWith('/settings') ||
                           request.nextUrl.pathname.startsWith('/drafts') ||
                           request.nextUrl.pathname.startsWith('/calendar') ||
                           request.nextUrl.pathname.startsWith('/carousels') ||
                           request.nextUrl.pathname.startsWith('/repurpose') ||
                           request.nextUrl.pathname.startsWith('/analytics')
  
  if (isProtectedRoute) {
    console.log('[Middleware] Auth check for:', request.nextUrl.pathname, user ? user.email : 'no user')
  }

  // Protect routes - redirect to login if not authenticated
  if (isProtectedRoute && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users away from public/auth pages to dashboard
  if ((request.nextUrl.pathname === '/' ||
       request.nextUrl.pathname === '/login' || 
       request.nextUrl.pathname === '/signup') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
