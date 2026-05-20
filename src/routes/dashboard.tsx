import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import xcelerateLogo from "@/assets/xcelerate-logo.png";
import { jsPDF } from "jspdf";
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

const VinylRecord = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" style={{ display: "inline-block", verticalAlign: "-0.125em", filter: "drop-shadow(0 0 6px #00F0D1) drop-shadow(0 0 12px rgba(0,240,209,0.7))" }}>
    <circle cx="12" cy="12" r="11" fill="#0B0B0D" stroke="#00F0D1" strokeWidth="0.6" />
    <circle cx="12" cy="12" r="9.2" fill="none" stroke="#2a2a2a" strokeWidth="0.3" />
    <circle cx="12" cy="12" r="7.6" fill="none" stroke="#2a2a2a" strokeWidth="0.3" />
    <circle cx="12" cy="12" r="6.0" fill="none" stroke="#2a2a2a" strokeWidth="0.3" />
    <circle cx="12" cy="12" r="4.4" fill="#FE2DA3" />
    <circle cx="12" cy="12" r="0.7" fill="#0B0B0D" />
  </svg>
);

const TOOLS: { key: ToolKey; num: number; emoji: ReactNode; title: string; subtitle: string }[] = [
  { key: "starting_point", num: 1, emoji: "⚡",            title: "Find Your Lane",   subtitle: "Get unstuck in 60 seconds" },
  { key: "product",        num: 2, emoji: <VinylRecord />, title: "Build Your Thing", subtitle: "A real product. No maybes." },
  { key: "storefront",     num: 3, emoji: "📼",            title: "Open Your Shop",   subtitle: "Beacons in one sitting" },
  { key: "launch_plan",    num: 4, emoji: "🎸",            title: "Launch & Sell",    subtitle: "Your 30-day game plan" },
];

const NEXT_TOOL: Partial<Record<ToolKey, ToolKey>> = {
  starting_point: "product",
  product: "storefront",
  storefront: "launch_plan",
};

