-- Add payment_status column to properties table
ALTER TABLE public.properties ADD COLUMN payment_status text DEFAULT 'paid';

-- Ensure valid values
ALTER TABLE public.properties ADD CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'paid'));

-- Update RLS policy to hide pending properties from public search
-- First, drop the existing public read policy
DROP POLICY IF EXISTS "Public properties are viewable by everyone." ON public.properties;

-- Recreate policy enforcing payment_status = 'paid' for public users, but allowing landlords to see their own pending properties
CREATE POLICY "Public properties are viewable by everyone." 
ON public.properties 
FOR SELECT 
USING (payment_status = 'paid' OR auth.uid() = landlord_id);
