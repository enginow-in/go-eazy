-- Restore the admin role that was accidentally omitted when service_provider
-- was added to the profiles role constraint.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'landlord', 'admin', 'service_provider'));
