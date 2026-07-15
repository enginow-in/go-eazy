CREATE TABLE IF NOT EXISTS public.service_view_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  viewer_key text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_view_log_lookup
  ON public.service_view_log (service_id, viewer_key, viewed_at);

ALTER TABLE public.service_view_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.increment_service_views(p_service_id uuid, p_viewer_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.service_view_log
    WHERE service_id = p_service_id
      AND viewer_key = p_viewer_key
      AND viewed_at > now() - INTERVAL '24 hours'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.service_view_log (service_id, viewer_key)
  VALUES (p_service_id, p_viewer_key);

  UPDATE public.service_providers
  SET views = views + 1
  WHERE id = p_service_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_old_service_view_log()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.service_view_log
  WHERE viewed_at < now() - INTERVAL '72 hours';
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
     AND NOT EXISTS (
       SELECT 1 FROM cron.job WHERE jobname = 'cleanup-service-view-log'
     ) THEN
    PERFORM cron.schedule(
      'cleanup-service-view-log',
      '0 * * * *',
      'SELECT public.delete_old_service_view_log()'
    );
  END IF;
END;
$$;
