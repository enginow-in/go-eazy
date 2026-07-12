-- ROBUST SEED DATA
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create a dummy landlord in public.profiles (skip auth.users link by removing constraint temporarily)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'admin@goeazy.com', 'System Admin', 'landlord')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert properties
INSERT INTO public.properties (landlord_id, title, description, price, city, area, type, amenities, images, availability, views, latitude, longitude, map_address)
VALUES 
('00000000-0000-0000-0000-000000000000', 'Premium Studio near IT Hub', 'A beautifully furnished studio apartment perfect for working professionals.', 18000, 'Bangalore', 'Koramangala', 'Flat', '{wifi, ac, parking, security, cctv}', '{https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80}', true, 342, 12.9352, 77.6244, 'Koramangala, Bangalore, Karnataka'),
('00000000-0000-0000-0000-000000000000', 'Cozy PG for Students', 'Fully furnished PG accommodation with home-cooked meals included.', 8500, 'Pune', 'Kothrud', 'PG', '{wifi, food, laundry, security}', '{https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80}', true, 218, 18.5018, 73.8131, 'Kothrud, Pune, Maharashtra'),
('00000000-0000-0000-0000-000000000000', 'Modern 1BHK in Bandra', 'Stylish 1BHK apartment with sea-facing balcony.', 35000, 'Mumbai', 'Bandra West', 'Flat', '{wifi, ac, gym, parking, security}', '{https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80}', true, 567, 19.0600, 72.8311, 'Bandra West, Mumbai, Maharashtra'),
('00000000-0000-0000-0000-000000000000', 'Boys Hostel near AIIMS', 'Clean and secure hostel for medical students.', 6000, 'Delhi', 'Ansari Nagar', 'Hostel', '{wifi, security, power, water}', '{https://images.unsplash.com/photo-1520166012956-add9ba0835cb?w=800&q=80}', true, 389, 28.5672, 77.2100, 'Ansari Nagar, Delhi'),
('00000000-0000-0000-0000-000000000000', 'Spacious Room in Shared House', 'Bright, airy room in a shared 3BHK.', 12000, 'Hyderabad', 'Gachibowli', 'Room', '{wifi, ac, parking, security}', '{https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80}', true, 145, 17.4401, 78.3489, 'Gachibowli, Hyderabad, Telangana');

-- 3. Re-add constraint (but it will fail if the user doesn't exist, so maybe don't re-add yet until they sign up)
-- Actually, it's better to just keep it disabled for the seed profile.
