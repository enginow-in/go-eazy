-- Migration: 20260408030000_storage_garbage_collection.sql
-- Description: Automated storage garbage collection for orphaned images when a property is deleted.

-- 1. Create the Cleanup Function
-- This function intercepts the deleted row (OLD) and loops through its images array.
-- It extracts the precise object path and deletes it from storage.objects natively.
CREATE OR REPLACE FUNCTION clean_orphaned_property_images()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    img_url text;
    obj_name text;
BEGIN
    -- Only proceed if the property had images
    IF OLD.images IS NOT NULL AND array_length(OLD.images, 1) > 0 THEN
        FOREACH img_url IN ARRAY OLD.images
        LOOP
            -- Extract the exact storage object path from the public URL.
            -- Supabase public URLs end in: /object/public/property-images/[actual_object_path]
            -- We split the string using the bucket name to reliably extract the path.
            obj_name := split_part(img_url, '/property-images/', 2);
            
            IF obj_name <> '' THEN
                -- Deleting from storage.objects natively triggers Supabase's background worker 
                -- to physically wipe the file from the AWS S3 bucket.
                DELETE FROM storage.objects 
                WHERE bucket_id = 'property-images' AND name = obj_name;
            END IF;
        END LOOP;
    END IF;
    
    RETURN OLD;
END;
$$;

-- 2. Attach the Trigger to the properties table
-- We use AFTER DELETE to ensure the row actually gets deleted before we wipe the files.
DROP TRIGGER IF EXISTS trigger_clean_property_images ON public.properties;
CREATE TRIGGER trigger_clean_property_images
AFTER DELETE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION clean_orphaned_property_images();
