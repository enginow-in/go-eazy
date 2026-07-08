-- Migration: 20260708000000_prevent_self_promotion.sql
-- Description: Restores the 'admin' role to the check constraint and adds a trigger to prevent non-admins from updating roles.

-- 1. Restore 'admin' to check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'landlord', 'service_provider', 'admin'));

-- 2. Create the trigger function to prevent self-promotion
CREATE OR REPLACE FUNCTION public.check_profile_role_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If role is being changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Check permissions:
    -- - If the updater is the service_role, we allow it (system-level change)
    -- - If the updater is already an admin in profiles, we allow it
    -- Otherwise, reject the update
    IF auth.role() <> 'service_role' AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IS DISTINCT FROM 'admin' THEN
      RAISE EXCEPTION 'You do not have permission to modify the user role.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Bind the trigger to profiles
DROP TRIGGER IF EXISTS tr_check_profile_role_update ON public.profiles;
CREATE TRIGGER tr_check_profile_role_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_role_update();
