-- Push Notifications and LinkedIn Company Pages Migration
-- Adds tables for push subscriptions and company page connections

-- Push notification subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT,
    auth_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own subscriptions
CREATE POLICY "Users manage own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- LinkedIn company pages table (for users who connect company pages)
CREATE TABLE IF NOT EXISTS public.linkedin_company_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    company_page_id TEXT NOT NULL, -- LinkedIn organization URN
    company_name TEXT,
    company_logo_url TEXT,
    access_token TEXT, -- Encrypted in production
    token_expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, company_page_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_linkedin_company_pages_user_id ON public.linkedin_company_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_company_pages_workspace_id ON public.linkedin_company_pages(workspace_id);

-- Enable RLS
ALTER TABLE public.linkedin_company_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own company pages
CREATE POLICY "Users manage own company pages"
  ON public.linkedin_company_pages FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add notification preferences to users table if not exists
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "push": false}'::jsonb;

-- Add company page preference to scheduled_posts
ALTER TABLE public.scheduled_posts 
ADD COLUMN IF NOT EXISTS linkedin_company_page_id UUID REFERENCES public.linkedin_company_pages(id);
