-- ============================================================
-- PROPERTY REVIEWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.property_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (property_id, reviewer_id) -- one review per user per property
);

-- ROW LEVEL SECURITY
ALTER TABLE public.property_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Property reviews are viewable by everyone"
  ON public.property_reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can submit property reviews"
  ON public.property_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update own property reviews"
  ON public.property_reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete own property reviews"
  ON public.property_reviews FOR DELETE
  USING (auth.uid() = reviewer_id);
