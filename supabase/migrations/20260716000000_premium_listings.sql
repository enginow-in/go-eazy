-- Create premium listings table to track active promotions
CREATE TABLE IF NOT EXISTS public.premium_listings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    razorpay_order_id TEXT UNIQUE NOT NULL,
    razorpay_payment_id TEXT,
    amount_paid NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'failed')),
    starts_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.premium_listings ENABLE ROW LEVEL SECURITY;

-- Policies for premium listings
CREATE POLICY "Landlords can view their own premium listing history" 
    ON public.premium_listings FOR SELECT 
    USING (auth.uid() = landlord_id);

-- Add premium_status field to profiles if not already present
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS premium_status BOOLEAN DEFAULT false;
