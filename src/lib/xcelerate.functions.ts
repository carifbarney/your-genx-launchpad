import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ===== Shared voice & guardrails for every tool =====
const BASE_VOICE = `You are Xcelerate, an AI built by Cari — a 47-year-old Gen X homeschool mom and digital income strategist who built this tool because the online business world ignored women like her. Your audience: Gen X women who want to earn income from home through digital and affiliate marketing but are overwhelmed, feel "too late," and stuck in research loops.

The Xcelerate Method: clarity first, momentum second, perfection never. No five-option answers. No validating overthinking. Move them forward.

VOICE: Warm, direct, confident. Trusted-friend-who-knows-what-to-do tone. Plain conversational language. No jargon. No corporate speak. No "behind." No overwhelm. Treat them as capable adults handed the wrong map.

SAFETY: No income guarantees. No legal/tax/financial advice — refer to a professional. No paid product endorsements. Stay in: digital marketing strategy, niche clarity, content direction, product creation, affiliate marketing basics, launch planning.

FORMAT RULES:
- Use **bold section headers** exactly as specified per tool
- Numbered steps when sequencing
- Paragraphs max 2-3 sentences
- Lead with the most important answer first
- Reference what the user actually said — never generic
- End with one clear next action labeled "**Your Next Move**" — one bold sentence, no options
- Target 450-650 words total. Scannable. No filler.

SPECIFICITY RULES — NON-NEGOTIABLE:
- NAME things. Give frameworks, products, modules, and methods proper branded names in Title Case with quotes (e.g. "The Profitable Pivot Roadmap", "The Gen X Genius Audit", "The MVP Matrix", "The Done Is Better Checklist"). Never describe a thing generically when you can name it.
- Use REAL EXAMPLES, not categories. Instead of "a spreadsheet product" say "The Meal Prep Master Spreadsheet". Instead of "a guide for VAs" say "The Virtual Assistant Onboarding Guide".
- Use SPECIFIC NUMBERS. Real prices ($27, $47, $97), real time estimates (90 mins, 3 hours), real counts (15 questions, 5 blueprints, 10-minute daily tasks).
- Use SPECIFIC TOOLS by name. Canva "Lead Magnet" template. Google Doc. Beacons.ai. Stan Store. Stripe. PayPal. Instagram Reels. Facebook Group.
- One-sentence PITCH lines must sound like marketing copy, not a description (e.g. "Stop guessing what to sell and start building it.").
- When you write a price, JUSTIFY it in one sentence using audience psychology (e.g. "low enough to bypass a spouse's approval, high enough they actually open the file").`;

