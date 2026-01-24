-- Create storage bucket for carousel exports
-- This bucket stores the exported HTML/PDF files for carousels

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'carousels',
  'carousels',
  true, -- Public bucket for easy sharing
  10485760, -- 10MB limit
  ARRAY['text/html', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for carousels bucket

-- Allow authenticated users to upload to their workspace folder
CREATE POLICY "Users can upload carousel exports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'carousels' AND
  (storage.foldername(name))[1] = 'workspaces'
);

-- Allow users to read their own carousel exports
CREATE POLICY "Users can read own carousel exports"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'carousels' AND
  (storage.foldername(name))[1] = 'workspaces'
);

-- Allow users to update their own carousel exports
CREATE POLICY "Users can update own carousel exports"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'carousels' AND
  (storage.foldername(name))[1] = 'workspaces'
);

-- Allow users to delete their own carousel exports
CREATE POLICY "Users can delete own carousel exports"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'carousels' AND
  (storage.foldername(name))[1] = 'workspaces'
);

-- Allow public read access for shared carousels
CREATE POLICY "Public can read carousel exports"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'carousels');
