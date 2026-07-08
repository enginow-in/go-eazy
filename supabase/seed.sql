-- SEED DATA FOR PROPERTIES
-- Note: landlord_id must be a valid profile. Since we don't have users, we might need to skip or create a dummy one.
-- Let's create a dummy landlord profile first (requires auth.uid() or dummy uuid)

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a dummy landlord id
DO $$
DECLARE
    dummy_id uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
    -- This assumes we can bypass auth.users for mock data in public.profiles
    -- But usually profiles has a foreign key to auth.users.
    -- To make it "fully working" without user registration, we'll just insert properties with a dummy UUID if possible,
    -- or tell the user to sign up.
    
    -- For now, let's just make sure the tables are there. 
    -- If we want real data, we need a valid landlord_id.
END $$;

-- Let's just create some starter properties if landlord_id is not enforced or we use a hack.
-- Actually, landlord_id has a CONSTRAINT on profiles(id).
-- So we MUST have a profile.

-- We must create an auth.user first to satisfy the foreign key constraint on profiles(id)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@goeazy.com',
  crypt('password123', gen_salt('bf')),
  current_timestamp,
  current_timestamp,
  current_timestamp,
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'admin@goeazy.com', 'System Admin', 'admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.properties (id, landlord_id, title, description, price, city, area, type, amenities, images, availability, views)
VALUES 
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Premium Studio near IT Hub', 'A beautifully furnished studio apartment perfect for working professionals.', 18000, 'Bangalore', 'Koramangala', 'Flat', '{wifi, ac, parking, security, cctv}', '{https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80}', true, 342),
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Cozy PG for Students', 'Fully furnished PG accommodation with home-cooked meals included.', 8500, 'Pune', 'Kothrud', 'PG', '{wifi, food, laundry, security}', '{https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80}', true, 218),
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Modern 1BHK in Bandra', 'Stylish 1BHK apartment with sea-facing balcony.', 35000, 'Mumbai', 'Bandra West', 'Flat', '{wifi, ac, gym, parking, security}', '{https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80}', true, 567),
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Boys Hostel near AIIMS', 'Clean and secure hostel for medical students.', 6000, 'Delhi', 'Ansari Nagar', 'Hostel', '{wifi, security, power, water}', '{https://images.unsplash.com/photo-1520166012956-add9ba0835cb?w=800&q=80}', true, 389),
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Spacious Room in Shared House', 'Bright, airy room in a shared 3BHK.', 12000, 'Hyderabad', 'Gachibowli', 'Room', '{wifi, ac, parking, security}', '{https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80}', true, 145);
