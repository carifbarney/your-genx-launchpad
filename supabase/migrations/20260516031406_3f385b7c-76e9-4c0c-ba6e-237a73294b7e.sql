REVOKE EXECUTE ON FUNCTION public.increment_ai_usage(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_ai_usage(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_ai_usage(UUID) FROM authenticated;