import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const ALLOWED_ORIGINS = ['https://goeazy.in', 'https://www.goeazy.in', 'https://goeazy.vercel.app', 'https://goeazy.app', 'https://www.goeazy.app']

const corsHeaders = (req: Request) => {
  const origin = req.headers.get('origin') || ''
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) || origin.startsWith('http://localhost:') ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

const respond = (body: Record<string, unknown>, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } })

serve(async (req: Request) => {
  const headers = corsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'POST') return respond({ error: 'Method not allowed' }, 405, headers)

  try {
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return respond({ error: 'Authentication required' }, 401, headers)

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !authData.user) return respond({ error: 'Authentication failed' }, 401, headers)

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) return respond({ error: 'AI service is not configured' }, 503, headers)

    const body = await req.json()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const city = typeof body.city === 'string' ? body.city.trim() : ''
    const area = typeof body.area === 'string' ? body.area.trim() : ''
    const type = typeof body.type === 'string' ? body.type.trim() : ''
    const price = Number(body.price)
    const amenities = Array.isArray(body.amenities) ? body.amenities.filter((item: unknown) => typeof item === 'string').slice(0, 20) : []
    const nearbyLandmarks = typeof body.nearby_landmarks === 'string' ? body.nearby_landmarks.trim().slice(0, 500) : ''

    if (!title || title.length > 200 || !city || city.length > 100 || !area || area.length > 150 || !type || !Number.isFinite(price) || price <= 0) {
      return respond({ error: 'Please provide valid property details' }, 400, headers)
    }

    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 300,
        messages: [
          { role: 'system', content: 'Write a concise, appealing rental property description in 80-150 words. Use only the supplied facts. Never invent amenities, measurements, views, availability, contact details, or guarantees. Avoid discriminatory language and do not mention that AI was used.' },
          { role: 'user', content: JSON.stringify({ title, city, area, type, monthly_rent: price, amenities, nearby_landmarks: nearbyLandmarks }) },
        ],
      }),
    })

    if (!openAiResponse.ok) {
      console.error('OpenAI request failed with status', openAiResponse.status)
      return respond({ error: 'Description generation failed' }, 502, headers)
    }
    const result = await openAiResponse.json()
    const description = result.choices?.[0]?.message?.content?.trim()
    if (!description) return respond({ error: 'Description generation failed' }, 502, headers)
    return respond({ description }, 200, headers)
  } catch (error) {
    console.error('generate-property-description failed:', error)
    return respond({ error: 'Description generation failed' }, 500, headers)
  }
})
