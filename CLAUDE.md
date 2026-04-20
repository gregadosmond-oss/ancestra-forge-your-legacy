═══════════════════════════════════════════════════════
ANCESTORSQR — PROJECT BRIEF, CONTROLS & STATE
Updated: April 2026
═══════════════════════════════════════════════════════

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLAUDE WORKING RULES (READ FIRST — ALWAYS FOLLOW)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. BEFORE WRITING ANY FILE — use the Read tool first. Never Write without reading.
2. ONE CHANGE AT A TIME — never bundle multiple features into one response.
3. DO NOT MODIFY existing pages or components unless explicitly asked.
4. USE AGENTS for research, codebase exploration, and multi-file tasks.
5. ALWAYS READ files before editing. Never assume file contents.
6. FOR LOVABLE CHANGES — give Greg a copy-paste prompt, don't try to edit Lovable files directly.
7. SUPABASE EDGE FUNCTIONS live at: /Users/hrcommb3/Desktop/ancestra/supabase/functions/
8. LOCAL = Deno edge functions synced from Lovable. Deploy via: supabase functions deploy <name>
9. MEMORY files live at: /Users/hrcommb3/.claude/projects/-Users-hrcommb3-Desktop-ancestra/memory/
10. NEVER use cold blue, cold gray, or pure white. Always warm palette (see design system below).
11. PREFER inline execution for small plans (1–5 tasks). Use subagent-driven-development for large plans.
12. COMMIT after each meaningful change. Keep commits small and focused.
13. GREG IS SOLO — no team. Keep solutions simple. Prefer tools he already has over new ones.
14. PRINTIFY PRODUCTS — all products are created/edited at printify.com, not programmatically (except the dynamic mug via create-heirloom-order).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DECISION GUIDE — WHAT TO DO WHEN GREG ASKS FOR X
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| If Greg asks to... | Do this |
|---|---|
| Change a page, component, copy, color, layout, animation (anything under src/) | Invoke `lovable-prompt` skill. Give him a copy-paste prompt. DO NOT Write/Edit src/ files. |
| Edit or create a Supabase edge function | Invoke `deploy-edge-function` skill. Edit directly, then remind him to run `supabase functions deploy <name>`. |
| Add/edit a Printify product (canvas, coaster, clock, t-shirt, blanket, etc.) | He does this manually at printify.com. Your job is only the design SVG/PNG (via generate-print-design). |
| Change the dynamic mug | That's create-heirloom-order edge function. Treat like any edge function. |
| Fix a 500 from an edge function | Check Supabase secrets FIRST, then logs: `supabase functions logs <name> --tail`. |
| Change database schema | He does it via Lovable Cloud / Supabase dashboard. Give him SQL or dashboard steps. |
| Add a new Claude API tool (e.g. wire Motto Generator) | Write a new edge function under supabase/functions/, then a Lovable prompt to wire the frontend call. |
| Plan a multi-step feature (3+ files or mixed frontend + edge) | Use a TaskCreate plan; execute inline if ≤5 tasks, subagent-driven-development if larger. |
| Do exploratory research across the codebase | Dispatch an Agent (Explore subagent). Do not read 10+ files yourself. |
| Commit changes | Only when he explicitly says so. Small, focused commits. |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWN ERRORS & GOTCHAS — CHECK BEFORE DEBUGGING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Symptom / Error | Likely cause | Fix |
|---|---|---|
| Edge function crashes with "CPU/memory budget exceeded" | Rendering at 3600×4200 via resvg-wasm | Drop to 1800×2100 @ 150 DPI. Printify rescales. |
| SVG renders but crest text missing | resvg-wasm can't render `<text>` without embedded fonts | Remove text from SVG, or upstream a pre-rendered PNG with text baked in. |
| qrserver.com returns 400 / bad URL | `#` symbol in color or bgcolor param | Strip `#`. Use `color=d4a04a` not `color=%23d4a04a`. |
| Crest looks tiny inside its SVG box | `preserveAspectRatio="xMidYMid meet"` + transparent PNG padding | Oversize bounding box (e.g. width=2400 in 3000px canvas) OR switch to `slice`. |
| QR code cut off on canvas print | QR placed inside Printify's 1.5" frame wrap zone | Keep QR ≥600px from all canvas edges. |
| Charcuterie board print rejected or looks wrong | Laser-engraver is single-color; QR can't burn | Crest only on charcuterie board. No QR. |
| `generate-legacy` returns wrong shape | `src/types/legacy.ts` and `supabase/functions/generate-legacy/types.ts` drifted | Make the two files byte-identical. Update both together. |
| Edge function 500s immediately after deploy | Missing or renamed env var | Check Supabase dashboard → Edge Functions → Secrets. |
| Lovable overwrote a local change to src/ | Greg edited src/ locally and re-published Lovable | Never Write/Edit src/. Always go through Lovable prompts. |
| Stripe webhook not firing | STRIPE_WEBHOOK_SECRET mismatch OR endpoint not registered | Re-copy the signing secret from Stripe dashboard into Supabase secrets. |
| Crest generation slow on repeat surnames | Cache miss in surname_crests table | Confirm write path in generate-crest; surname should normalize (lowercase, trim). |
| TTS audio cuts off mid-sentence | ElevenLabs char limit hit | Chunk story text and concatenate; don't send a full chapter in one call. |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KEY FILE PATHS — CENTRAL REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project root:
  /Users/hrcommb3/Desktop/ancestra/

