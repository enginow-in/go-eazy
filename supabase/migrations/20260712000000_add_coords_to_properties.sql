-- Add latitude, longitude, and map_address columns to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS map_address text;

-- Update seeded properties with mock coordinates
UPDATE public.properties SET latitude = 12.9352, longitude = 77.6244, map_address = 'Koramangala, Bangalore, Karnataka' WHERE title = 'Premium Studio near IT Hub';
UPDATE public.properties SET latitude = 18.5018, longitude = 73.8131, map_address = 'Kothrud, Pune, Maharashtra' WHERE title = 'Cozy PG for Students';
UPDATE public.properties SET latitude = 19.0600, longitude = 72.8311, map_address = 'Bandra West, Mumbai, Maharashtra' WHERE title = 'Modern 1BHK in Bandra';
UPDATE public.properties SET latitude = 28.5672, longitude = 77.2100, map_address = 'Ansari Nagar, Delhi' WHERE title = 'Boys Hostel near AIIMS';
UPDATE public.properties SET latitude = 17.4401, longitude = 78.3489, map_address = 'Gachibowli, Hyderabad, Telangana' WHERE title = 'Spacious Room in Shared House';
