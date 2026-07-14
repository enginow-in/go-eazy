-- Prevent clients from impersonating the notification system.
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
REVOKE INSERT ON TABLE public.notifications FROM anon, authenticated;

DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
CREATE POLICY "Users can mark their notifications read"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- A visit request must target the actual owner of the selected property.
DROP POLICY IF EXISTS "Users can create their own visits" ON public.site_visits;
CREATE POLICY "Users can create their own visits"
  ON public.site_visits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND status = 'pending'
    AND landlord_id = (
      SELECT properties.landlord_id
      FROM public.properties
      WHERE properties.id = property_id
    )
  );

DROP POLICY IF EXISTS "Landlords can update their property visits" ON public.site_visits;
CREATE POLICY "Landlords can update their property visits"
  ON public.site_visits
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = landlord_id)
  WITH CHECK ((SELECT auth.uid()) = landlord_id);

CREATE INDEX IF NOT EXISTS idx_site_visits_user_created_at
  ON public.site_visits (user_id, created_at DESC);

-- Keep trigger functions out of the exposed public schema. The rate-limit
-- function uses an advisory lock so concurrent requests cannot bypass it.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.enforce_site_visit_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(NEW.user_id::text));

  IF (
    SELECT count(*)
    FROM public.site_visits
    WHERE user_id = NEW.user_id
      AND created_at >= now() - interval '1 hour'
  ) >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded: at most 10 site visit requests per hour';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.prevent_site_visit_identity_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.property_id IS DISTINCT FROM OLD.property_id
    OR NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.landlord_id IS DISTINCT FROM OLD.landlord_id
    OR NEW.visit_date IS DISTINCT FROM OLD.visit_date
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Site visit identity fields cannot be changed';
  END IF;

  IF OLD.status <> 'pending' OR NEW.status NOT IN ('approved', 'declined') THEN
    RAISE EXCEPTION 'Only pending visits can be approved or declined';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.prevent_notification_content_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.message IS DISTINCT FROM OLD.message
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only a notification read state can be changed';
  END IF;

  RETURN NEW;
END;
$$;

-- Create user notifications only as a consequence of an authorized visit
-- status transition, never from a browser-controlled insert.
CREATE OR REPLACE FUNCTION private.create_site_visit_status_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  property_title text;
BEGIN
  SELECT title INTO property_title
  FROM public.properties
  WHERE id = NEW.property_id;

  INSERT INTO public.notifications (user_id, message)
  VALUES (
    NEW.user_id,
    format(
      'Your site visit request for "%s" has been %s.',
      coalesce(property_title, 'Property'),
      NEW.status
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_site_visit_rate_limit ON public.site_visits;
CREATE TRIGGER enforce_site_visit_rate_limit
  BEFORE INSERT ON public.site_visits
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_site_visit_rate_limit();

DROP TRIGGER IF EXISTS prevent_site_visit_identity_changes ON public.site_visits;
CREATE TRIGGER prevent_site_visit_identity_changes
  BEFORE UPDATE ON public.site_visits
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_site_visit_identity_changes();

DROP TRIGGER IF EXISTS prevent_notification_content_changes ON public.notifications;
CREATE TRIGGER prevent_notification_content_changes
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_notification_content_changes();

DROP TRIGGER IF EXISTS create_site_visit_status_notification ON public.site_visits;
CREATE TRIGGER create_site_visit_status_notification
  AFTER UPDATE OF status ON public.site_visits
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('approved', 'declined'))
  EXECUTE FUNCTION private.create_site_visit_status_notification();

REVOKE ALL ON FUNCTION private.enforce_site_visit_rate_limit() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.prevent_site_visit_identity_changes() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.prevent_notification_content_changes() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.create_site_visit_status_notification() FROM PUBLIC;
