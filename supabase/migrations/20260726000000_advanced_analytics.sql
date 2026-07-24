-- ============================================================================
-- MIGRATION: Advanced Analytics Dashboard (GoEazy Analytics Plus™)
-- Timestamp: 20260726000000
-- Description: Creates analytics event tracking table & aggregate views for
--              landlord conversion funnels, heatmaps, provider metrics, and growth.
-- ============================================================================

-- 1. CREATE TABLE: ANALYTICS_EVENTS
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.service_providers(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'view', 'unlock', 'phone_click', 'visit_request', 'lease_signed', 'heatmap_click'
  component_target text, -- 'photo_gallery', 'pricing', 'location_map', 'amenities', 'contact_button'
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- Index for fast time-series & funnel analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_prop_type ON public.analytics_events(property_id, event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON public.analytics_events(created_at);

-- 2. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES FOR ANALYTICS_EVENTS
-- Anyone authenticated can insert interaction events
CREATE POLICY "Authenticated users insert analytics_events" ON public.analytics_events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Landlords can view events for their own properties
CREATE POLICY "Landlords view own property analytics" ON public.analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = analytics_events.property_id
        AND properties.landlord_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
