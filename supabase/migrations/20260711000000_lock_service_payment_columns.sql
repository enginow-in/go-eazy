-- Prevent client-side payment escalation. Providers can still edit their listing
-- and the separate admin-approval flow remains responsible for verification status.
CREATE OR REPLACE FUNCTION public.prevent_client_side_status_tampering()
RETURNS trigger AS $$
BEGIN
  IF (
    NEW.payment_status IS DISTINCT FROM OLD.payment_status
  ) AND COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'payment_status can only be changed by a verified server-side process';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_status_tampering ON public.service_providers;
CREATE TRIGGER trg_prevent_status_tampering
  BEFORE UPDATE ON public.service_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_client_side_status_tampering();
