-- CREATE TABLES

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role text CHECK (role IN ('user', 'landlord')),
  bio text,
  phone text,
  address text,
  onboarding_data jsonb DEFAULT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- PROPERTIES
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  landlord_id uuid NOT NULL REFERENCES public.profiles(id) on delete cascade,
  title text NOT NULL,
  description text,
  price numeric NOT NULL,
  city text NOT NULL,
  area text NOT NULL,
  pincode text,
  type text NOT NULL,
  amenities text[] DEFAULT '{}'::text[],
  images text[] DEFAULT '{}'::text[],
  availability boolean DEFAULT true,
  nearby_landmarks text,
  views integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- FAVORITES
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id uuid NOT NULL REFERENCES public.profiles(id) on delete cascade,
  property_id uuid NOT NULL REFERENCES public.properties(id) on delete cascade,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, property_id)
);

-- RECENTLY VIEWED
CREATE TABLE IF NOT EXISTS public.recently_viewed (
  user_id uuid NOT NULL REFERENCES public.profiles(id) on delete cascade,
  property_id uuid NOT NULL REFERENCES public.properties(id) on delete cascade,
  viewed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, property_id)
);


-- SET UP ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DO $$ BEGIN
  CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Properties Policies
DO $$ BEGIN
  CREATE POLICY "Public properties are viewable by everyone." ON public.properties FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Landlords can insert own property" ON public.properties FOR INSERT WITH CHECK (auth.uid() = landlord_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Increment Views Function
CREATE OR REPLACE FUNCTION increment_views(property_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.properties
  SET views = views + 1
  WHERE id = property_id;
END;
$$;
