/**
 * Web Push Notification Service
 * Enables browser push notifications for scheduled posts
 */

// VAPID keys should be generated and stored in environment variables
// Generate keys with: npx web-push generate-vapid-keys

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: {
    url?: string
    postId?: string
    postContent?: string
  }
}

/**
 * Send a push notification to a subscription
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<{ success: boolean; error?: string }> {
  // Dynamic import web-push (server-side only)
  try {
    // @ts-ignore - web-push is an optional dependency
    const webpush = await import('web-push')
    
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
    const vapidEmail = process.env.VAPID_EMAIL || 'mailto:support@suflate.com'

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('[Push] VAPID keys not configured, skipping push notification')
      return { success: false, error: 'VAPID keys not configured' }
    }

    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify(payload)
    )

    return { success: true }
  } catch (error) {
    console.error('[Push] Failed to send notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Create notification payload for a scheduled post reminder
 */
export function createPostReminderPayload(
  postContent: string,
  postId: string
): NotificationPayload {
  const preview = postContent.length > 100 
    ? postContent.substring(0, 100) + '...' 
    : postContent

  return {
    title: '📝 Time to Post on LinkedIn!',
    body: preview,
    icon: '/assets/icon-192.png',
    badge: '/assets/badge-72.png',
    tag: `post-${postId}`,
    data: {
      url: `/editor/${postId}`,
      postId,
      postContent,
    },
  }
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 
    'serviceWorker' in navigator && 
    'PushManager' in window
}
