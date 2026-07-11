-- Route service approvals through the server-side admin function. The
-- hard-coded-email policy grants broad direct updates and is no longer needed.
DROP POLICY IF EXISTS "Admins can update all service providers" ON public.service_providers;

CREATE OR REPLACE FUNCTION public.prevent_client_verification_status_change()
RETURNS trigger AS $$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    IF TG_OP = 'INSERT' AND NEW.verification_status IS DISTINCT FROM 'pending' THEN
      RAISE EXCEPTION 'new service listings must have pending verification status';
    ELSIF TG_OP = 'UPDATE' AND NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
      RAISE EXCEPTION 'verification_status can only be changed by an authorized server-side process';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_client_verification_status_change ON public.service_providers;
CREATE TRIGGER trg_prevent_client_verification_status_change
  BEFORE INSERT OR UPDATE ON public.service_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_client_verification_status_change();

-- Public onboarding may select a non-admin role. Promotion to admin is only
-- allowed through a trusted server-side process.
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
