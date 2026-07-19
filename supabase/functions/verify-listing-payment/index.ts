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

    // 1. Authenticate user session
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401,
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Internal setup configuration parameters error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, { 
      auth: { persistSession: false } 
    })

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

    // 3. Cross-validate with Razorpay API
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

    if (!['captured', 'authorized'].includes(payment.status)) {
      return new Response(JSON.stringify({ error: `Payment not completed: ${payment.status}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403,
      })
    }

    // Bug Fix 1: Aligned target integer verification mapping parameters to match standard ₹9 value (900 paise)
    if (payment.amount !== 900) {
      return new Response(JSON.stringify({ error: 'Amount verification parameter tampered' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403,
      })
    }

    // 4. Create the property listing entry
    const { data: property, error: insertError } = await supabaseAdmin
      .from('properties')
      .insert({
        ...property_data,
        landlord_id: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to insert property:', insertError)
      return new Response(JSON.stringify({ error: 'Failed to create listing: ' + insertError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
      })
    }

    return new Response(JSON.stringify({ success: true, property }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    })

  } catch (error: any) {
    // Bug Fix 2: Shielded error extraction structures against object parameter leakage issues
    const handledMessage = error instanceof Error ? error.message : String(error)
    console.error('Unexpected error in verify-listing-payment:', handledMessage)
    return new Response(JSON.stringify({ error: `Internal Server Error: ${handledMessage}` }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 500,
    })
  }
})