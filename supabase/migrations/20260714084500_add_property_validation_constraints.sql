ALTER TABLE public.properties
  ADD CONSTRAINT properties_price_positive CHECK (price > 0 AND price < 100000000);

ALTER TABLE public.properties
  ADD CONSTRAINT properties_bedrooms_valid CHECK (bedrooms IS NULL OR (bedrooms >= 0 AND bedrooms <= 20));
