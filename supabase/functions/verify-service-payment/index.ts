import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const ALLOWED_ORIGINS = [
  'https://goeazy.in', 'https://www.goeazy.in',
  'https://goeazy.vercel.app', 'https://goeazy.app', 'https://www.goeazy.app',
]

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || ''
  const allowed = (ALLOWED_ORIGINS.includes(origin) || origin.startsWith('http://localhost:')) ? origin : ALLOWED_ORIGINS[0]
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
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i]
  return diff === 0
}

async function verifySignature(orderId: string, paymentId: string, signature: string, secret: string) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(`${orderId}|${paymentId}`))
  const hashHex = Array.from(new Uint8Array(signatureBuffer)).map(byte => byte.toString(16).padStart(2, '0')).join('')
  return timingSafeEqual(hashHex, signature)
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 })
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, service_id } = await req.json()
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !service_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 })
    }

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !authData?.user) {
      console.error('Auth failed:', authError?.message)
      return new Response(JSON.stringify({ error: 'Authentication failed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 })
    }

    const { data: listing, error: listingError } = await supabaseAdmin
      .from('service_providers')
      .select('id, provider_id, payment_status')
      .eq('id', service_id)
      .single()
    if (listingError || !listing) {
      return new Response(JSON.stringify({ error: 'Service listing not found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 })
    }
    if (listing.provider_id !== authData.user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
    }
    if (listing.payment_status === 'paid') {
      return new Response(JSON.stringify({ success: true, already_paid: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    const secret = Deno.env.get('RAZORPAY_KEY_SECRET')
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')
    if (!secret || !keyId) {
      console.error('Razorpay credentials are not configured')
      return new Response(JSON.stringify({ error: 'Payment service not configured' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }
    if (!await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, secret)) {
      return new Response(JSON.stringify({ error: 'Invalid payment signature' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
    }

    const payResp = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
      headers: { Authorization: `Basic ${btoa(`${keyId}:${secret}`)}` },
    })
    if (!payResp.ok) {
      return new Response(JSON.stringify({ error: 'Could not validate payment with Razorpay' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 })
    }

    const payment = await payResp.json()
    if (
      payment.order_id !== razorpay_order_id
      || !['captured', 'authorized'].includes(payment.status)
      || payment.amount !== 19900
      || payment.notes?.purpose !== 'service_listing'
      || payment.notes?.service_id !== service_id
      || payment.notes?.user_id !== authData.user.id
    ) {
      return new Response(JSON.stringify({ error: 'Payment validation failed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
    }

    const { error: consumeError } = await supabaseAdmin
      .from('consumed_payments')
      .insert({ razorpay_payment_id, user_id: authData.user.id, purpose: 'service_listing' })
    if (consumeError) {
      if (consumeError.code === '23505') {
        return new Response(JSON.stringify({ error: 'This payment has already been used' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 })
      }
      console.error('Failed to consume payment:', consumeError)
      return new Response(JSON.stringify({ error: 'Failed to consume payment' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }

    const { error: updateError } = await supabaseAdmin.from('service_providers').update({ payment_status: 'paid' }).eq('id', service_id)
    if (updateError) {
      console.error('Failed to update payment status:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to update payment status' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error: any) {
    console.error('Unexpected error in verify-service-payment:', error.message)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 500 })
  }
})
