-- ── AUTOMATED TIMESTAMP MAINTENANCE TRIGGER ──

-- Create a reusable function to handle updated_at timestamps automatically
CREATE OR REPLACE FUNCTION public.handle_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger to the premium_listings table
CREATE TRIGGER set_premium_listings_timestamp
    BEFORE UPDATE ON public.premium_listings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_update_timestamp();


-- ── HIGH-PERFORMANCE SEARCH AND RELATIONAL INDEXES ──

-- Index for User Lookups (Speeds up loading the Landlord/User Dashboard)
CREATE INDEX IF NOT EXISTS idx_premium_listings_user_id 
ON public.premium_listings(user_id);

-- Index for Order Tracking (Optimizes webhook execution lookups from Razorpay)
CREATE INDEX IF NOT EXISTS idx_premium_listings_razorpay_order_id 
ON public.premium_listings(razorpay_order_id);

-- Composite Index for Status & Date (Speeds up filtering histories by status timeline)
CREATE INDEX IF NOT EXISTS idx_premium_listings_status_created 
ON public.premium_listings(status, created_at DESC);
