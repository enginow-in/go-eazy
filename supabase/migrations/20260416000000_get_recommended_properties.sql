-- Migration: Add RPC function for fetching recommended properties globally
CREATE OR REPLACE FUNCTION get_recommended_properties(
  p_persona text DEFAULT NULL,
  p_type text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_limit integer DEFAULT 8
)
RETURNS SETOF public.properties
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  -- 1. Primary query with strict filters (type, city/area, budget)
  RETURN QUERY
  SELECT *
  FROM public.properties
  WHERE availability = true
    AND (p_type IS NULL OR p_type = '' OR type = p_type)
    AND (p_city IS NULL OR p_city = '' OR city ILIKE '%' || p_city || '%' OR area ILIKE '%' || p_city || '%')
    AND (p_min_price IS NULL OR price >= p_min_price)
    AND (p_max_price IS NULL OR price <= p_max_price)
  ORDER BY random()
  LIMIT p_limit;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- 2. Fallback 1: if no exact matches found and property type was specified, search by property type
  IF v_count = 0 AND (p_type IS NOT NULL AND p_type <> '') THEN
    RETURN QUERY
    SELECT *
    FROM public.properties
    WHERE availability = true
      AND type = p_type
    ORDER BY random()
    LIMIT p_limit;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;

  -- 3. Fallback 2: return any available properties randomly if still empty
  IF v_count = 0 THEN
    RETURN QUERY
    SELECT *
    FROM public.properties
    WHERE availability = true
    ORDER BY random()
    LIMIT p_limit;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION get_recommended_properties(text, text, text, numeric, numeric, integer) TO authenticated, anon;
