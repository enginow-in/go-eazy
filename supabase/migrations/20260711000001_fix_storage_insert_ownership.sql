-- Restrict uploads to paths owned by the authenticated user.
-- Property uploads use both properties/<user-id>/<filename> and the legacy
-- <user-id>/<filename> format; service uploads use <user-id>/<filename>.

DROP POLICY IF EXISTS "Landlords can upload property images" ON storage.objects;
CREATE POLICY "Landlords can upload property images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-images'
    AND auth.role() = 'authenticated'
    AND (
      auth.uid()::text = (storage.foldername(name))[2]
      OR auth.uid()::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Providers can upload their own documents" ON storage.objects;
CREATE POLICY "Providers can upload their own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'service-documents'
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Providers can upload their own service images" ON storage.objects;
CREATE POLICY "Providers can upload their own service images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'service-images'
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
