# Database Setup - Create Required Tables

## The Error

You're seeing: **"Could not find the table 'public.voice_recordings' in the schema cache"**

This means the database tables haven't been created yet.

## ✅ Quick Fix

### Step 1: Run the Migration

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy and paste the contents of `supabase/migrations/20240101000000_create_initial_tables.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 2: Verify Tables Created

After running the migration, you should see:
- ✅ `workspaces` table
- ✅ `voice_recordings` table
- ✅ `transcriptions` table
- ✅ `posts` table
- ✅ `amplification_jobs` table

### Step 3: Test Upload Again

1. Refresh your browser at `http://localhost:3000/record`
2. Record or upload an audio file
3. Click "Upload & Continue"
4. ✅ It should work now!

## What the Migration Creates

### Tables

1. **workspaces** - Workspace management (for Epic 2, but needed now for foreign keys)
2. **voice_recordings** - Stores uploaded audio file metadata
3. **transcriptions** - Stores transcription text and metadata
4. **posts** - Stores generated post variations
5. **amplification_jobs** - Tracks amplification processing

### Indexes

Creates indexes for better query performance on:
- `workspace_id`, `user_id`, `status` (voice_recordings)
- `recording_id` (transcriptions)
- `transcription_id`, `workspace_id`, `variation_type` (posts)

### Policies

Creates temporary "allow all" RLS policies for testing. These will be replaced with proper user-based policies in Epic 2.

### Placeholder Workspace

Creates a placeholder workspace (`placeholder-workspace-id`) for testing Epic 1.

## Alternative: Manual Table Creation

If you prefer to create tables manually, you can use the Supabase Table Editor:

1. Go to **Table Editor** in Supabase
2. Create each table with the columns specified in the migration file
3. Add foreign key relationships
4. Create indexes
5. Set up RLS policies

But using the SQL migration is faster and ensures everything is set up correctly.

## After Setup

Once the tables are created:
- ✅ Uploads will work
- ✅ Transcriptions will be stored
- ✅ Post variations will be saved
- ✅ All Epic 1 features will function

## Next Steps (Epic 2)

When implementing Epic 2 (Auth & Workspace):
- Replace placeholder workspace with real workspace management
- Replace temporary RLS policies with proper user-based policies
- Add user authentication and workspace membership tables

---

**Quick fix**: Just run the SQL migration in Supabase SQL Editor! ✅
