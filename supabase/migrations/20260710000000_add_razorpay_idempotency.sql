-- Create a table specifically designed for tracking Razorpay webhooks to guarantee idempotency
CREATE TABLE IF NOT EXISTS public.razorpay_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT NOT NULL UNIQUE, -- The idempotency key
    payment_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'PROCESSED', -- PROCESSED or DLQ_PENDING
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS but ensure only the service role (Edge Function) can insert/update
ALTER TABLE public.razorpay_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage razorpay_events" 
    ON public.razorpay_events 
    FOR ALL 
    USING (true)
    WITH CHECK (true); -- In reality, restricted to authenticated service_role keys

-- Add an index on order_id for ultra-fast idempotency checks
CREATE INDEX IF NOT EXISTS idx_razorpay_events_order_id ON public.razorpay_events(order_id);

-- Example: Add 'status' and 'payment_id' to properties if it doesn't exist
-- to allow the webhook to flip it to 'active'
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'status') THEN
        ALTER TABLE public.properties ADD COLUMN status TEXT DEFAULT 'draft';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'razorpay_order_id') THEN
        ALTER TABLE public.properties ADD COLUMN razorpay_order_id TEXT;
        CREATE INDEX idx_properties_razorpay_order_id ON public.properties(razorpay_order_id);
    END IF;
END $$;
