import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// ── TIMING-SAFE HMAC VERIFICATION ─────────────────────────────────────────────
async function verifyWebhookSignature(body: string, secret: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const computed = Array.from(new Uint8Array(mac))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Timing-safe comparison
  if (computed.length !== signature.length) return false
  const a = new TextEncoder().encode(computed)
  const b = new TextEncoder().encode(signature)
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
serve(async (req) => {
  // Razorpay webhooks are always POST — reject everything else
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // 1. Verify Razorpay signature FIRST — before parsing body
    const signature = req.headers.get('x-razorpay-signature')
    if (!signature) {
      console.error('Webhook: missing x-razorpay-signature header')
      return new Response('Unauthorized', { status: 401 })
    }

    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
    if (!webhookSecret) {
      console.error('Webhook: RAZORPAY_WEBHOOK_SECRET not configured')
      return new Response('Server misconfiguration', { status: 500 })
    }

    const bodyText = await req.text()
    if (!bodyText) {
      return new Response('Empty body', { status: 400 })
    }

    const isValid = await verifyWebhookSignature(bodyText, webhookSecret, signature)
    if (!isValid) {
      console.error('Webhook: Invalid HMAC signature — possible spoofed request')
      return new Response('Invalid Signature', { status: 403 })
    }

    // 2. Parse verified payload
    let payload: any
    try {
      payload = JSON.parse(bodyText)
    } catch {
      return new Response('Invalid JSON payload', { status: 400 })
    }

    const event = payload.event
    console.log(`Webhook received event: ${event}`)

    // 3. Only handle successful payment events
    if (event !== 'order.paid' && event !== 'payment.captured') {
      // Acknowledge other events without doing anything
      return new Response('OK', { status: 200 })
    }

    // 4. Extract and validate payment details from the webhook payload
    const paymentEntity = payload?.payload?.payment?.entity
    const orderEntity   = payload?.payload?.order?.entity

    const notes     = paymentEntity?.notes || orderEntity?.notes || {}
    const userId    = notes?.user_id
    const propertyId = notes?.property_id

    // 5. Validate UUIDs from notes — reject garbage/forged data
    if (!userId || !UUID_REGEX.test(userId)) {
      console.error('Webhook: invalid or missing user_id in notes:', userId)
      return new Response('OK', { status: 200 }) // Still return 200 so Razorpay stops retrying
    }

    if (!propertyId || !UUID_REGEX.test(propertyId)) {
      console.error('Webhook: invalid or missing property_id in notes:', propertyId)
      return new Response('OK', { status: 200 })
    }

    // 6. Verify payment amount and currency (prevent tampered webhooks)
    if (event === 'payment.captured') {
      const amount   = paymentEntity?.amount
      const currency = paymentEntity?.currency
      const status   = paymentEntity?.status

      if (amount !== 900) {
        console.error(`Webhook: unexpected amount ${amount}, expected 900`)
        return new Response('OK', { status: 200 })
      }

      if (currency !== 'INR') {
        console.error(`Webhook: unexpected currency ${currency}`)
        return new Response('OK', { status: 200 })
      }

      if (status !== 'captured') {
        console.error(`Webhook: payment not captured, status: ${status}`)
        return new Response('OK', { status: 200 })
      }
    }

    // 7. All checks passed — record the unlock in database
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    )

    const { error } = await supabaseAdmin
      .from('unlocked_properties')
      .upsert(
        { user_id: userId, property_id: propertyId, created_at: new Date().toISOString() },
        { onConflict: 'user_id,property_id' }
      )

    if (error) {
      console.error('Webhook: DB upsert failed:', error)
      return new Response('Database Error', { status: 500 })
    }

    console.log(`Webhook: Successfully unlocked property ${propertyId} for user ${userId}`)
    return new Response('OK', { status: 200 })

  } catch (error: any) {
    console.error('Webhook: Unexpected error:', error.message || error)
    return new Response('Internal Server Error', { status: 500 })
  }
})
