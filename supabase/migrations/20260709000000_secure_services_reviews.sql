-- Migration: 20260709000000_secure_services_reviews.sql
-- Description: Create unlocked_services table, RPC function for service details, and secure reviews RLS policy.

-- 1. Create unlocked_services table
CREATE TABLE IF NOT EXISTS public.unlocked_services (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    service_id uuid REFERENCES public.service_providers(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, service_id)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.unlocked_services ENABLE ROW LEVEL SECURITY;

-- 3. Policies for unlocked_services
-- Users can view their own unlocked services
DROP POLICY IF EXISTS "Users can view their own unlocked services" ON public.unlocked_services;
CREATE POLICY "Users can view their own unlocked services"
    ON public.unlocked_services FOR SELECT
    USING (auth.uid() = user_id);

-- Landlords/Providers can view who unlocked their services
DROP POLICY IF EXISTS "Providers can view unlocks for their services" ON public.unlocked_services;
CREATE POLICY "Providers can view unlocks for their services"
    ON public.unlocked_services FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.service_providers sp
            WHERE sp.id = unlocked_services.service_id
            AND sp.provider_id = auth.uid()
        )
    );

-- Allow authenticated users to insert/unlock services directly
DROP POLICY IF EXISTS "Users can insert their own unlocked services" ON public.unlocked_services;
CREATE POLICY "Users can insert their own unlocked services"
    ON public.unlocked_services FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 4. Define get_unlocked_service_details database function (RPC)
CREATE OR REPLACE FUNCTION public.get_unlocked_service_details(prov_id uuid)
RETURNS TABLE (
  contact_phone text,
  contact_email text,
  address text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is the service provider themselves OR has unlocked it
  IF EXISTS (
    SELECT 1 FROM public.service_providers sp
    WHERE sp.id = prov_id AND sp.provider_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.unlocked_services us
    WHERE us.service_id = prov_id AND us.user_id = auth.uid()
  ) THEN
    RETURN QUERY
    SELECT sp.contact_phone, sp.contact_email, sp.address
    FROM public.service_providers sp
    WHERE sp.id = prov_id;
  END IF;
END;
$$;

-- 5. Secure service reviews by requiring the user to have unlocked the service first
DROP POLICY IF EXISTS "Authenticated users can submit reviews" ON public.service_reviews;
CREATE POLICY "Authenticated users can submit reviews"
  ON public.service_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.unlocked_services us
      WHERE us.service_id = service_reviews.service_provider_id
      AND us.user_id = auth.uid()
    )
  );
