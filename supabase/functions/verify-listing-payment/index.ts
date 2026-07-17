import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { HmacSha256 } from "https://deno.land/std@0.160.0/crypto/sha256.ts"

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
    // 1. Authenticate user via JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
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
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // 2. Parse Razorpay Payment Proof Tokens
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Missing payment signature components' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // 3. Cryptographically Verify Signature locally
    const key_secret = Deno.env.get('RAZORPAY_KEY_SECRET')!
    const secretMessage = `${razorpay_order_id}|${razorpay_payment_id}`
    
    const hmac = new HmacSha256(key_secret)
    hmac.update(secretMessage)
    const generatedSignature = hmac.toString()

    if (generatedSignature !== razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Security alert: Fake transaction signature detected' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // 4. Fetch the Order Meta details directly from Razorpay to safely resolve the property ID
    const key_id = Deno.env.get('RAZORPAY_KEY_ID')!
    const auth = btoa(`${key_id}:${key_secret}`)
    const orderResp = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
      headers: { 'Authorization': `Basic ${auth}` }
    })
    
    if (!orderResp.ok) {
      throw new Error('Failed to verify metadata against gateway authority')
    }
    const orderData = await orderResp.json()
    const targetPropertyId = orderData.notes?.property_id

    if (!targetPropertyId) {
      throw new Error('Property mapping parameters missing from checkout metadata context')
    }

    // 5. Update Database: Flag listing as Premium
    // Adjust target table metadata flags depending on your exact schema layout requirements
    const { error: dbUpdateError } = await supabaseAdmin
      .from('properties')
      .update({ 
        is_premium: true,
        premium_activated_at: new Date().toISOString()
      })
      .eq('id', targetPropertyId)

    if (dbUpdateError) {
      console.error('Database promotion update error:', dbUpdateError)
      throw new Error('Payment cleared but database failed to update listing profile status')
    }

    return new Response(JSON.stringify({ success: true, message: 'Listing elevated to premium status successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Verification runtime failure:', error.message || error)
    return new Response(JSON.stringify({ error: error.message || 'Internal Verification Exception' }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
