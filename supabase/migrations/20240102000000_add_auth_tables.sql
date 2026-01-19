-- Add authentication tables for Epic 2
-- Run this migration after the initial tables migration

-- Note: Supabase Auth automatically creates auth.users table
-- We'll create a public.users table to store additional user metadata

-- Users table (extends auth.users with additional fields)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    linkedin_profile_id TEXT,
    linkedin_access_token TEXT, -- Will be encrypted in production
    subscription_tier TEXT DEFAULT 'starter',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace members table
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'editor' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- Update workspaces table to add owner_id
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'starter';
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS credits_remaining INTEGER DEFAULT 100;
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS credits_total INTEGER DEFAULT 100;

-- Update voice_recordings to use UUID for user_id
ALTER TABLE public.voice_recordings ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE public.voice_recordings ADD CONSTRAINT fk_voice_recordings_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update posts to use UUID for user_id
ALTER TABLE public.posts ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE public.posts ADD CONSTRAINT fk_posts_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON public.workspaces(owner_id);

-- Grant necessary permissions for the trigger function to work
-- The trigger function needs to bypass RLS to insert user records
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Function to create default workspace on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    workspace_id UUID;
    user_name TEXT;
BEGIN
    -- Insert into public.users (with conflict handling in case user already exists)
    INSERT INTO public.users (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(public.users.name, EXCLUDED.name);

    -- Check if user already has a workspace (to avoid duplicates)
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

        -- Add user as owner of workspace
        INSERT INTO public.workspace_members (workspace_id, user_id, role)
        VALUES (workspace_id, NEW.id, 'owner')
        ON CONFLICT (workspace_id, user_id) DO NOTHING;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth user creation
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create workspace on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on new tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Drop old placeholder policies
DROP POLICY IF EXISTS "Allow all for testing" ON public.voice_recordings;
DROP POLICY IF EXISTS "Allow all for testing" ON public.transcriptions;
DROP POLICY IF EXISTS "Allow all for testing" ON public.posts;
DROP POLICY IF EXISTS "Allow all for testing" ON public.amplification_jobs;

-- RLS Policies for users table
-- Allow trigger function to create users (SECURITY DEFINER should bypass RLS, but explicit policy ensures it works)
CREATE POLICY "System can create users"
    ON public.users FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- RLS Policies for workspaces table
-- Allow trigger function to create workspaces
CREATE POLICY "System can create workspaces"
    ON public.workspaces FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can view workspaces they are members of"
    ON public.workspaces FOR SELECT
    USING (
        id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update workspaces they own"
    ON public.workspaces FOR UPDATE
    USING (owner_id = auth.uid());

-- RLS Policies for workspace_members table
-- Allow trigger function to create workspace memberships
CREATE POLICY "System can create workspace memberships"
    ON public.workspace_members FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can view workspace memberships"
    ON public.workspace_members FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for voice_recordings table
CREATE POLICY "Users can view recordings in their workspaces"
    ON public.voice_recordings FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create recordings in their workspaces"
    ON public.voice_recordings FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin', 'editor')
        )
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can update their own recordings"
    ON public.voice_recordings FOR UPDATE
    USING (
        user_id = auth.uid()
        AND workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for transcriptions table
CREATE POLICY "Users can view transcriptions in their workspaces"
    ON public.transcriptions FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create transcriptions in their workspaces"
    ON public.transcriptions FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin', 'editor')
        )
    );

CREATE POLICY "Users can update transcriptions in their workspaces"
    ON public.transcriptions FOR UPDATE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin', 'editor')
        )
    );

-- RLS Policies for posts table
CREATE POLICY "Users can view posts in their workspaces"
    ON public.posts FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create posts in their workspaces"
    ON public.posts FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin', 'editor')
        )
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can update posts in their workspaces"
    ON public.posts FOR UPDATE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin', 'editor')
        )
    );

-- RLS Policies for amplification_jobs table
CREATE POLICY "Users can view amplification jobs in their workspaces"
    ON public.amplification_jobs FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create amplification jobs in their workspaces"
    ON public.amplification_jobs FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin', 'editor')
        )
    );

CREATE POLICY "Users can update amplification jobs in their workspaces"
    ON public.amplification_jobs FOR UPDATE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin', 'editor')
        )
    );
