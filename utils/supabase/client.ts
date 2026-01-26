import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

/**
 * Create Supabase client for browser use
 * Uses cookies for session storage (not localStorage) for better security
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
