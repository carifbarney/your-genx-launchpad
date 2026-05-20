import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import xcelerateLogo from "@/assets/xcelerate-logo.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in to Xcelerate" },
      { name: "description", content: "Sign up or log in to access your Xcelerate tool." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setMessage("Check your email for a confirmation link, then come back and log in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth/callback`,
      });
      if (result.error) throw new Error(result.error.message ?? "Google sign-in failed.");
      if (!result.redirected) navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 bottom-0 top-1/2"><div className="xcel-grid-floor" /></div>
        <div className="absolute -top-20 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#FE2DA3] opacity-25 blur-3xl xcel-blob" />
        <div className="absolute bottom-0 right-0 h-[380px] w-[380px] rounded-full bg-[#8A2BE2] opacity-25 blur-3xl xcel-blob" style={{ animationDelay: "-6s" }} />
      </div>
      <div className="xcel-card xcel-scanlines relative w-full max-w-md p-8">
        <div className="text-center">
          <Link to="/" className="relative inline-block">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-0 rounded-full"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(254,45,163,0.55), rgba(138,43,226,0.35) 45%, rgba(0,240,209,0.25) 70%, transparent 80%)",
                filter: "blur(28px)",
                transform: "scale(1.25)",
              }}
            />
            <img
              src={xcelerateLogo}
              alt="Xcelerate Ignition Lab"
              className="relative mx-auto h-40 w-auto sm:h-48 md:h-56 drop-shadow-[0_0_24px_rgba(254,45,163,0.7)]"
            />
          </Link>
          <h1 className="mt-6 text-3xl tracking-wide xcel-neon-pink" style={{ fontFamily: "Anton, sans-serif", textTransform: "uppercase" }}>
            {mode === "login" ? "Welcome back" : "Get on the list"}
          </h1>
          <p className="mt-2 text-sm normal-case tracking-normal text-[#F5F2EC]/70">
            {mode === "login" ? "Pick up where you left off." : "Use the email you bought in with."}
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="xcel-btn-ghost flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs disabled:opacity-50"
          >
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#FE2DA3]/30" /></div>
            <div className="relative flex justify-center">
              <span className="bg-[#141418] px-3 font-mono text-[10px] uppercase tracking-[0.25em] text-[#F5F2EC]/60">— or email —</span>
            </div>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-[#F5F2EC] outline-none placeholder:text-white/30 transition focus:border-[#FE2DA3] focus:shadow-[0_0_0_3px_rgba(254,45,163,0.2)]"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-[#F5F2EC] outline-none placeholder:text-white/30 transition focus:border-[#FE2DA3] focus:shadow-[0_0_0_3px_rgba(254,45,163,0.2)]"
            />
            <button
              type="submit"
              disabled={loading}
              className="xcel-btn-neon w-full rounded-xl px-4 py-3 text-sm disabled:opacity-50"
            >
              {loading ? "Hang on…" : mode === "login" ? "⚡ Log in" : "⚡ Create account"}
            </button>
          </form>

          {error && <p className="rounded-md border border-[#FF3B6B]/40 bg-[#FF3B6B]/10 px-3 py-2 text-sm font-semibold text-[#FF8FAA]">{error}</p>}
          {message && <p className="rounded-md border border-[#00F0D1]/40 bg-[#00F0D1]/10 px-3 py-2 text-sm font-semibold text-[#00F0D1]">{message}</p>}

          <p className="text-center text-sm normal-case tracking-normal text-[#F5F2EC]/70">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setMessage(null); }}
              className="font-bold text-[#FE2DA3] underline underline-offset-4 transition hover:text-[#00F0D1]"
            >
              {mode === "login" ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}