-- ============================================================
-- SECURE SERVICE PROVIDER LISTING PAYMENTS
-- ============================================================

-- 1. Add razorpay_payment_id to service_providers
ALTER TABLE public.service_providers 
ADD COLUMN IF NOT EXISTS razorpay_payment_id text UNIQUE;

-- 2. Create function to prevent payment status tampering from client
CREATE OR REPLACE FUNCTION prevent_payment_status_tampering()
RETURNS TRIGGER AS $$
DECLARE
  is_executor_admin BOOLEAN;
BEGIN
  -- Check if the current user (the executor) is an admin or the service role
  is_executor_admin := (auth.role() = 'service_role') OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (email = 'prriiyansunegi@gmail.com' OR role = 'admin')
  );

  -- If not admin/service role, they cannot modify payment_status
  IF NOT is_executor_admin THEN
    IF TG_OP = 'INSERT' THEN
      -- On insert, payment_status must be 'pending' or NULL
      IF NEW.payment_status IS DISTINCT FROM 'pending' AND NEW.payment_status IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot set initial payment status to %', NEW.payment_status;
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      -- On update, payment_status cannot be changed by the user
      IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
        RAISE EXCEPTION 'payment_status column is write-protected';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Bind trigger to service_providers table
DROP TRIGGER IF EXISTS lock_payment_status ON public.service_providers;
CREATE TRIGGER lock_payment_status
BEFORE INSERT OR UPDATE ON public.service_providers
FOR EACH ROW EXECUTE FUNCTION prevent_payment_status_tampering();
