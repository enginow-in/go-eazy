-- ============================================================
-- PREVENT ROLE SELF-ESCALATION TO ADMIN
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_role_self_escalation()
RETURNS TRIGGER AS $$
DECLARE
  is_executor_admin BOOLEAN;
BEGIN
  -- Check if the current user (the executor) is an admin or the service role
  is_executor_admin := (auth.role() = 'service_role') OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (email = 'prriiyansunegi@gmail.com' OR role = 'admin')
  );

  -- If not an admin/service role, restrict role modifications
  IF NOT is_executor_admin THEN
    IF TG_OP = 'INSERT' THEN
      -- Cannot register as an admin
      IF NEW.role = 'admin' THEN
        RAISE EXCEPTION 'Cannot register as an admin';
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      -- If role is changing
      IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Cannot set to admin
        IF NEW.role = 'admin' THEN
          RAISE EXCEPTION 'Cannot self-promote to admin';
        END IF;
        -- Cannot change role once set (from non-null to anything else)
        IF OLD.role IS NOT NULL THEN
          RAISE EXCEPTION 'Role changes are not permitted once set';
        END IF;
        -- If setting role for the first time (old is null), only allow 'user', 'landlord', 'service_provider'
        IF OLD.role IS NULL AND NEW.role NOT IN ('user', 'landlord', 'service_provider') THEN
          RAISE EXCEPTION 'Invalid role selection';
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to profiles table
DROP TRIGGER IF EXISTS lock_role_column ON public.profiles;
CREATE TRIGGER lock_role_column
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION prevent_role_self_escalation();
