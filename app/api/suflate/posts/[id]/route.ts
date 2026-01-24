import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/utils/supabase/auth-helper'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Helper to get service client
function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * GET /api/suflate/posts/[id]
 * Story 3.3: Edit Draft Content
 * 
 * Fetches a single post by ID with related data
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()

    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        id,
        workspace_id,
        user_id,
        transcription_id,
        amplification_job_id,
        source_type,
        variation_type,
        content,
        title,
        tags,
        status,
        word_count,
        character_count,
        scheduled_at,
        created_at,
        updated_at,
        transcriptions(
          id,
          raw_text,
          processed_text,
          detected_content_type,
          voice_recordings(
            id,
            storage_path,
            duration_seconds,
            created_at
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      console.error('Database error fetching post:', error)
      return NextResponse.json(
        { error: 'Failed to fetch post' },
        { status: 500 }
      )
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Fetch post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/suflate/posts/[id]
 * Story 3.3: Edit Draft Content
 * Story 3.6: Tag Drafts for Organization
 * 
 * Updates a post's content, title, tags, or status
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, title, tags, status } = body

    // Validate that at least one field is being updated
    if (!content && title === undefined && !tags && !status) {
      return NextResponse.json(
        { error: 'No update fields provided' },
        { status: 400 }
      )
    }

    // Validate status if provided
    const validStatuses = ['draft', 'scheduled', 'published', 'archived', 'deleted']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()

    // Build update object
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (content !== undefined) {
      updateData.content = content
      updateData.word_count = content.trim().split(/\s+/).filter(Boolean).length
      updateData.character_count = content.length
    }

    if (title !== undefined) {
      updateData.title = title
    }

    if (tags !== undefined) {
      // Validate tags is an array of strings
      if (!Array.isArray(tags) || !tags.every(t => typeof t === 'string')) {
        return NextResponse.json(
          { error: 'Tags must be an array of strings' },
          { status: 400 }
        )
      }
      updateData.tags = tags.map(t => t.trim()).filter(Boolean)
    }

    if (status !== undefined) {
      updateData.status = status
    }

    const { data: post, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      console.error('Database error updating post:', error)
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      post,
    })
  } catch (error) {
    console.error('Update post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/suflate/posts/[id]
 * Story 3.4: Delete Drafts
 * 
 * Soft deletes a post by setting status to 'deleted'
 * Use ?hard=true for permanent deletion
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'

    const supabase = getServiceClient()

    if (hardDelete) {
      // Permanent deletion
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Database error deleting post:', error)
        return NextResponse.json(
          { error: 'Failed to delete post' },
          { status: 500 }
        )
      }
    } else {
      // Soft delete - set status to 'deleted'
      const { error } = await supabase
        .from('posts')
        .update({
          status: 'deleted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Database error soft-deleting post:', error)
        return NextResponse.json(
          { error: 'Failed to delete post' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      deleted: true,
      hardDelete,
    })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
