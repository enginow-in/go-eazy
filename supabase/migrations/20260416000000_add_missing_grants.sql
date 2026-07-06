-- Migration: 20260416000000_add_missing_grants.sql
-- Description: Adds missing PostgreSQL grants to the site_visits and notifications tables for PostgREST to allow API requests.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_visits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

-- Also grant to anon if public access is ever needed (e.g. public listings or callbacks)
GRANT SELECT ON public.site_visits TO anon;
GRANT SELECT ON public.notifications TO anon;
