-- Require a property contact unlock before allowing a new review.
DROP POLICY IF EXISTS "Authenticated users can submit property reviews" ON public.property_reviews;
DROP POLICY IF EXISTS "Only users who unlocked the property can submit reviews" ON public.property_reviews;

CREATE POLICY "Only users who unlocked the property can submit reviews"
  ON public.property_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1
      FROM public.unlocked_properties u
      WHERE u.user_id = auth.uid()
        AND u.property_id = property_reviews.property_id
    )
  );
