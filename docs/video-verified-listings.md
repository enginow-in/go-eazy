# Video Verified Listings

Property owners may attach one 30–60 second walkthrough video (MP4, WebM, or MOV, up to 100 MB) from the final step of the property form. Uploads are stored in the `property-videos` Supabase Storage bucket and automatically enter `pending` review.

## Review lifecycle

An uploaded or replaced video is always reset to `pending` by the database trigger. Admins review videos from **System Admin → Video Verification** and can approve, reject, or request a re-check. Only rows with `video_status = 'approved'` are rendered on public property cards and detail pages; reviewer notes are never shown publicly.

## Deployment

1. Apply `20260719120000_add_property_video_verification.sql` with Supabase migrations.
2. Confirm the `property-videos` bucket exists and is public for playback, while its insert/update/delete policies restrict paths to the authenticated landlord's user-id folder.
3. Deploy the web app after the migration. Existing properties remain unchanged and continue to render without a badge.

The migration adds review metadata, an index for moderation queues, storage policies, and a trigger that prevents clients from self-approving videos. Admin review authorization is checked against `profiles.role = 'admin'`.
