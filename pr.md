### Description
This PR addresses a critical security vulnerability where the service provider payment flow bypassed HMAC verification, allowing users to activate their listings without a valid payment by directly modifying the `payment_status` on the client.

### Changes Made
- Removed the `payServiceListing` function from `src/hooks/useServices.js` so clients can no longer update `payment_status` directly.
- Updated the Razorpay handler in `src/pages/ServiceProviderDashboard.jsx` to verify payments securely via the backend Edge Function (`verify-service-payment`).

### Testing
- [x] This is tested thoroughly.
- Verified that successful payments still update the status via the secure backend handler.
- Verified that attempting to manipulate the client state does not result in an unpaid listing becoming active.
