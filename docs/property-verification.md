# Property verification and trust scores

Property listings receive a deterministic trust score after creation and after material edits. The score is stored in `property_verifications` with a versioned set of checks and starts in `pending` status until an administrator reviews it.

## Checks

Version 1 evaluates required listing fields, images, landlord profile completeness, location fields, and duplicate-title risk. Scores are from 0–100. Re-running `calculate_property_trust_score(property_id)` is idempotent and resets the review to `pending` when listing data changes.

## Admin workflow

Administrators use the SystemAdmin Property Verification queue to inspect the score and checks, re-run scoring, then approve or reject the listing. Review actions are performed through `review_property_verification` and record the reviewer and timestamp.

## Security

The verification table has RLS enabled. Owners and administrators can inspect their permitted records, while public clients can only read approved verification rows. Scoring and review functions validate the authenticated user and run with a fixed `search_path`.

## Local setup and deployment

1. Apply the migration in `supabase/migrations/20260715140000_property_verification.sql`.
2. Verify the RLS policies and RPC permissions in the Supabase dashboard or CLI.
3. Create or update a property to generate its pending verification record.
4. Open `/systemadmin` as an admin to review the queue.

The UI remains backward-compatible: listings without a verification row continue to render without a trust badge.
