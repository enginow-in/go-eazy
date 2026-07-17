import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const ALLOWED_ORIGINS = ['https://goeazy.in', 'https://www.goeazy.in', 'https://goeazy.vercel.app', 'https://goeazy.app', 'https://www.goeazy.app']
const cors = (req: Request) => {
  const origin = req.headers.get('origin') || ''
  return { 'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) || origin.startsWith('http://localhost:') ? origin : ALLOWED_ORIGINS[0], 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
}
const response = (body: Record<string, unknown>, status: number, headers: Record<string, string>) => new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } })

async function validSignature(orderId: string, paymentId: string, signature: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${orderId}|${paymentId}`))
  const expected = Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('')
  return expected.length === signature.length && expected === signature
}

serve(async (req: Request) => {
  const headers = cors(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'POST') return response({ error: 'Method not allowed' }, 405, headers)

  try {
    const body = await req.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, service_id } = body
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !service_id) return response({ error: 'Missing required fields' }, 400, headers)

    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return response({ error: 'Unauthorized' }, 401, headers)
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !authData.user) return response({ error: 'Authentication failed' }, 401, headers)

    const { data: service, error: serviceError } = await supabaseAdmin.from('service_providers').select('id').eq('id', service_id).eq('provider_id', authData.user.id).maybeSingle()
    if (serviceError || !service) return response({ error: 'Service listing not found' }, 404, headers)

    const secret = Deno.env.get('RAZORPAY_KEY_SECRET')
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')
    if (!secret || !keyId || !(await validSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, secret))) return response({ error: 'Invalid payment signature' }, 403, headers)

    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, { headers: { Authorization: `Basic ${btoa(`${keyId}:${secret}`)}` } })
    if (!paymentResponse.ok) return response({ error: 'Could not validate payment with Razorpay' }, 502, headers)
    const payment = await paymentResponse.json()
    if (payment.order_id !== razorpay_order_id || !['captured', 'authorized'].includes(payment.status) || payment.amount !== 19900) return response({ error: 'Payment validation failed' }, 403, headers)

    const { error: updateError } = await supabaseAdmin.from('service_providers').update({ payment_status: 'paid' }).eq('id', service_id)
    if (updateError) throw updateError
    return response({ success: true }, 200, headers)
  } catch (error) {
    console.error('verify-service-payment failed:', error)
    return response({ error: 'Internal server error' }, 500, headers)
  }
})
