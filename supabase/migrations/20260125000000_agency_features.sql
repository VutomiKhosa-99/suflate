-- Epic 7: Agency Workspace Features - Database changes

-- 1) Add branding to workspaces
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMENT ON COLUMN public.workspaces.branding IS 'Per-workspace branding settings: {colors, fonts, carousel_defaults, etc.}';
COMMENT ON COLUMN public.workspaces.logo_url IS 'Workspace logo stored in Supabase Storage';

-- 2) Invitations table for role-based access
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','admin','editor','viewer')),
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired','revoked')),
  expires_at TIMESTAMPTZ,
  invited_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_invitations_workspace_id ON public.workspace_invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON public.workspace_invitations(email);

-- 3) RLS policies (baseline; refine as needed)
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

-- Owners/admins can create invitations
DROP POLICY IF EXISTS "Owners or admins can insert invitations" ON public.workspace_invitations;
CREATE POLICY "Owners or admins can insert invitations"
  ON public.workspace_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner','admin')
    )
  );

-- Members can view invitations in their workspace
DROP POLICY IF EXISTS "Members can view invitations in their workspace" ON public.workspace_invitations;
CREATE POLICY "Members can view invitations in their workspace"
  ON public.workspace_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_id
        AND wm.user_id = auth.uid()
    )
  );

-- Owners/admins can update invitations (accept/revoke)
DROP POLICY IF EXISTS "Owners or admins can update invitations" ON public.workspace_invitations;
CREATE POLICY "Owners or admins can update invitations"
  ON public.workspace_invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner','admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner','admin')
    )
  );
