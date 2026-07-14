import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const ALLOWED_ORIGINS = [
  'https://goeazy.in', 'https://www.goeazy.in',
  'https://goeazy.vercel.app', 'https://goeazy.app', 'https://www.goeazy.app',
]

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || ''
  const isLocalhost = origin.startsWith('http://localhost:')
  const allowed = (ALLOWED_ORIGINS.includes(origin) || isLocalhost) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  const encoder = new TextEncoder()
  const aBytes = encoder.encode(a)
  const bBytes = encoder.encode(b)
  let diff = 0
  for (let i = 0; i < aBytes.length; i++) { diff |= aBytes[i] ^ bBytes[i] }
  return diff === 0
}

async function verifySignature(orderId: string, paymentId: string, signature: string, secret: string): Promise<boolean> {
  const text = `${orderId}|${paymentId}`
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(text))
  const hashHex = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  return timingSafeEqual(hashHex, signature)
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, property_data } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !property_data) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
      })
    }

    // 1. Authenticate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401,
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!

    // Use service role key to validate ES256 JWTs
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    )

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !authData?.user) {
      console.error('Auth failed:', authError?.message)
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401,
      })
    }

    const user = authData.user

    // 2. Verify HMAC signature (timing-safe)
    const secret = Deno.env.get('RAZORPAY_KEY_SECRET')!
    const isValid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, secret)
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid payment signature' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403,
      })
    }

    // 3. Cross-validate with Razorpay API — ensure amount is exactly ₹199
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')!
    const auth = btoa(`${keyId}:${secret}`)
    const payResp = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
      headers: { Authorization: `Basic ${auth}` }
    })

    if (!payResp.ok) {
      return new Response(JSON.stringify({ error: 'Could not validate payment with Razorpay' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502,
      })
    }

    const payment = await payResp.json()
    if (payment.order_id !== razorpay_order_id) {
      return new Response(JSON.stringify({ error: 'Order ID mismatch' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403,
      })
    }
    // Only allow 'authorized' in test mode. On live keys require a captured
    // payment, otherwise a merely-authorized (uncaptured, still voidable)
    // payment would be enough to create a listing.
    const isLiveMode = keyId.startsWith('rzp_live_')
    const acceptedStatuses = isLiveMode ? ['captured'] : ['captured', 'authorized']
    if (!acceptedStatuses.includes(payment.status)) {
      return new Response(JSON.stringify({ error: `Payment not completed: ${payment.status}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403,
      })
    }
    if (payment.currency !== 'INR') {
      return new Response(JSON.stringify({ error: 'Invalid currency' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403,
      })
    }
    if (payment.amount !== 19900) {
      return new Response(JSON.stringify({ error: 'Amount tampered' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403,
      })
    }

    // 4. All checks pass — create the property. Stamp the payment id (after the
    // spread so the client can't override it) so the unique index rejects any
    // replay of the same payment.
    const { data: property, error: insertError } = await supabaseAdmin
      .from('properties')
      .insert({
        ...property_data,
        landlord_id: user.id,
        razorpay_payment_id,
      })
      .select()
      .single()

    if (insertError) {
      // 23505 = unique_violation → this payment already created a listing
      if (insertError.code === '23505') {
        return new Response(JSON.stringify({ error: 'This payment has already been used to create a listing' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409,
        })
      }
      console.error('Failed to insert property:', insertError)
      return new Response(JSON.stringify({ error: 'Failed to create listing: ' + insertError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
      })
    }

    return new Response(JSON.stringify({ success: true, property }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    })

  } catch (error: any) {
    console.error('Unexpected error in verify-listing-payment:', error.message)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 500,
    })
  }
})
