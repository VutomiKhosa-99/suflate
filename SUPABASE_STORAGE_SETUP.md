# Supabase Storage Setup

## Required Storage Bucket

Suflate requires a Supabase Storage bucket named `voice-recordings` to store audio files.

## Step 1: Create Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Name it: `voice-recordings`
5. Make it **Private** (or Public if you prefer, but Private is recommended)
6. Click **Create bucket**

## Step 2: Configure Storage Policies

For the `voice-recordings` bucket, you need to set up Row Level Security (RLS) policies.

### Option A: Public Access (For Testing Only)

**⚠️ Warning**: This allows anyone to upload. Only use for testing.

1. Go to **Storage** → **Policies** → `voice-recordings`
2. Click **New Policy**
3. Select **For full customization**
4. Policy name: `Allow authenticated uploads`
5. Allowed operation: `INSERT`
6. Policy definition:
```sql
bucket_id = 'voice-recordings' AND auth.role() = 'authenticated'
```

7. Create another policy for SELECT:
   - Policy name: `Allow authenticated reads`
   - Allowed operation: `SELECT`
   - Policy definition:
```sql
bucket_id = 'voice-recordings' AND auth.role() = 'authenticated'
```

### Option B: Service Role Access (Recommended for Testing)

Since we're using placeholder auth, we need to use the service role key.

1. Go to **Storage** → **Policies** → `voice-recordings`
2. Click **New Policy**
3. Select **Allow public access** (temporarily for testing)

**OR** use the service role key in your API routes (which we're already doing).

### Option C: Disable RLS (For Testing Only)

**⚠️ Warning**: This disables security. Only use for local development.

1. Go to **Storage** → **Policies** → `voice-recordings`
2. Toggle **Enable RLS** to OFF

## Step 3: Verify Setup

After creating the bucket, test the upload:

1. Start your app: `npm run dev`
2. Go to: http://localhost:3000/record
3. Record or upload an audio file
4. Click "Upload & Continue"

If it works, you'll be redirected to `/record/{id}`.

## Troubleshooting

### Error: "Bucket not found"

**Solution**: Create the `voice-recordings` bucket in Supabase Storage.

### Error: "new row violates row-level security"

**Solution**: 
1. Check RLS policies are set up correctly
2. OR disable RLS for testing (not recommended for production)
3. OR use service role key (which we're doing)

### Error: "Permission denied"

**Solution**: Check that your Supabase service role key has access to storage.

## Storage Structure

Files are stored at:
```
{workspaceId}/voice-recordings/{userId}/{timestamp}-{recordingId}.{ext}
```

Example:
```
placeholder-workspace-id/voice-recordings/placeholder-user-id/1234567890-abc123.webm
```

## Production Setup

For production, you'll want:
1. Proper RLS policies based on user authentication
2. File size limits enforced
3. Virus scanning (optional)
4. Automatic cleanup of old files

But for now, the basic setup above works for testing Epic 1.
