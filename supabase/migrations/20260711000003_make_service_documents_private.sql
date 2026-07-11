-- Verification documents contain sensitive provider information and must never
-- be available through public object URLs.
UPDATE storage.buckets
SET public = false
WHERE id = 'service-documents';

-- The signed-URL function authorizes through profiles.role, so prevent a
-- client from creating or promoting itself to an administrator. This matches
-- the #441 guard and is idempotent if that migration lands first.
CREATE OR REPLACE FUNCTION public.prevent_client_admin_role_escalation()
RETURNS trigger AS $$
BEGIN
  IF NEW.role = 'admin' AND COALESCE(auth.role(), '') <> 'service_role' THEN
    IF TG_OP = 'INSERT' THEN
      RAISE EXCEPTION 'admin role can only be assigned by an authorized server-side process';
    ELSIF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'admin role can only be assigned by an authorized server-side process';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_client_admin_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_client_admin_role_escalation
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_client_admin_role_escalation();
