-- Migration: 20260717000200_roommate_finder.sql
-- Description: Drop NOT NULL constraint on property_id and add roommate columns to profiles.

-- 1. Drop NOT NULL constraint on property_id in public.conversations table
ALTER TABLE public.conversations ALTER COLUMN property_id DROP NOT NULL;

-- 2. Add roommate finder columns to public.profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_looking_for_roommate boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS roommate_profile jsonb DEFAULT null;

COMMENT ON COLUMN public.profiles.is_looking_for_roommate IS 'Whether the user is actively searching for roommate matches.';
COMMENT ON COLUMN public.profiles.roommate_profile IS 'Contains roommate preference details (sleeping_habits, smoking_drinking, food_preference, college_name, budget, gender, bio).';

-- 3. Update RLS policy for conversations insert to allow roommate-to-roommate chat
DROP POLICY IF EXISTS "Conversations insert policy" ON public.conversations;

CREATE POLICY "Conversations insert policy" ON public.conversations
  FOR INSERT WITH CHECK (
    -- Case A: Standard property unlock conversation (landlord/tenant with property_id)
    (
      property_id IS NOT NULL AND (
        (auth.uid() = tenant_id AND EXISTS (
          SELECT 1 FROM public.unlocked_properties up 
          WHERE up.user_id = auth.uid() AND up.property_id = property_id
        )) OR (auth.uid() = landlord_id)
      )
    )
    OR
    -- Case B: Roommate finder chat (property_id is null)
    (
      property_id IS NULL AND (
        auth.uid() = tenant_id OR auth.uid() = landlord_id
      )
    )
  );
