import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// ── CORS ──────────────────────────────────────────────────────────────────────
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

// ── HANDLER ───────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405,
    })
  }

  try {
    const body = await req.json()
    const { email, action, success } = body

    // action = 'check'  → check if login is allowed for this email
    // action = 'record' → record the outcome of a login attempt

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'email is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
      })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Service role client — bypasses RLS to read/write login_attempts
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    )

    // Extract client IP and user-agent for logging
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('cf-connecting-ip')
      || req.headers.get('x-real-ip')
      || null
    const userAgent = req.headers.get('user-agent') || null

    // ── ACTION: check ─────────────────────────────────────────────────────────
    if (!action || action === 'check') {
      const { data, error } = await supabaseAdmin.rpc('check_login_rate_limit', {
        p_email: normalizedEmail,
      })

      if (error) {
        console.error('check_login_rate_limit RPC error:', error.message)
        // Fail open — don't block users if our rate-limit check fails
        return new Response(JSON.stringify({ allowed: true, attemptsRemaining: 5, retryAfterSeconds: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
        })
      }

      const result = data as {
        locked: boolean
        failed_count: number
        attempts_remaining: number
        retry_after_seconds: number
      }

      if (result.locked) {
        console.log(`Login blocked for ${normalizedEmail}: ${result.failed_count} failed attempts, retry in ${result.retry_after_seconds}s`)
      }

      return new Response(JSON.stringify({
        allowed:             !result.locked,
        attemptsRemaining:   result.attempts_remaining,
        retryAfterSeconds:   result.retry_after_seconds,
        failedCount:         result.failed_count,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      })
    }

    // ── ACTION: record ────────────────────────────────────────────────────────
    if (action === 'record') {
      if (typeof success !== 'boolean') {
        return new Response(JSON.stringify({ error: 'success (boolean) is required for record action' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
        })
      }

      const { error } = await supabaseAdmin.rpc('record_login_attempt', {
        p_email:   normalizedEmail,
        p_success: success,
        p_ip:      ip,
        p_ua:      userAgent,
      })

      if (error) {
        console.error('record_login_attempt RPC error:', error.message)
        // Non-critical — don't fail the login flow if logging fails
        return new Response(JSON.stringify({ recorded: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
        })
      }

      if (!success) {
        console.log(`Failed login recorded for ${normalizedEmail} from IP ${ip}`)
      }

      return new Response(JSON.stringify({ recorded: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      })
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
    })

  } catch (err: any) {
    console.error('check-login-rate-limit unexpected error:', err.message)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 500,
    })
  }
})
