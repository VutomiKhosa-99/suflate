import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

// Singleton pattern - ensures same client instance is used
let browserClient: SupabaseClient<Database> | null = null

export function createClient(): SupabaseClient<Database> {
  if (browserClient) {
    return browserClient
  }

  browserClient = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Use implicit flow - avoids PKCE code verifier issues with SSR
        // This is the recommended approach when PKCE storage doesn't work
        flowType: 'implicit',
        // Persist session in localStorage
        persistSession: true,
        // Auto refresh tokens
        autoRefreshToken: true,
        // Detect session from URL hash (implicit flow returns tokens in hash)
        detectSessionInUrl: true,
      },
    }
  )

  return browserClient
}
