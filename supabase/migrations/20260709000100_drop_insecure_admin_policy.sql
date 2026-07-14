-- Migration: 20260709000100_drop_insecure_admin_policy.sql
-- Description: Drop insecure admin update policy since admin updates are now routed via secure Edge Function.

DROP POLICY IF EXISTS "Admins can update all service providers" ON public.service_providers;
