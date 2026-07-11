-- ============================================================
-- STORAGE BUCKET FOR SERVICE IMAGES (POSTERS)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for service images
-- Allow anyone to read
CREATE POLICY "Service images are public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'service-images');

-- Allow providers to upload their own images
CREATE POLICY "Providers can upload their own service images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'service-images'
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow providers to delete their own images
CREATE POLICY "Providers can delete their own service images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'service-images' AND auth.uid()::text = (storage.foldername(name))[1]);
