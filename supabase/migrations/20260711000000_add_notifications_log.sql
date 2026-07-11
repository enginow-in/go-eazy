-- Create notifications_log table
CREATE TABLE public.notifications_log (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) on delete cascade,
  type text NOT NULL CHECK (type IN ('booking_confirmation', 'payment_success', 'visit_reminder')),
  status text NOT NULL CHECK (status IN ('sent', 'failed')),
  recipient_phone text,
  message_body text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notification logs" 
ON public.notifications_log FOR SELECT 
USING (auth.uid() = user_id);

-- Note: Insertions to this table will primarily be done by Edge Functions using the service role key, 
-- which bypasses RLS. If client insertion is needed, add an insert policy.

/*
=============================================================================
PG_CRON SETUP FOR VISIT REMINDERS
=============================================================================
Note: To trigger the 'visit-reminders' edge function, you need to enable the 
pg_net and pg_cron extensions in Supabase (Database -> Extensions).

Then, you can schedule the cron job by running the following SQL in the SQL Editor.
Replace <YOUR_PROJECT_REF> and <YOUR_ANON_KEY> with your actual project details.
Alternatively, you can configure an Edge Function Schedule directly from the 
Supabase Dashboard (Edge Functions -> visit-reminders -> Add Schedule).

-- Enable extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the job to run every 30 minutes
SELECT cron.schedule(
  'visit-reminders-job',
  '*/30 * * * *',
  $$
    SELECT net.http_post(
      url:='https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/visit-reminders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer <YOUR_ANON_KEY>"}'::jsonb,
      body:='{}'::jsonb
    ) AS request_id;
  $$
);
=============================================================================
*/
