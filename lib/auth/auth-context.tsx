'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] State changed:', event)
        setSession(session)
        setUser(session?.user ?? null)

        // Sync session to cookies when auth state changes
        if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          await syncSessionToCookies(session)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const syncSessionToCookies = async (session: Session) => {
    try {
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        }),
      })
    } catch (e) {
      console.error('[Auth] Failed to sync session:', e)
    }
  }

  const signOut = async () => {
    const supabase = createClient()
    
    // Sign out from Supabase (clears localStorage)
    await supabase.auth.signOut()
    
    // Clear cookies via API
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (e) {
      console.error('[Auth] Failed to clear cookies:', e)
    }
    
    // Clear state
    setUser(null)
    setSession(null)
    
    // Redirect to home
    window.location.href = '/'
  }

  const refreshSession = async () => {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.error('[Auth] Failed to refresh session:', error)
      return
    }
    
    if (session) {
      setSession(session)
      setUser(session.user)
      await syncSessionToCookies(session)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
