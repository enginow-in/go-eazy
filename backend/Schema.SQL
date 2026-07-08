-- GoEazy database schema
-- Run with: psql "$DATABASE_URL" -f db/schema.sql
--
-- Works against plain Postgres or a Supabase project's connection string.
-- If you're on Supabase, pgcrypto is already enabled; on vanilla Postgres
-- the line below turns on gen_random_uuid().

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('tenant', 'landlord', 'service')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS properties (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  city              TEXT NOT NULL,
  rent_per_month    NUMERIC(10, 2) NOT NULL CHECK (rent_per_month > 0),
  photos            TEXT[] NOT NULL DEFAULT '{}',
  latitude          DOUBLE PRECISION,
  longitude         DOUBLE PRECISION,
  contact_phone     TEXT,
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'archived')),
  razorpay_order_id TEXT,
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_properties_status ON properties (status);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties (city);
CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties (owner_id);

-- Row Level Security is set up in db/schema.supabase-rls.sql (optional).
-- This backend enforces ownership checks in application code (see
-- routes/properties.js), so RLS here is defense-in-depth, not a
-- requirement — and the auth.uid() policies only make sense once this
-- schema is connected through Supabase's own auth layer.