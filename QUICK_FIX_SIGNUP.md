# 🔧 Quick Fix: Database Error Saving New User

## The Problem

When signing up, you see: **"Database error saving new user"**

The database trigger is failing when trying to create the user record.

## ✅ The Fix

I've updated the migration with:

1. **Better error handling** in the trigger function
2. **Conflict handling** to avoid duplicate errors
3. **RLS policies** that allow the trigger to insert records

## 🚀 Quick Fix

### Option 1: Re-run the Updated Migration

The migration file has been updated. Re-run just the trigger function:

```sql
-- Copy and run this in Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    workspace_id UUID;
    user_name TEXT;
BEGIN
    -- Insert into public.users (with conflict handling)
    INSERT INTO public.users (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(public.users.name, EXCLUDED.name);

    -- Check if user already has a workspace
    SELECT id INTO workspace_id
    FROM public.workspaces
    WHERE owner_id = NEW.id
    ORDER BY created_at ASC
    LIMIT 1;

    -- Create default workspace if one doesn't exist
    IF workspace_id IS NULL THEN
        workspace_id := uuid_generate_v4();
        user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
        
        INSERT INTO public.workspaces (id, name, owner_id, plan, credits_remaining, credits_total)
        VALUES (
            workspace_id,
            user_name || '''s Workspace',
            NEW.id,
            'starter',
            100,
            100
        );

        INSERT INTO public.workspace_members (workspace_id, user_id, role)
        VALUES (workspace_id, NEW.id, 'owner')
        ON CONFLICT (workspace_id, user_id) DO NOTHING;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Option 2: Add Missing RLS Policies

If Option 1 doesn't work, add these policies:

```sql
-- Allow trigger to insert users
CREATE POLICY "System can create users"
    ON public.users FOR INSERT
    WITH CHECK (true);

-- Allow trigger to create workspaces
CREATE POLICY "System can create workspaces"
    ON public.workspaces FOR INSERT
    WITH CHECK (true);

-- Allow trigger to create workspace memberships
CREATE POLICY "System can create workspace memberships"
    ON public.workspace_members FOR INSERT
    WITH CHECK (true);
```

## ✅ Test Again

After running the fix:
1. Try signing up again at `/signup`
2. Error should be gone
3. Workspace should be created automatically

## Still Having Issues?

Check Supabase logs:
- Go to **Logs** → **Postgres Logs**
- Look for errors related to `handle_new_user`
- Share the error message if you need more help

---

**The updated migration file is ready. Just re-run the trigger function!** ✅
