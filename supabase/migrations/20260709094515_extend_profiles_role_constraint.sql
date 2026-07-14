-- ============================================================
-- Extend profiles.role constraint to support administrator role
-- ============================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name = 'role'
    ) THEN

        ALTER TABLE public.profiles
        DROP CONSTRAINT IF EXISTS profiles_role_check;

        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_role_check
        CHECK (
            role IN (
                'user',
                'landlord',
                'service_provider',
                'admin'
            )
        );

    END IF;
END $$;