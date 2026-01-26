import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { getAuthUser } from '@/utils/supabase/auth-helper'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/suflate/voice/public-link/[id]
 * Update a public voice link (e.g., add/update questions)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Authentication check
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { questions } = body

    const serviceClient = createServiceClient()

    // Verify ownership and update
    const { data: link, error: fetchError } = await serviceClient
      .from('public_voice_links')
      .select('id, user_id')
      .eq('id', id)
      .single() as { data: { id: string; user_id: string } | null; error: any }

    if (fetchError || !link) {
      return NextResponse.json(
        { error: 'Public link not found' },
        { status: 404 }
      )
    }

    if (link.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this link' },
        { status: 403 }
      )
    }

    // Update the link
    const { error: updateError } = await (serviceClient
      .from('public_voice_links') as any)
      .update({ 
        questions: questions || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Failed to update public link:', updateError)
      return NextResponse.json(
        { error: 'Failed to update public link' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Public link update error:', error)
    return NextResponse.json(
      { error: 'Failed to update public link' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/suflate/voice/public-link/[id]
 * Delete a public voice link
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Authentication check
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = createServiceClient()

    // Verify ownership
    const { data: link, error: fetchError } = await serviceClient
      .from('public_voice_links')
      .select('id, user_id')
      .eq('id', id)
      .single() as { data: { id: string; user_id: string } | null; error: any }

    if (fetchError || !link) {
      return NextResponse.json(
        { error: 'Public link not found' },
        { status: 404 }
      )
    }

    if (link.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this link' },
        { status: 403 }
      )
    }

    // Delete the link
    const { error: deleteError } = await serviceClient
      .from('public_voice_links')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Failed to delete public link:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete public link' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Public link delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete public link' },
      { status: 500 }
    )
  }
}
