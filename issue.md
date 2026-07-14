### Description
The service provider payment flow currently allows direct client-side updates to bypass HMAC signature verification. This allows an attacker to update the payment status without actually making a payment, bypassing the Razorpay gateway completely.

### Steps to Reproduce
1. Log in as a service provider.
2. Initiate a payment for service listing.
3. Intercept the client-side request and manually update the `payment_status` in Supabase using the client-side token or direct function call.
4. The service listing is activated without valid payment verification on the backend.

### Expected Behavior
The payment verification should happen on the backend via a secure serverless function that checks the Razorpay HMAC signature before updating the payment status in the database. Client-side direct updates to the payment status should be restricted via Row Level Security (RLS) or by removing the update method on the frontend.
