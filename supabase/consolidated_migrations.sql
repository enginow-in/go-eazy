-- CONSOLIDATED SCHEMAS & MIGRATIONS (POST-SCHEMA.SQL)
-- Run this script in the Supabase SQL Editor to bring your database schema fully up-to-date.

-- 1. ADD ONBOARDING DATA COLUMN TO PROFILES
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_data jsonb DEFAULT NULL;

COMMENT ON COLUMN public.profiles.onboarding_data IS 'Stores preferences from the onboarding quiz for personalized recommendations.';


-- 2. ADD UNLOCKED PROPERTIES & ADDITIONAL CONTACT FIELDS
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS exact_location text;

CREATE TABLE IF NOT EXISTS public.unlocked_properties (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, property_id)
);

ALTER TABLE public.unlocked_properties ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view their own mapped properties" ON public.unlocked_properties FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Landlords can view unlocks for their properties" ON public.unlocked_properties FOR SELECT USING (
      EXISTS (
          SELECT 1 FROM public.properties p 
          WHERE p.id = unlocked_properties.property_id 
          AND p.landlord_id = auth.uid()
      )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- 3. PAYMENT ATTEMPTS
CREATE TABLE IF NOT EXISTS payment_attempts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_user_time
  ON payment_attempts (user_id, created_at DESC);

ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own payment attempts" ON payment_attempts FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- 4. SERVICES MARKETPLACE
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'landlord', 'admin', 'service_provider'));

CREATE TABLE IF NOT EXISTS public.service_providers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
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
  images text[] DEFAULT '{}'::text[],
  documents text[] DEFAULT '{}'::text[],
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  views integer DEFAULT 0,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed'));

CREATE TABLE IF NOT EXISTS public.service_listings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  service_provider_id uuid NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  price numeric,
  unit text DEFAULT 'per month',
  description text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.service_plans (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  service_provider_id uuid NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  price numeric NOT NULL,
  description text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.service_reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  service_provider_id uuid NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (service_provider_id, reviewer_id)
);

ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service providers are viewable by everyone" ON public.service_providers FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service providers can insert own listing" ON public.service_providers FOR INSERT WITH CHECK (auth.uid() = provider_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service providers can update own listing" ON public.service_providers FOR UPDATE USING (auth.uid() = provider_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service providers can delete own listing" ON public.service_providers FOR DELETE USING (auth.uid() = provider_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service listings are viewable by everyone" ON public.service_listings FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Providers can insert own service items" ON public.service_listings FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.service_providers sp
    WHERE sp.id = service_provider_id AND sp.provider_id = auth.uid()
  ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Providers can update own service items" ON public.service_listings FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.service_providers sp
    WHERE sp.id = service_provider_id AND sp.provider_id = auth.uid()
  ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Providers can delete own service items" ON public.service_listings FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.service_providers sp
    WHERE sp.id = service_provider_id AND sp.provider_id = auth.uid()
  ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service plans are viewable by everyone" ON public.service_plans FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Providers can insert own plans" ON public.service_plans FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.service_providers sp
    WHERE sp.id = service_provider_id AND sp.provider_id = auth.uid()
  ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Providers can update own plans" ON public.service_plans FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.service_providers sp
    WHERE sp.id = service_provider_id AND sp.provider_id = auth.uid()
  ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Providers can delete own plans" ON public.service_plans FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.service_providers sp
    WHERE sp.id = service_provider_id AND sp.provider_id = auth.uid()
  ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Reviews are viewable by everyone" ON public.service_reviews FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can submit reviews" ON public.service_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own review" ON public.service_reviews FOR UPDATE USING (auth.uid() = reviewer_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own review" ON public.service_reviews FOR DELETE USING (auth.uid() = reviewer_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO storage.buckets (id, name, public) VALUES ('service-documents', 'service-documents', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('service-images', 'service-images', true) ON CONFLICT (id) DO UPDATE SET public = true;

DO $$ BEGIN
  CREATE POLICY "Providers can upload their own documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'service-documents' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Providers can view their own documents" ON storage.objects FOR SELECT USING (bucket_id = 'service-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service images are public" ON storage.objects FOR SELECT USING (bucket_id = 'service-images');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Providers can upload their own service images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'service-images' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Providers can delete their own service images" ON storage.objects FOR DELETE USING (bucket_id = 'service-images' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update all service providers" ON public.service_providers FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'prriiyansunegi@gmail.com'
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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


-- 5. PROPERTY REVIEWS
CREATE TABLE IF NOT EXISTS public.property_reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (property_id, reviewer_id)
);

ALTER TABLE public.property_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Property reviews are viewable by everyone" ON public.property_reviews FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can submit property reviews" ON public.property_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own property reviews" ON public.property_reviews FOR UPDATE USING (auth.uid() = reviewer_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own property reviews" ON public.property_reviews FOR DELETE USING (auth.uid() = reviewer_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- 6. SITE VISITS & NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.site_visits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  landlord_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visit_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view their own visits" ON public.site_visits FOR SELECT USING (auth.uid() = user_id OR auth.uid() = landlord_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create their own visits" ON public.site_visits FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Landlords can update their property visits" ON public.site_visits FOR UPDATE USING (auth.uid() = landlord_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
