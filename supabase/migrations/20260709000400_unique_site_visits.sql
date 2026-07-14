-- Migration: 20260709000400_unique_site_visits.sql
-- Description: Add unique constraint on user_id, property_id, and visit_date to prevent duplicate site visit requests.

-- 1. Delete duplicate rows, keeping only the oldest one per group
DELETE FROM public.site_visits a USING public.site_visits b
WHERE a.id::text < b.id::text
  AND a.user_id = b.user_id
  AND a.property_id = b.property_id
  AND a.visit_date = b.visit_date;

-- 2. Add the unique constraint
ALTER TABLE public.site_visits 
ADD CONSTRAINT site_visits_user_property_date_key UNIQUE (user_id, property_id, visit_date);
