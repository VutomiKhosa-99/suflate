-- Epic 4: Post Scheduling Migration
-- Adds support for scheduling posts, notifications, and workspace schedules

-- Add workspace schedule JSONB column (Story 4.3)
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS posting_schedule JSONB DEFAULT '{
  "days": [1, 2, 3, 4, 5],
  "times": ["09:00", "12:00", "17:00"],
  "timezone": "UTC"
}'::jsonb;

-- Create scheduled_posts table (Story 4.1, 4.2)
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    scheduled_for TIMESTAMPTZ NOT NULL,
    notification_method TEXT DEFAULT 'email' CHECK (notification_method IN ('email', 'push', 'both', 'none')),
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_sent_at TIMESTAMPTZ,
    posted BOOLEAN DEFAULT FALSE,
    posted_at TIMESTAMPTZ,
    linkedin_post_id TEXT,
    post_url TEXT,
    is_company_page BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id)
);

-- Create indexes for scheduled_posts
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON public.scheduled_posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_workspace_id ON public.scheduled_posts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON public.scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_posted ON public.scheduled_posts(posted);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_notification_sent ON public.scheduled_posts(notification_sent);

-- Index for cron job queries: find due posts that haven't been posted
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_due 
ON public.scheduled_posts(scheduled_for, posted) 
WHERE posted = FALSE;

-- Enable RLS
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduled_posts
-- Users can view scheduled posts in their workspace
CREATE POLICY "Users can view scheduled posts in their workspace"
ON public.scheduled_posts FOR SELECT
USING (
  workspace_id IN (
    SELECT wm.workspace_id 
    FROM public.workspace_members wm 
    WHERE wm.user_id = auth.uid()
  )
);

-- Users can create scheduled posts in their workspace
CREATE POLICY "Users can create scheduled posts in their workspace"
ON public.scheduled_posts FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT wm.workspace_id 
    FROM public.workspace_members wm 
    WHERE wm.user_id = auth.uid()
  )
);

-- Users can update scheduled posts in their workspace
CREATE POLICY "Users can update scheduled posts in their workspace"
ON public.scheduled_posts FOR UPDATE
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

-- Users can delete scheduled posts in their workspace
CREATE POLICY "Users can delete scheduled posts in their workspace"
ON public.scheduled_posts FOR DELETE
USING (
  workspace_id IN (
    SELECT wm.workspace_id 
    FROM public.workspace_members wm 
    WHERE wm.user_id = auth.uid()
  )
);

-- Add linkedin_company_page_id to users table for company page posting
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS linkedin_company_page_id TEXT;

-- Function to update scheduled_posts.updated_at on changes
CREATE OR REPLACE FUNCTION update_scheduled_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_scheduled_posts_updated_at ON public.scheduled_posts;
CREATE TRIGGER trigger_scheduled_posts_updated_at
    BEFORE UPDATE ON public.scheduled_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_posts_updated_at();

-- Comments explaining the columns
COMMENT ON TABLE public.scheduled_posts IS 'Tracks scheduled posts for automated posting or notifications (Epic 4)';
COMMENT ON COLUMN public.scheduled_posts.scheduled_for IS 'When the post should be published or notification sent';
COMMENT ON COLUMN public.scheduled_posts.notification_method IS 'How to notify user: email, push, both, or none';
COMMENT ON COLUMN public.scheduled_posts.notification_sent IS 'Whether the notification has been sent';
COMMENT ON COLUMN public.scheduled_posts.posted IS 'Whether the post has been published';
COMMENT ON COLUMN public.scheduled_posts.linkedin_post_id IS 'LinkedIn post ID after successful posting (company pages only)';
COMMENT ON COLUMN public.scheduled_posts.post_url IS 'URL to the published post on LinkedIn';
COMMENT ON COLUMN public.scheduled_posts.is_company_page IS 'True if posting to company page (auto-post), false for personal profile (notify only)';
COMMENT ON COLUMN public.scheduled_posts.retry_count IS 'Number of retry attempts for failed posts';
COMMENT ON COLUMN public.workspaces.posting_schedule IS 'Default posting schedule: {days: [1-7], times: ["HH:MM"], timezone: "America/New_York"}';
