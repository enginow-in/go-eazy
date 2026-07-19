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
    const body = await req.json()
    const { property_id } = body

    // Bug Fix 1: Formulated a flexible and secure UUID checker pattern to avoid false matching blocks
    const generalUuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
    if (!property_id || typeof property_id !== 'string' || !generalUuidPattern.test(property_id)) {
      console.error('Validation failure - Improper identifier template structure received')
      return new Response(JSON.stringify({ error: 'Invalid property ID format' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // 2. Authenticate user session safely
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Internal server configuration missing parameters' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

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

    // 3. Verify payment configurations
    const key_id = Deno.env.get('RAZORPAY_KEY_ID')
    const key_secret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!key_id || !key_secret) {
      return new Response(JSON.stringify({ error: 'Payment service not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { 
      auth: { persistSession: false } 
    })

    // 5. Check if the property resource is already unlocked
    const { data: existingUnlock, error: fetchError } = await supabaseAdmin
      .from('unlocked_properties')
      .select('id')
      .eq('user_id', user.id)
      .eq('property_id', property_id)
      .maybeSingle()

    if (fetchError) {
      console.error('Database validation query failure:', fetchError)
      return new Response(JSON.stringify({ error: 'Failed to verify lock status' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    if (existingUnlock) {
      return new Response(JSON.stringify({ error: 'ALREADY_UNLOCKED' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 409,
      })
    }

    // 6. Enforce dynamic rate limits bounds
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentOrders } = await supabaseAdmin
      .from('payment_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo)

    if ((recentOrders || 0) >= 5) {
      return new Response(JSON.stringify({ error: 'Too many payment attempts. Please try again later.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429,
      })
    }

    // 7. Track current attempt instance parameters
    const { error: insertError } = await supabaseAdmin
      .from('payment_attempts')
      .insert({ user_id: user.id, property_id })
      
    if (insertError) {
      console.warn('Unable to register tracking logs identifier:', insertError.message)
    }

    // 8. Dispatch Razorpay system transaction order
    const auth = btoa(`${key_id}:${key_secret}`)
    const resp = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        amount: 900, // Explicit platform standard ₹9.00 fee parameter logic locked
        currency: 'INR',
        receipt: `rcpt_${property_id.substring(0, 8)}_${Date.now()}`,
        notes: {
          property_id,
          user_id: user.id
        }
      })
    })

    if (!resp.ok) {
      const errorText = await resp.text()
      console.error('Razorpay service connection drop tracking error:', resp.status, errorText)
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
    // Bug Fix 2: Shield exception string extraction routines from object mapping drops
    const processedMessage = error instanceof Error ? error.message : String(error)
    console.error('Server exception handling triggered:', processedMessage)
    return new Response(JSON.stringify({ error: `Internal Server Error: ${processedMessage}` }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})