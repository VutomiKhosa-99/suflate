import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { repurposeContent } from '@/lib/integrations/openrouter'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { getWorkspaceId } from '@/lib/suflate/workspaces/service'
import { randomUUID } from 'crypto'
import * as cheerio from 'cheerio'

// Service client to bypass RLS
function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * POST /api/suflate/repurpose/blog
 * Story 6.1: Repurpose Blog URL into LinkedIn Posts
 * 
 * Fetches blog content, extracts text, and generates 3 LinkedIn post variations
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
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Resolve selected workspace (do NOT create)
    const workspaceId = await getWorkspaceId(request, { id: user.id, email: user.email })
    if (!workspaceId) {
      return NextResponse.json({ error: 'No workspace selected' }, { status: 400 })
    }

    // Fetch the blog content
    let blogHtml: string
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Suflate/1.0; +https://suflate.com)',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status}`)
      }

      blogHtml = await response.text()
    } catch (fetchError) {
      console.error('Blog fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch blog content. Please check the URL is accessible.' },
        { status: 400 }
      )
    }

    // Extract content using cheerio
    const $ = cheerio.load(blogHtml)

    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .sidebar, .comments, .advertisement').remove()

    // Extract title
    const title = $('h1').first().text().trim() || 
                  $('title').text().trim() || 
                  $('meta[property="og:title"]').attr('content') || 
                  'Untitled'

    // Extract main content
    // Try common content selectors
    let content = ''
    const contentSelectors = [
      'article',
      '[role="main"]',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.content',
      'main',
      '.blog-post',
    ]

    for (const selector of contentSelectors) {
      const element = $(selector)
      if (element.length > 0) {
        content = element.text().trim()
        if (content.length > 200) break
      }
    }

    // Fallback to body if no content found
    if (content.length < 200) {
      content = $('body').text().trim()
    }

    // Clean up content
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .slice(0, 10000) // Limit content length

    if (content.length < 100) {
      return NextResponse.json(
        { error: 'Could not extract meaningful content from the URL' },
        { status: 400 }
      )
    }

    // Generate LinkedIn post variations
    let repurposeResult
    try {
      repurposeResult = await repurposeContent(content, {
        sourceType: 'blog',
        title,
        sourceUrl: url,
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
    // Use valid variation_type values from database constraint
    const variationTypes = ['professional', 'personal', 'actionable']

    for (let i = 0; i < Math.min(variations.length, 3); i++) {
      const postId = randomUUID()
      const content = variations[i]
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          id: postId,
          workspace_id: workspaceId,
          user_id: user.id,
          source_type: 'repurpose_blog',
          content: content,
          title: `${title} - Variation ${i + 1}`,
          variation_type: variationTypes[i] || 'professional',
          status: 'draft',
          word_count: content.split(/\s+/).length,
          character_count: content.length,
          tags: ['blog', 'repurposed'],
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
      extractedTitle: title,
      contentLength: content.length,
      usage: repurposeResult.usage,
    })
  } catch (error) {
    console.error('Blog repurpose error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
