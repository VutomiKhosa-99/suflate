-- Add LinkedIn headline column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS linkedin_headline TEXT;

-- Comment for documentation
COMMENT ON COLUMN public.users.linkedin_headline IS 'LinkedIn profile headline, fetched during OAuth connection';
