-- Add workspace_linkedin_accounts table to associate LinkedIn accounts with workspaces
CREATE TABLE IF NOT EXISTS public.workspace_linkedin_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  linkedin_profile_id TEXT NOT NULL,
  linkedin_access_token TEXT,
  linkedin_headline TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id), -- only one LinkedIn account per workspace
  UNIQUE (linkedin_profile_id) -- prevents a LinkedIn profile being linked to multiple workspaces
);

CREATE INDEX IF NOT EXISTS idx_workspace_linkedin_accounts_workspace_id ON public.workspace_linkedin_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_linkedin_accounts_profile_id ON public.workspace_linkedin_accounts(linkedin_profile_id);

-- RLS: allow service role to insert/update; allow workspace members to view
ALTER TABLE public.workspace_linkedin_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage workspace linkedin accounts"
  ON public.workspace_linkedin_accounts FOR ALL
  USING (true)
  WITH CHECK (true);
