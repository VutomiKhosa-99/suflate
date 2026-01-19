-- Simple fix for signup trigger - run this in Supabase SQL Editor
-- This ensures the trigger can insert records even with RLS enabled

-- First, temporarily disable RLS on users table to allow trigger insert
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Re-create the trigger function with explicit error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    workspace_id UUID;
    user_name TEXT;
BEGIN
    -- Insert into public.users
    INSERT INTO public.users (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(public.users.name, EXCLUDED.name);

    -- Get or create workspace
    SELECT id INTO workspace_id
    FROM public.workspaces
    WHERE owner_id = NEW.id
    LIMIT 1;

    IF workspace_id IS NULL THEN
        workspace_id := uuid_generate_v4();
        user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
        
        INSERT INTO public.workspaces (id, name, owner_id, plan, credits_remaining, credits_total)
        VALUES (workspace_id, user_name || '''s Workspace', NEW.id, 'starter', 100, 100);

        INSERT INTO public.workspace_members (workspace_id, user_id, role)
        VALUES (workspace_id, NEW.id, 'owner')
        ON CONFLICT (workspace_id, user_id) DO NOTHING;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail auth user creation even if trigger fails
        RAISE WARNING 'handle_new_user error: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-enable RLS but with a policy that allows inserts
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy that allows anyone to insert (trigger needs this)
DROP POLICY IF EXISTS "Allow trigger to insert users" ON public.users;
CREATE POLICY "Allow trigger to insert users"
    ON public.users FOR INSERT
    WITH CHECK (true);

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
