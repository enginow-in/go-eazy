-- Contact details must not live on the publicly readable service row.
CREATE TABLE IF NOT EXISTS public.service_contact_details (
  service_provider_id uuid PRIMARY KEY REFERENCES public.service_providers(id) ON DELETE CASCADE,
  contact_phone text,
  contact_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.service_contact_details (service_provider_id, contact_phone, contact_email)
SELECT id, contact_phone, contact_email
FROM public.service_providers
WHERE contact_phone IS NOT NULL OR contact_email IS NOT NULL
ON CONFLICT (service_provider_id) DO UPDATE
SET contact_phone = EXCLUDED.contact_phone,
    contact_email = EXCLUDED.contact_email;

ALTER TABLE public.service_providers
  DROP COLUMN IF EXISTS contact_phone,
  DROP COLUMN IF EXISTS contact_email;

ALTER TABLE public.service_contact_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers manage own service contacts"
  ON public.service_contact_details FOR ALL
  USING (EXISTS (SELECT 1 FROM public.service_providers sp WHERE sp.id = service_provider_id AND sp.provider_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.service_providers sp WHERE sp.id = service_provider_id AND sp.provider_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.unlocked_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_provider_id uuid NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, service_provider_id)
);

ALTER TABLE public.unlocked_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own service unlocks"
  ON public.unlocked_services FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_unlocked_service_details(prov_id uuid)
RETURNS TABLE(contact_phone text, contact_email text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT sc.contact_phone, sc.contact_email
  FROM service_contact_details sc
  JOIN service_providers sp ON sp.id = sc.service_provider_id
  WHERE sc.service_provider_id = prov_id
    AND (
      sp.provider_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM unlocked_services us
        WHERE us.service_provider_id = prov_id AND us.user_id = auth.uid()
      )
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_unlocked_service_details(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_unlocked_service_details(uuid) TO authenticated;
