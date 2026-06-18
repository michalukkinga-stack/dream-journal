-- ─────────────────────────────────────────────────────────────────────────────
-- Security fixes migration
-- Run once in Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. TOKEN HASHING
-- Add token_hash column (SHA-256 hex of plain token)
ALTER TABLE api_tokens ADD COLUMN IF NOT EXISTS token_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS api_tokens_token_hash_idx ON api_tokens (token_hash) WHERE token_hash IS NOT NULL;

-- Backfill hashes for existing tokens using pgcrypto (available in Supabase by default)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
UPDATE api_tokens
SET token_hash = encode(digest(token, 'sha256'), 'hex')
WHERE token_hash IS NULL AND token IS NOT NULL;


-- 2. TOKEN EXPIRY
ALTER TABLE api_tokens ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Set 1-year expiry for all existing tokens
UPDATE api_tokens
SET expires_at = NOW() + INTERVAL '1 year'
WHERE expires_at IS NULL;

-- Make column non-null with a default going forward
ALTER TABLE api_tokens ALTER COLUMN expires_at SET DEFAULT NOW() + INTERVAL '1 year';
ALTER TABLE api_tokens ALTER COLUMN expires_at SET NOT NULL;


-- 3. RATE LIMITING TABLE
CREATE TABLE IF NOT EXISTS api_rate_limits (
  user_id      UUID    NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  endpoint     TEXT    NOT NULL,
  minute_bucket BIGINT NOT NULL,
  count        INT     NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, endpoint, minute_bucket)
);

-- Auto-purge rows older than 2 hours to keep the table small
CREATE OR REPLACE FUNCTION purge_old_rate_limits() RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM api_rate_limits WHERE minute_bucket < (EXTRACT(EPOCH FROM NOW()) / 60)::BIGINT - 120;
$$;


-- 4. RATE LIMIT CHECK FUNCTION (atomic upsert, uses auth.uid() — not user-controllable)
CREATE OR REPLACE FUNCTION check_and_increment_rate_limit(
  p_endpoint TEXT,
  p_bucket   BIGINT,
  p_limit    INT DEFAULT 20
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id  UUID := auth.uid();
  new_count  INT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Opportunistic cleanup (low-cost, 1% of calls)
  IF random() < 0.01 THEN
    PERFORM purge_old_rate_limits();
  END IF;

  INSERT INTO api_rate_limits (user_id, endpoint, minute_bucket, count)
  VALUES (v_user_id, p_endpoint, p_bucket, 1)
  ON CONFLICT (user_id, endpoint, minute_bucket)
  DO UPDATE SET count = api_rate_limits.count + 1
  RETURNING count INTO new_count;

  RETURN new_count <= p_limit;
END;
$$;

-- Grant execute to authenticated users (RLS enforced inside via auth.uid())
GRANT EXECUTE ON FUNCTION check_and_increment_rate_limit(TEXT, BIGINT, INT) TO authenticated;

-- RLS for api_rate_limits (users see only their own rows)
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own rate limits" ON api_rate_limits
  FOR ALL USING (user_id = auth.uid());
