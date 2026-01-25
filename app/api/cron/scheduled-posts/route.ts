import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { postTextToLinkedIn } from '@/lib/integrations/linkedin'

// Use service role for cron jobs (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/cron/scheduled-posts
 * Story 4.1, 4.2: Process scheduled posts
 * 
 * This cron job runs every minute (configured in vercel.json)
 * - Posts directly to LinkedIn API (personal or company page)
 * - Falls back to notification if LinkedIn not connected
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (Vercel sends this header)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // In development, allow without auth
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const now = new Date()
    
    // Find all scheduled posts that are due (scheduled_for <= now) and not yet posted
    const { data: duePosts, error: fetchError } = await supabaseAdmin
      .from('scheduled_posts')
      .select(`
        *,
        posts(id, content, workspace_id, user_id),
        users:user_id(id, email, name, linkedin_access_token, linkedin_company_page_id)
      `)
      .lte('scheduled_for', now.toISOString())
      .eq('posted', false)
      .lt('retry_count', 3) // Max 3 retries
      .order('scheduled_for', { ascending: true })
      .limit(10) // Process max 10 at a time

    if (fetchError) {
      console.error('Error fetching due posts:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch scheduled posts' },
        { status: 500 }
      )
    }

    if (!duePosts || duePosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No posts due for processing',
        processed: 0,
      })
    }

    const results = {
      processed: 0,
      posted: 0,
      notified: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const scheduledPost of duePosts) {
      results.processed++
      const post = scheduledPost.posts as any
      const user = scheduledPost.users as any

      try {
        if (scheduledPost.is_company_page && user?.linkedin_access_token && user?.linkedin_company_page_id) {
          // Story 4.1: Auto-post to company page via LinkedIn API
          const postResult = await postToLinkedInCompanyPage(
            user.linkedin_access_token,
            user.linkedin_company_page_id,
            post.content
          )

          if (postResult.success) {
            // Update scheduled post as posted
            await supabaseAdmin
              .from('scheduled_posts')
              .update({
                posted: true,
                posted_at: now.toISOString(),
                linkedin_post_id: postResult.linkedinPostId,
                post_url: postResult.postUrl,
              })
              .eq('id', scheduledPost.id)

            // Update post status to published
            await supabaseAdmin
              .from('posts')
              .update({
                status: 'published',
                updated_at: now.toISOString(),
              })
              .eq('id', post.id)

            results.posted++
          } else {
            throw new Error(postResult.error || 'LinkedIn API failed')
          }
        } else {
          // Story 4.2: Personal profile - try to post directly, fallback to notification
          
          // Check if user has LinkedIn connected
          const { data: userData } = await supabaseAdmin
            .from('users')
            .select('linkedin_access_token, linkedin_profile_id, notification_preferences, email, name')
            .eq('id', user?.id)
            .single()
          
          let postedDirectly = false
          let linkedInPostId = null
          let postUrl = null
          
          // Try to post directly to LinkedIn
          if (userData?.linkedin_access_token && userData?.linkedin_profile_id) {
            console.log(`[Cron] Attempting direct LinkedIn post for scheduled post ${scheduledPost.id}`)
            const personUrn = `urn:li:person:${userData.linkedin_profile_id}`
            
            const result = await postTextToLinkedIn(
              userData.linkedin_access_token,
              personUrn,
              post.content
            )
            
            if (result.success) {
              postedDirectly = true
              linkedInPostId = result.postId
              postUrl = result.postUrl
              console.log(`[Cron] Posted to LinkedIn:`, linkedInPostId)
            } else {
              console.log(`[Cron] LinkedIn post failed:`, result.error)
            }
          }
          
          if (postedDirectly) {
            // Successfully posted - update records
            await supabaseAdmin
              .from('scheduled_posts')
              .update({
                posted: true,
                posted_at: now.toISOString(),
                linkedin_post_id: linkedInPostId,
                post_url: postUrl,
              })
              .eq('id', scheduledPost.id)

            await supabaseAdmin
              .from('posts')
              .update({
                status: 'published',
                updated_at: now.toISOString(),
              })
              .eq('id', post.id)

            results.posted++
          } else {
            // Fallback: Send notification for manual posting
            if (!scheduledPost.notification_sent) {
              const shareUrl = generateLinkedInShareUrl(post.content)
              
              const prefs = userData?.notification_preferences || { email: true, push: false }
              
              // Send email notification if enabled
              if (prefs.email) {
                const emailResult = await sendScheduleNotification(
                  userData?.email,
                  userData?.name || 'there',
                  post.content,
                  shareUrl
                )
                
                if (!emailResult.success) {
                  console.warn(`Email notification failed for ${scheduledPost.id}:`, emailResult.error)
                }
              }
              
              // Send push notification if enabled
              if (prefs.push) {
                const pushResult = await sendPushNotifications(
                  user?.id,
                  post.content,
                  post.id
                )
                
                if (!pushResult.success) {
                  console.warn(`Push notification failed for ${scheduledPost.id}:`, pushResult.error)
                }
              }

              await supabaseAdmin
                .from('scheduled_posts')
                .update({
                  notification_sent: true,
                  notification_sent_at: now.toISOString(),
                })
                .eq('id', scheduledPost.id)

              results.notified++
            }

            // Mark as "posted" after notification
            await supabaseAdmin
              .from('scheduled_posts')
              .update({
                posted: true,
                posted_at: now.toISOString(),
              })
              .eq('id', scheduledPost.id)

            results.posted++
          }
        }
      } catch (error) {
        console.error(`Failed to process scheduled post ${scheduledPost.id}:`, error)
        results.failed++
        results.errors.push(`Post ${scheduledPost.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)

        // Increment retry count
        await supabaseAdmin
          .from('scheduled_posts')
          .update({
            retry_count: scheduledPost.retry_count + 1,
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', scheduledPost.id)
      }
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Post content to LinkedIn company page
 * Story 4.1
 */
async function postToLinkedInCompanyPage(
  accessToken: string,
  companyPageId: string,
  content: string
): Promise<{ success: boolean; linkedinPostId?: string; postUrl?: string; error?: string }> {
  try {
    // LinkedIn API v2 for posting to company pages
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: `urn:li:organization:${companyPageId}`,
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('LinkedIn API error:', errorData)
      return {
        success: false,
        error: `LinkedIn API error: ${response.status} ${response.statusText}`,
      }
    }

    const data = await response.json()
    const postId = data.id // urn:li:share:xxx
    const postUrl = `https://www.linkedin.com/feed/update/${postId}`

    return {
      success: true,
      linkedinPostId: postId,
      postUrl,
    }
  } catch (error) {
    console.error('LinkedIn posting error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Generate LinkedIn share URL for personal profiles
 * Story 4.2, 4.6
 */
function generateLinkedInShareUrl(content: string): string {
  // LinkedIn share URL with pre-filled text
  // Note: LinkedIn's share-offsite doesn't support pre-filled text directly
  // We'll use the Post Inspector URL which allows text
  const encodedContent = encodeURIComponent(content)
  // Use the mobile share URL which better handles text
  return `https://www.linkedin.com/feed/?shareActive=true&text=${encodedContent}`
}

/**
 * Send email notification for scheduled post
 * Story 4.2
 */
async function sendScheduleNotification(
  email: string | undefined,
  name: string,
  postContent: string,
  shareUrl: string
): Promise<{ success: boolean; error?: string }> {
  if (!email) {
    return { success: false, error: 'No email address' }
  }

  // Check for Resend API key
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY not configured, skipping email notification')
    // Return success in development to not block the flow
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Would send email to ${email} with share URL: ${shareUrl}`)
      return { success: true }
    }
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Suflate <notifications@suflate.com>',
        to: email,
        subject: "It's time to post! Your scheduled content is ready",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .content-preview { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; white-space: pre-wrap; }
              .cta-button { display: inline-block; background: #0077B5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎯 Time to Post!</h1>
                <p>Hey ${name}, your scheduled post is ready to go live.</p>
              </div>
              
              <h3>Your Content:</h3>
              <div class="content-preview">${postContent.slice(0, 500)}${postContent.length > 500 ? '...' : ''}</div>
              
              <p style="text-align: center;">
                <a href="${shareUrl}" class="cta-button">Post to LinkedIn →</a>
              </p>
              
              <p style="font-size: 14px; color: #666;">
                Click the button above to open LinkedIn with your content ready to post.
                Just review and hit "Post" to publish!
              </p>
              
              <div class="footer">
                <p>Sent by Suflate • Your voice, amplified</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Hey ${name},

It's time to post! Your scheduled content is ready.

Your Content:
${postContent.slice(0, 500)}${postContent.length > 500 ? '...' : ''}

Click here to post to LinkedIn:
${shareUrl}

---
Sent by Suflate • Your voice, amplified
        `,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Resend API error:', errorData)
      return {
        success: false,
        error: `Email API error: ${response.status}`,
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Email sending error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send push notifications to all user's subscribed devices
 * Note: Requires web-push module to be installed
 */
async function sendPushNotifications(
  userId: string | undefined,
  postContent: string,
  postId: string
): Promise<{ success: boolean; error?: string }> {
  // Push notifications are disabled until web-push is installed
  // To enable: npm install web-push
  console.warn('Push notifications disabled - web-push module not installed')
  return { success: false, error: 'Push notifications not configured' }
}
