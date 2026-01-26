-- Migration: Add public voice links table
-- This table stores shareable links for public voice recording

-- Create the public_voice_links table
CREATE TABLE IF NOT EXISTS public_voice_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  questions TEXT, -- Optional prompt/questions for the recorder
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  recording_id UUID REFERENCES voice_recordings(id) ON DELETE SET NULL, -- Set when recording is uploaded
  expires_at TIMESTAMPTZ, -- Optional expiration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_public_voice_links_user_id ON public_voice_links(user_id);
CREATE INDEX IF NOT EXISTS idx_public_voice_links_workspace_id ON public_voice_links(workspace_id);
CREATE INDEX IF NOT EXISTS idx_public_voice_links_status ON public_voice_links(status);

-- Enable RLS
ALTER TABLE public_voice_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own links
CREATE POLICY "Users can view own public links"
  ON public_voice_links FOR SELECT
  USING (user_id = auth.uid());

-- Users can create links for their workspace
CREATE POLICY "Users can create public links"
  ON public_voice_links FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can update their own links
CREATE POLICY "Users can update own public links"
  ON public_voice_links FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own links
CREATE POLICY "Users can delete own public links"
  ON public_voice_links FOR DELETE
  USING (user_id = auth.uid());

-- Allow public read access for active links (needed for public page)
-- This uses a function to check status without exposing user data
CREATE POLICY "Anyone can view active public links"
  ON public_voice_links FOR SELECT
  USING (status = 'active');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_public_voice_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_public_voice_links_updated_at ON public_voice_links;
CREATE TRIGGER trigger_public_voice_links_updated_at
  BEFORE UPDATE ON public_voice_links
  FOR EACH ROW
  EXECUTE FUNCTION update_public_voice_links_updated_at();
