import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { repurposeContent } from '@/lib/integrations/openrouter'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { randomUUID } from 'crypto'

// Service client to bypass RLS
function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

/**
 * Fetch YouTube video metadata using oEmbed API (no API key required)
 */
async function fetchYouTubeMetadata(videoId: string): Promise<{
  title: string
  author: string
  description: string
}> {
  // Use oEmbed for basic metadata (no API key required)
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
  
  try {
    const response = await fetch(oembedUrl)
    if (response.ok) {
      const data = await response.json()
      return {
        title: data.title || 'Untitled Video',
        author: data.author_name || 'Unknown',
        description: '', // oEmbed doesn't include description
      }
    }
  } catch (error) {
    console.error('oEmbed fetch error:', error)
  }

  // Fallback: scrape video page for more info
  try {
    const pageUrl = `https://www.youtube.com/watch?v=${videoId}`
    const response = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Suflate/1.0)',
      },
    })

    if (response.ok) {
      const html = await response.text()
      
      // Extract title from meta tag
      const titleMatch = html.match(/<meta\s+name="title"\s+content="([^"]+)"/)
      const title = titleMatch ? titleMatch[1] : 'Untitled Video'

      // Extract description from meta tag
      const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/)
      const description = descMatch ? descMatch[1] : ''

      // Extract author/channel
      const authorMatch = html.match(/"ownerChannelName":"([^"]+)"/)
      const author = authorMatch ? authorMatch[1] : 'Unknown'

      return { title, author, description }
    }
  } catch (error) {
    console.error('YouTube page scrape error:', error)
  }

  return {
    title: 'YouTube Video',
    author: 'Unknown',
    description: '',
  }
}

/**
 * POST /api/suflate/repurpose/youtube
 * Story 6.3: Repurpose YouTube URL into Posts
 * 
 * Extracts video metadata and generates 3 LinkedIn post variations
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
        { status: 400 }
      )
    }

    // Extract video ID
    const videoId = extractVideoId(url)
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL. Please provide a valid YouTube video link.' },
        { status: 400 }
      )
    }

    // Get user's workspace, or create one if missing (for demo/test)
    let { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single()

    let workspaceId = membership?.workspace_id

    if (!workspaceId) {
      // Create a new workspace for this user
      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .insert({
          owner_id: user.id,
          name: user.user_metadata?.name || user.email || 'My Workspace',
          plan: 'starter',
          credits_remaining: 100,
          credits_total: 100,
        })
        .select()
        .single()
      if (wsError || !workspace) {
        return NextResponse.json(
          { error: 'Failed to create workspace' },
          { status: 500 }
        )
      }
      workspaceId = workspace.id
      // Add user as workspace member
      await supabase.from('workspace_members').insert({
        workspace_id: workspaceId,
        user_id: user.id,
        role: 'owner',
      })
    }

    // Fetch video metadata
    const metadata = await fetchYouTubeMetadata(videoId)

    // Build content for repurposing
    let contentToRepurpose = `Video Title: ${metadata.title}\n\nBy: ${metadata.author}`
    
    if (metadata.description) {
      contentToRepurpose += `\n\nDescription:\n${metadata.description}`
    }

    // Note: In production, you could integrate with YouTube's transcript API
    // or use services like AssemblyAI to transcribe the video
    contentToRepurpose += `\n\n[Note: Create posts that reference and promote this video while extracting key insights from the title and description]`

    if (contentToRepurpose.length < 50) {
      return NextResponse.json(
        { error: 'Could not extract enough content from the video' },
        { status: 400 }
      )
    }

    // Generate LinkedIn post variations
    let repurposeResult
    try {
      repurposeResult = await repurposeContent(contentToRepurpose, {
        sourceType: 'youtube',
        title: metadata.title,
        sourceUrl: `https://youtube.com/watch?v=${videoId}`,
      })
    } catch (error) {
      console.error('OpenRouter error:', error)
      return NextResponse.json(
        { error: 'Failed to generate posts: ' + (error instanceof Error ? error.message : 'Unknown error') },
        { status: 500 }
      )
    }

    const variations = repurposeResult.variations || []

    if (variations.length === 0) {
      return NextResponse.json(
        { error: 'No variations generated' },
        { status: 500 }
      )
    }

    // Create post records
    const posts: any[] = []
    const variationTypes = ['insight', 'story', 'actionable']

    for (let i = 0; i < Math.min(variations.length, 3); i++) {
      const allowedTypes = ['professional', 'personal', 'actionable', 'discussion', 'bold']
      const postId = randomUUID()
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          id: postId,
          workspace_id: workspaceId,
          user_id: user.id,
          source_type: 'repurpose_youtube',
          content: variations[i],
          title: `${metadata.title} - Variation ${i + 1}`,
          variation_type: allowedTypes[i] || 'professional',
          status: 'draft',
        })
        .select()
        .single()

      if (postError) {
        console.error('Error creating post:', postError)
      } else if (post) {
        posts.push(post)
      }
    }

    if (posts.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create posts' },
        { status: 500 }
      )
    }

    // TODO: Deduct 5 credits

    return NextResponse.json({
      success: true,
      posts,
      videoMetadata: metadata,
      videoId,
      usage: repurposeResult.usage,
    })
  } catch (error) {
    console.error('YouTube repurpose error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
