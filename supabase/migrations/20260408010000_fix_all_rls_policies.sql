-- Migration: 20260408010000_fix_all_rls_policies.sql
-- Description: Adds missing Update/Delete policies for Properties and Insert/Update/Delete policies for Storage objects.

-- 1. Fix Property Policies (Update & Delete)
-- These were missing in the remote schema, blocking landlords from managing existing listings.
DROP POLICY IF EXISTS "Landlords can update own property" ON public.properties;
CREATE POLICY "Landlords can update own property" ON public.properties 
FOR UPDATE USING (auth.uid() = landlord_id);

DROP POLICY IF EXISTS "Landlords can delete own property" ON public.properties;
CREATE POLICY "Landlords can delete own property" ON public.properties 
FOR DELETE USING (auth.uid() = landlord_id);

-- 2. Fix Storage Policies (Image Upload & View)
-- (RLS is usually enabled by default on storage.objects in Supabase)

-- Allow anyone to see images in the property-images bucket
DROP POLICY IF EXISTS "Public property images viewable by everyone" ON storage.objects;
CREATE POLICY "Public property images viewable by everyone" ON storage.objects 
FOR SELECT USING (bucket_id = 'property-images');

-- Allow authenticated landlords to upload to the 'properties/' folder
DROP POLICY IF EXISTS "Landlords can upload property images" ON storage.objects;
CREATE POLICY "Landlords can upload property images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'property-images'
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow landlords to update their own images
-- This policy extracts the user ID from the path: properties/<user_id>/filename
DROP POLICY IF EXISTS "Landlords can update their images" ON storage.objects;
CREATE POLICY "Landlords can update their images" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'property-images' AND 
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Allow landlords to delete their own images
DROP POLICY IF EXISTS "Landlords can delete their images" ON storage.objects;
CREATE POLICY "Landlords can delete their images" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'property-images' AND 
  auth.uid()::text = (storage.foldername(name))[2]
);
