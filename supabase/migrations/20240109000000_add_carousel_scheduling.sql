-- Story 5.7: Schedule Carousel Posts
-- Adds carousel support to the scheduling system

-- Add carousel_id to scheduled_posts table
ALTER TABLE public.scheduled_posts 
ADD COLUMN IF NOT EXISTS carousel_id UUID REFERENCES public.carousels(id) ON DELETE CASCADE;

-- Make post_id nullable since we can schedule either posts OR carousels
ALTER TABLE public.scheduled_posts 
ALTER COLUMN post_id DROP NOT NULL;

-- Drop the unique constraint on post_id to allow NULL values
ALTER TABLE public.scheduled_posts 
DROP CONSTRAINT IF EXISTS scheduled_posts_post_id_key;

-- Add a check constraint to ensure either post_id OR carousel_id is set (but not both)
ALTER TABLE public.scheduled_posts
ADD CONSTRAINT scheduled_posts_content_check 
CHECK (
  (post_id IS NOT NULL AND carousel_id IS NULL) OR 
  (post_id IS NULL AND carousel_id IS NOT NULL)
);

-- Create index for carousel_id
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_carousel_id 
ON public.scheduled_posts(carousel_id);

-- Add unique constraint for carousel_id (one schedule per carousel)
CREATE UNIQUE INDEX IF NOT EXISTS idx_scheduled_posts_carousel_unique 
ON public.scheduled_posts(carousel_id) 
WHERE carousel_id IS NOT NULL;

-- Add unique constraint for post_id (one schedule per post)
CREATE UNIQUE INDEX IF NOT EXISTS idx_scheduled_posts_post_unique 
ON public.scheduled_posts(post_id) 
WHERE post_id IS NOT NULL;

-- Add content_type column to easily distinguish between posts and carousels
ALTER TABLE public.scheduled_posts 
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'post' 
CHECK (content_type IN ('post', 'carousel'));

-- Update existing rows to have content_type = 'post'
UPDATE public.scheduled_posts 
SET content_type = 'post' 
WHERE content_type IS NULL AND post_id IS NOT NULL;

-- Comments
COMMENT ON COLUMN public.scheduled_posts.carousel_id IS 'Reference to carousel for scheduled carousel posts (Story 5.7)';
COMMENT ON COLUMN public.scheduled_posts.content_type IS 'Type of content: post or carousel';
