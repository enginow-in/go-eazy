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
    const { service_id, status } = await req.json()
    if (!service_id || !['verified', 'rejected'].includes(status)) {
      return new Response(JSON.stringify({ error: 'A service_id and valid status are required' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 })
    }

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: 'Authentication failed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 })
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single()
    if (profileError || profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Administrator access required' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
    }

    const { data: service, error: updateError } = await supabaseAdmin
      .from('service_providers')
      .update({ verification_status: status })
      .eq('id', service_id)
      .select('id, verification_status')
      .maybeSingle()
    if (updateError) {
      console.error('Failed to update service verification:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to update service verification' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }
    if (!service) {
      return new Response(JSON.stringify({ error: 'Service listing not found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 })
    }

    return new Response(JSON.stringify({ success: true, service }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error: any) {
    console.error('Unexpected error in admin-approve-service:', error.message)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 500 })
  }
})
