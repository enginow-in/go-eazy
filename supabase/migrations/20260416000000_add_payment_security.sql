-- ============================================================
-- Migration: 20260416000000_add_payment_security.sql
--
-- Purpose: Prevent payment replay attacks on the ₹199 listing
--          fee by recording each consumed razorpay_payment_id
--          with a PRIMARY KEY uniqueness guarantee.
--
-- The PRIMARY KEY on payment_id acts as the atomic, race-
-- condition-proof guard: any duplicate INSERT raises
-- unique_violation (23505) which verify-listing-payment
-- catches and rejects with HTTP 409.
--
-- Accessible only by the service role (Edge Functions).
-- No INSERT/SELECT policies for authenticated users — the
-- table must never be client-writable.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.used_listing_payments (
  -- The Razorpay payment ID is the natural unique key.
  -- PRIMARY KEY provides the UNIQUE constraint that makes
  -- the replay-prevention atomic even under concurrent requests.
  payment_id   text        PRIMARY KEY,

  -- Which landlord consumed this payment.
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Which property was created with it (nullable: set after
  -- successful property insert; NULL if insert failed and the
  -- claim was rolled back by the Edge Function).
  property_id  uuid        REFERENCES public.properties(id) ON DELETE SET NULL,

  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Index for audit lookups by user (e.g. "show all listings paid for by user X")
CREATE INDEX IF NOT EXISTS idx_used_listing_payments_user
  ON public.used_listing_payments (user_id, created_at DESC);

-- Enable RLS — no user-facing policies; only service role can read/write
ALTER TABLE public.used_listing_payments ENABLE ROW LEVEL SECURITY;

-- No policies = no access for authenticated/anon roles.
-- Edge Functions use the service role key which bypasses RLS.
-- This is intentional: users must never be able to query, insert,
-- or delete their own payment claims.

COMMENT ON TABLE public.used_listing_payments IS
  'Ledger of consumed Razorpay payment IDs for the ₹199 listing fee. '
  'PRIMARY KEY on payment_id prevents replay attacks at the DB level. '
  'Writable by service role (Edge Functions) only.';
