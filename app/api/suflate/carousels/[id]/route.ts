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

    // Fetch carousel
    const { data: carousel, error } = await supabase
      .from('carousels')
      .select('*, transcriptions(raw_text, processed_text)')
      .eq('id', id)
      .single()

    if (error || !carousel) {
      return NextResponse.json({ error: 'Carousel not found' }, { status: 404 })
    }

    if (carousel.workspace_id !== workspaceId) {
      return NextResponse.json({ error: 'Carousel does not belong to selected workspace' }, { status: 403 })
    }

    return NextResponse.json({ carousel })
  } catch (err) {
    console.error('Carousel fetch error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { user, error: authError } = await getAuthUser(request)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()
    const body = await request.json()

    // Resolve selected workspace
    const workspaceId = await getWorkspaceId(request, { id: user.id, email: user.email })
    if (!workspaceId) return NextResponse.json({ error: 'No workspace selected' }, { status: 400 })

    // Verify carousel exists and belongs to workspace
    const { data: existingCarousel, error: fetchError } = await supabase
      .from('carousels')
      .select('id, workspace_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingCarousel) {
      return NextResponse.json({ error: 'Carousel not found' }, { status: 404 })
    }

    if (existingCarousel.workspace_id !== workspaceId) {
      return NextResponse.json({ error: 'Carousel does not belong to selected workspace' }, { status: 403 })
    }

    // Build update object
    const updates: Record<string, any> = {}
    if (body.title !== undefined) updates.title = body.title
    if (body.slide_data !== undefined) {
      if (!Array.isArray(body.slide_data)) {
        return NextResponse.json({ error: 'slide_data must be an array' }, { status: 400 })
      }
      updates.slide_data = body.slide_data.map((slide: any, index: number) => ({
        ...slide,
        slide_number: index + 1,
      }))
    }
    if (body.template_type !== undefined) updates.template_type = body.template_type
    if (body.custom_branding !== undefined) updates.custom_branding = body.custom_branding
    if (body.status !== undefined) updates.status = body.status

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: carousel, error: updateError } = await supabase
      .from('carousels')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Carousel update error:', updateError)
      return NextResponse.json({ error: 'Failed to update carousel' }, { status: 500 })
    }

    return NextResponse.json({ carousel })
  } catch (error) {
    console.error('Carousel update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { user, error: authError } = await getAuthUser(request)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()

    // Resolve selected workspace
    const workspaceId = await getWorkspaceId(request, { id: user.id, email: user.email })
    if (!workspaceId) return NextResponse.json({ error: 'No workspace selected' }, { status: 400 })

    // Delete only if belongs to workspace
    const { error } = await supabase
      .from('carousels')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) {
      console.error('Carousel delete error:', error)
      return NextResponse.json({ error: 'Failed to delete carousel' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Carousel delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
