-- Persist service-contact unlocks so review eligibility can be enforced by RLS.
CREATE TABLE IF NOT EXISTS public.unlocked_services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_provider_id uuid REFERENCES public.service_providers(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, service_provider_id)
);

ALTER TABLE public.unlocked_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own unlocked services" ON public.unlocked_services;
CREATE POLICY "Users can view their own unlocked services"
  ON public.unlocked_services FOR SELECT
  USING (auth.uid() = user_id);

-- Unlock rows are written by the server-side payment verification flow only.

DROP POLICY IF EXISTS "Authenticated users can submit reviews" ON public.service_reviews;
DROP POLICY IF EXISTS "Only users who unlocked the provider can submit a review" ON public.service_reviews;
CREATE POLICY "Only users who unlocked the provider can submit a review"
  ON public.service_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1
      FROM public.unlocked_services u
      WHERE u.user_id = auth.uid()
        AND u.service_provider_id = service_reviews.service_provider_id
    )
  );
