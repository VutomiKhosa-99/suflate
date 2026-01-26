import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getAuthUser } from '@/utils/supabase/auth-helper'

/**
 * GET /api/suflate/workspaces
 * Story 3.8: Move Drafts Between Workspaces (Agency Feature)
 * 
 * Fetches all workspaces the current user is a member of
 * Used for workspace switching and moving drafts between workspaces
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get all workspaces where user is a member
    const { data: memberships, error: membershipError } = await supabase
      .from('workspace_members')
      .select(`
        workspace_id,
        role,
        workspaces (
          id,
          name,
          plan,
          credits_remaining,
          credits_total
        )
      `)
      .eq('user_id', user.id) as { 
        data: Array<{ 
          workspace_id: string; 
          role: string; 
          workspaces: { id: string; name: string; plan: string; credits_remaining: number; credits_total: number } | null 
        }> | null; 
        error: unknown 
      }

    if (membershipError) {
      console.error('Database error fetching workspaces:', membershipError)
      return NextResponse.json(
        { error: 'Failed to fetch workspaces' },
        { status: 500 }
      )
    }

    // Transform data to include workspace details and user's role
    const workspaces = (memberships || [])
      .filter(m => m.workspaces) // Filter out any with missing workspace data
      .map(m => ({
        id: m.workspaces!.id,
        name: m.workspaces!.name,
        plan: m.workspaces!.plan,
        credits_remaining: m.workspaces!.credits_remaining,
        credits_total: m.workspaces!.credits_total,
        role: m.role,
      }))

    return NextResponse.json({
      workspaces,
      count: workspaces.length,
    })
  } catch (error) {
    console.error('Fetch workspaces error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
