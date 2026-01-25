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
 * Post a text post to LinkedIn personal profile
 */
export async function postToPersonalProfile(
  accessToken: string,
  personUrn: string,
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
 * Register a document upload with LinkedIn
 * Step 1 of the document upload process
 * Uses the newer REST API format
 */
export async function registerDocumentUpload(
  accessToken: string,
  personUrn: string
): Promise<{ success: boolean; uploadUrl?: string; asset?: string; error?: string }> {
  try {
    // Try the newer documents API first
    const response = await fetch('https://api.linkedin.com/rest/documents?action=initializeUpload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202401',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: personUrn,
        },
      }),
    })

    if (!response.ok) {
      // Fallback to legacy API if newer one fails
      console.log('[LinkedIn] Newer documents API failed, trying legacy...')
      return await registerDocumentUploadLegacy(accessToken, personUrn)
    }

    const data = await response.json()
    const uploadUrl = data.value?.uploadUrl
    const document = data.value?.document

    if (!uploadUrl || !document) {
      return {
        success: false,
        error: 'No upload URL or document ID returned from LinkedIn',
      }
    }

    return {
      success: true,
      uploadUrl,
      asset: document,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Legacy document upload registration (fallback)
 */
async function registerDocumentUploadLegacy(
  accessToken: string,
  personUrn: string
): Promise<{ success: boolean; uploadUrl?: string; asset?: string; error?: string }> {
  try {
    const response = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-document'],
          owner: personUrn,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent',
            },
          ],
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: `Failed to register upload: ${response.status} - ${JSON.stringify(errorData)}`,
      }
    }

    const data = await response.json()
    const uploadUrl = data.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl
    const asset = data.value?.asset

    if (!uploadUrl || !asset) {
      return {
        success: false,
        error: 'No upload URL or asset returned from LinkedIn',
      }
    }

    return {
      success: true,
      uploadUrl,
      asset,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Upload document binary to LinkedIn
 * Step 2 of the document upload process
 */
export async function uploadDocumentBinary(
  uploadUrl: string,
  accessToken: string,
  pdfBuffer: Buffer | ArrayBuffer
): Promise<{ success: boolean; error?: string }> {
  try {
    // Convert Buffer to Uint8Array for fetch compatibility
    const bodyData = pdfBuffer instanceof Buffer 
      ? new Uint8Array(pdfBuffer) 
      : new Uint8Array(pdfBuffer)
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/pdf',
      },
      body: bodyData,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      return {
        success: false,
        error: `Failed to upload document: ${response.status} - ${errorText}`,
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Post a document (carousel PDF) to LinkedIn
 * Step 3 of the document upload process
 * Uses newer Posts API with fallback to ugcPosts
 */
export async function postDocumentToLinkedIn(
  accessToken: string,
  personUrn: string,
  asset: string,
  title: string,
  description: string
): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
  try {
    // Try the newer Posts API first
    const response = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202401',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: personUrn,
        commentary: description,
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        content: {
          media: {
            title: title,
            id: asset,
          },
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.log('[LinkedIn] Posts API failed:', response.status, errorData)
      // Fallback to legacy ugcPosts API
      return await postDocumentToLinkedInLegacy(accessToken, personUrn, asset, title, description)
    }

    const data = await response.json()
    const postId = data.id || data.value?.id
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
 * Legacy ugcPosts API (fallback)
 */
async function postDocumentToLinkedInLegacy(
  accessToken: string,
  personUrn: string,
  asset: string,
  title: string,
  description: string
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
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: description,
            },
            shareMediaCategory: 'DOCUMENT',
            media: [
              {
                status: 'READY',
                media: asset,
                title: {
                  text: title,
                },
              },
            ],
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
        error: `Failed to post document: ${response.status} - ${JSON.stringify(errorData)}`,
      }
    }

    const data = await response.json()
    const postId = data.id
    // Extract activity ID for URL
    const activityId = postId?.replace('urn:li:share:', '') || postId?.replace('urn:li:ugcPost:', '')
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
 * Complete flow to post a carousel PDF to LinkedIn
 * Falls back to text post if document upload isn't available
 */
export async function postCarouselToLinkedIn(
  accessToken: string,
  personUrn: string,
  pdfBuffer: Buffer | ArrayBuffer,
  title: string,
  caption: string
): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
  console.log('[LinkedIn] Starting carousel upload for:', personUrn)
  
  // Step 1: Register upload
  console.log('[LinkedIn] Step 1: Registering upload...')
  const registerResult = await registerDocumentUpload(accessToken, personUrn)
  
  if (!registerResult.success) {
    console.log('[LinkedIn] Document upload not available, falling back to text post')
    // Fallback: Post as text with the caption
    return await postTextToLinkedIn(accessToken, personUrn, caption || title, title)
  }
  console.log('[LinkedIn] Step 1 success, asset:', registerResult.asset)

  // Step 2: Upload the PDF
  console.log('[LinkedIn] Step 2: Uploading PDF binary...')
  const uploadResult = await uploadDocumentBinary(
    registerResult.uploadUrl!,
    accessToken,
    pdfBuffer
  )
  if (!uploadResult.success) {
    console.log('[LinkedIn] Step 2 failed:', uploadResult.error)
    // Fallback to text post
    return await postTextToLinkedIn(accessToken, personUrn, caption || title, title)
  }
  console.log('[LinkedIn] Step 2 success')

  // Step 3: Create the post with the document
  console.log('[LinkedIn] Step 3: Creating post...')
  const postResult = await postDocumentToLinkedIn(
    accessToken,
    personUrn,
    registerResult.asset!,
    title,
    caption
  )
  console.log('[LinkedIn] Step 3 result:', postResult.success ? 'success' : postResult.error)

  return postResult
}

/**
 * Post text content to LinkedIn (fallback when document upload isn't available)
 */
export async function postTextToLinkedIn(
  accessToken: string,
  personUrn: string,
  text: string,
  title?: string
): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
  try {
    console.log('[LinkedIn] Posting text content...')
    
    // Format the post content
    const fullText = title 
      ? `📑 ${title}\n\n${text}\n\n---\n🔗 View the full carousel in the comments!`
      : text

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
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
              text: fullText,
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
      console.log('[LinkedIn] Text post failed:', response.status, errorData)
      return {
        success: false,
        error: `Failed to post: ${response.status} - ${JSON.stringify(errorData)}`,
      }
    }

    const data = await response.json()
    const postId = data.id
    const postUrl = `https://www.linkedin.com/feed/update/${postId}`

    console.log('[LinkedIn] Text post success:', postId)
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
