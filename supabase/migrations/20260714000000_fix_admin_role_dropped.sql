-- Migration: 20260714000000_fix_admin_role_dropped.sql
-- Description: Restore 'admin' to the profiles table CHECK constraint.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'landlord', 'service_provider', 'admin'));
