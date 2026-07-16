-- Replace the legacy hardcoded-email authorization with the database role.
DROP POLICY IF EXISTS "Admins can update all service providers" ON public.service_providers;

CREATE POLICY "Admins can update all service providers"
  ON public.service_providers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );
