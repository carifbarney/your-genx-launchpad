import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  generateXcelerateResponse,
  getRemainingRequests,
  getUserPlan,
  clearUserPlan,
} from "@/lib/xcelerate.functions";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Xcelerate — Your Launch System" }] }),
  component: Dashboard,
});

type ToolKey = "starting_point" | "product" | "storefront" | "launch_plan";

const TOOLS: { key: ToolKey; num: number; emoji: string; title: string; subtitle: string }[] = [
  { key: "starting_point", num: 1, emoji: "🧭", title: "Find Your Lane", subtitle: "Get unstuck in 60 seconds" },
  { key: "product",        num: 2, emoji: "💡", title: "Build Your Thing", subtitle: "A real product, not a maybe" },
  { key: "storefront",     num: 3, emoji: "🛍️", title: "Open Your Shop", subtitle: "Beacons in one sitting" },
  { key: "launch_plan",    num: 4, emoji: "🚀", title: "Launch & Sell",   subtitle: "Your 30-day game plan" },
];

const NEXT_TOOL: Partial<Record<ToolKey, ToolKey>> = {
  starting_point: "product",
  product: "storefront",
  storefront: "launch_plan",
};

type PlanRow = {
  niche: string | null; roadblock: string | null; day: string | null;
  starting_point_output: string | null; product_output: string | null;
  storefront_output: string | null; launch_plan_output: string | null;
} | null;

function Dashboard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [activeTool, setActiveTool] = useState<ToolKey>("starting_point");
  const [plan, setPlan] = useState<PlanRow>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  const fetchPlan = useServerFn(getUserPlan);
  const fetchRemaining = useServerFn(getRemainingRequests);
  const clearPlan = useServerFn(clearUserPlan);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { navigate({ to: "/login" }); return; }
      setEmail(data.session.user.email ?? null);
      setChecking(false);
      Promise.all([
        fetchPlan({}).then((r) => setPlan(r.plan as PlanRow)).catch(() => {}),
        fetchRemaining({}).then((r) => setRemaining(r.remaining)).catch(() => {}),
      ]);
    });
  }, [navigate, fetchPlan, fetchRemaining]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const refreshPlan = async () => {
    try { const r = await fetchPlan({}); setPlan(r.plan as PlanRow); } catch {}
  };

  const handleStartFresh = async () => {
    if (!confirm("Clear all your saved answers and start over? (Your account stays — just the answers reset.)")) return;
    try { await clearPlan({}); } catch {}
    setPlan(null);
    setActiveTool("starting_point");
  };

  if (checking) {
    return <main className="flex min-h-screen items-center justify-center bg-background"><p className="text-sm text-muted-foreground">Loading…</p></main>;
  }

  const completed = {
    starting_point: !!plan?.starting_point_output,
    product: !!plan?.product_output,
    storefront: !!plan?.storefront_output,
    launch_plan: !!plan?.launch_plan_output,
  };

  const completedCount = Object.values(completed).filter(Boolean).length;
  const progressPct = (completedCount / 4) * 100;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Animated background blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-[oklch(0.85_0.13_45)] opacity-40 blur-3xl xcel-blob" />
        <div className="absolute top-40 -right-32 h-[480px] w-[480px] rounded-full bg-[oklch(0.80_0.18_345)] opacity-30 blur-3xl xcel-blob" style={{ animationDelay: "-6s" }} />
        <div className="absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-[oklch(0.78_0.16_295)] opacity-25 blur-3xl xcel-blob" style={{ animationDelay: "-12s" }} />
      </div>

      <header className="border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="bg-gradient-to-r from-[oklch(0.65_0.22_35)] via-[oklch(0.62_0.27_348)] to-[oklch(0.55_0.22_295)] bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
            Xcelerate
          </span>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-muted-foreground sm:inline">{email}</span>
            <button onClick={handleLogout} className="text-sm font-semibold text-muted-foreground transition hover:text-foreground">
              Log out
            </button>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 xcel-fade-up">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-sm font-semibold text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[oklch(0.65_0.20_145)]" />
              {completedCount === 0 ? "Let's start fresh" : completedCount === 4 ? "You did the whole thing 🎉" : `${completedCount} of 4 done — keep going`}
            </div>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
              Hey — let's build{" "}
              <span className="bg-gradient-to-r from-[oklch(0.65_0.22_35)] via-[oklch(0.62_0.27_348)] to-[oklch(0.55_0.22_295)] bg-clip-text text-transparent">
                your thing
              </span>{" "}
              👋
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">Four steps. No fluff. You'll have something real today.</p>
            {remaining !== null && (
              <p className="mt-2 text-sm text-muted-foreground">{remaining} of 20 AI requests left today</p>
            )}
          </div>
          {(plan?.niche || plan?.starting_point_output) && (
            <button onClick={handleStartFresh}
              className="rounded-full border border-border bg-card/80 px-4 py-2 text-sm font-semibold text-muted-foreground backdrop-blur transition hover:border-foreground/40 hover:text-foreground">
              ↺ Start fresh
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-8 xcel-fade-up" style={{ animationDelay: "0.05s" }}>
          <div className="mb-2 flex items-center justify-between text-sm font-semibold text-muted-foreground">
            <span>Your launch progress</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-border/60">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%`, background: "var(--gradient-brand)" }}
            />
          </div>
        </div>

        {/* Tool tabs */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TOOLS.map((t, i) => {
            const done = completed[t.key];
            const active = activeTool === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTool(t.key)}
                className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 xcel-fade-up ${
                  active
                    ? "border-transparent bg-card shadow-[0_10px_30px_-10px_oklch(0.62_0.27_348/0.35)] -translate-y-0.5"
                    : "border-border bg-card/60 backdrop-blur hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md"
                }`}
                style={{ animationDelay: `${0.08 + i * 0.05}s` }}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-0 -z-10 opacity-100"
                    style={{ background: "linear-gradient(135deg, oklch(0.62 0.27 348 / 0.18) 0%, oklch(0.55 0.22 295 / 0.18) 100%)" }}
                  />
                )}
                {active && (
                  <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: "var(--gradient-brand)" }} />
                )}
                <div className="flex items-center justify-between">
                  <span className={`text-2xl leading-none transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}>{t.emoji}</span>
                  {done && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.70_0.18_145/0.18)] px-2 py-0.5 text-xs font-bold text-[oklch(0.78_0.18_145)]">
                      ✓ Done
                    </span>
                  )}
                </div>
                <div className="mt-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Step {t.num}</div>
                <div className="mt-1 text-base font-bold leading-tight">{t.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{t.subtitle}</div>
              </button>
            );
          })}
        </div>

        <ToolPanel
          key={activeTool}
          tool={activeTool}
          plan={plan}
          onComplete={refreshPlan}
          onUsage={(r) => setRemaining(r)}
          disabled={remaining === 0}
          onAdvance={(next) => {
            setActiveTool(next);
            if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </section>
    </main>
  );
}