Instructions & memory:
  /Users/hrcommb3/Desktop/ancestra/CLAUDE.md
  /Users/hrcommb3/.claude/projects/-Users-hrcommb3-Desktop-ancestra/memory/MEMORY.md
  /Users/hrcommb3/.claude/projects/-Users-hrcommb3-Desktop-ancestra/memory/     ← individual memory files

Frontend (Lovable — DO NOT EDIT LOCALLY):
  /Users/hrcommb3/Desktop/ancestra/src/                      ← all pages, components, types
  /Users/hrcommb3/Desktop/ancestra/src/types/legacy.ts       ← React-side Legacy types (must mirror Deno)

Edge functions (edit and deploy locally):
  /Users/hrcommb3/Desktop/ancestra/supabase/functions/generate-legacy/index.ts
  /Users/hrcommb3/Desktop/ancestra/supabase/functions/generate-legacy/types.ts   ← mirrors src/types/legacy.ts
  /Users/hrcommb3/Desktop/ancestra/supabase/functions/generate-crest/index.ts
  /Users/hrcommb3/Desktop/ancestra/supabase/functions/generate-crest/crest.ts
  /Users/hrcommb3/Desktop/ancestra/supabase/functions/generate-print-design/index.ts
  /Users/hrcommb3/Desktop/ancestra/supabase/functions/create-heirloom-order/index.ts
  /Users/hrcommb3/Desktop/ancestra/supabase/functions/ancestor-tts/index.ts
  /Users/hrcommb3/Desktop/ancestra/supabase/functions/expand-chapters/index.ts
  /Users/hrcommb3/Desktop/ancestra/supabase/functions/stripe-webhook/index.ts
  /Users/hrcommb3/Desktop/ancestra/supabase/functions/send-legacy-email/index.ts

Custom skills (user-global, usable in any session):
  /Users/hrcommb3/.claude/skills/lovable-prompt/SKILL.md
  /Users/hrcommb3/.claude/skills/deploy-edge-function/SKILL.md

Supabase config:
  /Users/hrcommb3/Desktop/ancestra/supabase/config.toml

Deploy commands:
  supabase functions deploy <name>         ← single function
  supabase functions logs <name> --tail    ← live logs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT IS ANCESTORSQR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Domain: ancestorsqr.com
Brand name used in UI: AncestorsQR (public), Ancestra (legacy references — being phased out)
One-liner: "Every family has a story worth telling."

An AI-powered family legacy platform. User enters their surname → gets a custom coat of arms, family story, visual bloodline tree, and can order physical products with their crest on them.

NOT a genealogy database. An emotional identity discovery experience.

