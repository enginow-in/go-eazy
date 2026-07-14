-- Migration: 20260408020000_secure_property_contacts.sql
-- Description: Enforce Zero-Trust architecture by revoking public access to sensitive property fields and creating a secure RPC.


REVOKE SELECT (contact_phone, contact_email, exact_location) ON public.properties FROM anon, authenticated;


CREATE OR REPLACE FUNCTION get_unlocked_property_details(prop_id uuid)
RETURNS TABLE (
    contact_phone text,
    contact_email text,
    exact_location text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN

    IF EXISTS (
        SELECT 1 FROM public.properties p 
        WHERE p.id = prop_id AND p.landlord_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.unlocked_properties up 
        WHERE up.property_id = prop_id AND up.user_id = auth.uid()
    ) THEN
        RETURN QUERY SELECT p.contact_phone, p.contact_email, p.exact_location 
        FROM public.properties p 
        WHERE p.id = prop_id;
    END IF;
    
    RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION get_unlocked_property_details(uuid) TO anon, authenticated;
