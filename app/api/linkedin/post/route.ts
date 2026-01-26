import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/utils/supabase/auth-helper'

/**
 * POST /api/linkedin/post
 * Post content directly to LinkedIn using w_member_social scope
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, postId } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Get user's LinkedIn credentials
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: userData, error: fetchError } = await serviceClient
      .from('users')
      .select('linkedin_access_token, linkedin_profile_id')
      .eq('id', user.id)
      .single()

    if (fetchError || !userData?.linkedin_access_token) {
      return NextResponse.json({ 
        error: 'LinkedIn not connected. Please connect your LinkedIn account first.' 
      }, { status: 400 })
    }

    const accessToken = userData.linkedin_access_token
    const profileId = userData.linkedin_profile_id

    // Get the person URN - need to fetch it if we don't have it
    let personUrn: string
    if (profileId) {
      personUrn = `urn:li:person:${profileId}`
    } else {
      // Try to get the profile ID from userinfo
      const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!profileResponse.ok) {
        return NextResponse.json({ 
          error: 'Failed to get LinkedIn profile. Please reconnect your account.' 
        }, { status: 400 })
      }

      const profileData = await profileResponse.json()
      personUrn = `urn:li:person:${profileData.sub}`

      // Update the user's profile ID
      await serviceClient
        .from('users')
        .update({ linkedin_profile_id: profileData.sub })
        .eq('id', user.id)
    }

    console.log('[LinkedIn Post] Posting for user:', user.id, 'URN:', personUrn)

    // Post to LinkedIn using the Posts API (newer) with fallback to ugcPosts
    let linkedinPostId: string | null = null
    let linkedinPostUrl: string | null = null

    // Try the newer Posts API first (recommended by LinkedIn)
    const postsApiResponse = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202401',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: personUrn,
        commentary: content,
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: []
        },
        lifecycleState: 'PUBLISHED',
      }),
    })

    if (postsApiResponse.ok) {
      const postData = await postsApiResponse.json()
      linkedinPostId = postData.id || postData.urn
      console.log('[LinkedIn Post] Posted via Posts API:', linkedinPostId)
    } else {
      // Fallback to ugcPosts API
      console.log('[LinkedIn Post] Posts API failed, trying ugcPosts...')
      const errorText = await postsApiResponse.text()
      console.log('[LinkedIn Post] Posts API error:', postsApiResponse.status, errorText)

      const ugcResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          author: personUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: content,
              },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
          },
        }),
      })

      if (!ugcResponse.ok) {
        const ugcError = await ugcResponse.text()
        console.error('[LinkedIn Post] ugcPosts API failed:', ugcResponse.status, ugcError)
        return NextResponse.json({ 
          error: 'Failed to post to LinkedIn. Please try again or reconnect your account.',
          details: ugcError
        }, { status: 500 })
      }

      const ugcData = await ugcResponse.json()
      linkedinPostId = ugcData.id
      console.log('[LinkedIn Post] Posted via ugcPosts API:', linkedinPostId)
    }

    // Generate the post URL
    if (linkedinPostId) {
      // Clean up the URN to get just the activity ID
      const activityId = linkedinPostId.replace('urn:li:share:', '').replace('urn:li:ugcPost:', '')
      linkedinPostUrl = `https://www.linkedin.com/feed/update/urn:li:share:${activityId}`
    }

    // Update the post status in our database if postId was provided
    if (postId) {
      await serviceClient
        .from('posts')
        .update({
          status: 'published',
          linkedin_post_id: linkedinPostId,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)
        .eq('user_id', user.id)
    }

    return NextResponse.json({
      success: true,
      postId: linkedinPostId,
      postUrl: linkedinPostUrl,
    })

  } catch (e) {
    console.error('[LinkedIn Post] Exception:', e)
    return NextResponse.json({ 
      error: 'An error occurred while posting to LinkedIn' 
    }, { status: 500 })
  }
}
