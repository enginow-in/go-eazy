-- Add verification columns to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS verification_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'flagged', 'rejected'));

-- Update the profiles role constraint to allow 'admin' role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'landlord', 'service_provider', 'admin'));

-- Add RLS policies for Admins on the properties table
-- This allows admins to update the verification_status manually
DROP POLICY IF EXISTS "Admins can update properties" ON public.properties;
CREATE POLICY "Admins can update properties" ON public.properties
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Create the trigger function
CREATE OR REPLACE FUNCTION calculate_property_verification()
RETURNS TRIGGER AS $$
DECLARE
  score INTEGER := 0;
  v_status TEXT := 'pending';
  desc_length INTEGER := 0;
  upper_count INTEGER := 0;
  images_count INTEGER := 0;
BEGIN
  -- Check if an admin is manually overriding the verification status/score.
  -- Only skip recalculation if the user is an admin AND the content fields haven't changed.
  -- If a landlord tries to tamper with the status without changing content, we fall through and recalculate.
  IF TG_OP = 'UPDATE' THEN
    IF EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ) AND 
       NEW.description IS NOT DISTINCT FROM OLD.description AND 
       NEW.images IS NOT DISTINCT FROM OLD.images AND
       NEW.nearby_landmarks IS NOT DISTINCT FROM OLD.nearby_landmarks AND
       NEW.pincode IS NOT DISTINCT FROM OLD.pincode AND
       NEW.price IS NOT DISTINCT FROM OLD.price AND
       NEW.area IS NOT DISTINCT FROM OLD.area AND
       NEW.title IS NOT DISTINCT FROM OLD.title THEN
      -- Admin override detected, trust their explicit status/score values
      RETURN NEW;
    END IF;
  END IF;

  -- Description logic
  IF NEW.description IS NOT NULL THEN
    desc_length := length(NEW.description);
    
    -- Length points
    IF desc_length > 250 THEN
      score := score + 30;
    ELSIF desc_length > 100 THEN
      score := score + 20;
    END IF;

    -- Good keywords (spacious, furnished, natural light, security)
    IF NEW.description ILIKE '%spacious%' OR 
       NEW.description ILIKE '%furnished%' OR 
       NEW.description ILIKE '%natural light%' OR 
       NEW.description ILIKE '%security%' THEN
      score := score + 10;
    END IF;
    
    -- Spam words penalty
    IF NEW.description ~* 'click here|cheap|100% real|http://|https://' THEN
      score := score - 30;
    END IF;
    
    -- Suspicious phone number regex check (basic)
    IF NEW.description ~* '\d{10}' THEN
      score := score - 10;
    END IF;

    -- ALL CAPS penalty
    upper_count := length(regexp_replace(NEW.description, '[^A-Z]', '', 'g'));
    IF desc_length > 0 AND (upper_count::float / desc_length::float) > 0.3 THEN
      score := score - 20;
    END IF;
  END IF;

  -- Media completeness
  IF NEW.images IS NOT NULL THEN
    images_count := array_length(NEW.images, 1);
    IF images_count IS NOT NULL THEN
      score := score + LEAST(images_count * 10, 40);
    END IF;
  END IF;
  
  -- Metadata completeness
  IF NEW.nearby_landmarks IS NOT NULL AND length(NEW.nearby_landmarks) > 0 THEN
    score := score + 5;
  END IF;
  IF NEW.pincode IS NOT NULL AND length(NEW.pincode) > 0 THEN
    score := score + 5;
  END IF;
  
  -- Ensure score is clamped between 0 and 100
  score := GREATEST(0, LEAST(score, 100));
  
  -- Determine automated status
  IF score >= 70 THEN
    v_status := 'verified';
  ELSIF score < 40 THEN
    v_status := 'flagged';
  ELSE
    v_status := 'pending';
  END IF;
  
  -- Apply score and status to the record
  NEW.verification_score := score;
  NEW.verification_status := v_status;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind the trigger to the properties table
DROP TRIGGER IF EXISTS property_verification_trigger ON public.properties;
CREATE TRIGGER property_verification_trigger
BEFORE INSERT OR UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION calculate_property_verification();