// ===== Tool panel =====
function ToolPanel({
  tool, plan, onComplete, onUsage, disabled, onAdvance,
}: {
  tool: ToolKey;
  plan: PlanRow;
  onComplete: () => void;
  onUsage: (remaining: number) => void;
  disabled: boolean;
  onAdvance: (next: ToolKey) => void;
}) {
  const generate = useServerFn(generateXcelerateResponse);
  const [output, setOutput] = useState<string>(() => {
    if (!plan) return "";
    if (tool === "starting_point") return plan.starting_point_output ?? "";
    if (tool === "product")        return plan.product_output ?? "";
    if (tool === "storefront")     return plan.storefront_output ?? "";
    return plan.launch_plan_output ?? "";
  });
  const [streaming, setStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  // starting point inputs
  const [niche, setNiche] = useState(plan?.niche ?? "");
  const [roadblock, setRoadblock] = useState(plan?.roadblock ?? "");
  const [day, setDay] = useState(plan?.day ?? "");
  // product
  const [productNotes, setProductNotes] = useState("");
  // storefront
  const [storefrontNotes, setStorefrontNotes] = useState("");
  // launch plan
  const [hoursPerDay, setHoursPerDay] = useState("");
  const [platformPreference, setPlatformPreference] = useState("");

  const prerequisite = useMemo(() => {
    if (tool === "product")    return plan?.starting_point_output ? null : "Finish Step 1 (Starting Point) first so we know your niche.";
    if (tool === "storefront") return plan?.product_output        ? null : "Finish Step 2 (Product Builder) first so we know what you're selling.";
    if (tool === "launch_plan")return plan?.product_output        ? null : "Finish Step 2 (Product Builder) first so we have something to launch.";
    return null;
  }, [tool, plan]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (streaming || disabled) return;

    type GenInput =
      | { tool: "starting_point"; niche: string; roadblock: string; day: string }
      | { tool: "product"; productNotes: string }
      | { tool: "storefront"; storefrontNotes: string }
      | { tool: "launch_plan"; hoursPerDay: string; platformPreference: string };
    let payload: GenInput;
    if (tool === "starting_point") {
      if (!niche.trim() || !roadblock.trim() || !day.trim()) { setErrorMsg("Please fill in all three fields."); return; }
      payload = { tool: "starting_point", niche, roadblock, day };
    } else if (tool === "product") {
      payload = { tool: "product", productNotes };
    } else if (tool === "storefront") {
      payload = { tool: "storefront", storefrontNotes };
    } else {
      if (!hoursPerDay.trim()) { setErrorMsg("Tell me roughly how much time you have each day."); return; }
      payload = { tool: "launch_plan", hoursPerDay, platformPreference };
    }

    setErrorMsg(null); setOutput(""); setCopied(false); setStreaming(true);
    try {
      const stream = await generate({ data: payload });
      for await (const chunk of stream) {
        if (chunk.type === "error") { setErrorMsg(chunk.message); break; }
        if (chunk.type === "meta")  { onUsage(chunk.remaining); continue; }
        if (chunk.type === "delta") {
          setOutput((p) => p + chunk.text);
          requestAnimationFrame(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
        }
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setStreaming(false);
      onComplete();
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/90 p-6 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.18)] backdrop-blur-md sm:p-8 xcel-fade-up">
      <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: "var(--gradient-brand)" }} />
      <ToolHeader tool={tool} />

      {prerequisite ? (
        <div className="mt-6 rounded-md border border-border bg-background/50 p-5 text-sm text-muted-foreground">
          {prerequisite}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {tool === "starting_point" && (
            <>
              <Field
                label="What are you the go-to person for?"
                hint="Don't overthink it. What do friends ask you about?"
                value={niche} onChange={setNiche} disabled={streaming}
                placeholder={'e.g. "meal planning for busy moms" — or type "not sure yet" and we will figure it out'}
                chips={[
                  "Honestly? Not sure yet",
                  "Meal planning & easy recipes",
                  "Helping women restart their careers",
                  "Decluttering & home organization",
                  "Faith + family life",
                  "Menopause wellness",
                ]}
              />
              <Field
                label="What's the thing that keeps tripping you up?"
                hint="Be real — this is where most people quit."
                value={roadblock} onChange={setRoadblock} disabled={streaming}
                placeholder="e.g. I keep changing my mind every week"
                chips={[
                  "I keep changing my niche",
                  "Tech overwhelms me",
                  "I feel like I'm too late",
                  "I don't know what to sell",
                  "Scared nobody will care",
                ]}
              />
              <Field
                label="What does a normal day look like for you?"
                hint="So we don't build a plan you can't actually do."
                value={day} onChange={setDay} disabled={streaming}
                placeholder='e.g. "1 hour after the kids are in bed"'
                chips={[
                  "30 mins early morning",
                  "1-2 hours after kids/work",
                  "Weekends mostly",
                  "I homeschool — it's chaos",
                  "I work full-time",
                ]}
              />
            </>
          )}

          {tool === "product" && (
            <>
              <ContextSummary plan={plan} show={["niche", "starting_point_output"]} />
              <Field
                label="Any wishes for your product? (totally optional)"
                hint="Skip this and we'll pick what fits you best."
                value={productNotes} onChange={setProductNotes} disabled={streaming}
                placeholder="Type a wish, or tap one below 👇"
                chips={[
                  "Keep it under $30",
                  "Make it a free PDF to grow my email list",
                  "Something I can finish in a weekend",
                  "Affiliate-friendly so I don't have to make it",
                  "Surprise me",
                ]}
              />
            </>
          )}

          {tool === "storefront" && (
            <>
              <ContextSummary plan={plan} show={["niche", "product_output"]} />
              <Field
                label="Anything we should know? (optional)"
                hint="Username ideas, brand vibe, or just hit Generate."
                value={storefrontNotes} onChange={setStorefrontNotes} disabled={streaming}
                placeholder='e.g. "I want my username to be @ClaireAtHome"'
                chips={[
                  "I already have a Beacons account",
                  "Warm, cozy brand colors",
                  "Bold and modern vibe",
                  "I want my name in the handle",
                ]}
              />
            </>
          )}

          {tool === "launch_plan" && (
            <>
              <ContextSummary plan={plan} show={["niche", "product_output"]} />
              <Field
                label="How much time can you actually give this?"
                hint="Real talk — we'll build the plan around YOUR life."
                value={hoursPerDay} onChange={setHoursPerDay} disabled={streaming}
                placeholder="Tap one or type your own"
                chips={[
                  "15 mins a day, that's it",
                  "30 mins most mornings",
                  "1 hour after dinner",
                  "2 hours on weekends only",
                ]}
              />
              <Field
                label="Platform you're comfortable on? (optional)"
                hint="Or let us pick the easiest one for you."
                value={platformPreference} onChange={setPlatformPreference} disabled={streaming}
                placeholder="Tap one or skip"
                chips={[
                  "I'm already on Facebook",
                  "Instagram — but I hate Reels",
                  "Pinterest sounds doable",
                  "Help, I have no idea",
                ]}
              />
            </>
          )}

          {errorMsg && (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{errorMsg}</p>
          )}

          {disabled && !streaming && (
            <p className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
              You've used all 20 of today's AI requests. Your quota resets at midnight — come back tomorrow and pick right up where you left off. 💛
            </p>
          )}

          <button type="submit" disabled={streaming || disabled}
            className="group relative w-full overflow-hidden rounded-xl px-6 py-4 text-lg font-bold text-white shadow-[0_10px_30px_-10px_oklch(0.62_0.27_348/0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_40px_-10px_oklch(0.62_0.27_348/0.65)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            style={{ background: "var(--gradient-brand)" }}>
            <span className="relative z-10">
              {streaming ? "✨ Cooking it up…" : disabled ? "🚫 Out of requests for today" : output ? "↺ Try again with new info" : "✨ Show me what to do"}
            </span>
            {!streaming && (
              <span aria-hidden className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            )}
          </button>
        </form>
      )}

      {(output || streaming) && (
        <div ref={outputRef} className="relative mt-8 overflow-hidden rounded-2xl border border-border/70 bg-background/90 p-6 shadow-sm xcel-fade-up">
          {streaming && !output && (
            <div className="flex flex-col items-start gap-4 py-6">
              <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                <span className="inline-flex gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: "oklch(0.65 0.22 35)", animation: "xcel-bounce-dot 1.4s infinite ease-in-out", animationDelay: "0s" }} />
                  <span className="h-2 w-2 rounded-full" style={{ background: "oklch(0.62 0.27 348)", animation: "xcel-bounce-dot 1.4s infinite ease-in-out", animationDelay: "0.16s" }} />
                  <span className="h-2 w-2 rounded-full" style={{ background: "oklch(0.55 0.22 295)", animation: "xcel-bounce-dot 1.4s infinite ease-in-out", animationDelay: "0.32s" }} />
                </span>
                Cari's AI is thinking this through…
              </div>
              <div className="w-full space-y-2">
                <div className="h-3 w-2/3 rounded-full bg-muted xcel-shimmer" />
                <div className="h-3 w-full rounded-full bg-muted xcel-shimmer" />
                <div className="h-3 w-5/6 rounded-full bg-muted xcel-shimmer" />
              </div>
            </div>
          )}
          {output && (
            <>
              {streaming && (
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[oklch(0.62_0.27_348/0.18)] px-3 py-1 text-sm font-semibold text-[oklch(0.80_0.18_348)]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[oklch(0.75_0.22_348)]" /> Streaming live
                </div>
              )}
              <OutputCards output={output} streaming={streaming} />
              {!streaming && tool === "product" && (
                <BuildItWithAI output={output} plan={plan} />
              )}
              {!streaming && tool === "storefront" && (
                <StorefrontWalkthrough />
              )}
              {!streaming && tool === "launch_plan" && (
                <LaunchCalendar output={output} />
              )}
              {!streaming && (
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button onClick={handleCopy} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-base font-semibold transition hover:border-foreground/40 hover:bg-accent">
                    {copied ? "✓ Copied!" : "📋 Copy"}
                  </button>
                  {NEXT_TOOL[tool] && (
                    <button
                      type="button"
                      onClick={() => onAdvance(NEXT_TOOL[tool]!)}
                      className="group ml-auto inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-extrabold text-white shadow-[0_10px_30px_-10px_oklch(0.62_0.27_348/0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_15px_40px_-10px_oklch(0.62_0.27_348/0.65)]"
                      style={{ background: "var(--gradient-brand)" }}
                    >
                      Next: {TOOLS.find((t) => t.key === NEXT_TOOL[tool])!.title}
                      <span className="transition-transform group-hover:translate-x-0.5">→</span>
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ToolHeader({ tool }: { tool: ToolKey }) {
  const t = TOOLS.find((x) => x.key === tool)!;
  return (
    <div className="flex items-start gap-4">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-[0_8px_20px_-8px_oklch(0.62_0.27_348/0.45)]"
        style={{ background: "var(--gradient-brand)" }}
      >
        <span className="drop-shadow-sm">{t.emoji}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Step {t.num} of 4</p>
        <h2 className="mt-0.5 text-3xl font-extrabold leading-tight">{t.title}</h2>
        <p className="mt-1.5 text-base text-muted-foreground">{t.subtitle}</p>
      </div>
    </div>
  );
}

function ContextSummary({ plan, show }: { plan: PlanRow; show: string[] }) {
  if (!plan) return null;
  const items: { label: string; value: string }[] = [];
  if (show.includes("niche") && plan.niche) items.push({ label: "Your niche", value: plan.niche });
  if (show.includes("starting_point_output") && plan.starting_point_output)
    items.push({ label: "Your starting point", value: "Saved ✓" });
  if (show.includes("product_output") && plan.product_output)
    items.push({ label: "Your product", value: "Saved ✓" });
  if (!items.length) return null;
  return (
    <div className="rounded-md border border-border bg-background/50 p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Using your saved answers</p>
      <ul className="space-y-1 text-sm">
        {items.map((i) => (
          <li key={i.label}><span className="font-semibold">{i.label}:</span> <span className="text-muted-foreground">{i.value.length > 100 ? i.value.slice(0, 100) + "…" : i.value}</span></li>
        ))}
      </ul>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, disabled, hint, chips,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
  hint?: string;
  chips?: string[];
}) {
  const active = value.trim().length > 0;
  return (
    <div className="group">
      <label className="block">
        <span className="block text-base font-bold text-foreground">{label}</span>
        {hint && <span className="mt-1 block text-sm text-muted-foreground">{hint}</span>}
        <div className={`relative mt-2.5 rounded-xl border-2 bg-white transition-all duration-200 ${
          active ? "border-[oklch(0.62_0.27_348/0.5)] shadow-[0_0_0_4px_oklch(0.62_0.27_348/0.15)]" : "border-white/80 hover:border-white"
        } focus-within:border-[oklch(0.62_0.27_348/0.7)] focus-within:shadow-[0_0_0_4px_oklch(0.62_0.27_348/0.20)]`}>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            rows={3}
            maxLength={1000}
            className="w-full resize-none rounded-xl bg-transparent px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus-visible:outline-none disabled:opacity-60"
          />
        </div>
      </label>
      {chips && chips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((chip, i) => {
            const selected = value === chip;
            return (
              <button
                key={chip}
                type="button"
                disabled={disabled}
                onClick={() => onChange(chip)}
                className={`xcel-pop rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 ${
                  selected
                    ? "border-transparent bg-[oklch(0.62_0.27_348)] text-white shadow-[0_4px_12px_-2px_oklch(0.62_0.27_348/0.5)]"
                    : "border-border bg-background text-muted-foreground hover:border-[oklch(0.62_0.27_348/0.5)] hover:bg-[oklch(0.62_0.27_348/0.06)] hover:text-foreground"
                }`}
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                {chip}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== Lightweight markdown rendering =====
function splitIntoSections(text: string): { title: string | null; body: string }[] {
  const lines = text.split("\n");
  const sections: { title: string | null; body: string[] }[] = [];
  let current: { title: string | null; body: string[] } = { title: null, body: [] };
  for (const line of lines) {
    const hdr = line.match(/^\s*\*\*([^*]+)\*\*\s*$/);
    if (hdr) {
      if (current.title || current.body.join("").trim()) sections.push(current);
      current = { title: hdr[1].trim(), body: [] };
    } else {
      current.body.push(line);
    }
  }
  if (current.title || current.body.join("").trim()) sections.push(current);
  const cleaned = sections
    .map((s) => ({ title: s.title, body: s.body.join("\n").trim() }))
    .filter((s) => s.title || s.body);
  if (cleaned.length > 1) return cleaned;
  // Fallback: split single big blob into ~3-paragraph chunks
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paras.length <= 3) return [{ title: null, body: text }];
  const out: { title: string | null; body: string }[] = [];
  for (let i = 0; i < paras.length; i += 3) {
    out.push({ title: null, body: paras.slice(i, i + 3).join("\n\n") });
  }
  return out;
}

function OutputCards({ output, streaming }: { output: string; streaming: boolean }) {
  const sections = useMemo(() => splitIntoSections(output), [output]);
  const [idx, setIdx] = useState(0);
  // While streaming, follow the last section so users see new content arrive.
  useEffect(() => {
    if (streaming) setIdx(Math.max(0, sections.length - 1));
  }, [streaming, sections.length]);
  // Keep idx in bounds if sections shrink.
  useEffect(() => {
    if (idx > sections.length - 1) setIdx(Math.max(0, sections.length - 1));
  }, [sections.length, idx]);

  if (sections.length === 0) return null;
  const total = sections.length;
  const safeIdx = Math.min(idx, total - 1);
  const current = sections[safeIdx];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm font-semibold text-muted-foreground">
        <span>Card {safeIdx + 1} of {total}</span>
        <span className="hidden sm:inline">Tap the arrows or dots to flip through</span>
      </div>
      <div
        key={safeIdx}
        className="rounded-2xl border-2 border-[oklch(0.62_0.27_348/0.25)] bg-white p-6 text-slate-900 shadow-sm xcel-fade-up sm:p-8"
      >
        {current.title && (
          <h3 className="mb-4 text-2xl font-extrabold leading-tight text-slate-900">
            {current.title}
          </h3>
        )}
        <div className="prose-xcel text-[17px] leading-[1.75] text-slate-800">
          {renderMarkdown(current.body)}
        </div>
      </div>
      {total > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={safeIdx === 0}
            className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-card px-5 py-2.5 text-base font-bold transition hover:-translate-y-0.5 hover:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          >
            ← Back
          </button>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {sections.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to card ${i + 1}`}
                onClick={() => setIdx(i)}
                className={`h-2.5 rounded-full transition-all ${
                  i === safeIdx ? "w-8 bg-[oklch(0.62_0.27_348)]" : "w-2.5 bg-border hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
            disabled={safeIdx === total - 1}
            className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-card px-5 py-2.5 text-base font-bold transition hover:-translate-y-0.5 hover:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function renderMarkdown(text: string): ReactNode {
  const lines = text.split("\n");
  const out: ReactNode[] = [];
  let listBuf: string[] = [];
  const flushList = () => {
    if (listBuf.length) {
      out.push(
        <ul key={`ul-${out.length}`} className="my-3 ml-5 list-disc space-y-1">
          {listBuf.map((li, i) => <li key={i}>{splitBold(li)}</li>)}
        </ul>
      );
      listBuf = [];
    }
  };
  lines.forEach((raw, i) => {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) { flushList(); return; }
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) { listBuf.push(bullet[1]); return; }
    flushList();
    // Header-only line (whole line bold)
    const headerMatch = line.match(/^\*\*([^*]+)\*\*\s*[—-]?\s*(.*)$/);
    if (headerMatch && headerMatch[2] === "") {
      out.push(<h3 key={i} className="mt-6 mb-3 text-xl font-bold text-foreground">{headerMatch[1]}</h3>);
      return;
    }
    if (headerMatch && headerMatch[2]) {
      out.push(
        <p key={i} className="mb-4">
          <span className="font-bold">{headerMatch[1]}</span> — {splitBold(headerMatch[2])}
        </p>
      );
      return;
    }
    out.push(<p key={i} className="mb-4">{splitBold(line)}</p>);
  });
  flushList();
  return out;
}

function splitBold(line: string): ReactNode {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

// ===== Build-it-with-AI launchers (Product step) =====
function BuildItWithAI({ output, plan }: { output: string; plan: PlanRow }) {
  const niche = plan?.niche ?? "";
  const prompt = [
    `You are helping me actually BUILD the digital product described below. I'm a beginner — walk me through it step by step, write the actual content for me, and don't assume technical knowledge.`,
    ``,
    `MY NICHE: ${niche || "(see below)"}`,
    ``,
    `THE PRODUCT BLUEPRINT MY COACH GAVE ME:`,
    output,
    ``,
    `START BY: writing the full first section/module of this product for me, in a friendly, conversational voice my audience will love. Then ask me one question before continuing to section 2.`,
  ].join("\n");

  const tools = [
    { name: "ChatGPT", emoji: "💬", url: "chatgpt.com", note: "Best beginner choice" },
    { name: "Claude", emoji: "🧠", url: "claude.ai", note: "Great for long drafts" },
    { name: "Gemini", emoji: "✨", url: "gemini.google.com", note: "Good Google option" },
  ];

  const [copied, setCopied] = useState(false);
  const [copiedTool, setCopiedTool] = useState<string | null>(null);
  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyForTool = async (toolName: string) => {
    await navigator.clipboard.writeText(prompt);
    setCopiedTool(toolName);
    setTimeout(() => setCopiedTool(null), 3000);
  };

  return (
    <div className="mt-8 rounded-2xl border-2 border-dashed border-[oklch(0.62_0.27_348/0.4)] bg-[oklch(0.62_0.27_348/0.05)] p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="text-3xl">🚀</span>
        <div>
          <h3 className="text-xl font-extrabold text-foreground">Now let's actually BUILD it</h3>
          <p className="mt-1 text-base text-muted-foreground">
            Pick your AI helper below. In preview, outside AI sites block automatic opening, so this safely copies your prompt first.
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {tools.map((tool) => (
          <button
            key={tool.name}
            type="button"
            onClick={() => copyForTool(tool.name)}
            className="rounded-xl border-2 border-border bg-white p-4 text-left text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[oklch(0.62_0.27_348)] hover:shadow-md"
          >
            <div className="flex items-center gap-2 text-lg font-extrabold"><span>{tool.emoji}</span>{tool.name}</div>
            <p className="mt-1 text-sm font-semibold text-slate-600">{tool.note}</p>
            <p className="mt-3 text-base font-bold text-[oklch(0.62_0.27_348)]">
              {copiedTool === tool.name ? "✓ Prompt copied" : "Copy prompt"}
            </p>
            <p className="mt-1 text-sm text-slate-500">Then open {tool.url} in a normal browser tab and paste.</p>
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          onClick={copyPrompt}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-border bg-background px-5 py-3 text-base font-bold transition hover:border-foreground/40"
        >
          {copied ? "✓ Copied prompt!" : "📋 Copy the prompt"}
        </button>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        💡 This avoids the preview-window error. After publishing, you can still use the same copy-and-paste flow from the live site.
      </p>
    </div>
  );
}

// ===== Storefront walkthrough (videos + step cards) =====
function StorefrontWalkthrough() {
  // Curated YouTube tutorial for Beacons
  const videos = [
    { id: "wbWtUDfpacE", title: "Beacons.ai — Complete Beginner Walkthrough", platform: "Beacons" },
  ];
  const steps = [
    { n: 1, t: "Create your account", d: 'Go to beacons.ai. Sign up with the email you check every day — not a random one. Pick a username that\'s your name or your niche (e.g. @ClaireAtHome).' },
    { n: 2, t: "Add a real profile photo", d: "Take a fresh selfie in good light, smiling. No logo, no stock image. People buy from faces they trust." },
    { n: 3, t: "Write your one-line bio", d: 'Format: "I help [who] do [what] without [the pain point]." Example: "I help busy moms get dinner on the table in 20 minutes — without takeout guilt."' },
    { n: 4, t: "Add your free thing first", d: "Before you sell anything, give a free PDF or checklist in exchange for an email. This is your list. Your list is the business." },
    { n: 5, t: "Add your product block", d: "Upload your PDF/guide, set the price, write a 2-sentence pitch. Don't overthink the description — short beats clever." },
    { n: 6, t: "Test it on your phone", d: "Open your link on your phone. Tap every button. Buy your own product with PayPal. If it works for you, it works for them." },
  ];
  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-2xl border-2 border-dashed border-[oklch(0.55_0.22_295/0.4)] bg-[oklch(0.55_0.22_295/0.05)] p-6">
        <div className="mb-4 flex items-start gap-3">
          <span className="text-3xl">📺</span>
          <div>
            <h3 className="text-xl font-extrabold text-foreground">Watch someone set it up first</h3>
            <p className="mt-1 text-base text-muted-foreground">
              Seeing it done makes everything click. Pick the platform you're using, watch once start to finish, then come back and do yours.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-lg">
          {videos.map((v) => (
            <a
              key={v.id}
              href={`https://www.youtube.com/watch?v=${v.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative aspect-video bg-black">
                <img
                  src={`https://img.youtube.com/vi/${v.id}/maxresdefault.jpg`}
                  alt={v.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`;
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/20">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110">
                    <svg className="ml-1 h-6 w-6 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{v.platform}</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{v.title}</p>
                </div>
                <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition-colors group-hover:bg-red-100">Watch on YouTube →</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-[oklch(0.65_0.22_35/0.4)] bg-[oklch(0.65_0.22_35/0.05)] p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="text-3xl">🛠️</span>
          <div>
            <h3 className="text-xl font-extrabold text-foreground">The 6-step setup, plain and simple</h3>
            <p className="mt-1 text-base text-muted-foreground">Knock these out in one sitting. ~45 minutes total.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {steps.map((s) => (
            <div key={s.n} className="rounded-xl border border-border bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white" style={{ background: "var(--gradient-brand)" }}>{s.n}</span>
                <div>
                  <p className="text-base font-bold text-slate-900">{s.t}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.d}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== Launch calendar (parsed 30-day grid + platform basics) =====
function LaunchCalendar({ output }: { output: string }) {
  // Parse "**Day N:** ..." lines out of the markdown
  const days = useMemo(() => {
    const found: { day: number; text: string }[] = [];
    const re = /\*\*Day\s+(\d+):?\*\*\s*([^\n]+)/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(output)) !== null) {
      found.push({ day: parseInt(m[1], 10), text: m[2].trim() });
    }
    return found.sort((a, b) => a.day - b.day);
  }, [output]);

  // Detect recommended platform from output
  const platform = useMemo(() => {
    const o = output.toLowerCase();
    if (o.includes("instagram")) return "instagram";
    if (o.includes("facebook")) return "facebook";
    if (o.includes("pinterest")) return "pinterest";
    if (o.includes("tiktok")) return "tiktok";
    return null;
  }, [output]);

  const basics: Record<string, { title: string; steps: string[] }> = {
    instagram: {
      title: "Instagram basics — how to actually post",
      steps: [
        "Open the Instagram app. Tap the **+** at the bottom of the screen.",
        'Choose **Post** for a photo, **Reel** for a short video, or **Story** for a 24-hour update.',
        "Pick or record your content. Hit Next.",
        "Paste your caption (we wrote one for you above). Add 5–10 hashtags at the bottom.",
        "Tap **Share**. Done. Reply to every comment in the first hour — Instagram rewards it.",
      ],
    },
    facebook: {
      title: "Facebook basics — how to actually post",
      steps: [
        "Open Facebook. On the home screen, tap **What's on your mind?**.",
        "Type or paste your post. Add a photo with the photo icon.",
        "Set who can see it (Public for growth, Friends for warmth).",
        "Tap **Post**. For a group, post inside the group instead — engagement is much higher.",
        "Come back 30 minutes later and reply to every comment.",
      ],
    },
    pinterest: {
      title: "Pinterest basics — how to actually post",
      steps: [
        "Open Pinterest. Tap the **+** in the bottom right and choose **Pin**.",
        "Upload a tall vertical image (1000x1500 works best — make it in Canva).",
        "Write a keyword-rich title. Pinterest is a search engine, not a feed.",
        "Add a description with 3–5 relevant keywords. Paste your link.",
        "Pick a board that matches the topic. Tap **Publish**.",
      ],
    },
    tiktok: {
      title: "TikTok basics — how to actually post",
      steps: [
        "Open TikTok. Tap the **+** at the bottom center.",
        "Record up to 60 seconds, or upload a clip from your phone.",
        "Add trending audio (tap the music icon at the top — pick something with under 100k uses).",
        "Write a hook in the first 3 seconds of your caption. Add 3–5 hashtags.",
        "Tap **Post**. Don't delete a video that flops — leave it. Post again tomorrow.",
      ],
    },
  };

  return (
    <div className="mt-8 space-y-6">
      {days.length > 0 && (
        <div className="rounded-2xl border-2 border-dashed border-[oklch(0.62_0.27_348/0.4)] bg-[oklch(0.62_0.27_348/0.05)] p-6">
          <div className="mb-5 flex items-start gap-3">
            <span className="text-3xl">📅</span>
            <div>
              <h3 className="text-xl font-extrabold text-foreground">Your 30-day calendar — at a glance</h3>
              <p className="mt-1 text-base text-muted-foreground">One square = one day. Click any day to expand it. Check 'em off as you go.</p>
            </div>
          </div>
          <CalendarGrid days={days} />
        </div>
      )}

      {platform && basics[platform] && (
        <div className="rounded-2xl border-2 border-dashed border-[oklch(0.65_0.22_35/0.4)] bg-[oklch(0.65_0.22_35/0.05)] p-6">
          <div className="mb-4 flex items-start gap-3">
            <span className="text-3xl">📱</span>
            <div>
              <h3 className="text-xl font-extrabold text-foreground">{basics[platform].title}</h3>
              <p className="mt-1 text-base text-muted-foreground">No assumptions. Here's exactly what to tap.</p>
            </div>
          </div>
          <ol className="space-y-3">
            {basics[platform].steps.map((s, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border border-border bg-white p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white" style={{ background: "var(--gradient-brand)" }}>{i + 1}</span>
                <span className="text-base leading-relaxed text-slate-800">{splitBold(s)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function CalendarGrid({ days }: { days: { day: number; text: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const map = new Map(days.map((d) => [d.day, d.text]));
  const cells = Array.from({ length: 30 }, (_, i) => i + 1);
  return (
    <div>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-7 sm:gap-3">
        {cells.map((n) => {
          const has = map.has(n);
          const isOpen = open === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setOpen(isOpen ? null : n)}
              disabled={!has}
              className={`relative aspect-square rounded-xl border-2 text-sm font-bold transition-all ${
                isOpen
                  ? "border-transparent text-white shadow-md"
                  : has
                  ? "border-border bg-white text-slate-900 hover:-translate-y-0.5 hover:border-[oklch(0.62_0.27_348)] hover:shadow-sm"
                  : "cursor-not-allowed border-border/40 bg-background/40 text-muted-foreground/50"
              }`}
              style={isOpen ? { background: "var(--gradient-brand)" } : undefined}
            >
              <span className="absolute left-2 top-1.5 text-[10px] font-bold uppercase opacity-70">Day</span>
              <span className="text-lg">{n}</span>
            </button>
          );
        })}
      </div>
      {open !== null && map.has(open) && (
        <div className="mt-4 rounded-xl border-2 border-[oklch(0.62_0.27_348/0.4)] bg-white p-5 shadow-sm xcel-fade-up">
          <p className="text-xs font-extrabold uppercase tracking-widest text-[oklch(0.55_0.22_295)]">Day {open}</p>
          <p className="mt-2 text-base leading-relaxed text-slate-900">{splitBold(map.get(open)!)}</p>
        </div>
      )}
    </div>
  );
}
