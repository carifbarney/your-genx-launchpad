ALTER TABLE public.user_plans
  ADD COLUMN IF NOT EXISTS transformation text,
  ADD COLUMN IF NOT EXISTS who_help text,
  ADD COLUMN IF NOT EXISTS their_frustration text,
  ADD COLUMN IF NOT EXISTS their_dream text;