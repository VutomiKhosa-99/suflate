import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { postTextToLinkedIn, generateShareUrl } from '@/lib/integrations/linkedin'

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
 * POST /api/suflate/posts/[id]/publish
 * 
 * Publishes a post by:
 * 1. Posting directly to LinkedIn via API (if connected)
 * 2. Updating status to 'published'
 * 3. Setting published_at timestamp
 * 
 * Falls back to share URL if LinkedIn not connected
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()

    // Get the post and verify ownership
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id, content, title, status, user_id, workspace_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (!post.content || post.content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Cannot publish an empty post' },
        { status: 400 }
      )
    }

    // Fetch workspace-level LinkedIn account (if any)
    const { data: accountData } = await supabase
      .from('workspace_linkedin_accounts')
      .select('linkedin_access_token, linkedin_profile_id')
      .eq('workspace_id', post.workspace_id)
      .single()

    let linkedInPostId: string | null = null
    let linkedInPostUrl: string | null = null
    let postedDirectly = false

    // Try to post directly to LinkedIn if connected
    if (accountData?.linkedin_access_token && accountData?.linkedin_profile_id) {
      console.log('[Publish Post] Attempting direct LinkedIn post (workspace-level account)...')
      const personUrn = `urn:li:person:${accountData.linkedin_profile_id}`

      const result = await postTextToLinkedIn(
        accountData.linkedin_access_token,
        personUrn,
        post.content,
        post.title || undefined
      )

      if (result.success) {
        linkedInPostId = result.postId || null
        linkedInPostUrl = result.postUrl || null
        postedDirectly = true
        console.log('[Publish Post] Posted to LinkedIn:', linkedInPostId)
      } else {
        console.log('[Publish Post] LinkedIn API failed:', result.error)
        // Don't fail - fall back to share URL
      }
    }

    // Update post status to published
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({
        status: 'published',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating post status:', updateError)
      // Don't fail if the LinkedIn post succeeded - just log the DB error
      if (postedDirectly) {
        console.log('[Publish Post] LinkedIn post succeeded, but DB update failed. Continuing...')
      } else {
        return NextResponse.json(
          { error: 'Failed to publish post' },
          { status: 500 }
        )
      }
    }

    // Generate share URL as fallback
    const shareUrl = generateShareUrl(post.content)

    return NextResponse.json({
      success: true,
      post: updatedPost,
      postedDirectly,
      linkedInPostId,
      linkedInPostUrl,
      shareUrl,
      message: postedDirectly 
        ? 'Successfully posted to LinkedIn!' 
        : 'Post marked as published. Click the share link to post on LinkedIn.',
    })
  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
