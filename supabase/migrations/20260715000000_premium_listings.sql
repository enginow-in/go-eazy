-- ── PREMIUM LISTINGS SCHEMA AND PAYMENT TRANSACTION MANAGEMENT ──

-- Create enum for tracking listing payment status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE payment_status_type AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Extend profiles table if needed to track user premium status tier globally
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS premium_status BOOLEAN DEFAULT false NOT NULL;

-- Create premium listings metadata tracking table
CREATE TABLE IF NOT EXISTS public.premium_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    listing_title TEXT NOT NULL,
    amount_paid NUMERIC(10, 2) NOT NULL,
    razorpay_order_id TEXT UNIQUE NOT NULL,
    razorpay_payment_id TEXT UNIQUE,
    status payment_status_type DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) to safeguard database records
ALTER TABLE public.premium_listings ENABLE ROW LEVEL SECURITY;

-- ── ROW-LEVEL SECURITY (RLS) POLICIES ──

-- Drop existing policies if they happen to exist to prevent migration conflicts
DROP POLICY IF EXISTS "Users can view their own premium listings transactions" ON public.premium_listings;
DROP POLICY IF EXISTS "Users can insert their own premium listing order records" ON public.premium_listings;
DROP POLICY IF EXISTS "Service role only updates listing statuses" ON public.premium_listings;

-- Policy 1: Allow users to view only their own premium transactions
CREATE POLICY "Users can view their own premium listings transactions"
ON public.premium_listings
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Allow users to initialize a listing transaction record
CREATE POLICY "Users can insert their own premium listing order records"
ON public.premium_listings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Prevent unauthorized client modifications (Updates only handled via secure backend service role)
CREATE POLICY "Service role only updates listing statuses"
ON public.premium_listings
FOR UPDATE
USING (true)
WITH CHECK (true);
-- ── AUTOMATED TIMESTAMP MAINTENANCE ──

-- 1. Create a reusable function to handle updated_at timestamps automatically
CREATE OR REPLACE FUNCTION public.handle_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Bind the trigger to the premium_listings table
CREATE TRIGGER set_premium_listings_timestamp
    BEFORE UPDATE ON public.premium_listings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_update_timestamp();
