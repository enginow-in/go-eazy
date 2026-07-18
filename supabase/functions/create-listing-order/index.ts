import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

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

// ── Rate limiting (in-memory sliding window) ──────────────────────────────────
// Note: This is per-edge-instance (not globally shared) and is intended to
// immediately throttle abusive traffic without extra infra/dependencies.
const rateLimiterState: Map<string, number[]> = new Map()

function getClientKey(req: Request, userId?: string) {
  if (userId) return `user:${userId}`
  const xff = req.headers.get('x-forwarded-for') || ''
  const cf = req.headers.get('cf-connecting-ip') || ''
  const raw = cf || xff.split(',')[0]?.trim() || ''
  return `ip:${raw || 'unknown'}`
}

function isRateLimited(key: string, windowMs: number, maxRequests: number) {
  const now = Date.now()
  const arr = rateLimiterState.get(key) || []
  // keep only timestamps within window
  const cutoff = now - windowMs
  while (arr.length && arr[0] < cutoff) arr.shift()
  if (arr.length >= maxRequests) {
    rateLimiterState.set(key, arr)
    return { limited: true, remaining: 0, resetAt: cutoff + windowMs }
  }
  arr.push(now)
  rateLimiterState.set(key, arr)
  // simple cap for memory safety
  if (rateLimiterState.size > 5000) {
    // evict oldest keys
    let evicted = 0
    for (const [k] of rateLimiterState) {
      rateLimiterState.delete(k)
      evicted++
      if (evicted >= 500) break
    }
  }
  return { limited: false, remaining: maxRequests - arr.length, resetAt: cutoff + windowMs }
}

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
    // 0. Rate-limit at the very start of the POST handler.
    // Use per-user if Authorization exists, otherwise fall back to client IP.
    const authHeaderAtStart = req.headers.get('Authorization')
    const hasBearer = !!authHeaderAtStart?.startsWith('Bearer ')

    // We do not parse JWT claims here (keeps this fast); use IP for
    // unauthenticated requests and a shared key for authenticated ones.
    const key = hasBearer ? 'user:authenticated' : getClientKey(req)

    const windowMs = 60 * 1000 // 1 minute window
    const maxRequests = 30
    const rl = isRateLimited(key, windowMs, maxRequests)
    if (rl.limited) {
      return new Response(JSON.stringify({ error: 'Too Many Requests' }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
        status: 429,
      })
    }

    // 1. Authenticate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!

    // Use service role key to validate user JWT (works with ES256 tokens)
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    )

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !authData?.user) {
      console.error('Auth failed:', authError?.message)
      return new Response(JSON.stringify({ error: 'Authentication failed', detail: authError?.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const user = authData.user

    // 2. Check secrets
    const key_id = Deno.env.get('RAZORPAY_KEY_ID')
    const key_secret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!key_id || !key_secret) {
      return new Response(JSON.stringify({ error: 'Payment service not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // 3. Create Razorpay Order for ₹199
    const auth = btoa(`${key_id}:${key_secret}`)
    const resp = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        amount: 19900,        // ₹199.00 in paise — hardcoded server-side
        currency: 'INR',
        receipt: `listing_${user.id.substring(0, 8)}_${Date.now()}`,
        notes: {
          user_id: user.id,
          purpose: 'property_listing'
        }
      })
    })

    if (!resp.ok) {
      const errorText = await resp.text()
      console.error('Razorpay Order API error:', resp.status, errorText)
      return new Response(JSON.stringify({ error: 'Failed to create payment order', detail: errorText, status: resp.status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 502,
      })
    }

    const order = await resp.json()

    return new Response(JSON.stringify(order), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Unexpected error in create-listing-order:', error.message || error)
    return new Response(JSON.stringify({ error: `Internal Server Error: ${error.message}` }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