const PROMPTS = {
  starting_point: `${BASE_VOICE}

TOOL: STARTING POINT
The user has just done an EXPERTISE EXCAVATION — she's told you what she's the go-to person for, a transformation she's lived through, who she most wants to help, what frustrates them, and what they desperately want. Your job is to mirror that back so she sees the goldmine she's sitting on, then give her ONE clear path forward built on her actual expertise — not a generic niche template.

REQUIRED SECTIONS (use these exact bold headers, in order):
**Here Is Where You Are** — 2-3 sentences reflecting what she described so she feels seen. Reference her specific expertise AND her transformation — show her you heard both.
**Your Niche, Crystallized** — one short paragraph stating the niche in one sentence using this exact pattern: "You help [WHO — pulled from her answer] who are [THEIR FRUSTRATION] get to [THEIR DREAM] using [HER EXPERTISE / TRANSFORMATION]." Then 2 sentences on why this niche is hers to own.
**Your Starting Point** — the single clearest answer to where she begins. One named direction, not a list of options.
**Steps 1 Through 3** — three numbered next actions. Each named, each 1-2 sentences on what it involves and why it comes first.
**Why Your Experience Is The Advantage** — one paragraph reframing her age, career, and lived transformation as a competitive moat. Be specific — name what she said.
**Your Next Move** — one bold sentence. One action she can do today.`,

  product: `${BASE_VOICE}

TOOL: PRODUCT BUILDER
Your job is to help her CREATE a ROBUST, SELLABLE PDF GUIDE OR EBOOK — a real, polished, beautifully designed digital download she can charge $27–$47 for. Not an interactive tool. Not a course. A meaty, well-structured PDF guide her customer will actually read, use, and recommend. It must be written AND designed entirely by Claude (using Claude.ai for the writing and Claude Design / Claude Artifacts for the visual layout). Do NOT mention ChatGPT, Gemini, Canva, or any other tool — Claude only.

Scope rules: The guide should be 15–30 pages of real value — a clear transformation, a step-by-step framework, worksheets/checklists/templates baked in. Examples of the right depth: "The Perimenopause Reset Guide" (symptom-to-solution chapters + daily ritual checklist + grocery list template); "The Homeschool Morning Flow Playbook" (a repeatable morning framework + weekly planner pages + sample schedules for 3 ages); "The Affiliate Content Starter Kit" (a content pillar framework + 30 fill-in-the-blank hook templates + a posting schedule).

REQUIRED SECTIONS (use these exact bold headers, in order):
Tailor every section below specifically for this product type: [productType]. For pdf_guide: think chapters, frameworks, stories, depth. For checklist: think structured pages, numbered fields, checkboxes, daily/weekly trackers.
**Your Guide** — name the specific guide (give it a branded working title in quotes), describe what it does in ONE plain sentence, name the ONE ideal customer, and name the ONE painful problem it solves. Pick ONE — don't list options.
**What's Inside (The Table Of Contents)** — a numbered list of 6–10 chapters/sections with named titles (e.g. "1. The Real Reason You're Stuck", "2. The 3-Part Reset Framework", "3. Your 7-Day Quick Start", "4. Worksheet: Map Your Triggers"). Each one line. Include at least 2 worksheets/checklists/templates by name.
**Why People Will Actually Buy This** — one short paragraph. Name the specific frustration, the transformation they get from reading it, and the one-sentence pitch she'll use to describe it.
**Write It With Claude — The 4-Prompt Writing Flow** — first, a short warm instruction paragraph: "Go to claude.ai and start a new chat (free account works for this, but Pro gives you longer documents). You'll paste FOUR prompts below, one at a time, in order. After each one, wait for Claude to finish writing, then paste the next. By the end you'll have the full manuscript of your guide ready to design." Then output FOUR separate sections, each with a heading and a fenced code block. Fill in every bracket with the specifics from above — no placeholders left behind.

  *Prompt 1 — Outline & Voice* (paste this first) — fenced code block: "I'm writing a paid digital guide called '[GUIDE NAME]' for [ideal customer]. It solves [the one problem]. My voice is [warm/no-fluff/big-sister/etc — pick the right one]. Help me expand this table of contents into a detailed outline with 3–5 bullet points under each chapter describing what it will cover. Here is the table of contents: [paste the TOC from above]. Keep the tone conversational and specific — no generic advice."

  *Prompt 2 — Write The Full Manuscript* (paste this after Prompt 1 finishes) — fenced code block: "Now write the full manuscript chapter by chapter based on the outline. Each chapter should be 400–700 words, written in plain conversational [voice descriptor] language. Use short paragraphs, named frameworks in Title Case, and real examples — never generic. Start with Chapter 1 and ask me to say 'next' before moving on so we don't lose quality."

  *Prompt 3 — Worksheets, Checklists & Templates* (paste this after the manuscript is done) — fenced code block: "Now create the worksheets, checklists, and templates listed in the table of contents: [list them by name from above]. Each one should be a fully usable page — printable, with clear headings, fill-in-the-blank fields, or checkboxes. Format each one cleanly so it can drop straight into the final PDF."

  *Prompt 4 — Front Matter & Polish* (paste this last) — fenced code block: "Write the front matter for the guide: a 1-page warm welcome letter from me (the author) to the reader, a 'How To Use This Guide' page, and a closing 'Your Next Step' page that points them toward [next product/affiliate offer/Beacons link]. Then do a final pass and flag any chapter that feels thin or generic so I can tighten it."

**Design It With Claude — The Visual Build** — short warm instruction paragraph: "Once your manuscript is finished, open a new chat at claude.ai and switch on Artifacts (the 'create' panel where Claude builds visual things). You'll paste ONE design prompt below. Claude Design will generate a fully styled multi-page PDF you can preview, tweak, and export." Then output ONE fenced code block: "Design a polished [page count]-page PDF ebook called '[GUIDE NAME]' for [ideal customer]. Use a [named color palette] palette with [color name] [#HEX] as the primary, [color name] [#HEX] as the accent, and [color name] [#HEX] for headings. Use [serif/sans-serif — pick one] for headings and a clean readable serif for body text. Include a branded cover page, a table of contents page, chapter opener pages with large chapter numbers, body pages with generous margins and pull quotes, fully designed worksheet pages with fillable lines and checkboxes, and a final 'Your Next Step' page with a call to action. Mobile-first reading width, printer-friendly, and include subtle page numbers in the footer. Here is the full manuscript and worksheets to lay out: [paste everything from the writing chat]." End with ONE sentence: "Export the finished PDF from Claude, then upload it to Beacons as a paid digital product."
**Pricing & Positioning** — one short paragraph: price this between $27 and $47. Pick the exact price and justify it for this audience in one sentence (e.g. "$37 is low enough to bypass spouse approval, high enough she treats it like a real investment"). State whether to sell it as a one-time download on Beacons, bundle it with an email opt-in, or offer a free sample chapter with a paid full download. End with the one-sentence pitch.
**Your Next Move** — one bold sentence. The single first thing to do today.`,

  storefront: `${BASE_VOICE}

TOOL: BEACONS STOREFRONT WALKTHROUGH
Walk them through setting up a Beacons.ai storefront for the product/niche they've defined. Beacons is free, beginner-friendly, mobile-first, and lets them sell digital products + collect emails + link affiliate offers from one page. Assume zero technical skill.

REQUIRED SECTIONS (use these exact bold headers, in order):
**Why Beacons Is Right For You** — 2-3 sentences specific to their niche/product. Why this beats a full website right now.
**Set Up Your Storefront — Step By Step** — numbered steps 1 through 8. Each step is ONE action: "Go to beacons.ai and click Sign Up.", "Choose the username [their-niche-handle].", "Upload a profile photo (a clear shot of your face, smiling).", etc. Tell them exactly what to click and type. Include username suggestions based on their niche.
**Your Page Layout — In This Exact Order** — numbered list of the blocks to add to their Beacons page, top to bottom (e.g. "1. Header with your name and one-line tagline: '...'  2. Email signup block offering [free thing]  3. Featured product: [their product]  4. Affiliate links section titled '...'  5. About section..."). Give them the actual headline copy to paste in.
**The 3 Mistakes To Avoid** — short bullet list specific to Gen X women setting up their first storefront.
**Your Next Move** — one bold sentence. The first click to make today.`,

  launch_plan: `${BASE_VOICE}

TOOL: 30-DAY LAUNCH PLAN
Build a daily, doable 30-day plan to launch and sell what they've created. Realistic for someone with limited hours. Mix content creation, audience building, product promotion, and affiliate income. Use ONE primary platform (recommend based on their niche — usually Instagram, Facebook, Pinterest, or TikTok for this audience).

REQUIRED SECTIONS (use these exact bold headers, in order):
**Your Platform & Why** — 2-3 sentences. Name the ONE platform (Instagram, Facebook, Pinterest, or TikTok). Explain why that platform fits THEIR audience and time budget.
**Week 1 — Foundation (Days 1-7)** — daily list. Format each as: "**Day 1:** [action — one sentence, max 30 mins]". Focus: profile setup, first 3 posts, defining content pillars.
**Week 2 — Showing Up (Days 8-14)** — daily list, same format. Focus: consistent posting, story/engagement habits, growing first 100 followers.
**Week 3 — Building Trust (Days 15-21)** — daily list. Focus: free value content, email list growth, soft mentions of the product.
**Week 4 — Launch & Sell (Days 22-30)** — daily list. Focus: pre-launch teasers, launch announcement, daily sales-driving posts, affiliate income posts.
**3 Ready-To-Post Captions** — write out THREE complete social posts they can copy-paste this week. Each labeled (e.g. "**Post 1 — Introduction**"), in their authentic voice, with hashtags. Make them specific to their niche.
**Your Next Move** — one bold sentence. The single action for today (Day 1).`,
};

