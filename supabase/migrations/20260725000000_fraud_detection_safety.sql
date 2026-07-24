-- ============================================================================
-- MIGRATION: Fraud Detection & Safety System (GoEazy TrustGuard™)
-- Timestamp: 20260725000000
-- Description: Adds profiles & properties safety fields, blacklisted_users,
--              fraud_alerts, and strict RLS security policies.
-- ============================================================================

-- 1. EXTEND PROFILES TABLE WITH VERIFICATION & SAFETY STATUS
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS id_verification_status text DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS id_type text,
  ADD COLUMN IF NOT EXISTS id_number_masked text,
  ADD COLUMN IF NOT EXISTS id_verified_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS is_blacklisted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS blacklist_reason text,
  ADD COLUMN IF NOT EXISTS blacklist_updated_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS spam_score integer DEFAULT 0;

-- Ensure check constraints for status fields
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_id_verification_status_check'
  ) THEN
    ALTER TABLE public.profiles 
      ADD CONSTRAINT profiles_id_verification_status_check 
      CHECK (id_verification_status IN ('unverified', 'pending', 'verified', 'rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_id_type_check'
  ) THEN
    ALTER TABLE public.profiles 
      ADD CONSTRAINT profiles_id_type_check 
      CHECK (id_type IS NULL OR id_type IN ('aadhaar', 'pan'));
  END IF;
END $$;


-- 2. EXTEND PROPERTIES TABLE WITH SPAM & PHOTO AUTHENTICITY STATUS
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS spam_status text DEFAULT 'clean',
  ADD COLUMN IF NOT EXISTS spam_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spam_flags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS image_hashes text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS photo_verification_status text DEFAULT 'verified';

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'properties_spam_status_check'
  ) THEN
    ALTER TABLE public.properties 
      ADD CONSTRAINT properties_spam_status_check 
      CHECK (spam_status IN ('clean', 'flagged', 'blocked'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'properties_photo_verification_status_check'
  ) THEN
    ALTER TABLE public.properties 
      ADD CONSTRAINT properties_photo_verification_status_check 
      CHECK (photo_verification_status IN ('verified', 'flagged_duplicate', 'stock_photo_warning'));
  END IF;
END $$;


-- 3. CREATE TABLE: BLACKLISTED_USERS
CREATE TABLE IF NOT EXISTS public.blacklisted_users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  risk_level text DEFAULT 'high' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  blacklisted_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);


-- 4. CREATE TABLE: FRAUD_ALERTS
CREATE TABLE IF NOT EXISTS public.fraud_alerts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_type text NOT NULL, -- 'property', 'user', 'transaction'
  entity_id text,
  risk_level text DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  flag_type text NOT NULL, -- 'duplicate_listing', 'fake_account', 'suspicious_payment', 'duplicate_photo', 'unverified_high_amount'
  description text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);


-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.blacklisted_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES FOR BLACKLISTED_USERS & FRAUD_ALERTS
-- Admins can view and manage all blacklists and fraud alerts
CREATE POLICY "Admins full access on blacklisted_users" ON public.blacklisted_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins full access on fraud_alerts" ON public.fraud_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Users can insert fraud alerts (e.g. self-reported anomalies or system triggered)
CREATE POLICY "Authenticated users insert fraud_alerts" ON public.fraud_alerts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- 7. ENFORCE BLACKLIST RLS GUARD ON PROPERTY INSERTION
DROP POLICY IF EXISTS "Landlords can insert own property" ON public.properties;
CREATE POLICY "Landlords can insert own property" ON public.properties
  FOR INSERT WITH CHECK (
    auth.uid() = landlord_id AND 
    NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_blacklisted = true
    )
  );
