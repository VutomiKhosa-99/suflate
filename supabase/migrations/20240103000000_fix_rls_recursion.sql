-- Fix RLS infinite recursion issues
-- Run this in Supabase SQL Editor

-- =====================================================
-- DROP ALL PROBLEMATIC POLICIES FIRST
-- =====================================================

-- Drop workspace_members policies (these cause recursion)
DROP POLICY IF EXISTS "Users can view workspace memberships" ON public.workspace_members;
DROP POLICY IF EXISTS "System can create workspace memberships" ON public.workspace_members;

-- Drop workspaces policies
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON public.workspaces;
DROP POLICY IF EXISTS "Users can update workspaces they own" ON public.workspaces;
DROP POLICY IF EXISTS "System can create workspaces" ON public.workspaces;

-- Drop voice_recordings policies  
DROP POLICY IF EXISTS "Users can view recordings in their workspaces" ON public.voice_recordings;
DROP POLICY IF EXISTS "Users can create recordings in their workspaces" ON public.voice_recordings;
DROP POLICY IF EXISTS "Users can update their own recordings" ON public.voice_recordings;

-- Drop transcriptions policies
DROP POLICY IF EXISTS "Users can view transcriptions in their workspaces" ON public.transcriptions;
DROP POLICY IF EXISTS "Users can create transcriptions in their workspaces" ON public.transcriptions;
DROP POLICY IF EXISTS "Users can update transcriptions in their workspaces" ON public.transcriptions;

-- Drop posts policies
DROP POLICY IF EXISTS "Users can view posts in their workspaces" ON public.posts;
DROP POLICY IF EXISTS "Users can create posts in their workspaces" ON public.posts;
DROP POLICY IF EXISTS "Users can update posts in their workspaces" ON public.posts;

-- Drop amplification_jobs policies
DROP POLICY IF EXISTS "Users can view amplification jobs in their workspaces" ON public.amplification_jobs;
DROP POLICY IF EXISTS "Users can create amplification jobs in their workspaces" ON public.amplification_jobs;
DROP POLICY IF EXISTS "Users can update amplification jobs in their workspaces" ON public.amplification_jobs;

-- =====================================================
-- CREATE NON-RECURSIVE RLS POLICIES
-- =====================================================

-- WORKSPACE_MEMBERS: Simple policies that don't self-reference
-- Users can see their own memberships
CREATE POLICY "workspace_members_select_own" ON public.workspace_members
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own memberships (or system via SECURITY DEFINER)
CREATE POLICY "workspace_members_insert" ON public.workspace_members
    FOR INSERT WITH CHECK (true);

-- WORKSPACES: Check ownership directly, not via workspace_members
-- Users can view workspaces they own
CREATE POLICY "workspaces_select_owner" ON public.workspaces
    FOR SELECT USING (owner_id = auth.uid());

-- Anyone can create workspaces (owner_id will be set to their id)
CREATE POLICY "workspaces_insert" ON public.workspaces
    FOR INSERT WITH CHECK (true);

-- Owners can update their workspaces
CREATE POLICY "workspaces_update_owner" ON public.workspaces
    FOR UPDATE USING (owner_id = auth.uid());

-- VOICE_RECORDINGS: Check user_id directly
CREATE POLICY "voice_recordings_select" ON public.voice_recordings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "voice_recordings_insert" ON public.voice_recordings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "voice_recordings_update" ON public.voice_recordings
    FOR UPDATE USING (user_id = auth.uid());

-- TRANSCRIPTIONS: Check via recording ownership
CREATE POLICY "transcriptions_select" ON public.transcriptions
    FOR SELECT USING (
        recording_id IN (
            SELECT id FROM public.voice_recordings WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "transcriptions_insert" ON public.transcriptions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "transcriptions_update" ON public.transcriptions
    FOR UPDATE USING (
        recording_id IN (
            SELECT id FROM public.voice_recordings WHERE user_id = auth.uid()
        )
    );

-- POSTS: Check user_id directly
CREATE POLICY "posts_select" ON public.posts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "posts_insert" ON public.posts
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "posts_update" ON public.posts
    FOR UPDATE USING (user_id = auth.uid());

-- AMPLIFICATION_JOBS: Check via transcription ownership
CREATE POLICY "amplification_jobs_select" ON public.amplification_jobs
    FOR SELECT USING (
        transcription_id IN (
            SELECT t.id FROM public.transcriptions t
            JOIN public.voice_recordings vr ON t.recording_id = vr.id
            WHERE vr.user_id = auth.uid()
        )
    );

CREATE POLICY "amplification_jobs_insert" ON public.amplification_jobs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "amplification_jobs_update" ON public.amplification_jobs
    FOR UPDATE USING (
        transcription_id IN (
            SELECT t.id FROM public.transcriptions t
            JOIN public.voice_recordings vr ON t.recording_id = vr.id
            WHERE vr.user_id = auth.uid()
        )
    );

-- =====================================================
-- ENSURE TRIGGER FUNCTION HAS PROPER PERMISSIONS
-- =====================================================

-- Re-create the trigger function with SECURITY DEFINER
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

    -- Create workspace
    workspace_id := uuid_generate_v4();
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    
    INSERT INTO public.workspaces (id, name, owner_id, plan, credits_remaining, credits_total)
    VALUES (workspace_id, user_name || '''s Workspace', NEW.id, 'starter', 100, 100)
    ON CONFLICT DO NOTHING;

    -- Add user as workspace owner
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (workspace_id, NEW.id, 'owner')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail auth user creation even if trigger fails
        RAISE WARNING 'handle_new_user error: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