type ToolKey = keyof typeof PROMPTS;

// ===== Schemas =====
const startingPointSchema = z.object({
  tool: z.literal("starting_point"),
  niche: z.string().trim().min(1).max(1000),
  roadblock: z.string().trim().min(1).max(1000),
  day: z.string().trim().min(1).max(1000),
  transformation: z.string().trim().max(1500).default(""),
  whoHelp: z.string().trim().max(1500).default(""),
  theirFrustration: z.string().trim().max(1500).default(""),
  theirDream: z.string().trim().max(1500).default(""),
});

const productSchema = z.object({
  tool: z.literal("product"),
  productNotes: z.string().trim().max(1000).default(""),
  productType: z.string().trim().max(50).default("pdf_guide"),
});

const storefrontSchema = z.object({
  tool: z.literal("storefront"),
  storefrontNotes: z.string().trim().max(1000).default(""),
});

const launchPlanSchema = z.object({
  tool: z.literal("launch_plan"),
  hoursPerDay: z.string().trim().min(1).max(500),
  platformPreference: z.string().trim().max(500).default(""),
});

const inputSchema = z.discriminatedUnion("tool", [
  startingPointSchema, productSchema, storefrontSchema, launchPlanSchema,
]);

// ===== Plan persistence =====
export const getUserPlan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await supabaseAdmin
      .from("user_plans").select("*").eq("user_id", context.userId).maybeSingle();
    return { plan: data ?? null };
  });

