import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { getWorkspaceId } from '@/lib/suflate/workspaces/service'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Service client to bypass RLS
function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * POST /api/suflate/carousels/[id]/schedule
 * Story 5.7: Schedule a carousel for posting
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()
    const body = await request.json()
    const { scheduledFor, notificationMethod = 'email' } = body

    if (!scheduledFor) {
      return NextResponse.json(
        { error: 'scheduledFor is required' },
        { status: 400 }
      )
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledFor)
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      )
    }

    // Resolve selected workspace (do NOT create)
    const workspaceId = await getWorkspaceId(request, { id: user.id, email: user.email })
    if (!workspaceId) return NextResponse.json({ error: 'No workspace selected' }, { status: 400 })

    // Fetch carousel and verify ownership
    const { data: carousel, error: carouselError } = await supabase
      .from('carousels')
      .select('*')
      .eq('id', id)
      .single()

    if (carouselError || !carousel) {
      return NextResponse.json({ error: 'Carousel not found' }, { status: 404 })
    }

    if (carousel.workspace_id !== workspaceId) {
      return NextResponse.json({ error: 'Carousel does not belong to selected workspace' }, { status: 403 })
    }

    // Check if carousel is already scheduled (in this workspace)
    const { data: existingSchedule } = await supabase
      .from('scheduled_posts')
      .select('id')
      .eq('carousel_id', id)
      .eq('workspace_id', workspaceId)
      .single()

    if (existingSchedule) {
      return NextResponse.json(
        { error: 'Carousel is already scheduled. Delete the existing schedule first.' },
        { status: 400 }
      )
    }

    // Create scheduled_posts record
    const { data: scheduledPost, error: scheduleError } = await supabase
      .from('scheduled_posts')
      .insert({
        carousel_id: id,
        post_id: null,
        workspace_id: workspaceId,
        user_id: user.id,
        scheduled_for: scheduledDate.toISOString(),
        notification_method: notificationMethod,
        content_type: 'carousel',
      })
      .select()
      .single()

    if (scheduleError) {
      console.error('Schedule error:', scheduleError)
      return NextResponse.json(
        { error: 'Failed to schedule carousel' },
        { status: 500 }
      )
    }

    // Update carousel status (ensure workspace match)
    await supabase
      .from('carousels')
      .update({ status: 'scheduled' })
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    return NextResponse.json({
      success: true,
      scheduledPost,
    })
  } catch (error) {
    console.error('Carousel schedule error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/suflate/carousels/[id]/schedule
 * Get schedule info for a carousel
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()

    // Resolve selected workspace (do NOT create)
    const workspaceId = await getWorkspaceId(request, { id: user.id, email: user.email })
    if (!workspaceId) return NextResponse.json({ error: 'No workspace selected' }, { status: 400 })

    // Fetch schedule for this carousel in the workspace
    const { data: schedule, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('carousel_id', id)
      .eq('workspace_id', workspaceId)
      .single()

    if (error || !schedule) {
      return NextResponse.json({ scheduled: false })
    }

    return NextResponse.json({
      scheduled: true,
      schedule,
    })
  } catch (error) {
    console.error('Carousel schedule fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/suflate/carousels/[id]/schedule
 * Update schedule for a carousel
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()
    const body = await request.json()
    const { scheduledFor, notificationMethod } = body

    // Build update object
    const updates: Record<string, any> = {}

    if (scheduledFor) {
      const scheduledDate = new Date(scheduledFor)
      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future' },
          { status: 400 }
        )
      }
      updates.scheduled_for = scheduledDate.toISOString()
    }

    if (notificationMethod) {
      updates.notification_method = notificationMethod
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Update schedule
    const { data: schedule, error: updateError } = await supabase
      .from('scheduled_posts')
      .update(updates)
      .eq('carousel_id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError || !schedule) {
      return NextResponse.json(
        { error: 'Schedule not found or update failed' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      schedule,
    })
  } catch (error) {
    console.error('Carousel schedule update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/suflate/carousels/[id]/schedule
 * Cancel/delete schedule for a carousel
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()

    // Resolve selected workspace (do NOT create)
    const workspaceId = await getWorkspaceId(request, { id: user.id, email: user.email })
    if (!workspaceId) return NextResponse.json({ error: 'No workspace selected' }, { status: 400 })

    // Delete schedule for this carousel in the workspace
    const { error: deleteError } = await supabase
      .from('scheduled_posts')
      .delete()
      .eq('carousel_id', id)
      .eq('workspace_id', workspaceId)

    if (deleteError) {
      console.error('Schedule delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete schedule' },
        { status: 500 }
      )
    }

    // Update carousel status back to ready/draft
    await supabase
      .from('carousels')
      .update({ status: 'ready' })
      .eq('id', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Carousel schedule delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
