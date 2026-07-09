-- Migration: 20260709000200_secure_services_contact_details.sql
-- Description: Move private contact details out of service_providers and secure them using service_contacts table.

-- 1. Create service_contacts table
CREATE TABLE IF NOT EXISTS public.service_contacts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id uuid REFERENCES public.service_providers(id) ON DELETE CASCADE NOT NULL UNIQUE,
    contact_phone text,
    contact_email text,
    address text,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Migrate existing data from service_providers to service_contacts
INSERT INTO public.service_contacts (service_id, contact_phone, contact_email, address)
SELECT id, contact_phone, contact_email, address
FROM public.service_providers
ON CONFLICT (service_id) DO NOTHING;

-- 3. Drop private columns from service_providers table
ALTER TABLE public.service_providers DROP COLUMN IF EXISTS contact_phone;
ALTER TABLE public.service_providers DROP COLUMN IF EXISTS contact_email;
ALTER TABLE public.service_providers DROP COLUMN IF EXISTS address;

-- 4. Enable Row Level Security (RLS) on service_contacts
ALTER TABLE public.service_contacts ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for service_contacts
-- Allow owner (service provider) to manage their contacts
DROP POLICY IF EXISTS "Providers can manage own contacts" ON public.service_contacts;
CREATE POLICY "Providers can manage own contacts"
    ON public.service_contacts FOR ALL
    USING (
        auth.uid() = (
            SELECT provider_id FROM public.service_providers sp
            WHERE sp.id = service_contacts.service_id
        )
    );

-- Allow users who unlocked details to view contacts
DROP POLICY IF EXISTS "Unlocked users can view contacts" ON public.service_contacts;
CREATE POLICY "Unlocked users can view contacts"
    ON public.service_contacts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.unlocked_services us
            WHERE us.service_id = service_contacts.service_id
            AND us.user_id = auth.uid()
        )
    );

-- 6. Recreate the get_unlocked_service_details RPC to read from service_contacts
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
    SELECT sc.contact_phone, sc.contact_email, sc.address
    FROM public.service_contacts sc
    WHERE sc.service_id = prov_id;
  END IF;
END;
$$;
