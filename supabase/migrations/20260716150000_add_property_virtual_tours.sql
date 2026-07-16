-- Store optional 360-degree panorama URLs separately from standard gallery images.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS panorama_urls text[] NOT NULL DEFAULT '{}';
