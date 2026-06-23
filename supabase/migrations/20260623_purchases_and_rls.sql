-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: purchases table + RLS on dreams and chat_messages
-- Run once in Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────


-- 0. POMOCNICZA FUNKCJA RATE-LIMITINGU DLA MCP (service_role z jawnym user_id)
-- Wariant dla api/mcp.ts, który wywołuje Supabase jako service_role i musi
-- przekazać user_id explicite (auth.uid() byłoby NULL przy service_role key).
CREATE OR REPLACE FUNCTION check_and_increment_rate_limit_for_user(
  p_user_id UUID,
  p_endpoint TEXT,
  p_bucket   BIGINT,
  p_limit    INT DEFAULT 30
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_count INT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF random() < 0.01 THEN
    PERFORM purge_old_rate_limits();
  END IF;

  INSERT INTO api_rate_limits (user_id, endpoint, minute_bucket, count)
  VALUES (p_user_id, p_endpoint, p_bucket, 1)
  ON CONFLICT (user_id, endpoint, minute_bucket)
  DO UPDATE SET count = api_rate_limits.count + 1
  RETURNING count INTO new_count;

  RETURN new_count <= p_limit;
END;
$$;

-- Dostępna tylko dla service_role (nie dla authenticated/anon)
REVOKE ALL ON FUNCTION check_and_increment_rate_limit_for_user(UUID, TEXT, BIGINT, INT) FROM PUBLIC;


-- 1. TABELA ZAKUPÓW
-- Przechowuje informację, który użytkownik kupił którego terapeutę.
-- Zapełniana przez webhook Stripe (Edge Function stripe-webhook).
CREATE TABLE IF NOT EXISTS purchases (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  therapist_id     TEXT        NOT NULL,
  stripe_session_id TEXT       UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS purchases_user_id_idx ON purchases (user_id);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Użytkownik widzi tylko własne zakupy
CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (user_id = auth.uid());

-- Zapis możliwy tylko przez service_role (webhook Stripe)
-- Authenticated nie może sam sobie wstawić zakupu
CREATE POLICY "Service role can insert purchases"
  ON purchases FOR INSERT
  WITH CHECK (FALSE);  -- blokuje INSERT dla anon/authenticated; service_role pomija RLS


-- 2. RLS NA TABELI DREAMS
-- Jeśli jeszcze nie było włączone, aktywuj i dodaj politykę.
ALTER TABLE dreams ENABLE ROW LEVEL SECURITY;

-- Usuń poprzednie polityki (jeśli istniały) i utwórz nowe
DROP POLICY IF EXISTS "Users can manage own dreams" ON dreams;
CREATE POLICY "Users can manage own dreams"
  ON dreams FOR ALL
  USING      (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- 3. RLS NA TABELI CHAT_MESSAGES
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own chat messages" ON chat_messages;
CREATE POLICY "Users can manage own chat messages"
  ON chat_messages FOR ALL
  USING      (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
