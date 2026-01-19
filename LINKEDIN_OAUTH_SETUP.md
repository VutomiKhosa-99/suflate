# LinkedIn OAuth Setup Guide

## Prerequisites

1. LinkedIn Developer Account
2. Supabase Project
3. Domain for production (localhost for development)

## Step 1: Create LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click "Create app"
3. Fill in app details:
   - App name: Suflate
   - Company LinkedIn Page: (your company page)
   - Privacy policy URL: `https://yourdomain.com/privacy`
   - App logo: (upload your logo)
4. Accept terms and create app

## Step 2: Configure LinkedIn App

1. Go to your app's "Auth" tab
2. Note down:
   - **Client ID** (also called "Client ID")
   - **Client Secret** (click "Show" to reveal)

3. Add Authorized Redirect URLs:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`
   - Supabase: `https://[your-project-ref].supabase.co/auth/v1/callback`

## Step 3: Configure Supabase

1. Go to Supabase Dashboard → Authentication → Providers
2. Find "LinkedIn" and enable it
3. Enter:
   - **Client ID**: From LinkedIn app
   - **Client Secret**: From LinkedIn app
4. Save

## Step 4: Request LinkedIn API Access

LinkedIn requires approval for certain permissions:

1. Go to your LinkedIn app → "Products" tab
2. Request access to:
   - **Sign In with LinkedIn using OpenID Connect** (Required)
   - **Marketing Developer Platform** (Optional, for future LinkedIn API features)
3. Submit for approval (usually takes 24-48 hours)

## Step 5: Test OAuth Flow

1. Start your development server: `npm run dev`
2. Go to `/signup` or `/login`
3. Click "Sign up with LinkedIn" or "Continue with LinkedIn"
4. You should be redirected to LinkedIn login
5. After authorizing, you'll be redirected back to your app

## Troubleshooting

### Error: "Redirect URI mismatch"
- Make sure all redirect URLs are added in LinkedIn app settings
- Check that the URL matches exactly (including http vs https)

### Error: "Invalid client"
- Verify Client ID and Client Secret in Supabase dashboard
- Make sure LinkedIn app is not in draft mode

### Error: "User not authenticated"
- Check that Supabase callback route is correctly handling the OAuth code
- Verify the callback URL is set correctly in Supabase settings

## Production Deployment

1. Update LinkedIn app with production domain
2. Add production redirect URL
3. Update Supabase environment variables if needed
4. Test the full flow in production

## Additional Notes

- LinkedIn OAuth works for both signup and login
- User's email and basic profile are automatically synced
- You can request additional permissions if needed (requires approval)

---

**Status**: Implementation complete ✅  
**Next**: Configure LinkedIn app and test the flow
