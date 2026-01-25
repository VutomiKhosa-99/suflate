import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { randomUUID } from 'crypto'

// Service client to bypass RLS for administrative operations
function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * POST /api/suflate/posts
 * Story 3.9: Create Draft Manually
 * 
 * Creates a new blank draft post without going through voice recording
 * - Creates post with source_type='manual'
 * - Sets default variation_type='professional'
 * - Returns the created post for redirect to editor
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service client to bypass RLS for post creation
    const supabase = getServiceClient()
    
    // Parse optional body for initial content
    let initialContent = ''
    let initialTitle = ''
    let variationType = 'professional'
    
    try {
      const body = await request.json()
      initialContent = body.content || ''
      initialTitle = body.title || ''
      variationType = body.variationType || 'professional'
    } catch {
      // No body provided, use defaults
    }

    // Validate variation type
    const validVariationTypes = ['professional', 'personal', 'actionable', 'discussion', 'bold']
    if (!validVariationTypes.includes(variationType)) {
      variationType = 'professional'
    }

    // Get user's workspace using service client (bypasses RLS)
    let workspaceId: string | null = null
    
    // First try workspace_members
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (membership) {
      workspaceId = membership.workspace_id
    } else {
      // Fallback to owned workspace
      const { data: ownedWorkspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .single()

      if (ownedWorkspace) {
        workspaceId = ownedWorkspace.id
        
        // Create missing workspace_members record
        await supabase
          .from('workspace_members')
          .insert({
            workspace_id: ownedWorkspace.id,
            user_id: user.id,
            role: 'owner',
          })
      }
    }

    if (!workspaceId) {
      // Auto-create workspace for the user if they don't have one
      const { data: newWorkspace, error: createWsError } = await supabase
        .from('workspaces')
        .insert({
          name: `${user.email?.split('@')[0] || 'My'}'s Workspace`,
          owner_id: user.id,
        })
        .select()
        .single()

      if (createWsError) {
        console.error('Failed to create workspace:', createWsError)
        return NextResponse.json(
          { error: 'Failed to create workspace. Please try again.' },
          { status: 500 }
        )
      }

      workspaceId = newWorkspace.id

      // Create workspace_members record
      await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: user.id,
          role: 'owner',
        })
    }

    // Create the manual draft post
    // Note: Manual drafts don't have transcription_id since they're not from voice
    const postId = randomUUID()
    
    const { data: post, error: createError } = await supabase
      .from('posts')
      .insert({
        id: postId,
        workspace_id: workspaceId,
        user_id: user.id,
        source_type: 'manual',
        variation_type: variationType,
        content: initialContent,
        title: initialTitle,
        tags: [],
        status: 'draft',
        word_count: initialContent.trim().split(/\s+/).filter(Boolean).length,
        character_count: initialContent.length,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating manual draft:', createError)
      // Check for common database errors
      if (createError.message?.includes('null value') || createError.code === '23502') {
        return NextResponse.json(
          { error: 'Database schema error - transcription_id constraint. Please run migrations.' },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { error: `Failed to create draft: ${createError.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      post,
    })
  } catch (error) {
    console.error('Create draft error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/suflate/posts
 * Story 1.6: View Post Variations with Labels
 * 
 * Fetches post variations for a recording or transcription
 * - Can filter by recording_id or transcription_id
 * - Returns posts ordered by variation_type
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check using helper that handles cookie parsing
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service client to bypass RLS (we filter by user's posts)
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { searchParams } = new URL(request.url)
    const recordingId = searchParams.get('recordingId')
    const transcriptionId = searchParams.get('transcriptionId')

    if (!recordingId && !transcriptionId) {
      return NextResponse.json(
        { error: 'recordingId or transcriptionId is required' },
        { status: 400 }
      )
    }

    // Build query - filter by user_id to ensure user only sees their posts
    let query = supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)

    if (recordingId) {
      // Get posts via transcription_id from recording
      const { data: transcription } = await supabase
        .from('transcriptions')
        .select('id')
        .eq('recording_id', recordingId)
        .single()

      if (transcription) {
        query = query.eq('transcription_id', transcription.id)
      } else {
        // No transcription found, return empty
        return NextResponse.json({ posts: [] })
      }
    } else if (transcriptionId) {
      query = query.eq('transcription_id', transcriptionId)
    }

    // Order by variation_type for consistent display
    const variationOrder: Record<string, number> = {
      professional: 1,
      personal: 2,
      actionable: 3,
      discussion: 4,
      bold: 5,
    }

    const { data: posts, error } = await query

    if (error) {
      console.error('Database error fetching posts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

    // Sort by variation_type order
    const sortedPosts = (posts || []).sort((a, b) => {
      const orderA = variationOrder[a.variation_type || ''] || 99
      const orderB = variationOrder[b.variation_type || ''] || 99
      return orderA - orderB
    })

    return NextResponse.json({
      posts: sortedPosts,
      count: sortedPosts.length,
    })
  } catch (error) {
    console.error('Fetch posts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
