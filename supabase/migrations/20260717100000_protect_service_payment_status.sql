-- Prevent client sessions from changing payment_status directly.
CREATE OR REPLACE FUNCTION public.prevent_service_payment_status_tampering()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status
     AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'payment_status can only be changed by the server';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_service_payment_status ON public.service_providers;
CREATE TRIGGER protect_service_payment_status
  BEFORE UPDATE ON public.service_providers
  FOR EACH ROW EXECUTE FUNCTION public.prevent_service_payment_status_tampering();
