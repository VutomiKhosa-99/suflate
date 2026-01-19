# 🔧 Fix Upload Permissions - Quick Fix

## The Error

You're seeing: **"Storage bucket permissions issue. Please check RLS policies in Supabase."**

This means the bucket exists, but RLS (Row Level Security) is blocking the upload.

## ✅ Quick Fix (2 Options)

### Option 1: Disable RLS (Easiest for Testing)

1. Go to your Supabase dashboard
2. Click **Storage** in the left sidebar
3. Click on the **`voice-recordings`** bucket
4. Click the **Policies** tab
5. Toggle **"Enable RLS"** to **OFF**

**That's it!** Try uploading again.

### Option 2: Allow Public Uploads (Also for Testing)

If you prefer to keep RLS enabled but allow uploads:

1. Go to **Storage** → **Policies** → `voice-recordings`
2. Click **New Policy**
3. Select **"Allow public access"** for INSERT operations
4. Save the policy

**Note**: For production, you'll want proper authenticated policies, but for testing Epic 1, either option works.

## Why This Happens

Since we're using placeholder authentication (no real user logged in), the Supabase client can't authenticate uploads. When RLS is enabled, it blocks anonymous uploads.

## After Fixing

1. Refresh your browser at `http://localhost:3000/record`
2. Record a voice note or upload an audio file
3. Click "Upload & Continue"
4. ✅ It should work now!

## Long-Term Solution (Epic 2+)

Once real authentication is implemented (Epic 2), we'll:
- Use proper RLS policies based on authenticated users
- Ensure each user can only access their own recordings
- Use workspace-based permissions

But for now, disabling RLS is fine for testing Epic 1.

---

**Quick fix**: Just disable RLS on the `voice-recordings` bucket! ✅
