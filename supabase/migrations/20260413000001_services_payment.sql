-- ============================================================
-- ADD PAYMENT STATUS TO SERVICE PROVIDERS
-- ============================================================

ALTER TABLE public.service_providers 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' 
CHECK (payment_status IN ('pending', 'paid', 'failed'));

-- ============================================================
-- FIX BUCKET PERMISSIONS FOR ADMIN
-- ============================================================
-- We make the service-documents bucket public so the admin dashboard 
-- can cleanly read the document URLs from the database.
UPDATE storage.buckets
SET public = true
WHERE id = 'service-documents';

-- ============================================================
-- FIX ADMIN UPDATE RLS POLICY
-- ============================================================
-- Admin needs permission to update verification_status of other users

CREATE POLICY "Admins can update all service providers"
  ON public.service_providers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
