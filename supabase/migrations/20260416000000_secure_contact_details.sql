-- 1. Create property_contacts table
CREATE TABLE IF NOT EXISTS public.property_contacts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL UNIQUE,
    contact_phone text,
    contact_email text,
    exact_location text,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Copy existing data from properties to property_contacts (if any)
INSERT INTO public.property_contacts (property_id, contact_phone, contact_email, exact_location)
SELECT id, contact_phone, contact_email, exact_location
FROM public.properties
ON CONFLICT (property_id) DO NOTHING;

-- 3. Drop columns from properties table
ALTER TABLE public.properties 
DROP COLUMN IF EXISTS contact_phone,
DROP COLUMN IF EXISTS contact_email,
DROP COLUMN IF EXISTS exact_location;

-- 4. Enable RLS on property_contacts
ALTER TABLE public.property_contacts ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
-- SELECT: Landlord OR user who has unlocked details
CREATE POLICY "Landlords can view contacts for own properties" 
    ON public.property_contacts FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.properties p 
            WHERE p.id = property_contacts.property_id 
            AND p.landlord_id = auth.uid()
        )
    );

CREATE POLICY "Users can view contacts for unlocked properties" 
    ON public.property_contacts FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.unlocked_properties up 
            WHERE up.property_id = property_contacts.property_id 
            AND up.user_id = auth.uid()
        )
    );

-- INSERT: Landlords can insert contacts for their own properties
CREATE POLICY "Landlords can insert contacts for own properties" 
    ON public.property_contacts FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.properties p 
            WHERE p.id = property_contacts.property_id 
            AND p.landlord_id = auth.uid()
        )
    );

-- UPDATE: Landlords can update contacts for their own properties
CREATE POLICY "Landlords can update contacts for own properties" 
    ON public.property_contacts FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.properties p 
            WHERE p.id = property_contacts.property_id 
            AND p.landlord_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.properties p 
            WHERE p.id = property_contacts.property_id 
            AND p.landlord_id = auth.uid()
        )
    );

-- DELETE: Landlords can delete contacts for their own properties
CREATE POLICY "Landlords can delete contacts for own properties" 
    ON public.property_contacts FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.properties p 
            WHERE p.id = property_contacts.property_id 
            AND p.landlord_id = auth.uid()
        )
    );

-- 6. Grant privileges on new table to all roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_contacts TO anon, authenticated, service_role;

-- 7. Define get_unlocked_property_details database function (RPC)
CREATE OR REPLACE FUNCTION public.get_unlocked_property_details(prop_id uuid)
RETURNS TABLE (
  contact_phone text,
  contact_email text,
  exact_location text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is the landlord of the property OR has unlocked it
  IF EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = prop_id AND p.landlord_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.unlocked_properties up
    WHERE up.property_id = prop_id AND up.user_id = auth.uid()
  ) THEN
    RETURN QUERY
    SELECT pc.contact_phone, pc.contact_email, pc.exact_location
    FROM public.property_contacts pc
    WHERE pc.property_id = prop_id;
  END IF;
END;
$$;
