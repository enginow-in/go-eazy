import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// timingSafeEqual to avoid timing attacks on signatures
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  const encoder = new TextEncoder()
  const aBytes = encoder.encode(a)
  const bBytes = encoder.encode(b)
  let diff = 0
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i]
  }
  return diff === 0
}

async function verifySignature(body: string, secret: string, signature: string): Promise<boolean> {
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

  return timingSafeEqual(computed, signature)
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    const signature = req.headers.get('x-razorpay-signature')
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')

    if (!signature || !webhookSecret) {
      return new Response(JSON.stringify({ error: 'Missing security configuration' }), { status: 400 })
    }

    const rawBody = await req.text()
    const isValid = await verifySignature(rawBody, webhookSecret, signature)

    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Signature match failure' }), { status: 401 })
    }

    const eventData = JSON.parse(rawBody)
    const event = eventData.event

    // Match either standard captured payments or generalized paid orders
    if (event === 'payment.captured' || event === 'order.paid') {
      const payload = eventData.payload?.payment?.entity || eventData.payload?.order?.entity
      if (!payload) throw new Error('Malformed Razorpay payload structure')

      const orderId = payload.order_id
      const paymentId = payload.id
      const notes = payload.notes || {}

      // Identify if this transaction belongs to a premium promotion flow
      if (notes.purpose === 'premium_promotion' || notes.property_id) {
        const landlordId = notes.landlord_id || notes.user_id
        const propertyId = notes.property_id
        const propertyTitle = notes.property_title || 'Your Property'

        const startDate = new Date()
        const expiryDate = new Date()
        expiryDate.setDate(startDate.getDate() + 30) // Premium period: 30 Days

        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          { auth: { persistSession: false } }
        )

        // 1. Activate premium listing row tracking
        if (propertyId && orderId) {
          const { error: promoError } = await supabaseAdmin
            .from('premium_listings')
            .update({
              status: 'active',
              razorpay_payment_id: paymentId,
              starts_at: startDate.toISOString(),
              expires_at: expiryDate.toISOString(),
              updated_at: startDate.toISOString()
            })
            .eq('razorpay_order_id', orderId)

          if (promoError) console.error('Database pre-log activation failure:', promoError.message)
        }

        // 2. Elevate user profile flag status
        if (landlordId) {
          await supabaseAdmin
            .from('profiles')
            .update({ 
              premium_status: true, 
              updated_at: startDate.toISOString() 
            })
            .eq('id', landlordId)

          // 3. Insert real-time notification
          await supabaseAdmin
            .from('notifications')
            .insert({
              user_id: landlordId,
              message: `Payment Verified! Your listing "${propertyTitle}" has successfully been promoted to Premium for 30 days!`
            })
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err: any) {
    console.error('Unexpected error processing webhook:', err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
