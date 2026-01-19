# Fix Upload Error - "Failed to upload recording"

## The Problem

When you try to upload a recording, you see: **"Failed to upload recording"**

## The Solution

### 1. Create Supabase Storage Bucket

The upload is failing because the `voice-recordings` bucket doesn't exist in Supabase.

**Quick Fix:**

1. Go to your Supabase project dashboard
2. Click **Storage** in the left sidebar
3. Click **New bucket**
4. Name: `voice-recordings`
5. Make it **Public** (for now, for easier testing)
6. Click **Create bucket**

### 2. Disable RLS (For Testing Only)

Since we're using placeholder authentication:

1. Go to **Storage** → **Policies** → `voice-recordings`
2. Toggle **Enable RLS** to **OFF** (for testing only)

**⚠️ Warning**: This disables security. Only do this for local development/testing.

### 3. Try Again

1. Refresh your browser at `http://localhost:3000/record`
2. Record a voice note again
3. Click "Upload & Continue"
4. It should work now! ✅

## Improved Error Messages

I've updated the code to show more helpful error messages. You might now see:

- **"Storage bucket 'voice-recordings' not found"** → Create the bucket
- **"Storage bucket permissions issue"** → Disable RLS or fix policies
- **"Upload error: [specific error]"** → See specific Supabase error

## Long-Term Solution

For production (Epic 2+), you'll want:
- Proper RLS policies based on user authentication
- Service role key for server-side uploads
- Proper workspace-based file organization

But for now, the quick fix above works for testing Epic 1.

## Still Having Issues?

1. **Check Supabase Storage**:
   - Is the bucket named exactly `voice-recordings`?
   - Is it created and active?

2. **Check `.env.local`**:
   - Does it have `SUPABASE_SERVICE_ROLE_KEY`?
   - Are the Supabase URL and keys correct?

3. **Check Browser Console**:
   - Open DevTools (F12)
   - Look at the Network tab
   - Check the error response from `/api/suflate/voice/upload`

4. **Check Server Logs**:
   - Look at your terminal where `npm run dev` is running
   - Check for Supabase error messages

## See Also

- [SUPABASE_STORAGE_SETUP.md](./SUPABASE_STORAGE_SETUP.md) - Detailed storage setup guide
- [SETUP.md](./SETUP.md) - Full project setup instructions
