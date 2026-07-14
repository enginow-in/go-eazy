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

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 })
  }

  try {
    const { service_id } = await req.json()
    const authHeader = req.headers.get('Authorization')
    if (!service_id || !authHeader) {
      return new Response(JSON.stringify({ error: !authHeader ? 'Unauthorized' : 'Missing service_id' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: !authHeader ? 401 : 400 })
    }

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !authData?.user) {
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
      return new Response(JSON.stringify({ error: 'Service listing is already paid' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 })
    }

    const keyId = Deno.env.get('RAZORPAY_KEY_ID')
    const secret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!keyId || !secret) {
      return new Response(JSON.stringify({ error: 'Payment service not configured' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${btoa(`${keyId}:${secret}`)}` },
      body: JSON.stringify({
        amount: 19900,
        currency: 'INR',
        receipt: `service_${service_id.substring(0, 8)}_${Date.now()}`,
        notes: { user_id: authData.user.id, service_id, purpose: 'service_listing' },
      }),
    })
    if (!response.ok) {
      console.error('Razorpay Order API error:', response.status, await response.text())
      return new Response(JSON.stringify({ error: 'Failed to create payment order' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 })
    }

    return new Response(JSON.stringify(await response.json()), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error: any) {
    console.error('Unexpected error in create-service-listing-order:', error.message)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 500 })
  }
})
