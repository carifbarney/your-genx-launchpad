import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Xcelerate — Your Tool" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/login" });
        return;
      }
      setEmail(data.session.user.email ?? null);
      setChecking(false);
    });
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold">Xcelerate</span>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-muted-foreground sm:inline">{email}</span>
            <button
              onClick={handleLogout}
              className="text-sm font-semibold text-foreground underline underline-offset-4"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-3xl font-bold">Welcome to Xcelerate</h1>
        <p className="mt-4 text-muted-foreground">
          Your tool will appear here in the next step.
        </p>
      </section>
    </main>
  );
}