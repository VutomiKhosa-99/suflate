import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * GET /api/test-auth
 * Test endpoint to check authentication and workspace setup
 * Used for testing before Epic 2 (Auth & Workspace) is complete
 */
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Try to get user (will work if auth is set up)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Check if Supabase connection works
    const { data: testData, error: dbError } = await supabase
      .from('voice_recordings')
      .select('count')
      .limit(1)

    return NextResponse.json({
      supabaseConnected: !dbError,
      authAvailable: !authError,
      hasUser: !!user,
      userId: user?.id || null,
      testMode: process.env.TEST_MODE === 'true',
      message: user 
        ? 'Authentication is working!'
        : 'Using placeholder auth. Set up authentication in Epic 2.',
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
