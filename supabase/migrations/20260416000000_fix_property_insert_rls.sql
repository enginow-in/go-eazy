-- Migration: 20260416000000_fix_property_insert_rls.sql
-- Description: Drop the direct INSERT policy on properties to prevent landlords/users from bypassing the payment verification flow via the REST API.
-- The verify-listing-payment Edge Function uses the service_role key to insert properties, which bypasses RLS.

DROP POLICY IF EXISTS "Landlords can insert own property" ON public.properties;
