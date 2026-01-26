'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'

function VerifyEmailContent() {
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if user is already verified
    async function checkVerification() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setEmail(user.email || null)
        
        // Check email confirmation status
        if (user.email_confirmed_at) {
          setVerified(true)
          // Redirect to dashboard after a moment
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        }
      } else {
        // No user session, redirect to login
        router.push('/login')
      }
    }

    checkVerification()

    // Check for email confirmation token in URL
    const token = searchParams?.get('token')
    const type = searchParams?.get('type')

    if (token && type === 'signup') {
      verifyEmailToken(token)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, searchParams])

  const verifyEmailToken = async (token: string) => {
    setVerifying(true)
    setError(null)

    try {
      const supabase = createClient()
      
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup',
      })

      if (verifyError) {
        setError(verifyError.message)
        return
      }

      if (data.user) {
        setVerified(true)
        // Redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify email')
    } finally {
      setVerifying(false)
    }
  }

  const resendVerificationEmail = async () => {
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user || !user.email) {
        setError('No email found. Please sign up again.')
        return
      }

      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (resendError) {
        setError(resendError.message)
      } else {
        setError(null)
        alert('Verification email sent! Please check your inbox.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend email')
    }
  }

  if (verified) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="border-b border-gray-100">
          <div className="container mx-auto px-4 py-4">
            <Logo />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4 text-gray-900">Email Verified!</h1>
            <p className="text-gray-600 mb-6">
              Your email has been verified successfully. Redirecting to dashboard...
            </p>
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Go to Dashboard
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <Logo />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Verify Your Email</h1>
            <p className="text-gray-600">
              We&apos;ve sent a verification link to your email address
            </p>
            {email && (
              <p className="text-sm font-medium mt-2 text-gray-900">{email}</p>
            )}
          </div>

          <div className="space-y-6">
            <div className="p-6 border border-gray-200 rounded-xl bg-gray-50">
              <h2 className="font-semibold mb-3 text-gray-900">What&apos;s next?</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>You&apos;ll be redirected back to verify your account</li>
              </ol>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {verifying && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                Verifying your email...
              </div>
            )}

            <div className="space-y-4">
              <Button
                onClick={resendVerificationEmail}
                variant="outline"
                className="w-full h-12 border-gray-300 hover:bg-gray-50"
              >
                Resend Verification Email
              </Button>

              <div className="text-center">
                <Button
                  onClick={() => router.push('/login')}
                  variant="ghost"
                  className="w-full h-12 text-gray-600 hover:bg-gray-50"
                >
                  Back to Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <Logo />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </main>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <VerifyEmailContent />
    </Suspense>
  )
}