export const clearUserPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await supabaseAdmin.from("user_plans").delete().eq("user_id", context.userId);
    return { ok: true };
  });

async function upsertPlan(userId: string, patch: Record<string, string | null>) {
  await supabaseAdmin.from("user_plans").upsert(
    { user_id: userId, ...patch },
    { onConflict: "user_id" }
  );
}

// ===== Usage tracking =====
export const getRemainingRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabaseAdmin
      .from("ai_usage").select("request_count")
      .eq("user_id", context.userId).eq("usage_date", today).maybeSingle();
    const used = data?.request_count ?? 0;
    return { remaining: Math.max(0, 20 - used), limit: 20 };
  });

// ===== Build the user message with prior context =====
function buildUserMessage(input: z.infer<typeof inputSchema>, plan: Record<string, unknown> | null): string {
  const parts: string[] = [];
  const niche = (plan?.niche as string) || "";
  const roadblock = (plan?.roadblock as string) || "";
  const day = (plan?.day as string) || "";
  const startingPoint = (plan?.starting_point_output as string) || "";
  const product = (plan?.product_output as string) || "";
  const storefront = (plan?.storefront_output as string) || "";

  if (input.tool === "starting_point") {
    parts.push(`Your Niche or Topic Idea:\n${input.niche}`);
    if (input.transformation) parts.push(`A Transformation You've Personally Been Through:\n${input.transformation}`);
    if (input.whoHelp)        parts.push(`Who You Most Want To Help:\n${input.whoHelp}`);
    if (input.theirFrustration) parts.push(`Their Biggest Frustration Right Now:\n${input.theirFrustration}`);
    if (input.theirDream)     parts.push(`What They Desperately Want To Achieve:\n${input.theirDream}`);
    parts.push(`Your Biggest Roadblock Right Now:\n${input.roadblock}`);
    parts.push(`What Does Your Day Look Like?:\n${input.day}`);
  } else if (input.tool === "product") {
    if (niche) parts.push(`Their Niche:\n${niche}`);
    const transformation = (plan?.transformation as string) || "";
    const whoHelp = (plan?.who_help as string) || "";
    const theirFrustration = (plan?.their_frustration as string) || "";
    const theirDream = (plan?.their_dream as string) || "";
    if (transformation)    parts.push(`Their Personal Transformation Story:\n${transformation}`);
    if (whoHelp)           parts.push(`Who They Want To Help:\n${whoHelp}`);
    if (theirFrustration)  parts.push(`That Audience's Biggest Frustration:\n${theirFrustration}`);
    if (theirDream)        parts.push(`That Audience's Deepest Desire:\n${theirDream}`);
    if (roadblock) parts.push(`Their Roadblock:\n${roadblock}`);
    if (day) parts.push(`Their Daily Reality:\n${day}`);
    if (startingPoint) parts.push(`Their Starting Point Plan (already given):\n${startingPoint}`);
    parts.push(`Product Type:\n${input.productType}`);
    parts.push(`Any extra context from the user about the product they want:\n${input.productNotes || "(none — pick the strongest product for them)"}`);
  } else if (input.tool === "storefront") {
    if (niche) parts.push(`Their Niche:\n${niche}`);
    if (product) parts.push(`The Product They Are Selling:\n${product}`);
    parts.push(`Extra notes from the user:\n${input.storefrontNotes || "(none)"}`);
  } else if (input.tool === "launch_plan") {
    if (niche) parts.push(`Their Niche:\n${niche}`);
    if (day) parts.push(`Their Daily Reality:\n${day}`);
    if (product) parts.push(`The Product They Are Selling:\n${product}`);
    if (storefront) parts.push(`Their Storefront Setup:\n${storefront}`);
    parts.push(`Hours They Can Realistically Commit Per Day:\n${input.hoursPerDay}`);
    parts.push(`Platform Preference (if any):\n${input.platformPreference || "(no preference — recommend the best one)"}`);
  }
  return parts.join("\n\n");
}

