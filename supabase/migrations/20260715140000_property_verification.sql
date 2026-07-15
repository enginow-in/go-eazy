CREATE TABLE IF NOT EXISTS public.property_verifications (
  property_id uuid PRIMARY KEY REFERENCES public.properties(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  trust_score integer NOT NULL DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  checks jsonb NOT NULL DEFAULT '{}'::jsonb,
  scoring_version integer NOT NULL DEFAULT 1,
  reviewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewer_notes text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_verifications_status
  ON public.property_verifications(status);
CREATE INDEX IF NOT EXISTS idx_property_verifications_score
  ON public.property_verifications(trust_score DESC);

ALTER TABLE public.property_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view property verification"
  ON public.property_verifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.landlord_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles admin_profile
      WHERE admin_profile.id = auth.uid() AND admin_profile.role = 'admin'
    )
  );

CREATE POLICY "Public can view approved verification"
  ON public.property_verifications FOR SELECT
  USING (status = 'approved');

REVOKE SELECT ON public.property_verifications FROM anon, authenticated;
GRANT SELECT (property_id, status, trust_score, checks, scoring_version, created_at, updated_at)
  ON public.property_verifications TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_property_verification_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS property_verification_updated_at ON public.property_verifications;
CREATE TRIGGER property_verification_updated_at
  BEFORE UPDATE ON public.property_verifications
  FOR EACH ROW EXECUTE FUNCTION public.set_property_verification_updated_at();

CREATE OR REPLACE FUNCTION public.calculate_property_trust_score(p_property_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  property_row record;
  checks jsonb;
  score integer := 0;
  duplicate_risk boolean;
  result jsonb;
BEGIN
  SELECT p.*, pr.full_name AS landlord_name, pr.email AS landlord_email
  INTO property_row
  FROM public.properties p
  LEFT JOIN public.profiles pr ON pr.id = p.landlord_id
  WHERE p.id = p_property_id;

  IF property_row.id IS NULL THEN
    RAISE EXCEPTION 'Property not found';
  END IF;

  IF auth.uid() IS NULL OR NOT (
    property_row.landlord_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  ) THEN
    RAISE EXCEPTION 'Not authorized to verify this property';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.properties other_property
    WHERE other_property.id <> p_property_id
      AND other_property.landlord_id = property_row.landlord_id
      AND lower(trim(other_property.title)) = lower(trim(property_row.title))
  ) INTO duplicate_risk;

  checks := jsonb_build_object(
    'required_fields', coalesce(length(trim(property_row.title)) >= 5, false)
      AND coalesce(length(trim(property_row.description)) >= 20, false)
      AND property_row.price > 0
      AND coalesce(length(trim(property_row.city)) > 0, false)
      AND coalesce(length(trim(property_row.area)) > 0, false),
    'images', cardinality(coalesce(property_row.images, '{}'::text[])) > 0,
    'landlord_profile', property_row.landlord_name IS NOT NULL
      AND property_row.landlord_email IS NOT NULL,
    'location', coalesce(length(trim(property_row.city)) > 0, false)
      AND coalesce(length(trim(property_row.area)) > 0, false),
    'duplicate_risk', duplicate_risk
  );

  IF (checks->>'required_fields')::boolean THEN score := score + 25; END IF;
  IF (checks->>'images')::boolean THEN score := score + 25; END IF;
  IF (checks->>'landlord_profile')::boolean THEN score := score + 25; END IF;
  IF (checks->>'location')::boolean THEN score := score + 25; END IF;
  IF duplicate_risk THEN score := greatest(score - 20, 0); END IF;

  INSERT INTO public.property_verifications (
    property_id, status, trust_score, checks, scoring_version, reviewer_id, reviewer_notes, reviewed_at
  ) VALUES (p_property_id, 'pending', score, checks, 1, NULL, NULL, NULL)
  ON CONFLICT (property_id) DO UPDATE SET
    status = 'pending', trust_score = EXCLUDED.trust_score,
    checks = EXCLUDED.checks, scoring_version = EXCLUDED.scoring_version,
    reviewer_id = NULL, reviewer_notes = NULL, reviewed_at = NULL;

  result := jsonb_build_object(
    'property_id', p_property_id, 'score', score, 'status', 'pending',
    'checks', checks, 'scoring_version', 1
  );
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_property_verification(
  p_property_id uuid,
  p_status text,
  p_reviewer_notes text DEFAULT NULL
)
RETURNS public.property_verifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE updated_row public.property_verifications;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can review properties';
  END IF;
  IF p_status NOT IN ('approved', 'rejected', 'pending') THEN
    RAISE EXCEPTION 'Invalid verification status';
  END IF;

  INSERT INTO public.property_verifications (property_id)
  VALUES (p_property_id)
  ON CONFLICT (property_id) DO NOTHING;

  UPDATE public.property_verifications
  SET status = p_status, reviewer_id = auth.uid(), reviewer_notes = p_reviewer_notes,
      reviewed_at = now()
  WHERE property_id = p_property_id
  RETURNING * INTO updated_row;
  RETURN updated_row;
END;
$$;

REVOKE ALL ON FUNCTION public.calculate_property_trust_score(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calculate_property_trust_score(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.review_property_verification(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_property_verification(uuid, text, text) TO authenticated;
