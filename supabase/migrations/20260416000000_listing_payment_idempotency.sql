-- Tie each paid property listing to the Razorpay payment that created it.
-- verify-listing-payment stamps this column on insert, and the unique index
-- stops the same payment from being replayed to create multiple listings.

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS razorpay_payment_id text;

-- Partial unique index: only enforce uniqueness on real payment ids.
-- Existing/free listings keep razorpay_payment_id NULL and are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_razorpay_payment_id
  ON public.properties (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;