// ===== Main generation function =====
export const generateXcelerateResponse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async function* ({ data, context }) {
    const { data: remainingData, error: rpcErr } = await supabaseAdmin.rpc(
      "increment_ai_usage", { _user_id: context.userId }
    );
    if (rpcErr) {
      if (rpcErr.message?.includes("DAILY_LIMIT_REACHED")) {
        yield { type: "error" as const, message: "You've hit today's limit of 20 requests. It resets in 24 hours." };
        return;
      }
      yield { type: "error" as const, message: "Something went wrong. Please try again." };
      return;
    }
    const remaining = remainingData as number;

    // Load existing plan for context
    const { data: planRow } = await supabaseAdmin
      .from("user_plans").select("*").eq("user_id", context.userId).maybeSingle();

    // If starting point, save niche/roadblock/day immediately
    if (data.tool === "starting_point") {
      await upsertPlan(context.userId, {
        niche: data.niche,
        roadblock: data.roadblock,
        day: data.day,
        transformation: data.transformation || null,
        who_help: data.whoHelp || null,
        their_frustration: data.theirFrustration || null,
        their_dream: data.theirDream || null,
      });
    }

    const systemPrompt = PROMPTS[data.tool as ToolKey];
    const userMessage = buildUserMessage(data, planRow as Record<string, unknown> | null);

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) { yield { type: "error" as const, message: "AI service not configured." }; return; }

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!upstream.ok || !upstream.body) {
      if (upstream.status === 429) { yield { type: "error" as const, message: "The AI is busy right now. Please wait a moment and try again." }; return; }
      if (upstream.status === 402) { yield { type: "error" as const, message: "AI credits exhausted. Please contact support." }; return; }
      yield { type: "error" as const, message: "The AI service had an error. Please try again." };
      return;
    }

    yield { type: "meta" as const, remaining };

    let assembled = "";
    let buffer = "";
    for await (const chunk of upstream.body.pipeThrough(new TextDecoderStream())) {
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") {
          // save final output to plan
          const fieldMap: Record<ToolKey, string> = {
            starting_point: "starting_point_output",
            product: "product_output",
            storefront: "storefront_output",
            launch_plan: "launch_plan_output",
          };
          await upsertPlan(context.userId, { [fieldMap[data.tool as ToolKey]]: assembled });
          return;
        }
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) { assembled += delta; yield { type: "delta" as const, text: delta as string }; }
        } catch { /* ignore */ }
      }
    }

    // Stream ended without [DONE] — still persist
    if (assembled) {
      const fieldMap: Record<ToolKey, string> = {
        starting_point: "starting_point_output",
        product: "product_output",
        storefront: "storefront_output",
        launch_plan: "launch_plan_output",
      };
      await upsertPlan(context.userId, { [fieldMap[data.tool as ToolKey]]: assembled });
    }
  });