Business model:
- Free: surname lookup, bloodline quiz, motto generator, ancestor personality, ancestor chat
- Paid ($29.99): Legacy Pack — full crest (high-res), AI-written family story (9 chapters), bloodline tree, legacy certificate, ancestor chat
- Physical products ($24–$149): Mug, canvas, coaster, clock, t-shirt, acrylic print, blanket, charcuterie board, speaker, framed crest
- Premium ($99+): Deep research, hardcover book, Family Circle (future)

Founder: Gregory Angus Dean Osmond (GADO). Traced Osmond lineage to Dorset, England, 1066.
Family motto: "Ex Labore, Ascendimus" — From Labour, We Rise. Since 1688.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT'S BUILT (Current State — April 2026)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FRONTEND (Lovable — Vite + React + Tailwind + Framer Motion)

Pages / Routes:
  /                    → Landing page (hero, How It Works, Product Preview, Free Tools, Occasions, CTA)
  /journey/1           → Stop 1: Surname input
  /journey/2           → Stop 2: Name meaning reveal
  /journey/3           → Stop 3: Family tree (visual bloodline — PLACEHOLDER, not real data yet)
  /journey/4           → Stop 4: Crest forge reveal (REAL — DALL-E 3 generated, cached)
  /journey/5           → Stop 5: Story preview + $29.99 Stripe paywall
  /journey/6           → Stop 6: Pass It On (gift options)
  /checkout            → Stripe checkout page
  /my-legacy           → User dashboard (post-purchase)
  /tools               → Free tools hub
  /tools/quiz          → Bloodline Quiz (frontend only — NOT wired to Claude yet)
  /tools/surname       → Surname Lookup (frontend only)
  /tools/motto         → Motto Generator (frontend only — NOT wired to Claude yet)
  /tools/chat          → Ancestor Chat (frontend only)
  /shop                → NOT BUILT YET — needs Printify product fetch
  /about               → Founder story

Components built:
  - AppLayout (global navbar, back button, step counter)
  - AuthGate (email/Google/Apple auth modal)
  - JourneyContext (shared state across all stops)
  - SectionLabel, RetryInline
  - FreeCrest component (shows crest on free tier)
  - Stop5Story (TTS audio playback via ancestor-tts edge function)

BACKEND (Supabase Edge Functions — Deno)

Deployed edge functions:
  generate-legacy       → Claude API: generates LegacyFacts + LegacyStory for a surname
  generate-crest        → DALL-E 3: generates coat of arms image, caches in surname_crests table
  ancestor-tts          → ElevenLabs TTS: converts story text to audio (used in Stop 5)
  generate-print-design → SVG/PNG design builder for Printify products (canvas, coaster, clock)
  create-heirloom-order → Dynamic mug order: renders PNG via resvg-wasm, uploads to Supabase, sends to Printify
  expand-chapters       → Claude API: expands teaserChapters into full chapter bodies (post-purchase)
  stripe-webhook        → Handles Stripe payment → triggers legacy pack delivery
  send-legacy-email     → Resend: delivers Legacy Pack files to customer email

Local edge function files:
  /Users/hrcommb3/Desktop/ancestra/supabase/functions/generate-print-design/index.ts
  /Users/hrcommb3/Desktop/ancestra/supabase/functions/create-heirloom-order/index.ts
  /Users/hrcommb3/Desktop/ancestra/supabase/functions/generate-crest/crest.ts

DATABASE (Supabase — Lovable Cloud, isolated project)

Tables:
  surname_crests   → { surname, image_url, prompt } — cached DALL-E crest images
  users            → Supabase auth (managed by Lovable)
  orders           → product orders
  purchases        → Legacy Pack purchases (used by usePurchase hook)
  gifts            → gift sends and recipient tracking

Storage buckets:
  crests           → Crest PNG files (generate-crest uploads here)
  print-designs    → Printify design SVG/PNG files (generate-print-design uploads here)

STRIPE

  Product: Legacy Pack — $29.99 one-time
  Stripe webhook → stripe-webhook edge function → triggers Legacy Pack generation + email delivery
  Checkout page: /checkout

