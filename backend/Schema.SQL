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

-- ---------------------------------------------------------------------------
-- Reviews — one review per (property, user). Rating 1-5, comment optional.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_property ON reviews (property_id);

-- ---------------------------------------------------------------------------
-- Recently viewed — one row per (user, property), timestamp bumped on each
-- view. Pruned on a 72-hour rolling window (see lib/prune.js) so this table
-- never grows unbounded, matching the product's "Server-Side Storage
-- Governance" behaviour.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS recently_viewed (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_recently_viewed_viewed_at ON recently_viewed (viewed_at);

-- Row Level Security is set up in db/schema.supabase-rls.sql (optional).
-- This backend enforces ownership checks in application code (see
-- routes/properties.js), so RLS here is defense-in-depth, not a
-- requirement — and the auth.uid() policies only make sense once this
-- schema is connected through Supabase's own auth layer.