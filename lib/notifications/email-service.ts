/**
 * Email Notification Service
 * Sends email notifications for scheduled posts using Resend
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send an email notification
 * Uses Resend API if configured, otherwise logs to console
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY
  
  if (!resendApiKey) {
    console.log('[Email] Resend not configured, logging email:')
    console.log('[Email] To:', options.to)
    console.log('[Email] Subject:', options.subject)
    console.log('[Email] Body preview:', options.text?.substring(0, 200))
    return { success: true } // Consider it "sent" in dev mode
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Suflate <notifications@suflate.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: `Resend API error: ${response.status} - ${JSON.stringify(errorData)}`,
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[Email] Failed to send:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Create email content for a scheduled post reminder
 */
export function createPostReminderEmail(
  userName: string,
  postContent: string,
  postId: string
): { subject: string; html: string; text: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const editorUrl = `${appUrl}/editor/${postId}`
  const linkedInUrl = 'https://www.linkedin.com/feed/?shareActive=true'

  const subject = '📝 Your scheduled LinkedIn post is ready!'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Time to Post!</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background-color: #0077B5; padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">📝 Time to Post!</h1>
    </div>
    
    <div style="padding: 24px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.5;">
        Hey ${userName || 'there'}! Your scheduled post is ready to go live on LinkedIn.
      </p>
      
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="color: #1f2937; font-size: 14px; line-height: 1.6; white-space: pre-wrap; margin: 0;">${postContent}</p>
      </div>
      
      <div style="text-align: center; margin: 24px 0;">
        <a href="${linkedInUrl}" style="display: inline-block; background-color: #0077B5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-right: 8px;">
          Open LinkedIn →
        </a>
        <a href="${editorUrl}" style="display: inline-block; background-color: #6b7280; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">
          Edit in Suflate
        </a>
      </div>
      
      <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-top: 20px;">
        <p style="color: #92400e; font-size: 14px; margin: 0;">
          <strong>💡 Quick Tip:</strong> Your post content is below. Just copy it, click "Open LinkedIn", and paste!
        </p>
      </div>
    </div>
    
    <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px; margin: 0;">
        Sent by <a href="${appUrl}" style="color: #0077B5; text-decoration: none;">Suflate</a> - Your voice-first LinkedIn content creator
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()

  const text = `
Hey ${userName || 'there'}!

Your scheduled post is ready to go live on LinkedIn.

--- Your Post ---
${postContent}
-----------------

Steps:
1. Copy the content above
2. Open LinkedIn: ${linkedInUrl}
3. Paste and post!

Or edit in Suflate: ${editorUrl}

- The Suflate Team
  `.trim()

  return { subject, html, text }
}
