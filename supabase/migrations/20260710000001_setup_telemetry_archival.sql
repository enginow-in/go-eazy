-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the S3 cold storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('telemetry_cold_storage', 'telemetry_cold_storage', false)
ON CONFLICT (id) DO NOTHING;

-- Create a mock table for property_views if it doesn't exist, just so the Edge Function works out of the box
CREATE TABLE IF NOT EXISTS public.property_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    viewer_id UUID,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_views_viewed_at ON public.property_views(viewed_at);

-- Schedule the pg_cron job to ping the Edge Function every night at 2:00 AM IST (20:30 UTC)
-- Note: Replace the URL with the actual deployed Edge Function URL and Service Role Key
SELECT cron.schedule(
  'archive-telemetry-nightly',
  '30 20 * * *',
  $$
    SELECT net.http_post(
      url:='https://your-project-ref.supabase.co/functions/v1/archive-telemetry',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    ) as request_id;
  $$
);
