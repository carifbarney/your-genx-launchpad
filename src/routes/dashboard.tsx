import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  generateXcelerateResponse,
  getRemainingRequests,
  getUserPlan,
} from "@/lib/xcelerate.functions";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Xcelerate — Your Launch System" }] }),
  component: Dashboard,
});

type ToolKey = "starting_point" | "product" | "storefront" | "launch_plan";

const TOOLS: { key: ToolKey; num: number; title: string; subtitle: string; locked?: boolean }[] = [
  { key: "starting_point", num: 1, title: "Starting Point", subtitle: "Find your clear first step" },
  { key: "product",        num: 2, title: "Product Builder", subtitle: "Create what you'll sell" },
  { key: "storefront",     num: 3, title: "Beacons Storefront", subtitle: "Step-by-step setup" },
  { key: "launch_plan",    num: 4, title: "30-Day Launch Plan", subtitle: "Daily actions to sell" },
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

  if (checking) {
    return <main className="flex min-h-screen items-center justify-center bg-background"><p className="text-sm text-muted-foreground">Loading…</p></main>;
  }

  const completed = {
    starting_point: !!plan?.starting_point_output,
    product: !!plan?.product_output,
    storefront: !!plan?.storefront_output,
    launch_plan: !!plan?.launch_plan_output,
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight">Xcelerate</span>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-muted-foreground sm:inline">{email}</span>
            <button onClick={handleLogout} className="text-sm font-semibold underline underline-offset-4">Log out</button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold sm:text-4xl">Your Launch System</h1>
          <p className="mt-2 text-muted-foreground">Four tools. One clear path from idea to income.</p>
          {remaining !== null && (
            <p className="mt-2 text-xs text-muted-foreground">{remaining} of 20 AI requests left today</p>
          )}
        </div>

        {/* Tool tabs */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TOOLS.map((t) => {
            const done = completed[t.key];
            const active = activeTool === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTool(t.key)}
                className={`rounded-lg border p-4 text-left transition ${
                  active
                    ? "border-cta bg-card shadow-sm"
                    : "border-border bg-card/40 hover:border-foreground/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${active ? "text-cta" : "text-muted-foreground"}`}>
                    STEP {t.num}
                  </span>
                  {done && <span className="text-xs font-semibold text-emerald-600">✓ Done</span>}
                </div>
                <div className="mt-2 text-sm font-bold leading-tight">{t.title}</div>
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
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
      <ToolHeader tool={tool} />

      {prerequisite ? (
        <div className="mt-6 rounded-md border border-border bg-background/50 p-5 text-sm text-muted-foreground">
          {prerequisite}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {tool === "starting_point" && (
            <>
              <Field label="Your Niche or Topic Idea" value={niche} onChange={setNiche} disabled={streaming}
                placeholder='e.g. helping women over 40 with meal planning, teaching beginners how to use Canva, or write "not sure yet"' />
              <Field label="Your Biggest Roadblock Right Now" value={roadblock} onChange={setRoadblock} disabled={streaming}
                placeholder="e.g. I keep changing my niche, I don't know what platform to use, I'm scared no one will listen to someone my age" />
              <Field label="What Does Your Day Look Like?" value={day} onChange={setDay} disabled={streaming}
                placeholder="e.g. I have 1-2 hours a day, I work part time, I homeschool, the more honest the more useful" />
            </>
          )}

          {tool === "product" && (
            <>
              <ContextSummary plan={plan} show={["niche", "starting_point_output"]} />
              <Field label="Anything specific you want in your product? (optional)" value={productNotes} onChange={setProductNotes} disabled={streaming}
                placeholder='e.g. "I want it to be a free PDF I can give away to grow my email list" or "I want a paid product under $30" — leave blank and we pick the best fit' />
            </>
          )}

          {tool === "storefront" && (
            <>
              <ContextSummary plan={plan} show={["niche", "product_output"]} />
              <Field label="Anything to know about your storefront? (optional)" value={storefrontNotes} onChange={setStorefrontNotes} disabled={streaming}
                placeholder='e.g. preferred username, brand colors, whether you already have a Beacons account' />
            </>
          )}

          {tool === "launch_plan" && (
            <>
              <ContextSummary plan={plan} show={["niche", "product_output"]} />
              <Field label="How many hours can you realistically work on this each day?" value={hoursPerDay} onChange={setHoursPerDay} disabled={streaming}
                placeholder="e.g. 30 minutes weekday mornings, 2 hours on weekends" />
              <Field label="Any platform preference? (optional)" value={platformPreference} onChange={setPlatformPreference} disabled={streaming}
                placeholder="e.g. I'm already on Instagram, I hate making videos, I'm comfortable on Facebook — leave blank and we pick" />
            </>
          )}

          {errorMsg && (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{errorMsg}</p>
          )}

          <button type="submit" disabled={streaming || disabled}
            className="w-full rounded-md bg-cta px-6 py-3 text-base font-bold text-white shadow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
            {streaming ? "Generating…" : output ? "Regenerate" : "Generate"}
          </button>
        </form>
      )}

      {(output || streaming) && (
        <div ref={outputRef} className="mt-8 rounded-lg border border-border bg-background p-6 shadow-sm">
          {streaming && !output && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cta" /> Thinking…
            </div>
          )}
          {output && (
            <>
              <div className="text-[15px] leading-relaxed text-foreground">{renderMarkdown(output)}</div>
              {!streaming && (
                <button onClick={handleCopy} className="mt-6 inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent">
                  {copied ? "Copied!" : "Copy"}
                </button>
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
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-cta">Step {t.num} of 4</p>
      <h2 className="mt-1 text-2xl font-bold">{t.title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t.subtitle}</p>
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
  label, value, onChange, placeholder, disabled,
}: { label: string; value: string; onChange: (v: string) => void; placeholder: string; disabled?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-foreground">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        disabled={disabled} rows={3} maxLength={1000}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60" />
    </label>
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
