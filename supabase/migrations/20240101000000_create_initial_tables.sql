-- Create initial tables for Suflate MVP (Epic 1)
-- Run this migration in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Workspaces table (for Epic 2, but needed for foreign keys)
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voice recordings table
CREATE TABLE IF NOT EXISTS public.voice_recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- Will be UUID once auth is implemented
    storage_path TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    duration_seconds INTEGER,
    status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'transcribing', 'transcribed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transcriptions table
CREATE TABLE IF NOT EXISTS public.transcriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recording_id UUID NOT NULL REFERENCES public.voice_recordings(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    raw_text TEXT NOT NULL,
    processed_text TEXT, -- User-edited text
    detected_language TEXT, -- Detected language code (e.g., 'en', 'es')
    detected_content_type TEXT, -- story, lesson, opinion, tactic
    transcription_model TEXT DEFAULT 'assemblyai', -- AssemblyAI model identifier
    confidence DECIMAL, -- Transcription confidence score
    word_count INTEGER,
    character_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Amplification jobs table (tracks amplification processing)
CREATE TABLE IF NOT EXISTS public.amplification_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transcription_id UUID NOT NULL REFERENCES public.transcriptions(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    model_used TEXT, -- LLM model used (e.g., 'anthropic/claude-3.5-sonnet')
    usage_tokens INTEGER, -- Token usage for billing
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Posts table (generated post variations)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transcription_id UUID NOT NULL REFERENCES public.transcriptions(id) ON DELETE CASCADE,
    amplification_job_id UUID REFERENCES public.amplification_jobs(id) ON DELETE SET NULL,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- Will be UUID once auth is implemented
    source_type TEXT DEFAULT 'voice', -- voice, repurpose_blog, repurpose_tweet
    variation_type TEXT NOT NULL CHECK (variation_type IN ('professional', 'personal', 'actionable', 'discussion', 'bold')),
    content TEXT NOT NULL,
    word_count INTEGER,
    character_count INTEGER,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_voice_recordings_workspace_id ON public.voice_recordings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_voice_recordings_user_id ON public.voice_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_recordings_status ON public.voice_recordings(status);
CREATE INDEX IF NOT EXISTS idx_transcriptions_recording_id ON public.transcriptions(recording_id);
CREATE INDEX IF NOT EXISTS idx_posts_transcription_id ON public.posts(transcription_id);
CREATE INDEX IF NOT EXISTS idx_posts_workspace_id ON public.posts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_posts_variation_type ON public.posts(variation_type);
CREATE INDEX IF NOT EXISTS idx_amplification_jobs_transcription_id ON public.amplification_jobs(transcription_id);

-- Note: Workspaces are automatically created when users sign up via trigger
-- See migration 20240102000000_add_auth_tables.sql for the trigger function

-- Enable Row Level Security (RLS) - will be properly configured in Epic 2
ALTER TABLE public.voice_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amplification_jobs ENABLE ROW LEVEL SECURITY;

-- Temporary policies for testing (Epic 1) - allows all operations
-- These will be replaced with proper user-based policies in Epic 2
CREATE POLICY "Allow all for testing" ON public.voice_recordings
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for testing" ON public.transcriptions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for testing" ON public.posts
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for testing" ON public.amplification_jobs
    FOR ALL USING (true) WITH CHECK (true);
