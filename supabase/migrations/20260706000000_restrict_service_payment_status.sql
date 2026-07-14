-- ============================================================
-- RESTRICT CLIENT-SIDE payment_status UPDATES ON service_providers
-- ============================================================
-- Defense-in-depth: even if someone bypasses the frontend,
-- RLS blocks direct payment_status writes from the client SDK.
-- The verify-service-payment Edge Function uses the service role
-- key (which bypasses RLS) to set payment_status = 'paid'.
-- ============================================================

-- 1. Drop the permissive update policy that allows providers to
--    update ANY column (including payment_status) on their rows.
DROP POLICY IF EXISTS "Service providers can update own listing"
  ON public.service_providers;

-- 2. Replace with a restricted policy: providers can update their
--    own rows ONLY IF they are not changing payment_status.
--    This uses a trigger-based approach since Postgres RLS WITH CHECK
--    on UPDATE does not have access to OLD values directly in all
--    contexts. Instead we use a BEFORE UPDATE trigger.

-- Re-create the update policy (ownership check only)
CREATE POLICY "Service providers can update own listing"
  ON public.service_providers FOR UPDATE
  USING (auth.uid() = provider_id);

-- 3. Create a trigger function that prevents client-side
--    payment_status changes. The service role bypasses RLS
--    entirely, so Edge Function updates are unaffected.
CREATE OR REPLACE FUNCTION prevent_payment_status_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Allow if payment_status is not being changed
  IF OLD.payment_status IS NOT DISTINCT FROM NEW.payment_status THEN
    RETURN NEW;
  END IF;

  -- Block client-side payment_status changes.
  -- The current_setting check allows service-role callers (Edge Functions)
  -- to bypass this guard since they set role = 'service_role'.
  IF current_setting('role', true) = 'authenticated' THEN
    RAISE EXCEPTION 'payment_status cannot be updated directly. Use the payment verification endpoint.';
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Attach the trigger
DROP TRIGGER IF EXISTS guard_payment_status ON public.service_providers;
CREATE TRIGGER guard_payment_status
  BEFORE UPDATE ON public.service_providers
  FOR EACH ROW
  EXECUTE FUNCTION prevent_payment_status_tampering();
