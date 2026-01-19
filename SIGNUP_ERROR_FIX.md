# Fix: Database Error Saving New User

## The Error

When signing up, you're seeing: **"Database error saving new user"**

This error occurs when the database trigger `handle_new_user()` fails during user creation.

## The Fix

I've updated the trigger function to:

1. **Handle conflicts gracefully**: If a user record already exists, it updates instead of failing
2. **Check for existing workspace**: Avoids creating duplicate workspaces
3. **Better error handling**: Catches and logs errors without failing the auth user creation
4. **Added permissions**: Granted necessary permissions for the trigger to work

## What Was Changed

### Updated Trigger Function

The `handle_new_user()` function now:
- ✅ Uses `ON CONFLICT` to handle existing users
- ✅ Checks if workspace already exists before creating
- ✅ Has exception handling to prevent auth failures
- ✅ Logs warnings instead of failing silently

### Added Permissions

Granted necessary permissions for:
- Trigger function to access tables
- Authenticated users to insert/update their own records

## Next Steps

### 1. Re-run the Migration

You need to update the trigger function in your database:

1. Go to Supabase SQL Editor
2. Copy just the updated function from the migration file (lines 50-90)
3. Run it to replace the existing function

**OR** run the entire migration again (it's safe to re-run with `CREATE OR REPLACE`)

### 2. Test Signup Again

After updating the trigger:
1. Try signing up again at `/signup`
2. The error should be gone
3. Workspace should be created automatically

## Troubleshooting

If you still see errors:

1. **Check Supabase Logs**: 
   - Go to Logs → Postgres Logs
   - Look for errors related to `handle_new_user`

2. **Verify Tables Exist**:
   - Make sure `public.users` table exists
   - Make sure `public.workspaces` table exists
   - Make sure `public.workspace_members` table exists

3. **Check Permissions**:
   - Verify RLS policies are set correctly
   - Make sure trigger has `SECURITY DEFINER` privilege

4. **Check Trigger**:
   - Verify trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
   - Verify function exists: `SELECT * FROM pg_proc WHERE proname = 'handle_new_user';`

---

**Try the fix and let me know if the error persists!**
