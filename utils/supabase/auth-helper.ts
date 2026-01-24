import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'

/**
 * Get authenticated user from request cookies
 * Handles chunked cookies and the @supabase/ssr v0.1.0 cookie parsing issue
 */
export async function getAuthUser(request: NextRequest): Promise<{ user: User | null; error: string | null }> {
  const allCookies = request.cookies.getAll()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return allCookies
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

  // Fallback: manually parse chunked auth cookies
  const authCookies = allCookies.filter(c => c.name.includes('sb-') && c.name.includes('-auth-token') && !c.name.includes('code-verifier'))
  
  if (authCookies.length > 0) {
    try {
      // Check if cookies are chunked (.0, .1, etc.)
      const isChunked = authCookies.some(c => c.name.match(/\.\d+$/))
      let combinedValue = ''
      
      if (isChunked) {
        // Sort by chunk number and combine
        const chunks = authCookies
          .filter(c => c.name.match(/\.\d+$/))
          .sort((a, b) => {
            const aNum = parseInt(a.name.match(/\.(\d+)$/)?.[1] || '0')
            const bNum = parseInt(b.name.match(/\.(\d+)$/)?.[1] || '0')
            return aNum - bNum
          })
        combinedValue = chunks.map(c => c.value).join('')
      } else {
        combinedValue = authCookies[0].value
      }
      
      // Handle base64 encoding
      if (combinedValue.startsWith('base64-')) {
        combinedValue = Buffer.from(combinedValue.replace('base64-', ''), 'base64').toString()
      }
      
      const sessionData = JSON.parse(combinedValue)
      
      if (sessionData.access_token) {
        const { data: sessionResult, error: sessionError } = await supabase.auth.setSession({
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token || '',
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
      console.error('[Auth Helper] Cookie parse error:', e)
    }
  }

  return { user: null, error: error?.message || 'Auth session missing' }
}
