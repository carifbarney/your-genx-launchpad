import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      // Give Supabase a moment to process the URL hash / code
      for (let i = 0; i < 20; i++) {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          navigate({ to: "/dashboard" });
          return;
        }
        await new Promise((r) => setTimeout(r, 150));
      }
      navigate({ to: "/login" });
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </main>
  );
}