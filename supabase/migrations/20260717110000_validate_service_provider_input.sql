-- Enforce service-provider input limits at the database boundary.
CREATE OR REPLACE FUNCTION public.validate_service_provider_input()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.name := btrim(NEW.name);
  IF NEW.name IS NULL OR NEW.name = '' OR length(NEW.name) > 200 THEN
    RAISE EXCEPTION 'Provider name is required and must be under 200 characters';
  END IF;

  IF NEW.category NOT IN ('tiffin', 'laundry', 'cleaning') THEN
    RAISE EXCEPTION 'Invalid service category';
  END IF;
  IF NEW.description IS NOT NULL AND length(NEW.description) > 5000 THEN
    RAISE EXCEPTION 'Description must be under 5000 characters';
  END IF;
  IF NEW.city IS NOT NULL AND length(NEW.city) > 100 THEN
    RAISE EXCEPTION 'City must be under 100 characters';
  END IF;
  IF NEW.area IS NOT NULL AND length(NEW.area) > 150 THEN
    RAISE EXCEPTION 'Area must be under 150 characters';
  END IF;
  IF NEW.contact_phone IS NOT NULL AND length(NEW.contact_phone) > 30 THEN
    RAISE EXCEPTION 'Contact phone is too long';
  END IF;
  IF NEW.contact_email IS NOT NULL AND length(NEW.contact_email) > 200 THEN
    RAISE EXCEPTION 'Contact email is too long';
  END IF;
  IF coalesce(array_length(NEW.images, 1), 0) > 10 OR coalesce(array_length(NEW.documents, 1), 0) > 10 THEN
    RAISE EXCEPTION 'Too many service images or documents';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_service_provider_input ON public.service_providers;
CREATE TRIGGER validate_service_provider_input
  BEFORE INSERT OR UPDATE ON public.service_providers
  FOR EACH ROW EXECUTE FUNCTION public.validate_service_provider_input();
