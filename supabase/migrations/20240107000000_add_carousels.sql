-- Epic 5: Carousel Amplification
-- Migration to add carousels table and carousel branding to workspaces

-- Create carousels table
CREATE TABLE IF NOT EXISTS public.carousels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    transcription_id UUID REFERENCES public.transcriptions(id) ON DELETE SET NULL,
    
    -- Content
    title TEXT,
    slide_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Format: [{slide_number: 1, title: "...", body: "...", key_point: "..."}, ...]
    
    -- Template and styling
    template_type TEXT NOT NULL DEFAULT 'minimal',
    -- Options: minimal, bold, professional, creative, story
    
    -- Custom branding overrides (optional, falls back to workspace settings)
    custom_branding JSONB,
    -- Format: {primary_color: "#...", secondary_color: "#...", font_family: "...", font_sizes: {...}}
    
    -- Export
    pdf_path TEXT,
    pdf_generated_at TIMESTAMPTZ,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'draft',
    -- Options: draft, ready, scheduled, published
    
    -- Metadata
    slide_count INTEGER GENERATED ALWAYS AS (jsonb_array_length(slide_data)) STORED,
    credits_used INTEGER NOT NULL DEFAULT 10,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add carousel_branding to workspaces table
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS carousel_branding JSONB DEFAULT '{
    "primary_color": "#0077B5",
    "secondary_color": "#FFFFFF",
    "font_family": "Inter",
    "title_font_size": 32,
    "body_font_size": 18,
    "key_point_font_size": 14
}'::jsonb;

-- Create indexes for carousels
CREATE INDEX IF NOT EXISTS idx_carousels_workspace_id ON public.carousels(workspace_id);
CREATE INDEX IF NOT EXISTS idx_carousels_user_id ON public.carousels(user_id);
CREATE INDEX IF NOT EXISTS idx_carousels_transcription_id ON public.carousels(transcription_id);
CREATE INDEX IF NOT EXISTS idx_carousels_status ON public.carousels(status);
CREATE INDEX IF NOT EXISTS idx_carousels_created_at ON public.carousels(created_at DESC);

-- Create updated_at trigger for carousels
CREATE OR REPLACE FUNCTION update_carousels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_carousels_updated_at
    BEFORE UPDATE ON public.carousels
    FOR EACH ROW
    EXECUTE FUNCTION update_carousels_updated_at();

-- RLS Policies for carousels
ALTER TABLE public.carousels ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view carousels they own or are in their workspace
CREATE POLICY "Users can view own carousels"
    ON public.carousels FOR SELECT
    USING (user_id = auth.uid());

-- Policy: Users can insert carousels
CREATE POLICY "Users can create carousels"
    ON public.carousels FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own carousels
CREATE POLICY "Users can update own carousels"
    ON public.carousels FOR UPDATE
    USING (user_id = auth.uid());

-- Policy: Users can delete their own carousels
CREATE POLICY "Users can delete own carousels"
    ON public.carousels FOR DELETE
    USING (user_id = auth.uid());

-- Add comments for documentation
COMMENT ON TABLE public.carousels IS 'Stores carousel presentations generated from voice notes';
COMMENT ON COLUMN public.carousels.slide_data IS 'JSONB array of slides: [{slide_number, title, body, key_point}, ...]';
COMMENT ON COLUMN public.carousels.template_type IS 'Template style: minimal, bold, professional, creative, story';
COMMENT ON COLUMN public.carousels.custom_branding IS 'Per-carousel branding overrides';
COMMENT ON COLUMN public.carousels.pdf_path IS 'Path to generated PDF in Supabase Storage';
COMMENT ON COLUMN public.workspaces.carousel_branding IS 'Default carousel branding for the workspace';
