import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getAuthUser } from '@/utils/supabase/auth-helper'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/suflate/workspaces/[id]/schedule
 * Story 4.3: Get workspace posting schedule
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Verify user has access to workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have access to this workspace' },
        { status: 403 }
      )
    }

    // Get workspace with posting schedule
    const { data: workspace, error } = await supabase
      .from('workspaces')
      .select('id, name, posting_schedule')
      .eq('id', id)
      .single() as { data: { id: string; name: string; posting_schedule?: unknown } | null; error: unknown }

    if (error || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Return default schedule if not set
    const schedule = workspace.posting_schedule || {
      days: [1, 2, 3, 4, 5], // Monday to Friday
      times: ['09:00', '12:00', '17:00'],
      timezone: 'UTC',
    }

    return NextResponse.json({
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      schedule,
    })
  } catch (error) {
    console.error('Get workspace schedule error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/suflate/workspaces/[id]/schedule
 * Story 4.3: Update workspace posting schedule
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { days, times, timezone } = body

    // Validate input
    if (days !== undefined) {
      if (!Array.isArray(days) || !days.every(d => d >= 1 && d <= 7)) {
        return NextResponse.json(
          { error: 'days must be an array of numbers 1-7 (Monday=1, Sunday=7)' },
          { status: 400 }
        )
      }
    }

    if (times !== undefined) {
      if (!Array.isArray(times) || !times.every(t => /^([01]\d|2[0-3]):[0-5]\d$/.test(t))) {
        return NextResponse.json(
          { error: 'times must be an array of HH:MM format strings' },
          { status: 400 }
        )
      }
    }

    const supabase = await createClient()

    // Verify user has admin access to workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', id)
      .eq('user_id', user.id)
      .single() as { data: { role: string } | null; error: unknown }

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have access to this workspace' },
        { status: 403 }
      )
    }

    // Only owners and admins can change schedule
    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can modify the schedule' },
        { status: 403 }
      )
    }

    // Get current schedule
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('posting_schedule')
      .eq('id', id)
      .single() as { data: { posting_schedule?: unknown } | null; error: unknown }

    const currentSchedule = (workspace?.posting_schedule as Record<string, unknown>) || {
      days: [1, 2, 3, 4, 5],
      times: ['09:00', '12:00', '17:00'],
      timezone: 'UTC',
    }

    // Merge with existing schedule
    const newSchedule = {
      days: days ?? currentSchedule.days,
      times: times ?? currentSchedule.times,
      timezone: timezone ?? currentSchedule.timezone,
    }

    // Update workspace
    const { error: updateError } = await supabase
      .from('workspaces')
      .update({
        posting_schedule: newSchedule,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id)

    if (updateError) {
      console.error('Failed to update workspace schedule:', updateError)
      return NextResponse.json(
        { error: 'Failed to update schedule' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      schedule: newSchedule,
    })
  } catch (error) {
    console.error('Update workspace schedule error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
