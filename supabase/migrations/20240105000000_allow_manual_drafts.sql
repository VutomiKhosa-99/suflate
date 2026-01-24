-- Story 3.9: Allow Manual Draft Creation
-- Make transcription_id nullable to support drafts created without voice recording

-- Alter posts table to allow NULL transcription_id for manual drafts
ALTER TABLE public.posts 
ALTER COLUMN transcription_id DROP NOT NULL;

-- Add 'manual' to source_type documentation/comment
COMMENT ON COLUMN public.posts.source_type IS 'Source of the post: voice (from recording), repurpose_blog, repurpose_tweet, manual (created directly)';

-- Add index for source_type to efficiently filter manual drafts
CREATE INDEX IF NOT EXISTS idx_posts_source_type ON public.posts(source_type);
