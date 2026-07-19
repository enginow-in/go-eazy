-- Video Verified Listings: one moderated walkthrough video per property.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS video_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS video_reviewer_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS video_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS video_reviewer_notes text;

ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_video_status_check;
ALTER TABLE public.properties ADD CONSTRAINT properties_video_status_check
  CHECK (video_status IN ('none', 'pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_properties_video_status ON public.properties(video_status);

-- Videos are public media only after the listing is approved in application/RLS queries.
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-videos', 'property-videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Landlords can upload property videos" ON storage.objects;
CREATE POLICY "Landlords can upload property videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Landlords can update property videos" ON storage.objects;
CREATE POLICY "Landlords can update property videos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'property-videos' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'property-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Landlords can delete property videos" ON storage.objects;
CREATE POLICY "Landlords can delete property videos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'property-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE OR REPLACE FUNCTION public.guard_property_video_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.video_url IS NOT NULL THEN
    NEW.video_status := 'pending';
  ELSIF TG_OP = 'UPDATE' AND NEW.video_url IS DISTINCT FROM OLD.video_url THEN
    NEW.video_status := CASE WHEN NEW.video_url IS NULL THEN 'none' ELSE 'pending' END;
    NEW.video_reviewer_id := NULL;
    NEW.video_reviewed_at := NULL;
    NEW.video_reviewer_notes := NULL;
  END IF;

  IF TG_OP = 'UPDATE' AND (
    NEW.video_status IS DISTINCT FROM OLD.video_status OR
    NEW.video_reviewer_id IS DISTINCT FROM OLD.video_reviewer_id OR
    NEW.video_reviewed_at IS DISTINCT FROM OLD.video_reviewed_at OR
    NEW.video_reviewer_notes IS DISTINCT FROM OLD.video_reviewer_notes
  ) AND auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can review property videos';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS property_video_review_guard ON public.properties;
CREATE TRIGGER property_video_review_guard
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.guard_property_video_review();

DROP POLICY IF EXISTS "Admins can review property videos" ON public.properties;
CREATE POLICY "Admins can review property videos" ON public.properties
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
