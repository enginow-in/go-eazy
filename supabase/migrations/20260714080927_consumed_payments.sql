-- A Razorpay payment ID represents one purchase and must only be redeemed once.
-- The primary key makes the consume operation atomic across all payment flows.
CREATE TABLE public.consumed_payments (
  razorpay_payment_id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  purpose text NOT NULL CHECK (purpose IN ('property_listing', 'contact_unlock', 'service_listing')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- This is an internal payment ledger. Edge Functions access it with the
-- service role; clients must never be able to read or write payment IDs.
ALTER TABLE public.consumed_payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.consumed_payments FROM anon, authenticated;
