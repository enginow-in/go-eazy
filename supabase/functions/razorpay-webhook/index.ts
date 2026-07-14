// Setup type definitions for built-in Supabase Runtime APIs
import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Redis } from "https://esm.sh/@upstash/redis"
import * as crypto from "https://deno.land/std@0.177.0/node/crypto.ts"

// 1. Initialize Upstash Redis for our Dead Letter Queue (DLQ)
// We use env variables to connect to Redis
const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_REST_URL') || 'https://mock-redis.upstash.io',
  token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || 'mock-token',
})

// 2. Secret to verify Razorpay Webhook Signature
const razorpaySecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || 'test_secret'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // Parse the payload and signature
  const signature = req.headers.get('X-Razorpay-Signature')
  if (!signature) {
    return new Response('Missing Signature', { status: 400 })
  }

  const rawBody = await req.text()
  
  // Verify Webhook Signature (Security)
  const expectedSignature = crypto
    .createHmac('sha256', razorpaySecret)
    .update(rawBody)
    .digest('hex')

  if (expectedSignature !== signature) {
    return new Response('Invalid Signature', { status: 400 })
  }

  const payload = JSON.parse(rawBody)

  // Ensure it's a payment captured event
  if (payload.event !== 'payment.captured') {
    return new Response('Event ignored', { status: 200 })
  }

  const payment = payload.payload.payment.entity
  const orderId = payment.order_id
  const paymentId = payment.id

  // We assume the property_id was passed in notes during order creation
  const propertyId = payment.notes?.property_id

  if (!orderId || !propertyId) {
    return new Response('Invalid payload structure', { status: 400 })
  }

  try {
    // 3. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // 4. Idempotency & Race Condition Prevention using Postgres RPC
    // To do a `SELECT ... FOR UPDATE` row-level lock from an Edge Function securely,
    // it's best to call a Postgres Stored Procedure (RPC) that handles the transaction.
    // However, we can also simulate the idempotency here by relying on the UNIQUE constraint
    // of the razorpay_events table.
    
    // Attempt to insert the event. If the order_id already exists (handled by client or duplicate webhook),
    // this will throw a constraint violation error, making it completely Idempotent.
    const { error: insertError } = await supabaseAdmin
      .from('razorpay_events')
      .insert({
        order_id: orderId,
        payment_id: paymentId,
        event_type: payload.event,
        property_id: propertyId,
        payload: payload,
        status: 'PROCESSED'
      })

    if (insertError) {
      // If it's a duplicate key error (23505), it means we already processed this. Idempotency achieved!
      if (insertError.code === '23505') {
        console.log(`[Idempotency] Order ${orderId} already processed. Skipping.`)
        return new Response('Already processed', { status: 200 })
      }
      throw insertError;
    }

    // 5. Flip the property status to active
    const { error: updateError } = await supabaseAdmin
      .from('properties')
      .update({ status: 'active', razorpay_order_id: orderId })
      .eq('id', propertyId)

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, message: 'Property activated successfully' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Webhook Processing Failed. Routing to Dead Letter Queue (DLQ)...', error)

    // 6. Dead Letter Queue (DLQ) Fallback
    // If Supabase Postgres is down or timed out, the transaction fails.
    // We push the critical webhook payload to Upstash Redis.
    // A secondary Cron Job can pull from this DLQ and retry activating the property.
    try {
      await redis.lpush('razorpay_dlq', JSON.stringify({
        timestamp: new Date().toISOString(),
        order_id: orderId,
        property_id: propertyId,
        payload: payload,
        error: error.message
      }))
      
      console.log(`Pushed order ${orderId} to DLQ.`)
    } catch (redisError) {
      console.error('CRITICAL: DLQ Push Failed!', redisError)
      // Even if Redis fails, we should alert the infrastructure team, but return 500 to Razorpay 
      // so Razorpay's own internal retry mechanism kicks in.
    }

    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500, // Returning 5xx tells Razorpay to retry the webhook later
    })
  }
})
