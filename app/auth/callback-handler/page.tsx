'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

function CallbackHandler() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('Completing sign in...')

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient()
      const token_hash = searchParams?.get('token_hash')
      const type = searchParams?.get('type')
      const next = searchParams?.get('next') || '/dashboard'

      console.log('[Callback Handler] Starting...', { 
        hasTokenHash: !!token_hash, 
        type,
        next,
        hash: window.location.hash ? window.location.hash.substring(0, 50) + '...' : 'none'
      })

      // Handle email verification or password recovery (OTP)
      if (token_hash && type) {
        const isRecovery = type === 'recovery'
        setStatus(isRecovery ? 'Verifying reset link...' : 'Verifying email...')
        console.log('[Callback Handler] Verifying OTP, type:', type)
        
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          type: type as any,
          token_hash,
        })

        if (verifyError) {
          console.error('[Callback Handler] OTP verify error:', verifyError.message)
          setError(verifyError.message)
          return
        }

        if (data.session) {
          console.log('[Callback Handler] OTP verified for:', data.user?.email)
          await syncSessionToCookies(data.session)
          
          // For password recovery, redirect to reset password page
          if (isRecovery) {
            console.log('[Callback Handler] Redirecting to reset password')
            window.location.href = '/auth/reset-password'
            return
          }
          
          return redirectUser(data.user!, '/welcome')
        }
      }

      // For implicit flow, detectSessionInUrl should automatically handle the hash
      // Wait a moment for it to process
      setStatus('Processing authentication...')
      await new Promise(resolve => setTimeout(resolve, 500))

      // Check if session was established from URL hash
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('[Callback Handler] Session error:', sessionError.message)
        setError(sessionError.message)
        return
      }

      if (session?.user) {
        console.log('[Callback Handler] Session found for:', session.user.email)
        await syncSessionToCookies(session)
        return redirectUser(session.user, next)
      }

      // If no session yet, try to manually parse hash (fallback)
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        setStatus('Processing tokens...')
        console.log('[Callback Handler] Manually parsing hash...')
        
        const hashParams = new URLSearchParams(hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })

          if (sessionError) {
            console.error('[Callback Handler] Set session error:', sessionError.message)
            setError(sessionError.message)
            return
          }

          if (data.session) {
            console.log('[Callback Handler] Session set for:', data.user?.email)
            await syncSessionToCookies(data.session)
            return redirectUser(data.user!, next)
          }
        }
      }

      // No authentication found
      console.log('[Callback Handler] No authentication found, redirecting to login')
      setError('Authentication failed. Please try again.')
    }

    const syncSessionToCookies = async (session: any) => {
      try {
        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }),
        })
        
        if (res.ok) {
          console.log('[Callback Handler] Session synced to cookies')
          // Wait for cookies to be processed by browser
          await new Promise(resolve => setTimeout(resolve, 100))
        } else {
          console.error('[Callback Handler] Failed to sync session:', await res.text())
        }
      } catch (e) {
        console.error('[Callback Handler] Failed to sync session:', e)
      }
    }

    const redirectUser = async (user: { id: string }, defaultNext: string) => {
      const supabase = createClient()
      
      // Check if user has completed onboarding
      const { data: userData } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single() as { data: { onboarding_completed?: boolean } | null; error: unknown }

      // New users or users who haven't completed onboarding go to /onboarding
      const needsOnboarding = !userData?.onboarding_completed
      const destination = needsOnboarding ? '/onboarding' : defaultNext
      console.log('[Callback Handler] Redirecting to:', destination, { needsOnboarding })
      
      // Use router push with a slight delay to ensure cookies are set
      await new Promise(resolve => setTimeout(resolve, 200))
      window.location.href = destination
    }

    handleCallback()
  }, [searchParams])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a 
            href="/login" 
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  )
}

export default function CallbackHandlerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}
