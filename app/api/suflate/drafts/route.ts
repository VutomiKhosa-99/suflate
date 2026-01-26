import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { getWorkspaceId } from '@/lib/suflate/workspaces/service'

// Helper to get service client
function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * GET /api/suflate/drafts
 * Story 3.1: View All Drafts in Workspace
 * Story 3.5: Search and Filter Drafts
 * Story 3.7: View Draft Creation Date
 * 
 * Fetches all drafts for the current workspace with optional filters
 * - Search by content text
 * - Filter by source_type, variation_type, tags
 * - Sorted by most recent first
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const workspaceId = searchParams.get('workspaceId')
    const status = searchParams.get('status') || 'draft'
    const search = searchParams.get('search') || ''
    const sourceType = searchParams.get('sourceType')
    const variationType = searchParams.get('variationType')
    const tagsParam = searchParams.get('tags')
    const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : null
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = (page - 1) * limit

    // Resolve workspace: prefer explicit query param, otherwise use selected workspace cookie or membership/owner (no creation)
    let targetWorkspaceId = workspaceId
    if (!targetWorkspaceId) {
      targetWorkspaceId = await getWorkspaceId(request, { id: user.id, email: user.email })
    }

    if (!targetWorkspaceId) {
      return NextResponse.json({
        drafts: [],
        count: 0,
        page,
        limit,
        totalPages: 0,
        filters: {
          availableTags: [],
          sourceTypes: ['voice', 'repurpose_blog', 'repurpose_tweet'],
          variationTypes: ['professional', 'personal', 'actionable', 'discussion', 'bold'],
        },
      })
    }

    // Build base query - use basic columns that always exist
    // Note: title, tags, scheduled_at may not exist if migration hasn't run
    // Query by user_id primarily - workspace filter is optional for better UX
    let query = supabase
      .from('posts')
      .select(`
        id,
        workspace_id,
        user_id,
        transcription_id,
        source_type,
        variation_type,
        content,
        status,
        word_count,
        character_count,
        created_at,
        updated_at,
        transcriptions(
          id,
          raw_text,
          voice_recordings(
            id,
            storage_path,
            duration_seconds
          )
        )
      `, { count: 'exact' })
      .eq('workspace_id', targetWorkspaceId)
      .eq('user_id', user.id)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Already filtered by workspace via targetWorkspaceId

    // Apply search filter (case-insensitive content search)
    if (search) {
      query = query.ilike('content', `%${search}%`)
    }

    // Apply source type filter
    if (sourceType) {
      query = query.eq('source_type', sourceType)
    }

    // Apply variation type filter
    if (variationType) {
      query = query.eq('variation_type', variationType)
    }

    // Note: Tags filter requires the tags column from migration
    // Skip if tags column doesn't exist to maintain backwards compatibility
    if (tags && tags.length > 0) {
      try {
        query = query.overlaps('tags', tags)
      } catch {
        // Tags column may not exist - ignore filter
        console.warn('Tags column not available, skipping tags filter')
      }
    }

    const { data: drafts, error, count } = await query

    if (error) {
      console.error('Database error fetching drafts:', error)
      // Return empty results instead of error for better UX
      // The user can still see the UI and will know there are no drafts
      return NextResponse.json({
        drafts: [],
        count: 0,
        page,
        limit,
        totalPages: 0,
        filters: {
          availableTags: [],
          sourceTypes: ['voice', 'repurpose_blog', 'repurpose_tweet'],
          variationTypes: ['professional', 'personal', 'actionable', 'discussion', 'bold'],
        },
      })
    }

    // Try to get all unique tags - this may fail if tags column doesn't exist
    let uniqueTags: string[] = []
    try {
      const { data: allTags } = await supabase
        .from('posts')
        .select('tags')
        .eq('workspace_id', targetWorkspaceId)
        .eq('status', 'draft')
      
      uniqueTags = [...new Set(
        (allTags || [])
          .flatMap(post => (post as any).tags || [])
          .filter(Boolean)
      )].sort()
    } catch {
      // Tags column may not exist - continue without tags
      console.warn('Could not fetch tags - column may not exist')
    }

    // Add default values for optional columns that may not exist in older schema
    const normalizedDrafts = (drafts || []).map(draft => ({
      ...draft,
      title: (draft as any).title || null,
      tags: (draft as any).tags || [],
      scheduled_at: (draft as any).scheduled_at || null,
    }))

    return NextResponse.json({
      drafts: normalizedDrafts,
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      filters: {
        availableTags: uniqueTags,
        sourceTypes: ['voice', 'repurpose_blog', 'repurpose_tweet'],
        variationTypes: ['professional', 'personal', 'actionable', 'discussion', 'bold'],
      },
    })
  } catch (error) {
    console.error('Fetch drafts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
