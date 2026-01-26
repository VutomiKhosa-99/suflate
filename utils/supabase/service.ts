import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

/**
 * Creates a Supabase client with the service role key.
 * This bypasses RLS and should only be used for admin operations.
 * NEVER expose this client to the frontend.
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for service client')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
