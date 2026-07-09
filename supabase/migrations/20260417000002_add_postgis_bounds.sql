-- Enable PostGIS extension for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;

-- Add latitude and longitude columns for ease of use
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS lng double precision;

-- Add the Geometry column (Point, 4326 is standard WGS84 for lat/lng)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS location extensions.geometry(Point, 4326);

-- Populate location from existing lat/lng (if any) or generate fake ones for testing if null
-- Normally this would happen on INSERT trigger, but we backfill here.
UPDATE public.properties 
SET 
  lat = 30.316494 + (random() * 0.1 - 0.05), -- Randomize near Dehradun
  lng = 78.032191 + (random() * 0.1 - 0.05)
WHERE lat IS NULL OR lng IS NULL;

-- Set the location geometry
UPDATE public.properties 
SET location = extensions.st_point(lng, lat);

-- Create the GiST index for ultra-fast spatial bounding box queries
CREATE INDEX IF NOT EXISTS properties_location_idx ON public.properties USING GIST (location);

-- Create the RPC for the Map Bounding Box query
CREATE OR REPLACE FUNCTION public.fetch_properties_in_bounds(
  min_lat double precision,
  min_lng double precision,
  max_lat double precision,
  max_lng double precision
)
RETURNS TABLE (
  id uuid,
  landlord_id uuid,
  type text,
  title text,
  description text,
  price numeric,
  city text,
  area text,
  pincode text,
  amenities text[],
  images text[],
  availability boolean,
  views integer,
  created_at timestamp with time zone,
  lat double precision,
  lng double precision,
  landlord_name text,
  landlord_avatar text,
  landlord_bio text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.landlord_id,
    p.type,
    p.title,
    p.description,
    p.price,
    p.city,
    p.area,
    p.pincode,
    p.amenities,
    p.images,
    p.availability,
    p.views,
    p.created_at,
    p.lat,
    p.lng,
    pr.full_name AS landlord_name,
    pr.avatar_url AS landlord_avatar,
    pr.bio AS landlord_bio
  FROM public.properties p
  LEFT JOIN public.profiles pr ON pr.id = p.landlord_id
  WHERE p.availability = true
  AND p.location && extensions.st_makeenvelope(
    min_lng, min_lat, max_lng, max_lat, 4326
  )
  ORDER BY p.views DESC
  LIMIT 50; -- Only return a highly-optimized subset for the map viewport
END;
$$;
