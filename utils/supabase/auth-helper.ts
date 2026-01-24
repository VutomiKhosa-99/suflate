import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'

/**
 * Get authenticated user from request cookies
 * This handles the @supabase/ssr v0.1.0 cookie parsing issue
 */
export async function getAuthUser(request: NextRequest): Promise<{ user: User | null; error: string | null }> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // We don't need to set cookies for auth checks
        },
      },
    }
  )

  // Try standard getUser first
  const { data, error } = await supabase.auth.getUser()
  
  if (data?.user) {
    return { user: data.user, error: null }
  }

  // Fallback: manually parse the auth cookie
  const authCookie = request.cookies.getAll().find(c => c.name.includes('-auth-token'))
  
  if (authCookie?.value) {
    try {
      const sessionData = JSON.parse(authCookie.value)
      
      if (sessionData.access_token) {
        const { data: sessionResult, error: sessionError } = await supabase.auth.setSession({
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token,
        })
        
        if (sessionResult?.user) {
          return { user: sessionResult.user, error: null }
        }
        
        if (sessionError) {
          return { user: null, error: sessionError.message }
        }
      }
    } catch (e) {
      // Cookie parse failed
    }
  }

  return { user: null, error: error?.message || 'Auth session missing' }
}
