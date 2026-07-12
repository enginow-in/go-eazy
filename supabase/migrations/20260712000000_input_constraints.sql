-- Migration: 20260712000000_input_constraints.sql
-- Description: Add database CHECK constraints to enforce positive/non-negative prices and prevent empty required string fields.

-- 1. Constraints on public.properties
ALTER TABLE public.properties
  ADD CONSTRAINT properties_price_check CHECK (price > 0),
  ADD CONSTRAINT properties_title_check CHECK (char_length(trim(title)) > 0),
  ADD CONSTRAINT properties_city_check CHECK (char_length(trim(city)) > 0),
  ADD CONSTRAINT properties_area_check CHECK (char_length(trim(area)) > 0);

-- 2. Constraints on public.service_providers
ALTER TABLE public.service_providers
  ADD CONSTRAINT service_providers_name_check CHECK (char_length(trim(name)) > 0),
  ADD CONSTRAINT service_providers_city_check CHECK (char_length(trim(city)) > 0),
  ADD CONSTRAINT service_providers_area_check CHECK (char_length(trim(area)) > 0);

-- 3. Constraints on public.service_listings
ALTER TABLE public.service_listings
  ADD CONSTRAINT service_listings_price_check CHECK (price >= 0),
  ADD CONSTRAINT service_listings_name_check CHECK (char_length(trim(service_name)) > 0);

-- 4. Constraints on public.service_plans
ALTER TABLE public.service_plans
  ADD CONSTRAINT service_plans_price_check CHECK (price >= 0),
  ADD CONSTRAINT service_plans_name_check CHECK (char_length(trim(plan_name)) > 0);
