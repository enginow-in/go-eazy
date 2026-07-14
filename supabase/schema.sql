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


-- Prevent Role Self-Escalation Function
CREATE OR REPLACE FUNCTION prevent_role_self_escalation()
RETURNS TRIGGER AS $$
DECLARE
  is_executor_admin BOOLEAN;
BEGIN
  -- Check if the current user (the executor) is an admin or the service role
  is_executor_admin := (auth.role() = 'service_role') OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (email = 'prriiyansunegi@gmail.com' OR role = 'admin')
  );

  -- If not an admin/service role, restrict role modifications
  IF NOT is_executor_admin THEN
    IF TG_OP = 'INSERT' THEN
      -- Cannot register as an admin
      IF NEW.role = 'admin' THEN
        RAISE EXCEPTION 'Cannot register as an admin';
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      -- If role is changing
      IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Cannot set to admin
        IF NEW.role = 'admin' THEN
          RAISE EXCEPTION 'Cannot self-promote to admin';
        END IF;
        -- Cannot change role once set (from non-null to anything else)
        IF OLD.role IS NOT NULL THEN
          RAISE EXCEPTION 'Role changes are not permitted once set';
        END IF;
        -- If setting role for the first time (old is null), only allow 'user', 'landlord', 'service_provider'
        IF OLD.role IS NULL AND NEW.role NOT IN ('user', 'landlord', 'service_provider') THEN
          RAISE EXCEPTION 'Invalid role selection';
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to profiles table
DROP TRIGGER IF EXISTS lock_role_column ON public.profiles;
CREATE TRIGGER lock_role_column
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION prevent_role_self_escalation();

