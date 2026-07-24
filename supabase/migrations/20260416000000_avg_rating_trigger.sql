-- Add avg_rating column to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS avg_rating numeric(3,2) DEFAULT 0.0;

-- Function to recalculate and update avg_rating on the properties table
CREATE OR REPLACE FUNCTION update_property_avg_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_avg numeric(3,2);
  target_property_id uuid;
BEGIN
  -- Works for INSERT, UPDATE, and DELETE
  IF TG_OP = 'DELETE' THEN
    target_property_id := OLD.property_id;
  ELSE
    target_property_id := NEW.property_id;
  END IF;

  SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0.0)
  INTO new_avg
  FROM public.property_reviews
  WHERE property_id = target_property_id;

  UPDATE public.properties
  SET avg_rating = new_avg
  WHERE id = target_property_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger fires after any review insert, update, or delete
DROP TRIGGER IF EXISTS trg_update_property_avg_rating ON public.property_reviews;
CREATE TRIGGER trg_update_property_avg_rating
  AFTER INSERT OR UPDATE OR DELETE
  ON public.property_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_property_avg_rating();

-- Backfill avg_rating for all existing properties that already have reviews
UPDATE public.properties p
SET avg_rating = (
  SELECT COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0.0)
  FROM public.property_reviews r
  WHERE r.property_id = p.id
);