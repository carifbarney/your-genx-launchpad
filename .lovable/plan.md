## Goal

After the Product Builder finishes writing the product content, append a ready-to-paste Canva AI prompt so the user can go straight from "I have the words" to "I have a designed product" without staring at a blank Canva template.

## Changes

### 1. Update the `product` system prompt in `src/lib/xcelerate.functions.ts`

Add a new required section to the Product Builder output, placed **after** "Pricing & Positioning" and **before** "Your Next Move":

**Make It Pretty In Canva — Copy & Paste This Prompt**
- One short intro sentence telling her exactly what to do: "Go to canva.com, click Create a design → search 'Magic Design', and paste the prompt below."
- A fenced, copy-pasteable Canva Magic Design prompt block specific to the product just generated. The prompt must include:
  - Product type + page count (e.g. "a 12-page workbook", "a 1-page printable checklist", "a 6-slide Instagram carousel")
  - A named color palette tied to the niche (e.g. "warm cream, sage green, and soft terracotta")
  - Typography direction (e.g. "rounded sans-serif headlines, clean readable body text")
  - Section/page list pulled directly from the "What's Inside" section so the layout matches the content she already has
  - Tone descriptor (e.g. "warm, encouraging, approachable — not corporate")
- One sentence after the prompt block: "Then paste your content from the sections above into the matching pages. Done."

### 2. Voice/format rules to add to the `product` prompt

- The Canva prompt must reference the **actual product name and sections** generated above it (not generic placeholders).
- Keep it under ~120 words so it fits Canva's input field comfortably.
- No mention of other AI tools (ChatGPT, Claude, Gemini) — Canva only, to avoid tool-switching overwhelm.

### 3. No UI changes required

The dashboard already renders the streamed markdown output, so the new section appears automatically once the prompt is updated. No changes to `src/routes/dashboard.tsx`, no schema changes, no new server functions.

## Out of scope

- Storefront and Launch Plan tools are unchanged.
- Not adding a separate Canva button or embed — keeping this a pure copy-paste handoff to match the "low-tech, low-overwhelm" principle.
