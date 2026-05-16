-- Track per-user daily AI usage (resets each calendar day, UTC)
CREATE TABLE public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  request_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, usage_date)
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own usage"
  ON public.ai_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own usage"
  ON public.ai_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own usage"
  ON public.ai_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- Atomically check + increment usage. Returns remaining requests for today.
-- Raises an exception if the daily limit (20) has been reached.
CREATE OR REPLACE FUNCTION public.increment_ai_usage(_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _today DATE := (now() AT TIME ZONE 'utc')::date;
  _new_count INTEGER;
  _limit CONSTANT INTEGER := 20;
BEGIN
  INSERT INTO public.ai_usage (user_id, usage_date, request_count)
  VALUES (_user_id, _today, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET
    request_count = public.ai_usage.request_count + 1,
    updated_at = now()
  WHERE public.ai_usage.request_count < _limit
  RETURNING request_count INTO _new_count;

  IF _new_count IS NULL THEN
    RAISE EXCEPTION 'DAILY_LIMIT_REACHED';
  END IF;

  RETURN _limit - _new_count;
END;
$$;