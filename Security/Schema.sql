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

-- ---------------------------------------------------------------------------
-- Auth completeness: password reset, email verification, refresh-token
-- rotation, and Google OAuth accounts.
-- ---------------------------------------------------------------------------

-- OAuth-only accounts have no password; new accounts (email or Google)
-- pick a role after signup rather than requiring it up front, matching
-- the product's "Universal Role Selection" behaviour for Google sign-ins.
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ALTER COLUMN role DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;

-- Refresh tokens are opaque random strings; only their SHA-256 hash is
-- stored, so a DB leak alone can't be replayed as a session. Rotation:
-- each /api/auth/refresh call revokes the token used and issues a new
-- one, so a stolen-then-reused old token is detectable (see routes/auth.js).
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,
  expires_at   TIMESTAMPTZ NOT NULL,
  revoked_at   TIMESTAMPTZ,
  replaced_by  UUID REFERENCES refresh_tokens(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens (token_hash);

-- One table for both email-verification and password-reset links —
-- same shape (a hashed, expiring, single-use token tied to a user),
-- distinguished by `purpose`.
CREATE TABLE IF NOT EXISTS verification_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  purpose     TEXT NOT NULL CHECK (purpose IN ('email_verify', 'password_reset')),
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_hash ON verification_tokens (token_hash);

-- Row Level Security is set up in db/schema.supabase-rls.sql (optional).
-- This backend enforces ownership checks in application code (see
-- routes/properties.js), so RLS here is defense-in-depth, not a
-- requirement — and the auth.uid() policies only make sense once this
-- schema is connected through Supabase's own auth layer.