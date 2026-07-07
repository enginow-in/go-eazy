-- Prevent landlords from reviewing their own properties
CREATE OR REPLACE FUNCTION public.prevent_landlord_self_review()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = NEW.property_id
    AND landlord_id = NEW.reviewer_id
  ) THEN
    RAISE EXCEPTION 'Landlords cannot review their own property listings';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_landlord_self_review ON public.property_reviews;

CREATE TRIGGER trg_prevent_landlord_self_review
  BEFORE INSERT OR UPDATE ON public.property_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_landlord_self_review();