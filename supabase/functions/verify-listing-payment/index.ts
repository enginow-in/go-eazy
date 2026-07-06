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

// ── [FIX #2] PROPERTY DATA ALLOWLIST & VALIDATION ────────────────────────────
// Only these columns may be set by the client. Any other key in property_data
// (e.g. views, landlord_id, created_at, or any future sensitive column such as
// is_verified / status / moderation_state) is silently dropped.
//
// Without this allowlist, `...property_data` spreads the entire client-supplied
// object into the INSERT, so a client can write any column that exists today or
// is added in the future without this endpoint needing to change — that's the
// "landmine for future columns" risk.
const ALLOWED_PROPERTY_FIELDS = [
  'title', 'description', 'price', 'city', 'area', 'pincode',
  'type', 'amenities', 'images', 'availability', 'nearby_landmarks',
] as const

const VALID_PROPERTY_TYPES = ['Room', 'Flat', 'Hostel', 'PG'] as const

type AllowedField = typeof ALLOWED_PROPERTY_FIELDS[number]

interface ValidationResult {
  ok: boolean
  error?: string
  data?: Record<string, unknown>
}

function sanitizeAndValidatePropertyData(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'property_data must be an object' }
  }

  const input = raw as Record<string, unknown>

  // Strip to allowlist — anything not in ALLOWED_PROPERTY_FIELDS is silently dropped
  const safe: Record<string, unknown> = {}
  for (const field of ALLOWED_PROPERTY_FIELDS) {
    if (field in input) safe[field] = input[field]
  }

  // Required field presence
  const required: AllowedField[] = ['title', 'price', 'city', 'area', 'type']
  for (const field of required) {
    if (safe[field] === undefined || safe[field] === null || safe[field] === '') {
      return { ok: false, error: `${field} is required` }
    }
  }

  // title: non-empty string, max 200 chars
  if (typeof safe.title !== 'string' || safe.title.trim().length === 0) {
    return { ok: false, error: 'title must be a non-empty string' }
  }
  if (safe.title.length > 200) {
    return { ok: false, error: 'title must be 200 characters or fewer' }
  }

  // price: positive finite number
  const price = Number(safe.price)
  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false, error: 'price must be a positive number' }
  }
  safe.price = price

  // city / area: non-empty strings
  if (typeof safe.city !== 'string' || safe.city.trim().length === 0) {
    return { ok: false, error: 'city must be a non-empty string' }
  }
  if (typeof safe.area !== 'string' || safe.area.trim().length === 0) {
    return { ok: false, error: 'area must be a non-empty string' }
  }

  // type: must be one of the valid enum values
  if (!VALID_PROPERTY_TYPES.includes(safe.type as typeof VALID_PROPERTY_TYPES[number])) {
    return { ok: false, error: `type must be one of: ${VALID_PROPERTY_TYPES.join(', ')}` }
  }

  // images: must be an array (client-supplied URLs; storage origin validated by Supabase Storage RLS)
  if (safe.images !== undefined) {
    if (!Array.isArray(safe.images)) {
      return { ok: false, error: 'images must be an array' }
    }
    if (safe.images.length < 1 || safe.images.length > 3) {
      return { ok: false, error: 'images must contain between 1 and 3 items' }
    }
    if (!safe.images.every((img: unknown) => typeof img === 'string' && img.startsWith('https://'))) {
      return { ok: false, error: 'each image must be a valid HTTPS URL' }
    }
  }

  // amenities: must be an array of strings if provided
  if (safe.amenities !== undefined) {
    if (!Array.isArray(safe.amenities) || !safe.amenities.every((a: unknown) => typeof a === 'string')) {
      return { ok: false, error: 'amenities must be an array of strings' }
    }
  }

  // availability: must be boolean if provided
  if (safe.availability !== undefined && typeof safe.availability !== 'boolean') {
    return { ok: false, error: 'availability must be a boolean' }
  }

  return { ok: true, data: safe }
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405,
    })
  }

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

    // 2. [FIX #2] Sanitize and validate property_data BEFORE touching Razorpay
    // Allowlist strips any column the client should not control; type checks
    // catch bad inputs early so we never waste a Razorpay round-trip.
    const validation = sanitizeAndValidatePropertyData(property_data)
    if (!validation.ok) {
      return new Response(JSON.stringify({ error: validation.error }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
      })
    }
    const safePropertyData = validation.data!

    // 3. Verify HMAC signature (timing-safe)
    const secret = Deno.env.get('RAZORPAY_KEY_SECRET')!
    const isValid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, secret)
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid payment signature' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403,
      })
    }

    // 4. Cross-validate with Razorpay API — ensure payment is real and exactly ₹199
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
    // In test mode, status is 'authorized'; in live mode, it's 'captured'
    if (!['captured', 'authorized'].includes(payment.status)) {
      return new Response(JSON.stringify({ error: `Payment not completed: ${payment.status}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403,
      })
    }
    if (payment.amount !== 19900) {
      return new Response(JSON.stringify({ error: 'Amount tampered' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403,
      })
    }

    // 5. [FIX #1] Atomically claim the payment_id before any DB write.
    //
    // Attack being blocked:
    //   A valid (order_id, payment_id, signature) triple can be replayed N
    //   times with different property_data bodies. Each call passes the HMAC
    //   and Razorpay checks (they confirm the payment is real, not that it's
    //   unused), so without this guard N free listings would be created.
    //
    // How the fix works:
    //   INSERT into used_listing_payments with payment_id as PRIMARY KEY.
    //   If the payment_id was already claimed, the DB raises unique_violation
    //   (code 23505) and we return 409 — no property is created.
    //   The INSERT and the subsequent property INSERT are sequential; if the
    //   property INSERT fails, we delete the claim so the user can retry.
    const { error: claimError } = await supabaseAdmin
      .from('used_listing_payments')
      .insert({ payment_id: razorpay_payment_id, user_id: user.id })

    if (claimError) {
      // 23505 = unique_violation — payment_id already in the ledger
      if (claimError.code === '23505') {
        console.warn(`[SECURITY] Replay attempt: payment_id "${razorpay_payment_id}" already consumed by user "${user.id}"`)
        return new Response(JSON.stringify({ error: 'Payment already used' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409,
        })
      }
      // Unexpected DB error — surface it rather than silently proceeding
      console.error('Failed to claim payment_id:', claimError)
      return new Response(JSON.stringify({ error: 'Failed to process payment claim' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
      })
    }

    // 6. All checks pass — create the property using the allowlisted data only.
    // landlord_id is always set from the authenticated JWT, never from the client.
    const { data: property, error: insertError } = await supabaseAdmin
      .from('properties')
      .insert({
        ...safePropertyData,   // [FIX #2] allowlisted + validated fields only
        landlord_id: user.id,  // always server-authoritative
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to insert property:', insertError)

      // Roll back the payment claim so the user can retry with the same payment
      // rather than losing ₹199. This is safe: the payment is real but the
      // listing creation failed for a transient reason (DB error, schema change).
      const { error: rollbackError } = await supabaseAdmin
        .from('used_listing_payments')
        .delete()
        .eq('payment_id', razorpay_payment_id)
      if (rollbackError) {
        // Log but don't block — worst case: user contacts support with payment_id
        console.error('Could not roll back payment claim:', rollbackError)
      }

      return new Response(JSON.stringify({ error: 'Failed to create listing: ' + insertError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
      })
    }

    // 7. Update the claim row to record which property was created
    // (audit trail — non-critical, best-effort)
    await supabaseAdmin
      .from('used_listing_payments')
      .update({ property_id: property.id })
      .eq('payment_id', razorpay_payment_id)

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
