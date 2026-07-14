-- Enhanced Dashboard Tables Migration

-- Search History Table
CREATE TABLE public.search_history (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) on delete cascade,
  location text,
  property_type text,
  budget numeric,
  query_params jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- User Preferences Table
CREATE TABLE public.user_preferences (
  user_id uuid NOT NULL REFERENCES public.profiles(id) on delete cascade,
  budget_min numeric,
  budget_max numeric,
  preferred_locations text[] DEFAULT '{}',
  property_types text[] DEFAULT '{}',
  amenities text[] DEFAULT '{}',
  notification_settings jsonb DEFAULT '{"price_drops": true, "new_matches": true, "booking_updates": true, "messages": true}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id)
);

-- Notifications Table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) on delete cascade,
  type text NOT NULL CHECK (type IN ('price_drop', 'message', 'booking', 'property', 'recommendation')),
  title text NOT NULL,
  message text NOT NULL,
  related_property_id uuid REFERENCES public.properties(id) on delete cascade,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- Rental Applications Table
CREATE TABLE public.rental_applications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) on delete cascade,
  property_id uuid NOT NULL REFERENCES public.properties(id) on delete cascade,
  landlord_id uuid NOT NULL REFERENCES public.profiles(id) on delete cascade,
  message text,
  documents jsonb DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- Site Visits Table
CREATE TABLE public.site_visits (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) on delete cascade,
  property_id uuid NOT NULL REFERENCES public.properties(id) on delete cascade,
  landlord_id uuid NOT NULL REFERENCES public.profiles(id) on delete cascade,
  visit_date timestamp with time zone NOT NULL,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'completed')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- User Documents Table
CREATE TABLE public.user_documents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) on delete cascade,
  document_type text NOT NULL CHECK (document_type IN ('aadhar', 'pan', 'passport', 'driving_license', 'income_proof', 'agreement')),
  file_url text NOT NULL,
  file_name text NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- Property Comparisons Table
CREATE TABLE public.property_comparisons (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) on delete cascade,
  property_ids uuid[] NOT NULL,
  comparison_name text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- Reviews Table
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) on delete cascade,
  property_id uuid NOT NULL REFERENCES public.properties(id) on delete cascade,
  landlord_id uuid NOT NULL REFERENCES public.profiles(id) on delete cascade,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- Messages Table
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  from_user_id uuid NOT NULL REFERENCES public.profiles(id) on delete cascade,
  to_user_id uuid NOT NULL REFERENCES public.profiles(id) on delete cascade,
  property_id uuid REFERENCES public.properties(id) on delete cascade,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- Update properties table to add missing columns
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS rent numeric,
  ADD COLUMN IF NOT EXISTS property_type text,
  ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) on delete cascade;

-- Update the type column to property_type for consistency
UPDATE public.properties SET property_type = type WHERE property_type IS NULL;
UPDATE public.properties SET rent = price WHERE rent IS NULL;

-- Enable RLS on new tables
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Search History: Users can manage their own
CREATE POLICY "Users manage own search history" ON public.search_history FOR ALL USING (auth.uid() = user_id);

-- User Preferences: Users can manage their own
CREATE POLICY "Users manage own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

-- Notifications: Users can read and update their own
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Rental Applications: Users and landlords can view/manage
CREATE POLICY "Users view own applications" ON public.rental_applications FOR SELECT USING (auth.uid() = user_id OR auth.uid() = landlord_id);
CREATE POLICY "Users create applications" ON public.rental_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Landlords update applications" ON public.rental_applications FOR UPDATE USING (auth.uid() = landlord_id);

-- Site Visits: Users and landlords can view/manage
CREATE POLICY "Users view own visits" ON public.site_visits FOR SELECT USING (auth.uid() = user_id OR auth.uid() = landlord_id);
CREATE POLICY "Users create visits" ON public.site_visits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users/landlords update visits" ON public.site_visits FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = landlord_id);

-- User Documents: Users manage their own
CREATE POLICY "Users manage own documents" ON public.user_documents FOR ALL USING (auth.uid() = user_id);

-- Property Comparisons: Users manage their own
CREATE POLICY "Users manage own comparisons" ON public.property_comparisons FOR ALL USING (auth.uid() = user_id);

-- Reviews: Users can read all, write for properties they've visited
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users create own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

-- Messages: Users can view messages they're involved in
CREATE POLICY "Users view own messages" ON public.messages FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Users update own messages" ON public.messages FOR UPDATE USING (auth.uid() = to_user_id);

-- Functions

-- Function to add search history
CREATE OR REPLACE FUNCTION add_search_history(
  p_user_id uuid,
  p_location text DEFAULT NULL,
  p_property_type text DEFAULT NULL,
  p_budget numeric DEFAULT NULL,
  p_query_params jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  search_id uuid;
BEGIN
  INSERT INTO public.search_history (user_id, location, property_type, budget, query_params)
  VALUES (p_user_id, p_location, p_property_type, p_budget, p_query_params)
  RETURNING id INTO search_id;
  
  RETURN search_id;
END;
$$;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_related_property_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_property_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_related_property_id)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;