PRINTIFY (Physical Products)

  Connected via API store (not Shopify/Etsy)
  Shop ID: stored in PRINTIFY_SHOP_ID env var
  API Key: stored in PRINTIFY_API_KEY env var

  Products created in Printify (manual, not programmatic):
    1. Satin Canvas 8×10 (Vertical) — Blueprint ~530, Provider ~99
       Design: 1800×2100px SVG, crest centered upper, QR bottom center
    2. Ceramic Coaster — Blueprint ~304
       Design: 1169×1169px SVG, crest top 85%, QR centered below
    3. Wall Clock — Blueprint ~various
       Design: 3000×3000px SVG, crest large right, QR bottom center
    4. Classic T-Shirt — crest on chest, blank back (motto text not rendered — no embedded fonts in resvg-wasm)
    5. Charcuterie Board (CO2 laser engraving) — crest only, NO QR code (single color burn)
    6. Acrylic Print — crest + QR code
    7. Sherpa Blanket — crest + QR code
    8. Java Speaker — crest + QR code

  Dynamic product (code-generated per order):
    White 11oz Ceramic Mug — Blueprint 478, Provider 99
    Created by create-heirloom-order edge function
    Design: 2475×1155px PNG, "HOUSE OF [SURNAME]" text left, crest right, QR left

RESEND (Transactional Email)
  Used by send-legacy-email for Legacy Pack delivery
  API key in RESEND_API_KEY env var

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT TECHNICAL NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EDGE FUNCTION MEMORY LIMITS (resvg-wasm):
  - MAX reliable render size: 1800×2100px at 150 DPI
  - 3600×4200 crashes with CPU/memory budget exceeded
  - SVG output (no rasterization) is preferred when Printify accepts SVG
  - resvg-wasm CANNOT render SVG <text> elements without embedded fonts — avoid text in designs

QR CODE URL FORMAT:
  https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=d4a04a&bgcolor=0d0a07&data=...
  CRITICAL: NO # symbols in color params — qrserver.com rejects them

CREST SIZING IN SVG:
  - preserveAspectRatio="xMidYMid meet" + transparent PNG padding = crest appears smaller
  - Fix: oversize the bounding box (e.g., set width=2400 when canvas is 3000) to force image larger
  - Or use preserveAspectRatio="xMidYMid slice" to fill the box

