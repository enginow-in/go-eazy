-- Atomic rate limiting schema and function

CREATE TABLE IF NOT EXISTS payment_rate_limits (
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  window_start timestamptz NOT NULL,
  attempt_count int         NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, window_start)
);

-- Enable RLS for security
ALTER TABLE payment_rate_limits ENABLE ROW LEVEL SECURITY;

-- Atomic increment function
CREATE OR REPLACE FUNCTION increment_payment_attempt(target_user_id uuid, target_property_id uuid)
RETURNS int AS $$
DECLARE
  current_attempts int;
  window_start timestamptz;
BEGIN
  -- Truncate current timestamp to the hour
  window_start := date_trunc('hour', now());

  -- Perform atomic upsert with row locking on update
  INSERT INTO payment_rate_limits (user_id, window_start, attempt_count)
  VALUES (target_user_id, window_start, 1)
  ON CONFLICT (user_id, window_start)
  DO UPDATE SET attempt_count = payment_rate_limits.attempt_count + 1
  RETURNING attempt_count INTO current_attempts;

  -- Append to audit log for history tracking
  INSERT INTO payment_attempts (user_id, property_id, created_at)
  VALUES (target_user_id, target_property_id, now());

  RETURN current_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
