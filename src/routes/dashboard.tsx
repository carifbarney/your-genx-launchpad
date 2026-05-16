import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  generateXcelerateResponse,
  getRemainingRequests,
} from "@/lib/xcelerate.functions";

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

  const [niche, setNiche] = useState("");
  const [roadblock, setRoadblock] = useState("");
  const [day, setDay] = useState("");
  const [output, setOutput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const generate = useServerFn(generateXcelerateResponse);
  const fetchRemaining = useServerFn(getRemainingRequests);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/login" });
        return;
      }
      setEmail(data.session.user.email ?? null);
      setChecking(false);
      fetchRemaining({}).then((r) => setRemaining(r.remaining)).catch(() => {});
    });
  }, [navigate, fetchRemaining]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (streaming) return;
    if (!niche.trim() || !roadblock.trim() || !day.trim()) {
      setErrorMsg("Please fill in all three fields.");
      return;
    }
    setErrorMsg(null);
    setOutput("");
    setCopied(false);
    setStreaming(true);
    try {
      const stream = await generate({ data: { niche, roadblock, day } });
      for await (const chunk of stream) {
        if (chunk.type === "error") {
          setErrorMsg(chunk.message);
          break;
        }
        if (chunk.type === "meta") {
          setRemaining(chunk.remaining);
          continue;
        }
        if (chunk.type === "delta") {
          setOutput((prev) => prev + chunk.text);
          requestAnimationFrame(() => {
            outputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
          });
        }
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setStreaming(false);
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

      <section className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Get Your Starting Point</h1>
          <p className="mt-3 text-muted-foreground">
            Answer three quick questions. Get one clear plan made for you.
          </p>
          {remaining !== null && (
            <p className="mt-3 text-xs text-muted-foreground">
              {remaining} of 20 requests left today
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field
            label="Your Niche or Topic Idea"
            value={niche}
            onChange={setNiche}
            placeholder='e.g. helping women over 40 with meal planning, teaching beginners how to use Canva, sharing travel tips for empty nesters, or write "not sure yet" and we will help you figure it out'
            disabled={streaming}
          />
          <Field
            label="Your Biggest Roadblock Right Now"
            value={roadblock}
            onChange={setRoadblock}
            placeholder="e.g. I keep changing my niche and never start, I do not know what platform to use, I have no idea how affiliate marketing actually works, I am scared no one will listen to someone my age"
            disabled={streaming}
          />
          <Field
            label="What Does Your Day Look Like?"
            value={day}
            onChange={setDay}
            placeholder="e.g. I have 1-2 hours a day, I work part time, I homeschool my kids, I help run a family business, the more honest you are, the more useful this will be"
            disabled={streaming}
          />

          {errorMsg && (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={streaming || remaining === 0}
            className="w-full rounded-md bg-cta px-6 py-3 text-base font-bold text-white shadow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {streaming ? "Generating your plan…" : "Get My Plan"}
          </button>
        </form>

        {(output || streaming) && (
          <div ref={outputRef} className="mt-10 rounded-lg border border-border bg-card p-6 shadow-sm">
            {streaming && !output && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="h-2 w-2 animate-pulse rounded-full bg-cta" />
                Thinking…
              </div>
            )}
            {output && (
              <>
                <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
                  {renderMarkdown(output)}
                </div>
                {!streaming && (
                  <button
                    onClick={handleCopy}
                    className="mt-6 inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-accent"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-foreground">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={3}
        maxLength={1000}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60"
      />
    </label>
  );
}

// Minimal renderer: bolds **text** and preserves line breaks.
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => (
    <p key={i} className="mb-3 last:mb-0">
      {splitBold(line)}
    </p>
  ));
}

function splitBold(line: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}