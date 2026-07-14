-- ============================================================
-- Login Attempts Table — Rate Limiting & Account Lockout
-- ============================================================
-- Tracks failed (and successful) login attempts per email.
-- Used by the check-login-rate-limit Edge Function to enforce
-- a 5-attempt / 15-minute lockout policy.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text        NOT NULL,
  ip_address   text,
  user_agent   text,
  success      boolean     NOT NULL DEFAULT false,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

-- Fast lookups by email + time window
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time
  ON public.login_attempts (email, attempted_at DESC);

-- RLS — only service role (Edge Functions) can access this table
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- No policies for authenticated/anon users — only service role bypasses RLS
-- This ensures users cannot read or manipulate their own attempt records

-- ============================================================
-- Function: check_login_rate_limit(p_email TEXT)
-- Returns: JSON with locked status, attempts remaining, retry_after_seconds
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(p_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_minutes  INT  := 15;    -- Lockout window in minutes
  v_max_attempts    INT  := 5;     -- Max failures before lockout
  v_failed_count    INT;
  v_latest_fail     timestamptz;
  v_seconds_since   INT;
  v_retry_after     INT;
BEGIN
  -- Count failed attempts in the last window_minutes
  SELECT COUNT(*), MAX(attempted_at)
  INTO v_failed_count, v_latest_fail
  FROM public.login_attempts
  WHERE
    email       = p_email
    AND success = false
    AND attempted_at > (now() - make_interval(mins => v_window_minutes));

  -- If under the limit, return allowed
  IF v_failed_count < v_max_attempts THEN
    RETURN json_build_object(
      'locked',              false,
      'failed_count',        v_failed_count,
      'attempts_remaining',  v_max_attempts - v_failed_count,
      'retry_after_seconds', 0
    );
  END IF;

  -- Account is locked — calculate seconds remaining in lockout
  v_seconds_since := EXTRACT(EPOCH FROM (now() - v_latest_fail))::INT;
  v_retry_after   := GREATEST(0, (v_window_minutes * 60) - v_seconds_since);

  RETURN json_build_object(
    'locked',              true,
    'failed_count',        v_failed_count,
    'attempts_remaining',  0,
    'retry_after_seconds', v_retry_after
  );
END;
$$;

-- ============================================================
-- Function: record_login_attempt(...)
-- Inserts a login attempt record (called by Edge Function)
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_login_attempt(
  p_email      TEXT,
  p_success    BOOLEAN,
  p_ip         TEXT DEFAULT NULL,
  p_ua         TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.login_attempts (email, success, ip_address, user_agent)
  VALUES (p_email, p_success, p_ip, p_ua);

  -- If login succeeded, clear old failed attempts for this email
  -- This resets the lockout counter on successful auth
  IF p_success THEN
    DELETE FROM public.login_attempts
    WHERE email = p_email AND success = false;
  END IF;
END;
$$;

-- ============================================================
-- Auto-cleanup: purge attempts older than 24 hours
-- Run this via pg_cron or a scheduled Supabase function
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_attempts
  WHERE attempted_at < now() - INTERVAL '24 hours';
END;
$$;
