import { createClient } from '@/utils/supabase/client'

/**
 * Sign in with Google OAuth
 * Story 2.2: Sign Up with Google OAuth
 */
export async function signInWithGoogle() {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Redirect to server callback which handles PKCE exchange
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/**
 * Sign up with Google OAuth (same as sign in for OAuth)
 */
export async function signUpWithGoogle() {
  return signInWithGoogle()
}
