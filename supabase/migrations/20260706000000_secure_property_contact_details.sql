-- Gate the paid contact details and exact location behind payment.
--
-- The "Public properties are viewable by everyone" policy uses USING (true),
-- and Postgres RLS is row level only, so contact_phone, contact_email and
-- exact_location were readable by anyone with the public anon key via a direct
-- PostgREST query. That bypassed the Rs 9 unlock paywall and leaked landlord
-- PII. This migration enforces the gating in the database.

-- 1. The RPC the client already calls but that was never defined.
--    SECURITY DEFINER so it can read the columns after we revoke direct access.
--    It only returns the sensitive fields when the caller owns the property or
--    has paid to unlock it (has a row in unlocked_properties).
create or replace function public.get_unlocked_property_details(prop_id uuid)
returns table (
  contact_phone text,
  contact_email text,
  exact_location text
)
language sql
security definer
set search_path = public
as $$
  select p.contact_phone, p.contact_email, p.exact_location
  from public.properties p
  where p.id = prop_id
    and (
      auth.uid() = p.landlord_id
      or exists (
        select 1
        from public.unlocked_properties u
        where u.property_id = prop_id
          and u.user_id = auth.uid()
      )
    );
$$;

grant execute on function public.get_unlocked_property_details(uuid) to anon, authenticated;

-- 2. Stop the sensitive columns leaking through direct table reads. Column
--    level REVOKE is needed because RLS cannot restrict individual columns.
--    The SECURITY DEFINER function above and the service role are unaffected,
--    so the unlock flow and the edge functions keep working.
revoke select (contact_phone, contact_email, exact_location)
  on public.properties
  from anon, authenticated;
