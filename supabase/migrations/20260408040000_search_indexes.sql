-- Migration: 20260408040000_search_indexes.sql
-- Description: Comprehensive database indexing strategy to eliminate sequential table scans.

-- 1. B-Tree Indexes for Equality and Range Queries
-- These support fast exact matches, boolean filters, numeric comparisons, and pagination sorting.
CREATE INDEX IF NOT EXISTS idx_properties_availability ON public.properties (availability);
CREATE INDEX IF NOT EXISTS idx_properties_type ON public.properties (type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties (price);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties (created_at DESC);

-- 2. GIN Index for Array Content Search
-- Supports the `contains` filter used for checking if a property has specific amenities.
CREATE INDEX IF NOT EXISTS idx_properties_amenities ON public.properties USING GIN (amenities);

-- 3. Trigram GIN Indexes for Fuzzy Text Search
-- Supports the `ilike` operations used in city and area substring matching.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_properties_city_trgm ON public.properties USING GIN (city gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_area_trgm ON public.properties USING GIN (area gin_trgm_ops);
