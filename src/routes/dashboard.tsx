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
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[oklch(0.65_0.20_145)]" />
              {completedCount === 0 ? "Let's start fresh" : completedCount === 4 ? "You did the whole thing 🎉" : `${completedCount} of 4 done — keep going`}
            </div>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
              Hey — let's build{" "}
              <span className="bg-gradient-to-r from-[oklch(0.65_0.22_35)] via-[oklch(0.62_0.27_348)] to-[oklch(0.55_0.22_295)] bg-clip-text text-transparent">
                your thing
              </span>{" "}
              👋
            </h1>
            <p className="mt-2 text-muted-foreground">Four steps. No fluff. You'll have something real today.</p>
            {remaining !== null && (
              <p className="mt-2 text-xs text-muted-foreground">{remaining} of 20 AI requests left today</p>
            )}
          </div>
          {(plan?.niche || plan?.starting_point_output) && (
            <button onClick={handleStartFresh}
              className="rounded-full border border-border bg-card/80 px-4 py-2 text-xs font-semibold text-muted-foreground backdrop-blur transition hover:border-foreground/40 hover:text-foreground">
              ↺ Start fresh
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-8 xcel-fade-up" style={{ animationDelay: "0.05s" }}>
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Your launch progress</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-border/60">
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
                    style={{ background: "linear-gradient(135deg, oklch(0.97 0.04 55) 0%, oklch(0.96 0.05 340) 100%)" }}
                  />
                )}
                {active && (
                  <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: "var(--gradient-brand)" }} />
                )}
                <div className="flex items-center justify-between">
                  <span className={`text-2xl leading-none transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}>{t.emoji}</span>
                  {done && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.95_0.08_145)] px-2 py-0.5 text-[10px] font-bold text-[oklch(0.45_0.15_145)]">
                      ✓ Done
                    </span>
                  )}
                </div>
                <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Step {t.num}</div>
                <div className="mt-1 text-sm font-bold leading-tight">{t.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{t.subtitle}</div>
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
        />
      </section>
    </main>
  );
}

// ===== Tool panel =====
function ToolPanel({
  tool, plan, onComplete, onUsage, disabled,
}: {
  tool: ToolKey;
  plan: PlanRow;
  onComplete: () => void;
  onUsage: (remaining: number) => void;
  disabled: boolean;
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

          <button type="submit" disabled={streaming || disabled}
            className="group relative w-full overflow-hidden rounded-xl px-6 py-3.5 text-base font-bold text-white shadow-[0_10px_30px_-10px_oklch(0.62_0.27_348/0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_40px_-10px_oklch(0.62_0.27_348/0.65)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            style={{ background: "var(--gradient-brand)" }}>
            <span className="relative z-10">
              {streaming ? "✨ Cooking it up…" : output ? "↺ Try again with new info" : "✨ Show me what to do"}
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
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
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
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[oklch(0.96_0.05_340)] px-3 py-1 text-xs font-semibold text-[oklch(0.50_0.20_348)]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[oklch(0.62_0.27_348)]" /> Streaming live
                </div>
              )}
              <div className="prose-xcel text-[15px] leading-relaxed text-foreground">{renderMarkdown(output)}</div>
              {!streaming && (
                <div className="mt-6 flex flex-wrap gap-2">
                  <button onClick={handleCopy} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:border-foreground/40 hover:bg-accent">
                    {copied ? "✓ Copied!" : "📋 Copy"}
                  </button>
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
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Step {t.num} of 4</p>
        <h2 className="mt-0.5 text-2xl font-extrabold leading-tight">{t.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
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
        <span className="block text-sm font-bold text-foreground">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>}
        <div className={`relative mt-2 rounded-xl border bg-background transition-all duration-200 ${
          active ? "border-[oklch(0.62_0.27_348/0.4)] shadow-[0_0_0_4px_oklch(0.62_0.27_348/0.08)]" : "border-input hover:border-foreground/30"
        } focus-within:border-[oklch(0.62_0.27_348/0.6)] focus-within:shadow-[0_0_0_4px_oklch(0.62_0.27_348/0.12)]`}>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            rows={2}
            maxLength={1000}
            className="w-full resize-none rounded-xl bg-transparent px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:opacity-60"
          />
        </div>
      </label>
      {chips && chips.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {chips.map((chip, i) => {
            const selected = value === chip;
            return (
              <button
                key={chip}
                type="button"
                disabled={disabled}
                onClick={() => onChange(chip)}
                className={`xcel-pop rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 ${
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
      out.push(<h3 key={i} className="mt-5 mb-2 text-base font-bold text-foreground">{headerMatch[1]}</h3>);
      return;
    }
    if (headerMatch && headerMatch[2]) {
      out.push(
        <p key={i} className="mb-3">
          <span className="font-bold">{headerMatch[1]}</span> — {splitBold(headerMatch[2])}
        </p>
      );
      return;
    }
    out.push(<p key={i} className="mb-3">{splitBold(line)}</p>);
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
