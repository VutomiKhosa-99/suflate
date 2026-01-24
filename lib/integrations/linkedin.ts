// LinkedIn OAuth and API integration

/**
 * Story 4.1: Post content to LinkedIn company page
 */
export async function postToCompanyPage(
  accessToken: string,
  companyPageId: string,
  content: string
): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
  try {
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
      return {
        success: false,
        error: `LinkedIn API error: ${response.status} - ${JSON.stringify(errorData)}`,
      }
    }

    const data = await response.json()
    const postId = data.id
    const postUrl = `https://www.linkedin.com/feed/update/${postId}`

    return {
      success: true,
      postId,
      postUrl,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Story 4.2, 4.6: Generate LinkedIn share URL for personal profiles
 * Creates a URL that opens LinkedIn with pre-filled content
 */
export function generateShareUrl(content: string): string {
  const encodedContent = encodeURIComponent(content)
  // Use the feed URL with shareActive parameter for better text support
  return `https://www.linkedin.com/feed/?shareActive=true&text=${encodedContent}`
}

/**
 * Get optimal posting times based on LinkedIn best practices
 * Story 4.7
 */
export function getOptimalPostingTimes(timezone: string = 'UTC'): string[] {
  // LinkedIn best practices suggest these times (in local time)
  // - 9 AM: Start of workday engagement
  // - 12 PM: Lunch break browsing
  // - 5 PM: End of workday wind-down
  return ['09:00', '12:00', '17:00']
}

/**
 * Check if a time is optimal for posting
 */
export function isOptimalTime(time: string): boolean {
  const optimalTimes = ['09:00', '12:00', '17:00']
  return optimalTimes.includes(time)
}
