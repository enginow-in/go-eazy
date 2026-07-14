CREATE OR REPLACE FUNCTION public.reject_past_site_visit_dates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.visit_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Site visits cannot be scheduled in the past'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reject_past_site_visit_dates ON public.site_visits;

CREATE TRIGGER reject_past_site_visit_dates
  BEFORE INSERT OR UPDATE OF visit_date ON public.site_visits
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_past_site_visit_dates();
