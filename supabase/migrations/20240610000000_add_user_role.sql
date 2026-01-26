-- Add user_role and feature_tour_completed columns to users table for onboarding
-- This stores the user's selected role: individual, ghostwriter, or team

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS feature_tour_completed BOOLEAN DEFAULT FALSE;

-- Add a check constraint for valid roles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_user_role_check'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_user_role_check 
            CHECK (user_role IS NULL OR user_role IN ('individual', 'ghostwriter', 'team'));
    END IF;
END $$;

-- Create index for querying users by role
CREATE INDEX IF NOT EXISTS idx_users_user_role ON public.users(user_role);

COMMENT ON COLUMN public.users.user_role IS 'User role selected during onboarding: individual, ghostwriter, or team';
COMMENT ON COLUMN public.users.feature_tour_completed IS 'Whether user has completed the feature tour';
