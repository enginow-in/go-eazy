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

    // Parse body parameters
    let service_id = null
    let purpose = 'property_listing'
    try {
      const body = await req.json()
      if (body.purpose) purpose = body.purpose
      if (body.service_id) service_id = body.service_id
    } catch {
      // ignore json parsing errors for backwards compatibility
    }

    if (purpose === 'service_listing') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!service_id || !uuidRegex.test(service_id)) {
        return new Response(JSON.stringify({ error: 'Invalid service_id format' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }
    }

    const notes: Record<string, string> = {
      user_id: user.id,
      purpose
    }
    if (service_id) {
      notes.service_id = service_id
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
        notes
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
