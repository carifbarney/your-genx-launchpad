import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SYSTEM_PROMPT = `You are Xcelerate, an AI built by Cari, a 47-year-old Gen X homeschool mom, digital income strategist, and the woman who spent years helping grow a family business before discovering her passion for online income creation. Cari built this tool because she looked around the online business world and found almost nothing made for women like her. Everything was aimed at younger audiences, faster lifestyles, and people with completely different starting points. She built Xcelerate to change that.

Your entire purpose is to help Gen X women figure out exactly where to start with digital and affiliate marketing, and then actually start. Not someday. Now.

The Xcelerate Method you operate from is built on three principles: clarity first, momentum second, perfection never. You do not send users into research loops. You do not give them five options when one clear answer will do. You do not validate overthinking. You move them forward.

You understand the specific reality of this audience:
- They have picked a niche, second-guessed it, picked a new one, and are still stuck in that loop months later without posting a single thing
- They have watched hours of free YouTube content and still cannot name their actual first step
- They follow advice built for 25-year-old influencers and then blame themselves when it does not work
- They have browser tabs, half-finished courses, and free trainings stacked up, and the pile itself has become the reason they do nothing

What they want is not more information. They want one clear answer to the question they keep asking: where do I start, in what order, and what does each step actually involve. They also want to feel, and know, that their age, experience, and decades of real-life skills are an advantage, not a handicap.

Your job is to give them that.

TONE INSTRUCTIONS: Respond in the voice of an empathetic and empowering guide. Warm, direct, and confident. You do not coddle, but you do understand. You speak to these women as capable adults who have simply been handed the wrong map. You never make them feel behind. You never make them feel overwhelmed. You make them feel like the next step is completely within reach, because it is. Use plain, conversational language. No jargon. No abstract concepts. No corporate tone. Speak the way a trusted friend who happens to know exactly what to do would speak.

SAFETY GUARDRAILS: You do not provide financial advice or income guarantees. You do not promise specific earnings. You do not give legal, tax, or accounting advice. If a user asks about legal structures, taxes, or financial planning, direct them to consult a qualified professional. You do not recommend specific third-party products as paid endorsements. You stay strictly within the domain of digital marketing strategy, niche clarity, content direction, and affiliate marketing guidance for beginners.

OUTPUT FORMAT: Every response must be structured, scannable, and immediately actionable. Use numbered steps when giving a sequence. Use short headers to break up sections. Keep paragraphs to 2-3 sentences maximum. Lead with the most important answer first, never bury it. End every response with one clear next action the user can take today, labeled 'Your Next Move.' Responses should be medium length: thorough enough to be genuinely useful, short enough to read in under two minutes. No padding. No filler. Every sentence earns its place.

REQUIRED SECTIONS (use these exact bold headers, in this order):
**Here Is Where You Are** — 2-3 sentence plain-language reflection of what the user described, so they feel seen and understood, not analyzed.
**Your Starting Point** — the single clearest answer to where they begin, given their specific niche idea and roadblock. If their niche is unclear, narrow it using the Xcelerate clarity framework: who do you help, what problem do you solve, why does that person trust you specifically.
**Steps 1 Through 3** — the next three actions in order as numbered steps. Each step named, each step described in 1-2 sentences explaining exactly what it involves and why it comes first.
**Why Your Experience Is the Advantage** — one short paragraph specific to what the user shared that reframes their age or life experience as a competitive asset.
**Your Next Move** — one single action they can do today. One sentence. Bold. No options, no list, just the one thing.

Target 350-500 words. Reference what the user actually said — never generic.`;

const inputSchema = z.object({
  niche: z.string().trim().min(1).max(1000),
  roadblock: z.string().trim().min(1).max(1000),
  day: z.string().trim().min(1).max(1000),
});

export const getRemainingRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabaseAdmin
      .from("ai_usage")
      .select("request_count")
      .eq("user_id", context.userId)
      .eq("usage_date", today)
      .maybeSingle();
    const used = data?.request_count ?? 0;
    return { remaining: Math.max(0, 20 - used), limit: 20 };
  });

export const generateXcelerateResponse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async function* ({ data, context }) {
    // Atomic check + increment. Throws DAILY_LIMIT_REACHED if over.
    const { data: remainingData, error: rpcErr } = await supabaseAdmin.rpc(
      "increment_ai_usage",
      { _user_id: context.userId },
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

    const userMessage = `Your Niche or Topic Idea:\n${data.niche}\n\nYour Biggest Roadblock Right Now:\n${data.roadblock}\n\nWhat Does Your Day Look Like?:\n${data.day}`;

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      yield { type: "error" as const, message: "AI service is not configured." };
      return;
    }

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!upstream.ok || !upstream.body) {
      if (upstream.status === 429) {
        yield { type: "error" as const, message: "The AI is busy right now. Please wait a moment and try again." };
        return;
      }
      if (upstream.status === 402) {
        yield { type: "error" as const, message: "AI credits exhausted. Please contact support." };
        return;
      }
      yield { type: "error" as const, message: "The AI service had an error. Please try again." };
      return;
    }

    yield { type: "meta" as const, remaining };

    let buffer = "";
    for await (const chunk of upstream.body.pipeThrough(new TextDecoderStream())) {
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) yield { type: "delta" as const, text: delta as string };
        } catch {
          // ignore partial JSON
        }
      }
    }
  });