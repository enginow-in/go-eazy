-- ============================================================
-- SERVICES MARKETPLACE MIGRATION
-- ============================================================

-- Update profiles role to include service_provider
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'landlord', 'service_provider'));

-- ============================================================
-- SERVICE PROVIDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.service_providers (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  provider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('tiffin', 'laundry', 'cleaning')),
  description text,
  experience text,
  speciality text,
  area text,
  city text,
  state text,
  address text,
  landmark text,
  contact_phone text,
  contact_email text,
  is_open boolean DEFAULT true,
  working_hours jsonb DEFAULT '{}'::jsonb,
  images text[] DEFAULT '{}'::text[],
  documents text[] DEFAULT '{}'::text[],
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  views integer DEFAULT 0,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- ============================================================
-- SERVICE LISTINGS TABLE (individual services with price)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.service_listings (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  service_provider_id uuid NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  price numeric,
  unit text DEFAULT 'per month',
  description text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- ============================================================
-- SERVICE PLANS TABLE (subscription plans)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.service_plans (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  service_provider_id uuid NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  price numeric NOT NULL,
  description text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- ============================================================
-- SERVICE REVIEWS TABLE (persisted, no loss on refresh)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.service_reviews (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  service_provider_id uuid NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (service_provider_id, reviewer_id)  -- one review per user per provider
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;

-- Service Providers: public read, provider manages own
CREATE POLICY "Service providers are viewable by everyone"
  ON public.service_providers FOR SELECT USING (true);

CREATE POLICY "Service providers can insert own listing"
  ON public.service_providers FOR INSERT
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Service providers can update own listing"
  ON public.service_providers FOR UPDATE
  USING (auth.uid() = provider_id);

CREATE POLICY "Service providers can delete own listing"
  ON public.service_providers FOR DELETE
  USING (auth.uid() = provider_id);

-- Service Listings: public read, provider manages own
CREATE POLICY "Service listings are viewable by everyone"
  ON public.service_listings FOR SELECT USING (true);

CREATE POLICY "Providers can insert own service items"
  ON public.service_listings FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.service_providers sp
    WHERE sp.id = service_provider_id AND sp.provider_id = auth.uid()
  ));

CREATE POLICY "Providers can update own service items"
  ON public.service_listings FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.service_providers sp
    WHERE sp.id = service_provider_id AND sp.provider_id = auth.uid()
  ));

CREATE POLICY "Providers can delete own service items"
  ON public.service_listings FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.service_providers sp
    WHERE sp.id = service_provider_id AND sp.provider_id = auth.uid()
  ));

-- Service Plans: public read, provider manages own
CREATE POLICY "Service plans are viewable by everyone"
  ON public.service_plans FOR SELECT USING (true);

CREATE POLICY "Providers can insert own plans"
  ON public.service_plans FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.service_providers sp
    WHERE sp.id = service_provider_id AND sp.provider_id = auth.uid()
  ));

CREATE POLICY "Providers can update own plans"
  ON public.service_plans FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.service_providers sp
    WHERE sp.id = service_provider_id AND sp.provider_id = auth.uid()
  ));

CREATE POLICY "Providers can delete own plans"
  ON public.service_plans FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.service_providers sp
    WHERE sp.id = service_provider_id AND sp.provider_id = auth.uid()
  ));

-- Reviews: public read, authenticated users can post, own reviews editable
CREATE POLICY "Reviews are viewable by everyone"
  ON public.service_reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can submit reviews"
  ON public.service_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update own review"
  ON public.service_reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete own review"
  ON public.service_reviews FOR DELETE
  USING (auth.uid() = reviewer_id);

-- ============================================================
-- STORAGE BUCKET FOR DOCUMENTS
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-documents', 'service-documents', false)
ON CONFLICT DO NOTHING;

-- Storage policies for service documents
CREATE POLICY "Providers can upload their own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'service-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Providers can view their own documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'service-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- VIEWS COUNT FUNCTION FOR SERVICES
-- ============================================================
CREATE OR REPLACE FUNCTION increment_service_views(p_service_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.service_providers
  SET views = views + 1
  WHERE id = p_service_id;
END;
$$;
