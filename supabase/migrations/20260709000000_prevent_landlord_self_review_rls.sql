-- ============================================================
-- PREVENT LANDLORDS FROM REVIEWING THEIR OWN PROPERTY LISTINGS
-- (RLS layer — complements the BEFORE INSERT/UPDATE trigger in PR #203)
-- ============================================================

-- Update INSERT policy to reject self-reviews at the RLS layer.
-- This gives a faster rejection for normal client/authenticated requests,
-- before the request even reaches the trigger. The trigger remains as a
-- backstop for UPDATE and for any service_role inserts that bypass RLS.
DROP POLICY IF EXISTS "Authenticated users can submit property reviews" ON public.property_reviews;

CREATE POLICY "Authenticated users can submit property reviews"
  ON public.property_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND NOT EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.landlord_id = reviewer_id
    )
  );

-- Update UPDATE policy with the same guard, so a reviewer who somehow
-- ends up owning the property later (or vice versa) can't retroactively
-- edit a review into a self-review either.
DROP POLICY IF EXISTS "Users can update own property reviews" ON public.property_reviews;

CREATE POLICY "Users can update own property reviews"
  ON public.property_reviews FOR UPDATE
  USING (auth.uid() = reviewer_id)
  WITH CHECK (
    auth.uid() = reviewer_id
    AND NOT EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.landlord_id = reviewer_id
    )
  );