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

function normalizeDocumentPath(value: string): string | null {
  const marker = '/storage/v1/object/public/service-documents/'
  const markerIndex = value.indexOf(marker)
  const path = markerIndex >= 0 ? value.slice(markerIndex + marker.length).split('?')[0] : value
  if (!path || path.includes('..') || path.startsWith('/')) return null

  try {
    return decodeURIComponent(path)
  } catch {
    return null
  }
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 })
  }

  try {
    const { service_id, document_path } = await req.json()
    if (!service_id || !document_path || typeof document_path !== 'string') {
      return new Response(JSON.stringify({ error: 'A service_id and document_path are required' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
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

    const { data: service, error: serviceError } = await supabaseAdmin
      .from('service_providers')
      .select('documents')
      .eq('id', service_id)
      .single()
    if (serviceError || !service) {
      return new Response(JSON.stringify({ error: 'Service listing not found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 })
    }

    const requestedPath = normalizeDocumentPath(document_path)
    const allowedPaths = (service.documents || []).map(normalizeDocumentPath).filter(Boolean)
    if (!requestedPath || !allowedPaths.includes(requestedPath)) {
      return new Response(JSON.stringify({ error: 'Document does not belong to this service listing' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
    }

    const { data: signedUrl, error: signedUrlError } = await supabaseAdmin.storage
      .from('service-documents')
      .createSignedUrl(requestedPath, 300)
    if (signedUrlError || !signedUrl?.signedUrl) {
      console.error('Failed to create signed document URL:', signedUrlError)
      return new Response(JSON.stringify({ error: 'Failed to access document' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }

    return new Response(JSON.stringify({ signed_url: signedUrl.signedUrl, document_path: requestedPath }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error: any) {
    console.error('Unexpected error in admin-get-service-document:', error.message)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 500 })
  }
})
