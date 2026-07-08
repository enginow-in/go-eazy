-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- Add embedding column to properties table
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS embedding vector(384);

-- Create match function for semantic search
CREATE OR REPLACE FUNCTION match_properties (
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  price numeric,
  type text,
  amenities text[],
  location jsonb,
  images text[],
  created_at timestamptz,
  landlord_id uuid,
  views integer,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    properties.id,
    properties.title,
    properties.description,
    properties.price,
    properties.type,
    properties.amenities,
    properties.location,
    properties.images,
    properties.created_at,
    properties.landlord_id,
    properties.views,
    1 - (properties.embedding <=> query_embedding) AS similarity
  FROM public.properties
  WHERE properties.embedding IS NOT NULL AND 1 - (properties.embedding <=> query_embedding) > match_threshold
  ORDER BY properties.embedding <=> query_embedding
  LIMIT match_count;
$$;
