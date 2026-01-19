-- Fix trigger permissions and ensure it can insert users
-- Run this after the main auth migration if signup still fails

-- Ensure the function has proper ownership
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Grant execute permission to authenticated role
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon, service_role;

-- Make absolutely sure the INSERT policy exists
DROP POLICY IF EXISTS "System can create users" ON public.users;
CREATE POLICY "System can create users"
    ON public.users FOR INSERT
    WITH CHECK (true);

-- Also ensure workspace policies allow inserts
DROP POLICY IF EXISTS "System can create workspaces" ON public.workspaces;
CREATE POLICY "System can create workspaces"
    ON public.workspaces FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "System can create workspace memberships" ON public.workspace_members;
CREATE POLICY "System can create workspace memberships"
    ON public.workspace_members FOR INSERT
    WITH CHECK (true);

-- Update the trigger function to use service_role if needed
-- The SECURITY DEFINER should already bypass RLS, but let's make sure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    workspace_id UUID;
    user_name TEXT;
BEGIN
    -- Insert into public.users (with conflict handling)
    BEGIN
        INSERT INTO public.users (id, email, name)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            name = COALESCE(public.users.name, EXCLUDED.name);
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING 'Error inserting user: %', SQLERRM;
            -- Don't fail auth user creation even if this fails
    END;

    -- Check if user already has a workspace
    BEGIN
        SELECT id INTO workspace_id
        FROM public.workspaces
        WHERE owner_id = NEW.id
        ORDER BY created_at ASC
        LIMIT 1;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING 'Error checking existing workspace: %', SQLERRM;
            workspace_id := NULL;
    END;

    -- Create default workspace if one doesn't exist
    IF workspace_id IS NULL THEN
        BEGIN
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

            -- Add user as owner of workspace
            INSERT INTO public.workspace_members (workspace_id, user_id, role)
            VALUES (workspace_id, NEW.id, 'owner')
            ON CONFLICT (workspace_id, user_id) DO NOTHING;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Error creating workspace: %', SQLERRM;
                -- Don't fail auth user creation even if workspace creation fails
        END;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth user creation
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify trigger exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;
