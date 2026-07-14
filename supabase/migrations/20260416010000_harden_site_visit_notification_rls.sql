-- Tighten the INSERT policies added in 20260415000000_site_visits.sql.
--
-- Two holes:
--   1. site_visits only checked auth.uid() = user_id, so a user could send a
--      visit request with any landlord_id (not the property's real owner) and
--      spam arbitrary landlords with fake requests.
--   2. notifications used WITH CHECK (true), so any authenticated user could
--      insert a notification for any user with any message (spam / phishing).
--
-- Both legitimate client flows still pass:
--   * Booking a visit always sends the property's real landlord_id
--     (PropertyDetail.jsx).
--   * The only client that inserts a notification is a landlord responding to a
--     visit request (LandlordDashboard.jsx), where a matching site_visit already
--     exists. Edge functions use the service role and bypass RLS regardless.

-- 1. A visit's landlord_id must be the actual owner of the property.
DROP POLICY IF EXISTS "Users can create their own visits" ON public.site_visits;
CREATE POLICY "Users can create their own visits" ON public.site_visits
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND landlord_id = (SELECT landlord_id FROM public.properties WHERE id = property_id)
  );

-- 2. A user may only notify someone they have a real site-visit relationship
--    with (i.e. the landlord replying to that user's visit request).
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Users can notify their site-visit counterparties" ON public.notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.site_visits sv
      WHERE sv.user_id = notifications.user_id
        AND sv.landlord_id = auth.uid()
    )
  );
