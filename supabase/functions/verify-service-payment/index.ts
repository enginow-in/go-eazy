import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const ALLOWED_ORIGINS = [
  'https://goeazy.in',
  'https://www.goeazy.in',
  'https://goeazy.vercel.app',
  'https://goeazy.app',
  'https://www.goeazy.app',
]

const SERVICE_LISTING_AMOUNT = Number(Deno.env.get('SERVICE_LISTING_AMOUNT_PAISE') || '19900')

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
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i]
  }
  return diff === 0
}

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

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, service_id } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !service_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
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

    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    )

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !authData?.user) {
      console.error('Auth failed:', authError?.message)
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const user = authData.user

    // Verify service provider belongs to the user
    const { data: provider, error: fetchError } = await supabaseAdmin
      .from('service_providers')
      .select('id, provider_id')
      .eq('id', service_id)
      .single()

    if (fetchError || !provider) {
      return new Response(JSON.stringify({ error: 'Service provider listing not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    if (provider.provider_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized operation on this listing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // 2. Verify HMAC signature (timing-safe)
    const secret = Deno.env.get('RAZORPAY_KEY_SECRET')!
    const isValid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, secret)
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid payment signature' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // 3. Cross-validate with Razorpay API — ensure amount is exactly ₹199 (19900 paise)
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')!
    const auth = btoa(`${keyId}:${secret}`)
    const payResp = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
      headers: { Authorization: `Basic ${auth}` }
    })

    if (!payResp.ok) {
      return new Response(JSON.stringify({ error: 'Could not validate payment with Razorpay' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 502,
      })
    }

    const payment = await payResp.json()
    if (payment.order_id !== razorpay_order_id) {
      return new Response(JSON.stringify({ error: 'Order ID mismatch' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // In test mode, status is 'authorized'; in live mode, it's 'captured'
    if (!['captured', 'authorized'].includes(payment.status)) {
      return new Response(JSON.stringify({ error: `Payment not completed: ${payment.status}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }
    if (payment.amount !== SERVICE_LISTING_AMOUNT) {
      return new Response(JSON.stringify({ error: 'Amount tampered' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // 4. Update the service provider listing using admin client (idempotent write)
    const { error: updateError } = await supabaseAdmin
      .from('service_providers')
      .update({
        payment_status: 'paid',
        razorpay_payment_id
      })
      .eq('id', service_id)
      .is('razorpay_payment_id', null)

    if (updateError) {
      console.error('Failed to update service provider status:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to update payment status' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Unexpected error in verify-service-payment:', error.message)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
