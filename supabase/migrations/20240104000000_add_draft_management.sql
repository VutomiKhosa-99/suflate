-- Epic 3: Draft Management Migration
-- Adds support for tags, title, and improved draft management

-- Add tags array column to posts table (Story 3.6)
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add title column for better draft organization
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Add scheduled_at column for Epic 4 preparation
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

-- Add archived status to posts status check constraint
-- First drop the existing constraint, then recreate with new values
ALTER TABLE public.posts 
DROP CONSTRAINT IF EXISTS posts_status_check;

ALTER TABLE public.posts 
ADD CONSTRAINT posts_status_check 
CHECK (status IN ('draft', 'scheduled', 'published', 'archived', 'deleted'));

-- Create index on tags for efficient filtering (Story 3.5, 3.6)
CREATE INDEX IF NOT EXISTS idx_posts_tags ON public.posts USING GIN (tags);

-- Create index on status for filtering drafts
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);

-- Create index on created_at for sorting (Story 3.7)
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- Create full-text search index on content for search functionality (Story 3.5)
-- Using GIN index with to_tsvector for efficient full-text search
CREATE INDEX IF NOT EXISTS idx_posts_content_search 
ON public.posts USING GIN (to_tsvector('english', content));

-- Add function for full-text search on posts
CREATE OR REPLACE FUNCTION search_posts(
  p_workspace_id UUID,
  p_search_term TEXT,
  p_status TEXT DEFAULT 'draft',
  p_source_type TEXT DEFAULT NULL,
  p_variation_type TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  workspace_id UUID,
  user_id TEXT,
  transcription_id UUID,
  source_type TEXT,
  variation_type TEXT,
  content TEXT,
  title TEXT,
  tags TEXT[],
  status TEXT,
  word_count INTEGER,
  character_count INTEGER,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.workspace_id,
    p.user_id,
    p.transcription_id,
    p.source_type,
    p.variation_type,
    p.content,
    p.title,
    p.tags,
    p.status,
    p.word_count,
    p.character_count,
    p.scheduled_at,
    p.created_at,
    p.updated_at
  FROM public.posts p
  WHERE p.workspace_id = p_workspace_id
    AND p.status = COALESCE(p_status, p.status)
    AND (p_search_term IS NULL OR p_search_term = '' OR 
         to_tsvector('english', p.content) @@ plainto_tsquery('english', p_search_term) OR
         p.content ILIKE '%' || p_search_term || '%')
    AND (p_source_type IS NULL OR p.source_type = p_source_type)
    AND (p_variation_type IS NULL OR p.variation_type = p_variation_type)
    AND (p_tags IS NULL OR p.tags && p_tags)
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION search_posts TO authenticated;
GRANT EXECUTE ON FUNCTION search_posts TO anon;

-- Update RLS policies for posts to ensure workspace isolation
DROP POLICY IF EXISTS "Allow all for testing" ON public.posts;

-- Users can view posts in their workspace
CREATE POLICY "Users can view posts in their workspace"
ON public.posts FOR SELECT
USING (
  workspace_id IN (
    SELECT wm.workspace_id 
    FROM public.workspace_members wm 
    WHERE wm.user_id = auth.uid()
  )
);

-- Users can insert posts in their workspace
CREATE POLICY "Users can insert posts in their workspace"
ON public.posts FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT wm.workspace_id 
    FROM public.workspace_members wm 
    WHERE wm.user_id = auth.uid()
  )
);

-- Users can update posts in their workspace
CREATE POLICY "Users can update posts in their workspace"
ON public.posts FOR UPDATE
USING (
  workspace_id IN (
    SELECT wm.workspace_id 
    FROM public.workspace_members wm 
    WHERE wm.user_id = auth.uid()
  )
)
WITH CHECK (
  workspace_id IN (
    SELECT wm.workspace_id 
    FROM public.workspace_members wm 
    WHERE wm.user_id = auth.uid()
  )
);

-- Users can delete posts in their workspace
CREATE POLICY "Users can delete posts in their workspace"
ON public.posts FOR DELETE
USING (
  workspace_id IN (
    SELECT wm.workspace_id 
    FROM public.workspace_members wm 
    WHERE wm.user_id = auth.uid()
  )
);

-- Comment explaining the migration
COMMENT ON COLUMN public.posts.tags IS 'Array of tags for organizing drafts (Story 3.6)';
COMMENT ON COLUMN public.posts.title IS 'Optional title for the post/draft';
COMMENT ON COLUMN public.posts.scheduled_at IS 'Scheduled publish time (Epic 4)';
