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
    // 1. Extract parameters from payload
    const { propertyId, title } = await req.json()
    if (!propertyId) {
      return new Response(JSON.stringify({ error: 'Missing required propertyId parameter' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // 2. Authenticate user via ES256 JWT
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

    // 3. Verify property ownership before creating payment ledger entry
    const { data: property, error: propError } = await supabaseAdmin
      .from('properties')
      .select('id, user_id')
      .eq('id', propertyId)
      .single()

    if (propError || !property) {
      return new Response(JSON.stringify({ error: 'Property record not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    if (property.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden: You do not own this listing record' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // 4. Check Razorpay credentials configuration status
    const key_id = Deno.env.get('RAZORPAY_KEY_ID')
    const key_secret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!key_id || !key_secret) {
      return new Response(JSON.stringify({ error: 'Payment service not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // 5. Create Razorpay Order for ₹500
    // CRITICAL: Amount is strictly configured server-side for security purposes
    const auth = btoa(`${key_id}:${key_secret}`)
    const resp = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        amount: 50000,        // ₹500.00 in paise (server-side immutable fallback context)
        currency: 'INR',
        receipt: `listing_${propertyId.substring(0, 8)}_${Date.now()}`,
        notes: {
          user_id: user.id,
          property_id: propertyId,
          property_title: title || 'Premium Upgrade',
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

    // Map order.id directly to orderId format expected by File 14
    return new Response(JSON.stringify({ orderId: order.id }), {
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
