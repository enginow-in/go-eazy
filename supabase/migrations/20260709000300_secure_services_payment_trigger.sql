-- Migration: 20260709000300_secure_services_payment_trigger.sql
-- Description: Create a trigger on service_providers to prevent non-service-role users from changing the payment_status column.

-- 1. Create trigger function
CREATE OR REPLACE FUNCTION public.check_service_provider_payment_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If payment_status is being changed
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    -- Allow ONLY if the updater is the service_role (privileged Edge Function)
    IF auth.role() <> 'service_role' THEN
      RAISE EXCEPTION 'You do not have permission to modify the payment status.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Bind the trigger to service_providers
DROP TRIGGER IF EXISTS tr_check_service_provider_payment_update ON public.service_providers;
CREATE TRIGGER tr_check_service_provider_payment_update
  BEFORE UPDATE ON public.service_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.check_service_provider_payment_update();
