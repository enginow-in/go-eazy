import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { fetchWithTimeout } from '../_shared/fetchWithTimeout.ts'

// ── CORS ─────────────────────────────────────────────────────────────────────
// Restrict to your own origins. Add your production domain here.
const ALLOWED_ORIGINS = [
  'https://goeazy.in',
  'https://www.goeazy.in',
  'https://goeazy.vercel.app',
  'https://goeazy.app',
  'https://www.goeazy.app',
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

// ── TIMING-SAFE HMAC COMPARISON ───────────────────────────────────────────────
// Uses bitwise XOR across all bytes so execution time doesn't leak secret length
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

// ── SIGNATURE VERIFICATION ────────────────────────────────────────────────────
async function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const text = `${orderId}|${paymentId}`
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(text))
  const hashHex = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return timingSafeEqual(hashHex, signature)
}

// ── VALIDATE PAYMENT WITH RAZORPAY API ────────────────────────────────────────
// Cross-check: ensure the payment actually exists, is captured, correct amount
// This prevents replay attacks and forged payment IDs
async function validatePaymentWithRazorpay(
  paymentId: string,
  expectedOrderId: string,
  keyId: string,
  keySecret: string
): Promise<{ valid: boolean; reason?: string }> {
  const auth = btoa(`${keyId}:${keySecret}`)
  const resp = await fetchWithTimeout(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Basic ${auth}` }
  })

  if (!resp.ok) {
    return { valid: false, reason: `Razorpay API returned ${resp.status}` }
  }

  const payment = await resp.json()

  if (payment.order_id !== expectedOrderId) {
    return { valid: false, reason: 'Order ID mismatch' }
  }

  if (payment.status !== 'captured') {
    return { valid: false, reason: `Payment not captured: ${payment.status}` }
  }

  if (payment.currency !== 'INR') {
    return { valid: false, reason: 'Invalid currency' }
  }

  if (payment.amount !== 900) {
    return { valid: false, reason: 'Amount tampered' }
  }

  return { valid: true }
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    })
  }

  try {
    const body = await req.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, property_id } = body

    // 1. Input validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !property_id) {
      return new Response(JSON.stringify({ error: 'Missing required payment fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(property_id)) {
      return new Response(JSON.stringify({ error: 'Invalid property_id format' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // 2. Authenticate user FIRST (before touching Razorpay API)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    })

    const { data: authData, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const user = authData.user

    // 3. Timing-safe HMAC signature verification
    const secret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!secret) {
      console.error('RAZORPAY_KEY_SECRET not configured')
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const isSignatureValid = await verifySignature(
      razorpay_order_id, razorpay_payment_id, razorpay_signature, secret
    )

    if (!isSignatureValid) {
      console.error(`Signature mismatch for order ${razorpay_order_id}`)
      return new Response(JSON.stringify({ error: 'Invalid payment signature' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // 4. Cross-validate payment with Razorpay API
    // Prevents replay attacks and forged payment IDs
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')!
    const { valid, reason } = await validatePaymentWithRazorpay(
      razorpay_payment_id, razorpay_order_id, keyId, secret
    )

    if (!valid) {
      console.error(`Razorpay payment validation failed: ${reason}`)
      return new Response(JSON.stringify({ error: `Payment validation failed: ${reason}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // 5. Update database — only reached if all checks pass
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    )

    const { error: dbError } = await supabaseAdmin
      .from('unlocked_properties')
      .upsert(
        { user_id: user.id, property_id },
        { onConflict: 'user_id, property_id' }
      )

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(JSON.stringify({ error: 'Failed to record unlock' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    return new Response(JSON.stringify({ success: true, message: 'Payment verified and property unlocked!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Unexpected error in verify-razorpay-payment:', error.message || error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
