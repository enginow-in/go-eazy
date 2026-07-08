-- Enable the PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;

-- Add location columns to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric,
ADD COLUMN IF NOT EXISTS location geometry(Point, 4326);

-- Function to update the geometry column automatically when lat/long changes
CREATE OR REPLACE FUNCTION update_property_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    ELSE
        NEW.location = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to keep location updated
DROP TRIGGER IF EXISTS trg_update_property_location ON public.properties;
CREATE TRIGGER trg_update_property_location
BEFORE INSERT OR UPDATE OF latitude, longitude ON public.properties
FOR EACH ROW
EXECUTE FUNCTION update_property_location();

-- Update existing rows
UPDATE public.properties SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND location IS NULL;

-- Create RPC for searching properties within a given GeoJSON polygon
CREATE OR REPLACE FUNCTION search_properties_in_polygon(polygon_geojson jsonb)
RETURNS SETOF public.properties AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.properties
    WHERE location IS NOT NULL
      AND ST_Within(location, ST_GeomFromGeoJSON(polygon_geojson));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
