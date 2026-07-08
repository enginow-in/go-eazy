-- Optional: Row Level Security policies for Supabase projects specifically.
--
-- These reference auth.uid(), which only exists when this schema lives
-- inside a Supabase project (Supabase provisions the `auth` schema and
-- populates auth.uid() from the request's Supabase-issued JWT). Running
-- this against a plain Postgres instance will fail with
-- "schema auth does not exist" — that's expected, skip this file there.
--
-- This backend already enforces ownership in application code
-- (routes/properties.js checks owner_id against the session), so these
-- policies are defense-in-depth for teams who also expose this table
-- directly through Supabase's PostgREST / client SDK.
--
-- Run with: psql "$SUPABASE_DATABASE_URL" -f db/schema.supabase-rls.sql

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read live properties" ON properties;
CREATE POLICY "Public can read live properties"
  ON properties FOR SELECT
  USING (status = 'live');

DROP POLICY IF EXISTS "Owners can manage their own properties" ON properties;
CREATE POLICY "Owners can manage their own properties"
  ON properties FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());