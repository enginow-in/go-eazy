-- Issue 363: Add security rule to prevent spam reviews on services
-- Requires a user to unlock a service provider's contact details first.

-- 1. Create unlocked_services table
CREATE TABLE IF NOT EXISTS public.unlocked_services (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    service_provider_id uuid REFERENCES public.service_providers(id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, service_provider_id)
);

-- Enable RLS on unlocked_services
ALTER TABLE public.unlocked_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own unlocked services" 
    ON public.unlocked_services FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own unlocked services" 
    ON public.unlocked_services FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service providers can view unlocks for their services" 
    ON public.unlocked_services FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.service_providers sp 
            WHERE sp.id = unlocked_services.service_provider_id 
            AND sp.provider_id = auth.uid()
        )
    );

-- 2. Update service_reviews policy
DROP POLICY IF EXISTS "Authenticated users can submit reviews" ON public.service_reviews;

CREATE POLICY "Authenticated users can submit reviews"
  ON public.service_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id 
    AND EXISTS (
      SELECT 1 FROM public.unlocked_services 
      WHERE user_id = auth.uid() 
      AND service_provider_id = service_reviews.service_provider_id
    )
  );

-- 3. Create RPC for fetchServiceGatedData
CREATE OR REPLACE FUNCTION get_unlocked_service_details(prov_id uuid)
RETURNS TABLE (
    contact_phone text,
    contact_email text,
    address text,
    latitude double precision,
    longitude double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the user is the provider or has unlocked the service
    IF EXISTS (
        SELECT 1 FROM public.unlocked_services 
        WHERE user_id = auth.uid() AND service_provider_id = prov_id
    ) OR EXISTS (
        SELECT 1 FROM public.service_providers 
        WHERE id = prov_id AND provider_id = auth.uid()
    ) THEN
        RETURN QUERY 
        SELECT 
            sp.contact_phone, 
            sp.contact_email, 
            sp.address,
            NULL::double precision AS latitude,
            NULL::double precision AS longitude
        FROM public.service_providers sp
        WHERE sp.id = prov_id;
    END IF;
END;
$$;
