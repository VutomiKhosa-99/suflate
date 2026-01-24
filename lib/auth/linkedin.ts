/**
 * LinkedIn OAuth Integration
 * 
 * Supabase supports OAuth providers through auth.signInWithOAuth()
 * LinkedIn OAuth requires:
 * 1. LinkedIn App created at https://www.linkedin.com/developers/apps
 * 2. Client ID and Client Secret configured in Supabase Dashboard
 * 3. Redirect URL configured in LinkedIn app settings
 */

import { createClient } from '@/utils/supabase/client'

export async function signInWithLinkedIn() {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'linkedin_oidc',
    options: {
      // Redirect to server callback which handles PKCE exchange
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    throw error
  }

  return data
}

export async function signUpWithLinkedIn() {
  // LinkedIn OAuth handles both sign in and sign up
  return signInWithLinkedIn()
}
