-- Migration: 20260719163000_fix_admin_rls.sql
-- Description: Replaces the hardcoded admin email check ('prriiyansunegi@gmail.com') in the service providers update policy with a dynamic role check ('admin') against public.profiles.

-- Drop the old policy
DROP POLICY IF EXISTS "Admins can update all service providers" ON public.service_providers;

-- Recreate the policy with dynamic role check
CREATE POLICY "Admins can update all service providers"
  ON public.service_providers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