PRINTIFY PRINT AREAS:
  - Canvas 8×10 satin: actual print area is 3600×4200px (300 DPI)
  - But 1800×2100 SVG scales fine and avoids memory issues
  - QR code must be 600px+ from canvas edge to avoid wrap zone (1.5" frame)

LOVABLE DEPLOYMENT:
  - Greg deploys from Lovable UI (publish button)
  - Edge functions deployed separately via: supabase functions deploy <function-name>
  - Environment variables set in Supabase dashboard → Edge Functions → Secrets

TYPES (keep in sync — Deno and React cannot share source):
  src/types/legacy.ts                                    ← React/Vite side
  supabase/functions/generate-legacy/types.ts            ← Deno side
  These MUST stay byte-identical. Any type change needs updating both files.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PENDING / NOT YET BUILT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HIGH PRIORITY:
  - /shop page — fetch products from Printify API, display with add-to-cart
  - Stop 3 family tree — real visual bloodline tree (currently placeholder)
  - Wire Bloodline Quiz → Claude API (frontend exists, no backend)
  - Wire Motto Generator → Claude API (frontend exists, no backend)
  - Wire Surname Lookup → generate-legacy function
  - Fix legacy certificate: "House Osmond" → "House of Osmond"

MEDIUM PRIORITY:
  - Family Anthem (Suno API) — AI-generated song per family
  - /my-legacy dashboard improvements
  - n8n automations: FamilySearch API, Kit.com email flows
  - T-shirt back: add motto text (needs font embedding solution)
  - Gift delivery flow (/gifts, /gift/[gift-id])

FUTURE:
  - Premium tier ($99+): deep research, hardcover book
  - Family Circle: collaborative multi-user family trees
  - Etsy shop: AncestraShop / AncestraHeritage
  - Social automation: Blotato + n8n

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN SYSTEM — "FIRESIDE LUXURY"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Feel: Sitting by a fire in a beautiful old library. Warm, rich, inviting. NOT cold, NOT techy, NOT blue.

COLORS:
  Backgrounds:
    --bg:              #0d0a07   Main background — warm near-black
    --bg-warm:         #13100b   Slightly warmer sections
    --bg-card:         #1a1510   Card/panel background
    --bg-card-hover:   #221c14   Card hover state
    --bg-input:        #161210   Input field background

  Primary — Amber:
    --amber:           #d4a04a   Primary gold/amber
    --amber-light:     #e8b85c   Headlines in italic, emphasis
    --amber-dim:       #a07830   Labels, subtle accents, dividers

  Accent — Honey (CTAs):
    --honey:           #e8943a   Primary CTA button color
    --honey-light:     #f0a848   Button hover
    --honey-dim:       #c47828   Button gradient end

  Text:
    --cream:           #e8ddd0   Section headings
    --cream-soft:      #d8cdbf   Secondary headings
    --cream-warm:      #f0e8da   Hero headlines — warmest white
    --text:            #d0c4b4   Body text — clearly readable
    --text-body:       #c4b8a6   Extended body copy
    --text-dim:        #8a7e6e   Labels, captions, hints

  Borders:
    --gold-line:       #3d3020   Subtle border
    --dark-line:       #2a2018   Very subtle separator

CRITICAL COLOR RULES:
  - NEVER cold blue, cold gray, or cold white
  - NEVER pure black (#000) — always #0d0a07
  - NEVER pure white (#fff) — always #f0e8da
  - ALL glows/shadows: amber/orange tint, never blue
  - Body text: minimum #d0c4b4 on dark backgrounds
  - CTA buttons: ALWAYS honey-orange (#e8943a), never cold gold

TYPOGRAPHY:
  --display:  'Libre Caslon Display', serif     Headlines, product names, large text
  --serif:    'Libre Caslon Text', serif        Italic quotes, subtitles, mottos
  --sans:     'DM Sans', sans-serif             Body, labels, buttons, UI

  Usage:
    --display → h1-h4, product names, prices, stats
    --serif italic → quotes, subtitles, warm accent text, mottos
    --sans → body paragraphs, labels, buttons, nav, UI elements
  NEVER use: Inter, Roboto, Arial, system fonts

BORDER RADIUS:
  --radius:      14px   Standard cards, inputs
  --radius-lg:   22px   Large cards, panels
  --radius-xl:   32px   Hero cards, modals
  --radius-pill: 60px   ALL buttons (always pill-shaped)

BUTTONS:
  Primary CTA (btn-warm):
    background: linear-gradient(135deg, #e8943a, #c47828)
    color: #1a1208
    font-size: 13px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase
    padding: 16px 40px; border-radius: 60px
    Hover: translateY(-2px) + box-shadow: 0 12px 40px rgba(232,148,58,0.2)

  Secondary (btn-soft):
    background: rgba(232,148,58,0.06)
    border: 1px solid rgba(232,148,58,0.18)
    color: #d4a04a; padding: 15px 40px; border-radius: 60px
    Hover: background rgba(232,148,58,0.12)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Frontend:       Lovable (Vite + React + TypeScript + Tailwind + Framer Motion)
Backend:        Supabase Edge Functions (Deno)
Database:       Supabase (Lovable Cloud — isolated project, no table prefixes needed)
Auth:           Supabase Auth (email, Google, Apple — Lovable Cloud managed)
Storage:        Supabase Storage (buckets: crests, print-designs)
AI - Text:      Claude API (Anthropic) — story, surname meaning, motto, ancestor chat
AI - Image:     DALL-E 3 (OpenAI) — crest generation
AI - TTS:       ElevenLabs — story narration
Payments:       Stripe — $29.99 Legacy Pack + physical products
Email:          Resend (transactional), Kit.com (marketing)
Print-on-demand: Printify (mugs, canvas, coasters, t-shirts, etc.)
Books:          Gelato (hardcover/softcover — future)
Automations:    n8n Cloud (FamilySearch, Suno, Blotato, Kit.com flows)
Social:         Blotato (AI content + scheduling — via n8n)

ENV VARS (Supabase Edge Function Secrets):
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  OPENAI_API_KEY                  ← DALL-E 3 crest generation (generate-crest)
  ANTHROPIC_API_KEY               ← Claude (generate-legacy, expand-chapters)
  ELEVENLABS_API_KEY              ← TTS (ancestor-tts)
  STRIPE_SECRET_KEY               ← payments-webhook, create-checkout
  STRIPE_WEBHOOK_SECRET           ← payments-webhook signature verification
  PRINTIFY_API_KEY                ← orders/fulfillment (create-heirloom-order, printify-proxy)
  PRINTIFY_SHOP_ID                ← Printify shop ID (URL-path param)
  PRINTFUL_API_KEY                ← mug mockup previews ONLY (generate-mug-mockup)
  PRINTFUL_STORE_ID               ← legacy v1; api2.printful.com is Bearer-only (see printify-skill)
  REMOVE_BG_API_KEY               ← strip bg from crests before compositing on dark products (future)
  IDEOGRAM_API_KEY                ← alt/fallback crest generator; stylized variants, readable text (future)
  RESEND_API_KEY                  ← transactional email (send-preview, payments-webhook)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE GUIDED JOURNEY (6 Stops)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Stop 1 — /journey/1 — Enter Your Name
  Single surname input → "Discover My Legacy" CTA
  Calls generate-legacy edge function (Claude API + caches in DB)

Stop 2 — /journey/2 — Your Name Has a Story
  Surname meaning, origin, ancestral role, historical context
  Elements stagger in one by one. CTA: "Meet Your Bloodline"

Stop 3 — /journey/3 — Meet Your Bloodline
  Visual family tree with names, years, locations
  Currently: PLACEHOLDER — not yet wired to real data
  CTA: "Forge Your Crest"

Stop 4 — /journey/4 — Your Crest is Forged
  Forge animation → DALL-E 3 crest reveals with glow
  Motto in Latin + English. Symbolism breakdown.
  CTA: "Read Your Story"

Stop 5 — /journey/5 — Your Story is Written (PAYWALL)
  Chapter I in manuscript style with drop cap
  TTS "Listen" button (ancestor-tts edge function)
  Teaser of 8 more chapters fades out
  PAYWALL: "Unlock My Full Legacy — $29.99" → /checkout

Stop 6 — /journey/6 — Pass It On
  "Who in your family needs to see this?"
  Option A: Send free preview (viral loop)
  Option B: Gift Legacy Pack ($29.99)
  Option C: Gift physical products (linked to shop)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GENERATE-PRINT-DESIGN EDGE FUNCTION SPECS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Endpoint: POST /generate-print-design
Body: { surname: string, productType?: "canvas" | "coaster" | "clock" }
Returns: { url: string, format: "svg", width: number, height: number }

Canvas (default):
  Width: 1800px, Height: 2100px (150 DPI, scales to 3600×4200 Printify print area)
  Background: #0d0a07
  Crest: x=150, y=200, w=1500, h=1100
  QR: x=775, y=1375, w=250, h=250
  QR URL: ancestorsqr.com/f/{surname}

Coaster:
  Width: 1169px, Height: 1169px
  Crest: centered, upper 85% of width
  QR: centered below crest

Clock:
  Width: 3000px, Height: 3000px
  Crest: x=300, y=50, w=2400, h=1400 (oversized box to fill space)
  QR: x=1350, y=2100, w=300, h=300

File naming: {surname}-8x10.svg (canvas), {surname}-coaster.svg, {surname}-clock.svg
Storage bucket: print-designs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BRAND VOICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tone: Warm, emotional, direct. Like a friend who just discovered something incredible about their family.
NOT: corporate, techy, academic, cold

NEVER say: "genealogy database," "data processing," "algorithm," "optimize," "leverage"
ALWAYS say: "legacy," "bloodline," "House," "story," "discover," "forge," "pass it on"

Emotional register: Pride, identity, connection, warmth, nostalgia, strength.
Every experience ends with: "Who in your family needs to see this?"

Positioning: Ancestry.com gives you data. AncestorsQR gives you identity.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GREG'S WORKING STYLE & PREFERENCES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Solo founder. Keep things simple. No over-engineering.
- Prefers inline execution for small tasks (1–5 steps), subagent-driven for large features.
- Prefers merging locally over creating PRs.
- Uses Lovable for frontend changes — Claude provides copy-paste Lovable prompts.
- Uses Higgsfield for video content.
- Deploys edge functions via Supabase CLI: supabase functions deploy <name>
- Reviews Blotato social queue weekly (15-min sprint).
- Email: gregadosmond@gmail.com

Lovable prompt format Greg uses:
  - "Do not modify any existing pages or components."
  - "One change at a time."
  - Give him the exact prompt to paste into Lovable chat.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUCT CATALOG (PHYSICAL — PRINTIFY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mugs:
  White 11oz Ceramic Mug     $27.99    Dynamic per-order via create-heirloom-order
  White 15oz Ceramic Mug     TBD       Future
  Whiskey Glass              TBD       Future

Canvas & Prints:
  Satin Canvas 8×10          $47.99    Created in Printify
  Satin Canvas 11×14         TBD       Future
  Acrylic Print              TBD       Created in Printify

Coasters:
  Ceramic Coaster            TBD       Created in Printify

Clocks:
  Wall Clock                 TBD       Created in Printify

Apparel:
  Classic T-Shirt            TBD       Created in Printify (crest front, blank back)

Kitchen:
  Charcuterie Board          TBD       Laser engraved — crest only, NO QR

Lifestyle:
  Sherpa Blanket             TBD       Created in Printify
  Java Speaker               TBD       Created in Printify

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUCT CATALOG (DIGITAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Legacy Pack (core product)    $29.99    9-chapter family story + crest + tree + certificate
Custom Crest Download         $19       High-res PNG/SVG
Legacy Certificate            $49       Frameable PDF
Combined Wedding Crest        $79       24–48hr delivery

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FREE TOOLS (All Claude API — mostly frontend-only right now)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Bloodline Quiz      → 5 questions → archetype (Warrior/Builder/Explorer/Healer/Scholar)
2. Surname Lookup      → meaning, origin, date, role for any surname
3. Motto Generator     → 3 values → Latin motto with English translation
4. Meet Your Ancestor  → AI ancestor profile (name, year, occupation, personality)
5. The 1700s You       → what your life would look like 300 years ago
6. Ancestor Chat       → live chat with AI ancestor character

All tools end with: "Want to discover your full legacy? → Begin Your Journey"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FOUNDER STORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Gregory Angus Dean Osmond traced his family through 80+ historical documents — wills from the 1700s, church records in Piddletrenthide, Domesday Book entries from 1066. Osmond ancestors were Haywards (land managers) in Dorset, England.

They later migrated to Newfoundland, Canada, where Joseph Osmond built a fishing operation from nothing. Sons Mark and Ambrose grew it into one of the largest shipping businesses in Newfoundland, trading across the West Indies for 100+ years.

Real Osmond Coat of Arms documented since 1688. 12 generations, 80+ documents.
Motto: "Ex Labore, Ascendimus" — From Labour, We Rise.

Key quote: "Most people don't know where they come from — and that disconnect affects who they believe they can become."

GADO: Gregory's initials (Gregory Angus Dean Osmond) = anagram of "A GOD". "Osmond" = Old English for "Divine Protector" (os = god, mund = protector). Used in founder marketing, NOT in the public brand.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROUTES / PAGES REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/                    Landing page
/journey/1           Stop 1: Enter surname
/journey/2           Stop 2: Name meaning
/journey/3           Stop 3: Family tree
/journey/4           Stop 4: Crest forge
/journey/5           Stop 5: Story preview + paywall
/journey/6           Stop 6: Pass it on
/checkout            Stripe checkout
/my-legacy           User dashboard (post-purchase)
/tools               Free tools hub
/tools/quiz          Bloodline Quiz
/tools/surname       Surname Lookup
/tools/motto         Motto Generator
/tools/chat          Ancestor Chat
/shop                Product catalog (NOT BUILT)
/shop/[product-id]   Product detail (NOT BUILT)
/gifts               Gift guide by occasion (NOT BUILT)
/about               Founder story
/gift/[gift-id]      Gift recipient landing (NOT BUILT)