type PlanRow = {
  niche: string | null; roadblock: string | null; day: string | null;
  transformation: string | null; who_help: string | null;
  their_frustration: string | null; their_dream: string | null;
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
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="xcel-kicker xcel-flicker">Powering up…</p>
      </main>
    );
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
      {/* Retro neon background — grid floor + sunset blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 top-1/2"><div className="xcel-grid-floor" /></div>
        <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-[#FE2DA3] opacity-25 blur-3xl xcel-blob" />
        <div className="absolute top-40 -right-32 h-[480px] w-[480px] rounded-full bg-[#8A2BE2] opacity-25 blur-3xl xcel-blob" style={{ animationDelay: "-6s" }} />
        <div className="absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-[#00F0D1] opacity-15 blur-3xl xcel-blob" style={{ animationDelay: "-12s" }} />
      </div>

      <header className="relative border-b border-[#FE2DA3]/20 bg-black/40 backdrop-blur-md">
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #FE2DA3 30%, #00F0D1 70%, transparent)" }} />
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <img src={xcelerateLogo} alt="Xcelerate" className="h-10 w-auto drop-shadow-[0_0_12px_rgba(254,45,163,0.55)]" />
          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-[11px] uppercase tracking-widest text-[#00F0D1]/80 sm:inline">{email}</span>
            <button onClick={handleLogout} className="xcel-kicker transition hover:text-[#00F0D1]">
              Log out
            </button>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 xcel-fade-up">
          <div>
            <h1 className="relative inline-block text-left">
              <span className="sr-only">Xcelerate Ignition Lab</span>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(closest-side, rgba(254,45,163,0.55), rgba(138,43,226,0.35) 45%, rgba(0,240,209,0.22) 72%, transparent 82%)",
                  filter: "blur(32px)",
                  transform: "scale(1.2)",
                }}
              />
              <img
                src={xcelerateLogo}
                alt="Xcelerate Ignition Lab"
                className="relative h-28 w-auto sm:h-36 md:h-44 drop-shadow-[0_0_22px_rgba(254,45,163,0.7)]"
              />
            </h1>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#FE2DA3]/40 bg-black/60 px-3 py-1 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00F0D1] shadow-[0_0_8px_#00F0D1]" />
              <span className="xcel-kicker text-[#F5F2EC]">
                {completedCount === 0 ? "Side A — Track 1" : completedCount === 4 ? "Album complete — go gold" : `${completedCount} of 4 in the can`}
              </span>
            </div>
            <p className="mt-4 max-w-md font-sans text-base normal-case tracking-normal text-[#F5F2EC]/75">
              Four tracks. No filler. You walk out tonight with something real.
            </p>
            {remaining !== null && (
              <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-[#00F0D1]/80">
                ▮ {remaining} of 20 AI runs left today
              </p>
            )}
          </div>
          {(plan?.niche || plan?.starting_point_output) && (
            <button onClick={handleStartFresh}
              className="xcel-btn-ghost rounded-full px-4 py-2 text-xs">
              ↺ Rewind tape
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-8 xcel-fade-up" style={{ animationDelay: "0.05s" }}>
          <div className="mb-2 flex items-center justify-between">
            <span className="xcel-kicker">Launch sequence</span>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#00F0D1]">{Math.round(progressPct)}%</span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full border border-[#FE2DA3]/30 bg-black/60">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #FE2DA3, #8A2BE2, #00F0D1)", boxShadow: "0 0 16px rgba(254,45,163,0.7)" }}
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
                    ? "-translate-y-0.5 border-[#FE2DA3]/60 bg-[#141418] shadow-[0_0_24px_rgba(254,45,163,0.35)]"
                    : "border-white/10 bg-black/40 backdrop-blur hover:-translate-y-0.5 hover:border-[#00F0D1]/40 hover:shadow-[0_0_18px_rgba(0,240,209,0.18)]"
                }`}
                style={{ animationDelay: `${0.08 + i * 0.05}s` }}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-0 -z-10 opacity-100"
                    style={{ background: "linear-gradient(135deg, rgba(254,45,163,0.18) 0%, rgba(138,43,226,0.18) 100%)" }}
                  />
                )}
                {active && (
                  <span aria-hidden className="absolute inset-x-0 top-0 h-[2px]" style={{ background: "linear-gradient(90deg, #FE2DA3, #00F0D1)", boxShadow: "0 0 10px #FE2DA3" }} />
                )}
                <div className="flex items-center justify-between">
                  <span className={`text-2xl leading-none transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}>{t.emoji}</span>
                  {done && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#00F0D1]/50 bg-[#00F0D1]/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#00F0D1] shadow-[0_0_10px_rgba(0,240,209,0.35)]">
                      ✓ Cut
                    </span>
                  )}
                </div>
                <div className="mt-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#FE2DA3]">Track 0{t.num}</div>
                <div className="mt-1 font-[var(--font-display)] text-lg leading-tight tracking-wide text-[#F5F2EC]" style={{ fontFamily: "Anton, sans-serif", textTransform: "uppercase" }}>{t.title}</div>
                <div className="mt-1 text-xs normal-case tracking-normal text-[#F5F2EC]/60">{t.subtitle}</div>
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
  // expertise excavation (Stage 1 of starting point)
  const [transformation, setTransformation] = useState(plan?.transformation ?? "");
  const [whoHelp, setWhoHelp] = useState(plan?.who_help ?? "");
  const [theirFrustration, setTheirFrustration] = useState(plan?.their_frustration ?? "");
  const [theirDream, setTheirDream] = useState(plan?.their_dream ?? "");
  // product
  const [productNotes, setProductNotes] = useState("");
  // storefront
  const [storefrontNotes, setStorefrontNotes] = useState("");
  // launch plan
  const [hoursPerDay, setHoursPerDay] = useState("");
  const [platformPreference, setPlatformPreference] = useState("");

  // ===== Starting-point stepper (one card at a time) =====
  const startingPointSteps = useMemo(() => ([
    {
      label: "What pro problem can you solve in your sleep?",
      hint: "The thing people already come to you for. The thing you'd do half-asleep, no coffee.",
      value: niche, set: setNiche, required: true,
      placeholder: 'e.g. "Building marketing strategies, managing teams, creating systems..." — or "Honestly, not sure yet"',
      chips: ["Honestly? Not sure yet","Meal planning & easy recipes","Helping women restart their careers","Decluttering & home organization","Faith + family life","Menopause wellness"],
    },
    {
      label: "What transformation have YOU personally been through?",
      hint: "Your story is the receipt. What did you walk through and come out the other side of?",
      value: transformation, set: setTransformation, required: false,
      placeholder: 'e.g. "Starting over at 50, building confidence, leaving corporate..."',
      chips: ["Started over after 50","Left corporate, never looked back","Rebuilt my confidence post-divorce","Survived burnout","Empty nest, full reinvention"],
    },
    {
      label: "Describe who you most want to help.",
      hint: "Picture one real human. Age, life stage, what's on her plate.",
      value: whoHelp, set: setWhoHelp, required: true,
      placeholder: 'e.g. "A 50-year-old corporate professional ready to start consulting..."',
      chips: ["Gen X woman, mid-career pivot","Empty-nester ready for act two","Corporate escapee, first-time consultant","Mom going back to work after years off","Recently divorced, rebuilding income"],
    },
    {
      label: "What's her biggest frustration right now?",
      hint: "The thing that keeps her up at 2am. Be specific — no fluff.",
      value: theirFrustration, set: setTheirFrustration, required: true,
      placeholder: 'e.g. "She knows she has expertise but doesn\u2019t know how to package it..."',
      chips: ["Has the expertise, can't package it","Sick of being invisible at work","Stuck trading hours for dollars","Doesn't know where to even start","Tech makes her freeze up"],
    },
    {
      label: "What does she desperately want to achieve?",
      hint: "The thing she'd pay almost anything to make real.",
      value: theirDream, set: setTheirDream, required: true,
      placeholder: 'e.g. "Financial independence, recognition for her expertise, freedom to work from anywhere..."',
      chips: ["Financial independence","Recognition for her expertise","Freedom to work from anywhere","An income that doesn't need her boss","Time back with her people"],
    },
    {
      label: "What's the thing that keeps tripping you up?",
      hint: "Be real — this is where most people quit.",
      value: roadblock, set: setRoadblock, required: true,
      placeholder: "e.g. I keep changing my mind every week",
      chips: ["I keep changing my niche","Tech overwhelms me","I feel like I'm too late","I don't know what to sell","Scared nobody will care"],
    },
    {
      label: "What does a normal day look like for you?",
      hint: "So we don't build a plan you can't actually do.",
      value: day, set: setDay, required: true,
      placeholder: 'e.g. "1 hour after the kids are in bed"',
      chips: ["30 mins early morning","1-2 hours after kids/work","Weekends mostly","I homeschool — it's chaos","I work full-time"],
    },
  ]), [niche, transformation, whoHelp, theirFrustration, theirDream, roadblock, day]);

  const [spStep, setSpStep] = useState(0);
  const isLastStep = spStep === startingPointSteps.length - 1;
  const currentStep = startingPointSteps[spStep];
  const canAdvance = !currentStep.required || currentStep.value.trim().length > 0;

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
      | { tool: "starting_point"; niche: string; roadblock: string; day: string; transformation: string; whoHelp: string; theirFrustration: string; theirDream: string }
      | { tool: "product"; productNotes: string }
      | { tool: "storefront"; storefrontNotes: string }
      | { tool: "launch_plan"; hoursPerDay: string; platformPreference: string };
    let payload: GenInput;
    if (tool === "starting_point") {
      if (!niche.trim() || !whoHelp.trim() || !theirFrustration.trim() || !theirDream.trim() || !roadblock.trim() || !day.trim()) {
        setErrorMsg("Fill in the starred fields so we can dig in. Transformation is optional.");
        return;
      }
      payload = { tool: "starting_point", niche, roadblock, day, transformation, whoHelp, theirFrustration, theirDream };
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
    <div className="xcel-card xcel-scanlines relative overflow-hidden p-6 backdrop-blur-md sm:p-8 xcel-fade-up">
      <span aria-hidden className="absolute inset-x-0 top-0 h-[2px]" style={{ background: "linear-gradient(90deg, #FE2DA3, #8A2BE2, #00F0D1)", boxShadow: "0 0 12px #FE2DA3" }} />
      <ToolHeader tool={tool} />

      {prerequisite ? (
        <div className="mt-6 rounded-md border border-[#00F0D1]/30 bg-black/40 p-5 text-sm text-[#F5F2EC]/80">
          {prerequisite}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {tool === "starting_point" && (
            <>
              {/* Stage 1 header — Expertise Excavation */}
              <div className="relative -mx-2 mb-2 rounded-2xl border border-[#FE2DA3]/40 bg-black/60 px-5 py-5 shadow-[0_0_24px_rgba(254,45,163,0.18)] sm:-mx-0">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#00F0D1]/90">Stage 01 — Expertise Excavation</p>
                <h3
                  className="mt-1 text-3xl leading-none sm:text-4xl"
                  style={{
                    fontFamily: "Anton, sans-serif",
                    textTransform: "uppercase",
                    color: "#FE2DA3",
                    textShadow: "0 0 10px rgba(254,45,163,0.85), 0 0 22px rgba(254,45,163,0.55), 0 0 40px rgba(254,45,163,0.35)",
                    letterSpacing: "0.02em",
                  }}
                >
                  What's Your Goldmine?
                </h3>
                <p
                  className="mt-2 text-sm sm:text-base"
                  style={{
                    fontFamily: "var(--font-sub)",
                    color: "#00F0D1",
                    textShadow: "0 0 8px rgba(0,240,209,0.45)",
                  }}
                >
                  You know more than you think. Let's dig it out.
                </p>
              </div>

              {/* Stepper progress */}
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#F5F2EC]/60">
                  Question {String(spStep + 1).padStart(2, "0")} <span className="text-[#F5F2EC]/30">of {String(startingPointSteps.length).padStart(2, "0")}</span>
                </p>
                <div className="flex flex-1 items-center gap-1.5">
                  {startingPointSteps.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSpStep(i)}
                      disabled={streaming}
                      aria-label={`Go to question ${i + 1}`}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        i < spStep
                          ? "bg-[#00F0D1] shadow-[0_0_8px_#00F0D1]"
                          : i === spStep
                            ? "bg-[#FE2DA3] shadow-[0_0_10px_#FE2DA3]"
                            : "bg-white/10 hover:bg-white/20"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <Field
                key={spStep}
                label={currentStep.label}
                hint={currentStep.hint}
                value={currentStep.value}
                onChange={currentStep.set}
                disabled={streaming}
                placeholder={currentStep.placeholder}
                chips={currentStep.chips}
              />

              {!isLastStep && (
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSpStep((s) => Math.max(0, s - 1))}
                    disabled={streaming || spStep === 0}
                    className="xcel-btn-ghost rounded-xl px-5 py-3 text-xs disabled:opacity-30"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (canAdvance) setSpStep((s) => Math.min(startingPointSteps.length - 1, s + 1)); else setErrorMsg("Give this one a shot before moving on."); }}
                    disabled={streaming || !canAdvance}
                    className="xcel-btn-neon group relative flex-1 overflow-hidden rounded-xl px-6 py-4 text-base disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="relative z-10">Next →</span>
                    <span aria-hidden className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  </button>
                </div>
              )}
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
                  "Quick-Win Guide",
                  "Mini Workshop",
                  "Template Toolkit",
                  "Workbook / Planner",
                  "Mini Course",
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
            <p className="rounded-md border border-[#FF3B6B]/40 bg-[#FF3B6B]/10 px-4 py-3 text-sm font-semibold text-[#FF8FAA]">{errorMsg}</p>
          )}

          {disabled && !streaming && (
            <p className="rounded-xl border border-[#00F0D1]/40 bg-[#00F0D1]/10 px-4 py-3 text-sm font-semibold text-[#00F0D1]">
              That's a wrap — all 20 AI runs burned for today. Tape resets at midnight. Come back tomorrow and pick up where you left off.
            </p>
          )}

          {(tool !== "starting_point" || isLastStep) && (
            <button type="submit" disabled={streaming || disabled}
              className="xcel-btn-neon group relative w-full overflow-hidden rounded-xl px-6 py-4 text-base disabled:cursor-not-allowed disabled:opacity-60">
              <span className="relative z-10">
                {streaming
                  ? "⚡ Recording…"
                  : disabled
                    ? "🚫 Out of runs for today"
                    : output
                      ? "↺ Run it again"
                      : tool === "starting_point"
                        ? "DIG DEEPER →"
                        : "⚡ Drop the needle"}
              </span>
              {!streaming && (
                <span aria-hidden className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              )}
            </button>
          )}
          {tool === "starting_point" && isLastStep && (
            <button
              type="button"
              onClick={() => setSpStep((s) => Math.max(0, s - 1))}
              disabled={streaming}
              className="xcel-btn-ghost mt-2 w-full rounded-xl px-5 py-3 text-xs"
            >
              ← Back
            </button>
          )}
        </form>
      )}

      {(output || streaming) && (
        <div ref={outputRef} className="relative mt-8 overflow-hidden rounded-2xl border border-[#00F0D1]/30 bg-black/60 p-6 shadow-[0_0_24px_rgba(0,240,209,0.10)] xcel-fade-up">
          {streaming && !output && (
            <div className="flex flex-col items-start gap-4 py-6">
              <div className="flex items-center gap-2 text-base font-semibold text-[#F5F2EC]">
                <span className="inline-flex gap-1">
                  <span className="h-2 w-2 rounded-full shadow-[0_0_8px_#FE2DA3]" style={{ background: "#FE2DA3", animation: "xcel-bounce-dot 1.4s infinite ease-in-out", animationDelay: "0s" }} />
                  <span className="h-2 w-2 rounded-full shadow-[0_0_8px_#8A2BE2]" style={{ background: "#8A2BE2", animation: "xcel-bounce-dot 1.4s infinite ease-in-out", animationDelay: "0.16s" }} />
                  <span className="h-2 w-2 rounded-full shadow-[0_0_8px_#00F0D1]" style={{ background: "#00F0D1", animation: "xcel-bounce-dot 1.4s infinite ease-in-out", animationDelay: "0.32s" }} />
                </span>
                <span className="xcel-kicker normal-case tracking-widest text-[#00F0D1]">Cari's AI is cooking…</span>
              </div>
              <div className="w-full space-y-2">
                <div className="h-3 w-2/3 rounded-full bg-white/5 xcel-shimmer" />
                <div className="h-3 w-full rounded-full bg-white/5 xcel-shimmer" />
                <div className="h-3 w-5/6 rounded-full bg-white/5 xcel-shimmer" />
              </div>
            </div>
          )}
          {output && (
            <>
              {streaming && (
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FE2DA3]/50 bg-[#FE2DA3]/10 px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-[#FE2DA3]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FE2DA3] shadow-[0_0_6px_#FE2DA3]" /> ● REC — live
                </div>
              )}
              {tool === "starting_point" ? (
                <BlueprintCard
                  output={output}
                  streaming={streaming}
                  plan={plan}
                  onAdvance={() => onAdvance("product")}
                />
              ) : (
                <OutputCards output={output} streaming={streaming} />
              )}
              {!streaming && tool === "product" && (
                <BuildItWithAI output={output} plan={plan} />
              )}
              {!streaming && tool === "storefront" && (
                <StorefrontWalkthrough />
              )}
              {!streaming && tool === "launch_plan" && (
                <LaunchCalendar output={output} />
              )}
              {!streaming && tool !== "starting_point" && (
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button onClick={handleCopy} className="xcel-btn-ghost inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs">
                    {copied ? "✓ Copied!" : "📋 Copy"}
                  </button>
                  {NEXT_TOOL[tool] && (
                    <button
                      type="button"
                      onClick={() => onAdvance(NEXT_TOOL[tool]!)}
                      className="xcel-btn-neon group ml-auto inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm"
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
    <div className="relative z-10 flex items-start gap-4">
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
        style={{ background: "linear-gradient(135deg, #FE2DA3 0%, #8A2BE2 100%)", boxShadow: "0 0 24px rgba(254,45,163,0.55), inset 0 1px 0 rgba(255,255,255,0.3)" }}
      >
        <span className="drop-shadow-sm">{t.emoji}</span>
      </div>
      <div className="min-w-0">
        <p className="xcel-kicker">Track 0{t.num} / 04</p>
        <h2 className="mt-1 text-3xl leading-tight tracking-wide text-[#F5F2EC]" style={{ fontFamily: "Anton, sans-serif", textTransform: "uppercase" }}>{t.title}</h2>
        <p className="mt-1.5 text-sm normal-case tracking-normal text-[#F5F2EC]/70">{t.subtitle}</p>
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
    <div className="rounded-md border border-[#8A2BE2]/40 bg-[#8A2BE2]/5 p-4">
      <p className="xcel-kicker mb-2 text-[#C8A4FF]">From your liner notes</p>
      <ul className="space-y-1 text-sm text-[#F5F2EC]/80">
        {items.map((i) => (
          <li key={i.label}><span className="font-bold text-[#F5F2EC]">{i.label}:</span> <span className="text-[#F5F2EC]/70">{i.value.length > 100 ? i.value.slice(0, 100) + "…" : i.value}</span></li>
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
    <div
      className={`group relative rounded-2xl border bg-black/60 p-7 sm:p-9 backdrop-blur-sm transition-all duration-300 ${
        active
          ? "border-[#00F0D1]/60 shadow-[0_0_28px_rgba(0,240,209,0.30),inset_0_0_22px_rgba(0,240,209,0.10)]"
          : "border-[#FE2DA3]/35 shadow-[0_0_22px_rgba(254,45,163,0.22),inset_0_0_18px_rgba(254,45,163,0.06)] hover:border-[#FE2DA3]/55 hover:shadow-[0_0_30px_rgba(254,45,163,0.32),inset_0_0_22px_rgba(254,45,163,0.08)]"
      }`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] rounded-t-2xl"
        style={{
          background: active
            ? "linear-gradient(90deg, transparent, #00F0D1, transparent)"
            : "linear-gradient(90deg, transparent, #FE2DA3, #8A2BE2, transparent)",
          boxShadow: active ? "0 0 12px #00F0D1" : "0 0 12px #FE2DA3",
        }}
      />
      <label className="block">
        <span className="block text-lg sm:text-xl font-bold normal-case tracking-normal text-[#F5F2EC]" style={{ fontFamily: "var(--font-sub)" }}>{label}</span>
        {hint && <span className="mt-2 block text-sm sm:text-[15px] font-normal normal-case tracking-normal text-[#F5F2EC]/65">{hint}</span>}
        <div className={`relative mt-4 rounded-xl border bg-black/50 transition-all duration-200 ${
          active
            ? "border-[#FE2DA3]/70 shadow-[0_0_0_3px_rgba(254,45,163,0.18),0_0_18px_rgba(254,45,163,0.35)]"
            : "border-white/10 hover:border-[#00F0D1]/40"
        } focus-within:border-[#FE2DA3] focus-within:shadow-[0_0_0_3px_rgba(254,45,163,0.22),0_0_24px_rgba(254,45,163,0.4)]`}>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            rows={5}
            maxLength={1000}
            className="w-full resize-none rounded-xl bg-transparent px-4 py-3 text-base text-[#F5F2EC] placeholder:text-white/30 focus-visible:outline-none disabled:opacity-60"
          />
        </div>
      </label>
      {chips && chips.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2.5">
          {chips.map((chip, i) => {
            const selected = value === chip;
            return (
              <button
                key={chip}
                type="button"
                disabled={disabled}
                onClick={() => onChange(chip)}
                className={`xcel-pop rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 ${
                  selected
                    ? "border-[#00F0D1] bg-[#00F0D1] text-[#0B0B0D] shadow-[0_0_18px_rgba(0,240,209,0.6)]"
                    : "border-[#FE2DA3] bg-[#FE2DA3] text-white shadow-[0_0_14px_rgba(254,45,163,0.45)] hover:bg-[#FE2DA3]/90 hover:shadow-[0_0_20px_rgba(254,45,163,0.65)]"
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

// ===== Blueprint card (Find Your Lane result) =====
const HIDDEN_BLUEPRINT_SECTIONS = /next\s*move|next\s*steps?|steps?\s*1\s*(through|to|-)\s*3/i;

function BlueprintCard({
  output, streaming, plan, onAdvance,
}: {
  output: string;
  streaming: boolean;
  plan: PlanRow;
  onAdvance: () => void;
}) {
  const sections = useMemo(() => {
    const all = splitIntoSections(output);
    return all.filter((s) => !(s.title && HIDDEN_BLUEPRINT_SECTIONS.test(s.title)));
  }, [output]);

  const [downloaded, setDownloaded] = useState(false);

  const loadLogo = async (): Promise<{ dataUrl: string; w: number; h: number } | null> => {
    try {
      const res = await fetch(xcelerateLogo);
      const blob = await res.blob();
      const dataUrl: string = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
      const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = reject;
        img.src = dataUrl;
      });
      return { dataUrl, w: dims.w, h: dims.h };
    } catch {
      return null;
    }
  };

  const handleDownload = async () => {
    const logo = await loadLogo();
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 60;
    const headerH = 72;          // pink band height
    const headerBottom = headerH + 8; // includes thin teal underline strip
    const contentTop = headerBottom + 40;
    const contentBottom = pageH - 60;
    const maxW = pageW - margin * 2;

    // Consistent body typography
    const BODY_SIZE = 11;
    const BODY_LINE_H = BODY_SIZE * 1.55;
    const PARA_GAP = 12;
    const SECTION_GAP = 22;

    // Brand palette (printer-friendly: mostly white page, color used in accents)
    const PINK: [number, number, number] = [254, 45, 163];
    const BLACK: [number, number, number] = [10, 10, 12];
    const PURPLE: [number, number, number] = [138, 43, 226];
    const TEAL: [number, number, number] = [0, 176, 156];
    const INK: [number, number, number] = [24, 24, 28];
    const BODY: [number, number, number] = [55, 55, 62];
    const MUTED: [number, number, number] = [130, 130, 138];
    const CREAM: [number, number, number] = [248, 245, 238];

    let y = contentTop;
    let page = 1;
    // Inset used by writeRich so content inside section cards has padding
    let contentInset = 0;

    const drawPageChrome = () => {
      // Top band: black header with pink + teal accent underline
      doc.setFillColor(...BLACK);
      doc.rect(0, 0, pageW, headerH, "F");
      doc.setFillColor(...PINK);
      doc.rect(0, headerH, pageW, 6, "F");
      doc.setFillColor(...TEAL);
      doc.rect(0, headerH + 6, pageW, 2, "F");

      // Logo on the left of the band (preserve aspect ratio)
      if (logo) {
        const targetH = 44;
        const targetW = (logo.w / logo.h) * targetH;
        const cappedW = Math.min(targetW, 220);
        const finalW = cappedW;
        const finalH = (logo.h / logo.w) * finalW;
        const yOffset = (headerH - finalH) / 2;
        doc.addImage(logo.dataUrl, "PNG", margin, yOffset, finalW, finalH);
      } else {
        // Fallback wordmark
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.text("XCELERATE", margin, headerH / 2 + 7);
      }

      // Tagline on the right
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text("ALL GAS · NO BRAKES", pageW - margin, headerH / 2 + 3, { align: "right" });

      // Footer hairline
      doc.setDrawColor(...PINK);
      doc.setLineWidth(1);
      doc.line(margin, pageH - 38, pageW - margin, pageH - 38);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text("xcelerate · your blueprint", margin, pageH - 22);
      doc.text(`page ${page}`, pageW - margin, pageH - 22, { align: "right" });
    };

    const newPage = () => {
      doc.addPage();
      page += 1;
      drawPageChrome();
      y = contentTop;
    };

    const ensureSpace = (needed: number) => {
      if (y + needed > contentBottom) newPage();
    };

    // Wrap + write paragraph, supporting **bold** segments inline.
    const writeRich = (
      text: string,
      size: number,
      color: [number, number, number],
      gapAfter = PARA_GAP,
      indent = 0,
    ) => {
      doc.setFontSize(size);
      doc.setTextColor(...color);
      const lineH = size === BODY_SIZE ? BODY_LINE_H : size * 1.55;
      // Tokenize into {text, bold} chunks first
      const tokens: { text: string; bold: boolean }[] = [];
      const parts = text.split(/(\*\*[^*]+\*\*)/g);
      for (const part of parts) {
        if (!part) continue;
        if (part.startsWith("**") && part.endsWith("**")) tokens.push({ text: part.slice(2, -2), bold: true });
        else tokens.push({ text: part, bold: false });
      }
      // Layout word-by-word
      const lineStart = margin + contentInset + indent;
      const lineEnd = pageW - margin - contentInset;
      let cursorX = lineStart;
      ensureSpace(lineH);
      const space = () => { doc.setFont("helvetica", "normal"); return doc.getTextWidth(" "); };
      const flushNewLine = () => { y += lineH; cursorX = lineStart; ensureSpace(lineH); };
      for (const tok of tokens) {
        doc.setFont("helvetica", tok.bold ? "bold" : "normal");
        const words = tok.text.split(/(\s+)/); // keep whitespace
        for (const w of words) {
          if (!w) continue;
          if (/^\s+$/.test(w)) {
            // collapse to single space; ignore at start of line
            if (cursorX > lineStart) cursorX += space();
            continue;
          }
          const wWidth = doc.getTextWidth(w);
          if (cursorX + wWidth > lineEnd) flushNewLine();
          doc.text(w, cursorX, y);
          cursorX += wWidth;
        }
      }
      y += lineH + gapAfter;
    };

    // ===== PAGE 1 chrome =====
    drawPageChrome();

    // Cover block
    y = contentTop;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...PINK);
    doc.text("TRACK 01 · FIND YOUR LANE", margin, y);
    y += 26;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.setTextColor(...INK);
    doc.text("YOUR BLUEPRINT", margin, y);
    y += 14;

    // Gradient-feel underline: pink → purple → teal segments
    const ulY = y + 4;
    const ulW = maxW;
    doc.setLineWidth(3);
    doc.setDrawColor(...PINK);
    doc.line(margin, ulY, margin + ulW * 0.4, ulY);
    doc.setDrawColor(...PURPLE);
    doc.line(margin + ulW * 0.4, ulY, margin + ulW * 0.75, ulY);
    doc.setDrawColor(...TEAL);
    doc.line(margin + ulW * 0.75, ulY, margin + ulW, ulY);
    y += 32;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...MUTED);
    doc.text("The goldmine you're already sitting on. Print it. Pin it. Build from it.", margin, y);
    y += 32;

    // Niche callout — cream box with pink left bar
    if (plan?.niche) {
      const niche = plan.niche.trim();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(BODY_SIZE);
      const innerPadX = 18;
      const wrapped = doc.splitTextToSize(niche, maxW - innerPadX * 2) as string[];
      const boxH = 22 + 14 + wrapped.length * BODY_LINE_H + 22;
      ensureSpace(boxH + 16);
      doc.setFillColor(...CREAM);
      doc.roundedRect(margin, y, maxW, boxH, 6, 6, "F");
      doc.setFillColor(...PINK);
      doc.rect(margin, y, 4, boxH, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...PURPLE);
      doc.text("YOUR NICHE IDEA", margin + innerPadX, y + 22);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(BODY_SIZE);
      doc.setTextColor(...INK);
      let ty = y + 22 + 14 + BODY_SIZE;
      for (const ln of wrapped) {
        doc.text(ln, margin + innerPadX, ty);
        ty += BODY_LINE_H;
      }
      y += boxH + 26;
    }

    // ===== Sections (rendered as rounded card boxes) =====
    const CARD_PAD_X = 20;
    const CARD_PAD_Y = 20;
    const CARD_RADIUS = 10;

    // Estimate height of a section so we can draw the card behind it.
    const measureSection = (s: { title: string | null; body: string }): number => {
      let h = CARD_PAD_Y;
      const innerW = maxW - CARD_PAD_X * 2;
      if (s.title) {
        h += 14; // tag line
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        const titleLines = doc.splitTextToSize(s.title.toUpperCase(), innerW) as string[];
        h += titleLines.length * 22;
        h += 18; // underline accent gap
      }
      const paragraphs = s.body.trim().split(/\n\s*\n/);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(BODY_SIZE);
      paragraphs.forEach((p, i) => {
        const clean = p.replace(/\n/g, " ").trim();
        if (!clean) return;
        const bullet = clean.match(/^\s*[-*]\s+(.*)$/);
        const text = (bullet ? bullet[1] : clean).replace(/\*\*/g, "");
        const indent = bullet ? 16 : 0;
        const lines = doc.splitTextToSize(text, innerW - indent) as string[];
        h += lines.length * BODY_LINE_H;
        h += i === paragraphs.length - 1 ? 0 : (bullet ? PARA_GAP - 2 : PARA_GAP);
      });
      h += CARD_PAD_Y;
      return h;
    };

    for (const s of sections) {
      const cardH = measureSection(s);
      // Move whole card to next page if it doesn't fit; allow page-spanning if larger than page.
      const available = contentBottom - y;
      if (cardH > available && cardH <= contentBottom - contentTop) newPage();

      const cardTop = y;
      // Draw card chrome (rounded rect + subtle border + pink left accent)
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(225, 225, 230);
      doc.setLineWidth(0.75);
      doc.roundedRect(margin, cardTop, maxW, Math.min(cardH, contentBottom - cardTop), CARD_RADIUS, CARD_RADIUS, "FD");
      doc.setFillColor(...PINK);
      // Pink left accent bar inset slightly so it follows the rounded corner
      doc.rect(margin + 1, cardTop + CARD_RADIUS, 3, Math.min(cardH, contentBottom - cardTop) - CARD_RADIUS * 2, "F");

      // Content inset for writeRich
      contentInset = CARD_PAD_X;
      y = cardTop + CARD_PAD_Y;

      if (s.title) {
        const tag = "▮ SECTION";
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...TEAL);
        doc.text(tag, margin + CARD_PAD_X, y);
        y += 14;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(...PINK);
        const titleLines = doc.splitTextToSize(s.title.toUpperCase(), maxW - CARD_PAD_X * 2) as string[];
        for (const tl of titleLines) {
          doc.text(tl, margin + CARD_PAD_X, y);
          y += 22;
        }
        doc.setDrawColor(...PURPLE);
        doc.setLineWidth(1.5);
        doc.line(margin + CARD_PAD_X, y, margin + CARD_PAD_X + 48, y);
        y += 18;
      }

      const body = s.body.trim();
      const paragraphs = body.split(/\n\s*\n/);
      for (const p of paragraphs) {
        const clean = p.replace(/\n/g, " ").trim();
        if (!clean) continue;
        const bullet = clean.match(/^\s*[-*]\s+(.*)$/);
        if (bullet) {
          ensureSpace(BODY_LINE_H);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(BODY_SIZE);
          doc.setTextColor(...PINK);
          doc.text("•", margin + CARD_PAD_X, y);
          writeRich(bullet[1], BODY_SIZE, BODY, PARA_GAP - 2, 16);
        } else {
          writeRich(clean, BODY_SIZE, BODY, PARA_GAP);
        }
      }

      contentInset = 0;
      // Position y below the card with a gap before next section
      y = cardTop + cardH + 18;
      if (y > contentBottom) {
        // ran past — start fresh page
        newPage();
      }
    }

    doc.save("xcelerate-blueprint.pdf");
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  if (sections.length === 0) return null;

  return (
    <div className="space-y-6">
      <div
        className="relative overflow-hidden rounded-2xl border-2 border-[#FE2DA3]/40 p-7 shadow-[0_0_32px_rgba(254,45,163,0.25)] sm:p-9"
        style={{ background: "#F5F2EC" }}
      >
        <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: "linear-gradient(90deg, #FE2DA3, #8A2BE2, #00F0D1)" }} />
        <div className="mb-5 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-xl text-white shadow-[0_0_18px_rgba(254,45,163,0.55)]" style={{ background: "linear-gradient(135deg, #FE2DA3, #8A2BE2)" }}>📜</span>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#8A2BE2]">Your Blueprint</p>
            <h3 className="text-2xl leading-tight tracking-wide text-slate-900 sm:text-3xl" style={{ fontFamily: "Anton, sans-serif", textTransform: "uppercase" }}>
              Find Your Lane
            </h3>
          </div>
        </div>
        <div className="prose-xcel space-y-6 text-[17px] leading-[1.75] text-slate-800">
          {sections.map((s, i) => (
            <section key={i}>
              {s.title && (
                <h4 className="mb-2 text-xl tracking-wide text-slate-900" style={{ fontFamily: "Anton, sans-serif", textTransform: "uppercase" }}>
                  {s.title}
                </h4>
              )}
              <div>{renderMarkdown(s.body)}</div>
            </section>
          ))}
        </div>
      </div>

      {!streaming && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleDownload}
            className="xcel-btn-ghost inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm"
          >
            {downloaded ? "✓ Downloaded!" : "⬇ Download Blueprint PDF"}
          </button>
        </div>
      )}

      {!streaming && (
        <button
          type="button"
          onClick={onAdvance}
          className="xcel-btn-neon group relative w-full overflow-hidden rounded-2xl px-8 py-6 text-lg sm:text-xl"
        >
          <span className="relative z-10 inline-flex items-center justify-center gap-3" style={{ fontFamily: "Anton, sans-serif", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Next: Build Your Thing
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </span>
          <span aria-hidden className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </button>
      )}
    </div>
  );
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
        <span className="xcel-kicker text-[#00F0D1]">Side {safeIdx + 1} of {total}</span>
        <span className="hidden font-mono text-[10px] uppercase tracking-widest text-[#F5F2EC]/50 sm:inline">◀ ▶ flip through the tracks</span>
      </div>
      <div
        key={safeIdx}
        className="rounded-2xl border-2 border-[#FE2DA3]/30 p-6 text-slate-900 shadow-[0_0_24px_rgba(254,45,163,0.20)] xcel-fade-up sm:p-8"
        style={{ background: "#F5F2EC" }}
      >
        {current.title && (
          <h3 className="mb-4 text-2xl leading-tight tracking-wide text-slate-900" style={{ fontFamily: "Anton, sans-serif", textTransform: "uppercase" }}>
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
            className="xcel-btn-ghost inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          >
            ◀ Rewind
          </button>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {sections.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to card ${i + 1}`}
                onClick={() => setIdx(i)}
                className={`h-2.5 rounded-full transition-all ${
                  i === safeIdx ? "w-8 bg-[#FE2DA3] shadow-[0_0_8px_#FE2DA3]" : "w-2.5 bg-white/15 hover:bg-[#00F0D1]/60"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
            disabled={safeIdx === total - 1}
            className="xcel-btn-ghost inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          >
            Fast forward ▶
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
      out.push(<h3 key={i} className="mt-6 mb-3 text-xl font-bold tracking-wide text-slate-900" style={{ fontFamily: "Anton, sans-serif", textTransform: "uppercase" }}>{headerMatch[1]}</h3>);
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
    <div className="mt-8 rounded-2xl border-2 border-dashed border-[#FE2DA3]/50 bg-[#FE2DA3]/[0.06] p-6 shadow-[0_0_24px_rgba(254,45,163,0.12)]">
      <div className="mb-4 flex items-start gap-3">
        <span className="text-3xl">🎸</span>
        <div>
          <h3 className="text-2xl tracking-wide text-[#F5F2EC]" style={{ fontFamily: "Anton, sans-serif", textTransform: "uppercase" }}>Now cut the record</h3>
          <p className="mt-1 text-sm normal-case tracking-normal text-[#F5F2EC]/70">
            Pick your AI helper below. In preview, outside sites don't open automatically — we copy the prompt first so you can paste it.
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {tools.map((tool) => (
          <button
            key={tool.name}
            type="button"
            onClick={() => copyForTool(tool.name)}
            className="rounded-xl border border-white/10 bg-black/50 p-4 text-left text-[#F5F2EC] backdrop-blur transition-all hover:-translate-y-0.5 hover:border-[#FE2DA3] hover:shadow-[0_0_24px_rgba(254,45,163,0.35)]"
          >
            <div className="flex items-center gap-2 text-lg tracking-wide" style={{ fontFamily: "Anton, sans-serif", textTransform: "uppercase" }}><span>{tool.emoji}</span>{tool.name}</div>
            <p className="mt-1 text-xs font-semibold normal-case tracking-normal text-[#F5F2EC]/60">{tool.note}</p>
            <p className="mt-3 font-mono text-xs font-bold uppercase tracking-widest text-[#FE2DA3]">
              {copiedTool === tool.name ? "✓ Prompt copied" : "Copy prompt"}
            </p>
            <p className="mt-1 text-xs normal-case tracking-normal text-[#F5F2EC]/50">Then open {tool.url} in a fresh tab and paste.</p>
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          onClick={copyPrompt}
          className="xcel-btn-ghost inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs"
        >
          {copied ? "✓ Copied prompt!" : "📋 Copy the prompt"}
        </button>
      </div>
      <p className="mt-4 text-xs normal-case tracking-normal text-[#F5F2EC]/55">
        💡 This avoids preview-window errors. After publishing, the same copy-and-paste flow works on the live site.
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
      <div className="rounded-2xl border-2 border-dashed border-[#8A2BE2]/50 bg-[#8A2BE2]/[0.06] p-6 shadow-[0_0_24px_rgba(138,43,226,0.14)]">
        <div className="mb-4 flex items-start gap-3">
          <span className="text-3xl">📺</span>
          <div>
            <h3 className="text-2xl tracking-wide text-[#F5F2EC]" style={{ fontFamily: "Anton, sans-serif", textTransform: "uppercase" }}>Watch the dress rehearsal</h3>
            <p className="mt-1 text-sm normal-case tracking-normal text-[#F5F2EC]/70">
              Seeing it done once makes the whole thing click. Watch start to finish, then come back and do yours.
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
              className="group block overflow-hidden rounded-xl border border-white/10 bg-black/60 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-[#8A2BE2]/70 hover:shadow-[0_0_24px_rgba(138,43,226,0.4)]"
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
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-[0_0_24px_rgba(254,45,163,0.55)] transition-transform group-hover:scale-110">
                    <svg className="ml-1 h-6 w-6 text-[#FE2DA3]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="xcel-kicker text-[#00F0D1]">{v.platform}</p>
                  <p className="mt-1 text-sm font-semibold normal-case tracking-normal text-[#F5F2EC]">{v.title}</p>
                </div>
                <span className="rounded-full border border-[#FE2DA3]/40 bg-[#FE2DA3]/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#FE2DA3]">▶ YouTube</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-[#00F0D1]/50 bg-[#00F0D1]/[0.05] p-6 shadow-[0_0_24px_rgba(0,240,209,0.12)]">
        <div className="mb-5 flex items-start gap-3">
          <span className="text-3xl">🛠️</span>
          <div>
            <h3 className="text-2xl tracking-wide text-[#F5F2EC]" style={{ fontFamily: "Anton, sans-serif", textTransform: "uppercase" }}>The 6-step setup, no jargon</h3>
            <p className="mt-1 text-sm normal-case tracking-normal text-[#F5F2EC]/70">Knock these out in one sitting. About 45 minutes, start to finish.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {steps.map((s) => (
            <div key={s.n} className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white shadow-[0_0_12px_rgba(254,45,163,0.5)]" style={{ background: "linear-gradient(135deg, #FE2DA3, #8A2BE2)" }}>{s.n}</span>
                <div>
                  <p className="text-base font-bold normal-case tracking-normal text-[#F5F2EC]" style={{ fontFamily: "var(--font-sub)" }}>{s.t}</p>
                  <p className="mt-1 text-sm leading-relaxed normal-case tracking-normal text-[#F5F2EC]/70">{s.d}</p>
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
        <div className="rounded-2xl border-2 border-dashed border-[#FE2DA3]/50 bg-[#FE2DA3]/[0.06] p-6 shadow-[0_0_24px_rgba(254,45,163,0.14)]">
          <div className="mb-5 flex items-start gap-3">
            <span className="text-3xl">📅</span>
            <div>
              <h3 className="text-2xl tracking-wide text-[#F5F2EC]" style={{ fontFamily: "Anton, sans-serif", textTransform: "uppercase" }}>Your 30-day tour calendar</h3>
              <p className="mt-1 text-sm normal-case tracking-normal text-[#F5F2EC]/70">One square = one day. Click any day to expand it. Check 'em off as you knock 'em out.</p>
            </div>
          </div>
          <CalendarGrid days={days} />
        </div>
      )}

      {platform && basics[platform] && (
        <div className="rounded-2xl border-2 border-dashed border-[#00F0D1]/50 bg-[#00F0D1]/[0.05] p-6 shadow-[0_0_24px_rgba(0,240,209,0.12)]">
          <div className="mb-4 flex items-start gap-3">
            <span className="text-3xl">📱</span>
            <div>
              <h3 className="text-2xl tracking-wide text-[#F5F2EC]" style={{ fontFamily: "Anton, sans-serif", textTransform: "uppercase" }}>{basics[platform].title}</h3>
              <p className="mt-1 text-sm normal-case tracking-normal text-[#F5F2EC]/70">No assumptions. Here's exactly which button to push.</p>
            </div>
          </div>
          <ol className="space-y-3">
            {basics[platform].steps.map((s, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white shadow-[0_0_12px_rgba(254,45,163,0.5)]" style={{ background: "linear-gradient(135deg, #FE2DA3, #8A2BE2)" }}>{i + 1}</span>
                <span className="text-base leading-relaxed normal-case tracking-normal text-[#F5F2EC]/85">{splitBold(s)}</span>
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
              className={`relative aspect-square rounded-xl border text-sm font-bold transition-all ${
                isOpen
                  ? "border-transparent text-white shadow-[0_0_24px_rgba(254,45,163,0.6)]"
                  : has
                  ? "border-white/15 bg-black/60 text-[#F5F2EC] hover:-translate-y-0.5 hover:border-[#FE2DA3] hover:shadow-[0_0_16px_rgba(254,45,163,0.4)]"
                  : "cursor-not-allowed border-white/5 bg-black/20 text-white/20"
              }`}
              style={isOpen ? { background: "linear-gradient(135deg, #FE2DA3, #8A2BE2)" } : undefined}
            >
              <span className="absolute left-2 top-1.5 font-mono text-[9px] font-bold uppercase tracking-widest opacity-70">Day</span>
              <span className="text-lg">{n}</span>
            </button>
          );
        })}
      </div>
      {open !== null && map.has(open) && (
        <div className="mt-4 rounded-xl border-2 border-[#FE2DA3]/50 p-5 shadow-[0_0_24px_rgba(254,45,163,0.20)] xcel-fade-up" style={{ background: "#F5F2EC" }}>
          <p className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-[#8A2BE2]">Day {open}</p>
          <p className="mt-2 text-base leading-relaxed text-slate-900">{splitBold(map.get(open)!)}</p>
        </div>
      )}
    </div>
  );
}
