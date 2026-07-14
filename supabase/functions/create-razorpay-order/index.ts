import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { fetchWithTimeout } from '../_shared/fetchWithTimeout.ts'

// ── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://goeazy.in',
  'https://www.goeazy.in',
  'https://goeazy.vercel.app',
  'https://goeazy.app',
  'https://www.goeazy.app',
]

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || ''
  
  // Allow any localhost port during development
  const isLocalhost = origin.startsWith('http://localhost:')
  const allowed = (ALLOWED_ORIGINS.includes(origin) || isLocalhost) ? origin : ALLOWED_ORIGINS[0]
  
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
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
    const { property_id } = body

    // 1. Validate property_id is a proper UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!property_id || !uuidRegex.test(property_id)) {
      console.error('Invalid Property ID:', property_id)
      return new Response(JSON.stringify({ error: 'Invalid property ID format' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // 2. Authenticate user
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

    // 3. Check secrets are properly configured
    const key_id = Deno.env.get('RAZORPAY_KEY_ID')
    const key_secret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!key_id || !key_secret) {
      console.error('Razorpay secrets not configured in Edge Function env')
      return new Response(JSON.stringify({ error: 'Payment service not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // 4. Use admin client for trusted DB operations
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    )

    // 5. Prevent double charge: check if already unlocked
    const { data: existingUnlock, error: fetchError } = await supabaseAdmin
      .from('unlocked_properties')
      .select('id')
      .eq('user_id', user.id)
      .eq('property_id', property_id)
      .maybeSingle()

    if (fetchError) {
      console.error('DB fetch error:', fetchError)
      return new Response(JSON.stringify({ error: 'Failed to verify lock status' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    if (existingUnlock) {
      // Return a clear signal so frontend can handle gracefully
      return new Response(JSON.stringify({ error: 'ALREADY_UNLOCKED' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 409, // Conflict — resource already exists
      })
    }

    // 6. Rate limiting: max 5 order creation attempts per user per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentOrders } = await supabaseAdmin
      .from('payment_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo)

    if ((recentOrders || 0) >= 5) {
      console.warn(`Rate limit hit for user ${user.id}`)
      return new Response(JSON.stringify({ error: 'Too many payment attempts. Please try again later.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429,
      })
    }

    // 7. Log this attempt (for rate limiting)
    const { error: insertError } = await supabaseAdmin
      .from('payment_attempts')
      .insert({ user_id: user.id, property_id })
      
    if (insertError) {
      console.warn('Could not log payment attempt:', insertError.message)
    }

    // 8. Create Razorpay Order
    const auth = btoa(`${key_id}:${key_secret}`)
    const resp = await fetchWithTimeout('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        amount: 900,           // ₹9.00 in paise — hardcoded, never from client
        currency: 'INR',       // Always INR, never from client
        receipt: `rcpt_${property_id.substring(0, 8)}_${Date.now()}`,
        notes: {
          property_id,
          user_id: user.id     // Embedded for webhook fallback
        }
      })
    })

    if (!resp.ok) {
      const errorText = await resp.text()
      console.error('Razorpay Order API error:', resp.status, errorText)
      return new Response(JSON.stringify({ error: 'Failed to create payment order' }), {
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
    console.error('Unexpected error in create-razorpay-order:', error.message || error)
    return new Response(JSON.stringify({ error: `Internal Server Error: ${error.message || JSON.stringify(error)}` }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
