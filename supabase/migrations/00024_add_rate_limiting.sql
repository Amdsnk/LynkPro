-- Create rate limiting table for 2FA attempts
CREATE TABLE IF NOT EXISTS rate_limit_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  attempt_type TEXT NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_type_time 
ON rate_limit_attempts(user_id, attempt_type, attempted_at DESC);

-- Create function to clean up old rate limit attempts (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limit_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rate_limit_attempts
  WHERE attempted_at < now() - INTERVAL '1 hour';
END;
$$;

-- Create function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_attempt_type TEXT,
  p_max_attempts INT DEFAULT 5,
  p_window_minutes INT DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attempt_count INT;
BEGIN
  -- Count attempts in the time window
  SELECT COUNT(*)
  INTO v_attempt_count
  FROM rate_limit_attempts
  WHERE user_id = p_user_id
    AND attempt_type = p_attempt_type
    AND attempted_at > now() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Return true if under limit, false if over
  RETURN v_attempt_count < p_max_attempts;
END;
$$;

-- Create function to record rate limit attempt
CREATE OR REPLACE FUNCTION record_rate_limit_attempt(
  p_user_id UUID,
  p_attempt_type TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO rate_limit_attempts (user_id, attempt_type, ip_address, user_agent)
  VALUES (p_user_id, p_attempt_type, p_ip_address, p_user_agent);
  
  -- Clean up old attempts periodically (10% chance)
  IF random() < 0.1 THEN
    PERFORM cleanup_old_rate_limit_attempts();
  END IF;
END;
$$;

COMMENT ON TABLE rate_limit_attempts IS 'Tracks rate limit attempts for security-sensitive operations like 2FA verification';
COMMENT ON FUNCTION check_rate_limit IS 'Checks if user has exceeded rate limit for a specific operation';
COMMENT ON FUNCTION record_rate_limit_attempt IS 'Records a rate limit attempt and periodically cleans up old records';
