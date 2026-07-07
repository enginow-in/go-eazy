-- Drop the weak INSERT policy
DROP POLICY IF EXISTS "Authenticated users can submit property reviews" ON public.property_reviews;

-- Create the secure, spam-protected INSERT policy
CREATE POLICY "Authenticated users can submit property reviews"
  ON public.property_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id 
    AND EXISTS (
      SELECT 1 FROM public.unlocked_properties up 
      WHERE up.property_id = property_reviews.property_id 
      AND up.user_id = auth.uid()
    )
  );
