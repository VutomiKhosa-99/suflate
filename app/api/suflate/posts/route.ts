import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

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
    // Authentication check - Epic 2
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const recordingId = searchParams.get('recordingId')
    const transcriptionId = searchParams.get('transcriptionId')

    if (!recordingId && !transcriptionId) {
      return NextResponse.json(
        { error: 'recordingId or transcriptionId is required' },
        { status: 400 }
      )
    }

    // Build query
    let query = supabase
      .from('posts')
      .select('*')

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
