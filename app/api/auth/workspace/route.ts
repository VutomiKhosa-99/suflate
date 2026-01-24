import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getAuthUser } from '@/utils/supabase/auth-helper'

/**
 * GET /api/auth/workspace
 * Get the user's default workspace
 * Story 2.6: Create Default Workspace
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user using helper that handles cookie parsing
    const { user, error: userError } = await getAuthUser(request)

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's default workspace (first workspace they own)
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (workspaceError || !workspace) {
      // If no workspace exists, create one (fallback - should be handled by trigger)
      const { data: newWorkspace, error: createError } = await supabase
        .from('workspaces')
        .insert({
          name: `${user.email?.split('@')[0]}'s Workspace`,
          owner_id: user.id,
          plan: 'starter',
          credits_remaining: 100,
          credits_total: 100,
        })
        .select()
        .single()

      if (createError || !newWorkspace) {
        return NextResponse.json(
          { error: 'Failed to get or create workspace' },
          { status: 500 }
        )
      }

      // Add user as owner
      await supabase
        .from('workspace_members')
        .insert({
          workspace_id: newWorkspace.id,
          user_id: user.id,
          role: 'owner',
        })

      return NextResponse.json({ workspace: newWorkspace })
    }

    return NextResponse.json({ workspace })
  } catch (error) {
    console.error('Get workspace error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
