import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/utils/supabase/auth-helper'

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
 * GET /api/suflate/carousels/[id]
 * Get a specific carousel by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()

    // Fetch carousel with user ownership check
    const { data: carousel, error } = await supabase
      .from('carousels')
      .select('*, transcriptions(raw_text, processed_text)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !carousel) {
      return NextResponse.json({ error: 'Carousel not found' }, { status: 404 })
    }

    return NextResponse.json({ carousel })
  } catch (error) {
    console.error('Carousel fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/suflate/carousels/[id]
 * Update a carousel (slides, template, branding, etc.)
 * Story 5.4: Edit Text on Each Slide
 * Story 5.5: Add or Remove Slides
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

    // Verify ownership
    const { data: existingCarousel, error: fetchError } = await supabase
      .from('carousels')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingCarousel) {
      return NextResponse.json({ error: 'Carousel not found' }, { status: 404 })
    }

    // Build update object
    const updates: Record<string, any> = {}

    if (body.title !== undefined) {
      updates.title = body.title
    }

    if (body.slide_data !== undefined) {
      // Validate slide data structure
      if (!Array.isArray(body.slide_data)) {
        return NextResponse.json(
          { error: 'slide_data must be an array' },
          { status: 400 }
        )
      }

      // Renumber slides to ensure continuity
      updates.slide_data = body.slide_data.map((slide: any, index: number) => ({
        ...slide,
        slide_number: index + 1,
      }))
    }

    if (body.template_type !== undefined) {
      const validTemplates = ['minimal', 'bold', 'professional', 'creative', 'story']
      if (!validTemplates.includes(body.template_type)) {
        return NextResponse.json(
          { error: 'Invalid template type' },
          { status: 400 }
        )
      }
      updates.template_type = body.template_type
    }

    if (body.custom_branding !== undefined) {
      updates.custom_branding = body.custom_branding
    }

    if (body.status !== undefined) {
      const validStatuses = ['draft', 'ready', 'scheduled', 'published']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        )
      }
      updates.status = body.status
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Update carousel
    const { data: carousel, error: updateError } = await supabase
      .from('carousels')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Carousel update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update carousel' },
        { status: 500 }
      )
    }

    return NextResponse.json({ carousel })
  } catch (error) {
    console.error('Carousel update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/suflate/carousels/[id]
 * Delete a carousel
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()

    // Verify ownership and delete
    const { error } = await supabase
      .from('carousels')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Carousel delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete carousel' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Carousel delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
