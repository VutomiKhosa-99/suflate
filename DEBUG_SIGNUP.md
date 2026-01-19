# Debug Signup Error - Step by Step

## The Problem

Still seeing: **"Database error saving new user"**

Let's debug this systematically.

## Step 1: Check if Trigger Exists

Run this in Supabase SQL Editor:

```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check if function exists
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';

-- Check if policies exist
SELECT * FROM pg_policies WHERE tablename = 'users' AND policyname = 'System can create users';
```

## Step 2: Test the Trigger Function Manually

Try creating a test user to see the actual error:

```sql
-- Check Supabase Logs first
-- Go to Logs → Postgres Logs in Supabase dashboard
-- Try signing up and watch for errors
```

## Step 3: Check RLS Policies

Make sure policies are correct:

```sql
-- Check all policies on users table
SELECT * FROM pg_policies WHERE tablename = 'users';

-- If "System can create users" doesn't exist, create it:
CREATE POLICY IF NOT EXISTS "System can create users"
    ON public.users FOR INSERT
    WITH CHECK (true);
```

## Step 4: Run the Fix Migration

I've created a new migration file: `supabase/migrations/20240102000001_fix_trigger_permissions.sql`

**Run this in Supabase SQL Editor:**
1. Copy the entire file
2. Paste into SQL Editor
3. Run it

This will:
- Fix function permissions
- Ensure policies exist
- Add better error handling to the trigger
- Verify trigger exists

## Step 5: Check Browser Console

When signing up:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try signing up
4. Look for any error messages
5. Share what you see

## Step 6: Check Server Logs

In your terminal where `npm run dev` is running:
1. Try signing up
2. Look for any error messages
3. Share what you see

## Quick Test

After running the fix migration, try:

1. Go to `/signup`
2. Fill in the form
3. Click "Create Account"
4. Check:
   - Browser console for errors
   - Terminal for errors
   - Supabase Logs → Postgres Logs

## Common Issues

1. **Trigger doesn't exist**: Run the trigger creation SQL
2. **RLS blocking**: Make sure INSERT policy exists
3. **Function permissions**: Run the fix migration
4. **Constraint violation**: Check if user already exists

## Still Failing?

Share:
1. Browser console errors
2. Terminal/server errors  
3. Supabase Postgres Logs errors
4. Any specific error message you see

Then I can help fix the specific issue!
