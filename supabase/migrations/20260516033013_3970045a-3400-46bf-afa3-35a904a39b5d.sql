
CREATE TABLE public.user_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  niche TEXT,
  roadblock TEXT,
  day TEXT,
  starting_point_output TEXT,
  product_output TEXT,
  storefront_output TEXT,
  launch_plan_output TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own plan" ON public.user_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own plan" ON public.user_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own plan" ON public.user_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own plan" ON public.user_plans FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_user_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_plans_updated_at_trigger
BEFORE UPDATE ON public.user_plans
FOR EACH ROW EXECUTE FUNCTION public.update_user_plans_updated_at();
