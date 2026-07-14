-- CREATE TABLES

-- PROFILES
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role text CHECK (role IN ('user', 'landlord', 'admin', 'service_provider')),
  bio text,
  phone text,
  address text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- PROPERTIES
CREATE TABLE public.properties (
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
CREATE TABLE public.favorites (
  user_id uuid NOT NULL REFERENCES public.profiles(id) on delete cascade,
  property_id uuid NOT NULL REFERENCES public.properties(id) on delete cascade,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, property_id)
);

-- RECENTLY VIEWED
CREATE TABLE public.recently_viewed (
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

-- Profiles: Anyone can read, users can update own profile
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Properties: Anyone can read available properties, landlords manage their own
CREATE POLICY "Public properties are viewable by everyone." ON public.properties FOR SELECT USING (true);
CREATE POLICY "Landlords can insert own property" ON public.properties FOR INSERT WITH CHECK (auth.uid() = landlord_id);
CREATE POLICY "Landlords can update own property" ON public.properties FOR UPDATE USING (auth.uid() = landlord_id);
CREATE POLICY "Landlords can delete own property" ON public.properties FOR DELETE USING (auth.uid() = landlord_id);

-- Favorites: Users can manage their own favorites
CREATE POLICY "Users view own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- Recently Viewed: Users manage their own
CREATE POLICY "Users view own recently viewed" ON public.recently_viewed FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert/update own recently viewed" ON public.recently_viewed FOR ALL USING (auth.uid() = user_id);


-- STORAGE BUCKETS

-- Set up Property Images Bucket
insert into storage.buckets (id, name, public) values ('property-images', 'property-images', true);

-- Storage RLS
CREATE POLICY "Public property images viewable by everyone" ON storage.objects FOR SELECT USING (bucket_id = 'property-images');
CREATE POLICY "Landlords can upload property images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');
CREATE POLICY "Landlords can update their images" ON storage.objects FOR UPDATE USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[2]);
CREATE POLICY "Landlords can delete their images" ON storage.objects FOR DELETE USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[2]);


-- FUNCTIONS

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

-- Trigger to prevent role escalation
CREATE OR REPLACE FUNCTION check_role_update() RETURNS trigger AS $$
DECLARE
  jwt_role text;
BEGIN
  BEGIN
    jwt_role := current_setting('request.jwt.claim.role', true);
  EXCEPTION WHEN OTHERS THEN
    jwt_role := '';
  END;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF jwt_role = 'authenticated' THEN
      RAISE EXCEPTION 'Users cannot update their own role directly';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_role_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION check_role_update();
