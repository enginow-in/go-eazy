-- SEED DATA FOR PROPERTIES
-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fetch the landlord id dynamically by email
-- This requires registering 'admin@goeazy.com' as a landlord in the app UI first.
DO $$
DECLARE
    landlord_uuid uuid;
BEGIN
    SELECT id INTO landlord_uuid FROM public.profiles WHERE email = 'admin@goeazy.com';
    
    IF landlord_uuid IS NULL THEN
        RAISE EXCEPTION 'Landlord profile for admin@goeazy.com not found. Please sign up this user as a Landlord in the application first, then run this seed query.';
    END IF;

    INSERT INTO public.properties (id, landlord_id, title, description, price, city, area, type, amenities, images, availability, views)
    VALUES 
    (uuid_generate_v4(), landlord_uuid, 'Premium Studio near IT Hub', 'A beautifully furnished studio apartment perfect for working professionals.', 18000, 'Bangalore', 'Koramangala', 'Flat', '{wifi, ac, parking, security, cctv}', '{https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80}', true, 342),
    (uuid_generate_v4(), landlord_uuid, 'Cozy PG for Students', 'Fully furnished PG accommodation with home-cooked meals included.', 8500, 'Pune', 'Kothrud', 'PG', '{wifi, food, laundry, security}', '{https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80}', true, 218),
    (uuid_generate_v4(), landlord_uuid, 'Modern 1BHK in Bandra', 'Stylish 1BHK apartment with sea-facing balcony.', 35000, 'Mumbai', 'Bandra West', 'Flat', '{wifi, ac, gym, parking, security}', '{https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80}', true, 567),
    (uuid_generate_v4(), landlord_uuid, 'Boys Hostel near AIIMS', 'Clean and secure hostel for medical students.', 6000, 'Delhi', 'Ansari Nagar', 'Hostel', '{wifi, security, power, water}', '{https://images.unsplash.com/photo-1520166012956-add9ba0835cb?w=800&q=80}', true, 389),
    (uuid_generate_v4(), landlord_uuid, 'Spacious Room in Shared House', 'Bright, airy room in a shared 3BHK.', 12000, 'Hyderabad', 'Gachibowli', 'Room', '{wifi, ac, parking, security}', '{https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80}', true, 145);
END $$;
