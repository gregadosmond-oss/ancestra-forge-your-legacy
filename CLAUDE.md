═══════════════════════════════════════════════════════
ANCESTORSQR — PROJECT BRIEF, CONTROLS & STATE
Updated: May 12, 2026 (post FS-unlock + drip personalization session)
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
7. SUPABASE EDGE FUNCTIONS live at: /Users/hrcommb3/Documents/ancestra/supabase/functions/
8. LOVABLE CLOUD — edge functions deploy via Lovable, NOT supabase CLI. Edit, then ask Lovable to deploy.
9. MEMORY files live at: /Users/hrcommb3/.claude/projects/-Users-hrcommb3-Documents-ancestra/memory/
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
| Edit or create a Supabase edge function | Edit the file under supabase/functions/ directly OR give Greg a Lovable prompt for the same edit. Lovable Cloud handles deployment — never suggest `supabase functions deploy` CLI. |
| Add/edit a Printify product (canvas, coaster, clock, t-shirt, blanket, etc.) | He does this manually at printify.com. Your job is only the design SVG/PNG (via generate-print-design). |
| Change the dynamic mug | That's create-heirloom-order edge function. Treat like any edge function. |
| Fix a 500 from an edge function | Ask Lovable to pull edge function logs for the time window — never use supabase CLI. Or use Supabase MCP `get_logs` if available. |
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
| Lovable claims a file change is "already done" but local file shows otherwise | Lovable's cloud filesystem is ahead of GitHub-synced local copy | Trust deployed behavior, not local file. Verify by triggering the live function with a test payload. |
| User signs up but no welcome email | One of the 5 entry paths failed to fire | All 5 paths (JourneyGate, FreeToolsEmailCTA, AuthGate email+pwd, AuthGate Google, AppLayout safety net) now fire welcome as of May 12 2026. Check `[send-welcome-email]` and `[sync-to-resend-audience]` logs for that email. |
| Social card preview shows broken image | og-default.jpg missing from /public/ | Confirm /public/og-default.jpg exists and serves 200 (not 404). It's the fallback for every page without a surname-specific crest. |
| Google OAuth signup gets no welcome | (legacy gap) | FIXED May 12 2026. AppLayout.tsx now subscribes to supabase.auth.onAuthStateChange — on SIGNED_IN it inserts into journey_subscribers (23505 dedup), then fires welcome + audience sync. Catches Google OAuth + every future auth method. |
| Local repo lags behind Lovable cloud | Lovable publishes to GitHub but local doesn't pull | `cd ~/Documents/ancestra && git pull origin main`. On May 12 the local was 108 commits behind. May need to `rm public/og-default.jpg` first if untracked-file conflict appears. |
| Resend Publish button doesn't work in automation | Resend uses a slide-to-publish gesture | Greg has to do this manually with mouse. Cannot drive via Chrome MCP — requires real user-activation event. |
| Drip email links return 404 | `/surname`, `/motto`, `/crest`, `/ancestor` are not real routes | Use `/tools/surname`, `/tools/motto`, `/journey/4` (for crest), `/tools/ancestor`. All 3 drip templates corrected May 12 2026. |
| Drip email greeting says "Hi friend," for some users | They signed up before AuthGate first-name capture | Expected. The `{{{first_name}}}` merge tag falls back to "friend" when contact has no first_name. JourneyGate doesn't yet capture first_name (planned). |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KEY FILE PATHS — CENTRAL REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project root:
  /Users/hrcommb3/Documents/ancestra/

Instructions & memory:
  /Users/hrcommb3/Documents/ancestra/CLAUDE.md
  /Users/hrcommb3/.claude/projects/-Users-hrcommb3-Documents-ancestra/memory/MEMORY.md
  /Users/hrcommb3/.claude/projects/-Users-hrcommb3-Documents-ancestra/memory/     ← individual memory files

Frontend (Lovable — DO NOT EDIT LOCALLY):
  /Users/hrcommb3/Documents/ancestra/src/                       ← all pages, components, types
  /Users/hrcommb3/Documents/ancestra/src/types/legacy.ts        ← React-side Legacy types (must mirror Deno)
  /Users/hrcommb3/Documents/ancestra/src/hooks/usePageMeta.ts   ← per-page SEO title/og-tag hook

Edge functions (Lovable Cloud — edit locally, Lovable deploys):
  /Users/hrcommb3/Documents/ancestra/supabase/functions/      ← all edge functions live here

Static assets:
  /Users/hrcommb3/Documents/ancestra/public/og-default.jpg    ← 1200×630 OG image (used as og:image fallback)
  /Users/hrcommb3/Documents/ancestra/public/sitemap.xml       ← public sitemap
  /Users/hrcommb3/Documents/ancestra/public/robots.txt        ← crawler rules

Custom skills (user-global, usable in any session):
  /Users/hrcommb3/.claude/skills/lovable-prompt/SKILL.md
  /Users/hrcommb3/.claude/skills/deploy-edge-function/SKILL.md

Supabase config:
  /Users/hrcommb3/Documents/ancestra/supabase/config.toml

Project ID (Lovable Cloud Supabase): fjtkjbnvpobawqqkzrst

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
WHAT'S BUILT (Current State — May 2026)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FRONTEND (Lovable — Vite + React + Tailwind + Framer Motion)

All pages have per-page SEO titles + Open Graph meta tags via the usePageMeta hook
(src/hooks/usePageMeta.ts). Default og:image is /og-default.jpg (branded 1200×630 cover).

Pages / Routes:
  /                    → Landing page (hero, free tools preview, pricing, How It Works, CTA)
  /journey/1           → Stop 1: Surname input
  /journey/2           → Stop 2: Name meaning reveal
  /journey/3           → Stop 3: Bloodline + FULL FamilySearch UI (Connect button, manual ancestor search form, tree display, disconnect). FS_COMING_SOON = false as of May 12 2026. Blocked only on Gordon Clarke registering redirect URI server-side.
  /journey/4           → Stop 4: Crest forge reveal (DALL-E 3 generated, cached) — dynamic title "House of [Surname]"
  /journey/5           → Stop 5: Story Chapter I + $29.99 Stripe paywall — dynamic title "The [Surname] Family Story"
  /journey/6           → Stop 6: Pass It On — share buttons, gift options, mug upsell
  /pricing             → Pricing comparison: Free / Legacy Pack $29.99 / Deep Legacy $79
  /shop                → Heirloom shop — Mug $49.99, Canvas (4 sizes), Throw Blanket (3 sizes), Cork Coaster, Legacy Book $129 Coming Soon
  /heirloom-order      → Mug order form (dynamic per-order via create-heirloom-order)
  /product-order       → Generic product order form (164-country dropdown)
  /cart                → Cart page (Popular Gifts: Pack, Mug, Book Coming Soon)
  /checkout            → Stripe checkout entry
  /my-legacy           → User dashboard (post-purchase) — auth-gated, redirects to /journey/1 if not signed in
  /deep-legacy         → Premium $79 tier landing
  /deep-legacy/...     → Deep Legacy interview flow subpages
  /tools               → Free tools hub
  /tools/surname       → Surname Lookup (wired to surname-lookup edge fn)
  /tools/quiz          → Bloodline Quiz (wired to bloodline-quiz edge fn)
  /tools/motto         → Motto Generator (wired to motto-generator edge fn)
  /tools/ancestor      → Meet Your Ancestor (wired to meet-ancestor edge fn)
  /tools/1700s         → The 1700s You (wired to the-1700s-you edge fn)
  /tools/chat          → Ancestor Chat (wired to ancestor-chat edge fn)
  /about               → Founder story
  /privacy-policy      → Privacy policy (contact: greg@ancestorsqr.com)
  /terms               → Terms of service (contact: greg@ancestorsqr.com)
  /f/:surname          → Public family share page — dynamic title + cached crest as og:image
  /gift/:giftId        → Individual gift redemption page
  /gifts/:occasion     → Gift occasion landing pages (Father's Day, Christmas, etc.)
  /confirmation        → Post-purchase confirmation page
  /auth/familysearch/callback → FamilySearch OAuth callback (validates state, calls auth-familysearch-callback edge fn, redirects to /journey/3?fs_connected=true)
  /404                 → On-brand "branch of family tree doesn't exist" with Begin Journey CTA

Key components:
  - AppLayout (global navbar, footer, step counter + onAuthStateChange listener as of May 12 2026 — catches every SIGNED_IN event, fires welcome + audience sync via 23505 dedup gate. Belt+suspenders against future auth gaps.)
  - JourneyGate (Stop 1 email capture — inserts journey_subscribers, fires welcome + audience sync, AND magic-link OTP with shouldCreateUser=true. Creates a real Supabase auth account as of May 12 2026.)
  - AuthGate (navbar Sign In modal — email+password OR Google OAuth. Optional first_name field as of May 12 2026 captures + pipes to send-welcome-email + sync-to-resend-audience. Welcome email greets "Hi <FirstName>," when set, falls back to "Hi friend,".)
  - FreeToolsEmailCTA (giant gate on /tools — hides automatically for logged-in users as of May 12 2026)
  - JourneyContext (shared state: surname, email, etc. across stops)
  - useEmailGate hook (inline free tool email gate; checks auth session before showing JourneyGate)
  - usePageMeta hook (per-page SEO + OG tags, wired into ~15 pages)
  - Stop5Story (TTS playback via ancestor-tts)
  - FreeCrest, ScrollChevron, RetryInline, SectionLabel

FamilySearch frontend:
  - src/pages/auth/FamilySearchCallback.tsx → loading/success/error UI for OAuth return
  - src/lib/familySearchAuth.ts → initiateFamilySearchOAuth() helper (generates state UUID, stores in localStorage, calls familysearch-build-auth-url, redirects to FS)
  - Stop 3 has full FS UI behind FS_COMING_SOON flag (set to false May 12 2026)

BACKEND (Supabase Edge Functions — Deno, deployed via Lovable Cloud)

  Core legacy generation:
    generate-legacy            → Claude API: LegacyFacts + LegacyStory for a surname (cached)
    generate-legacy-fixture    → Test fixture (dev only)
    generate-crest             → DALL-E 3: coat of arms PNG, cached in surname_crests
    expand-chapters            → Claude: expands teaser chapters into full bodies (post-purchase)

  Free tools (all Claude-backed):
    surname-lookup, bloodline-quiz, motto-generator, motto-english, motto-latin, meet-ancestor, the-1700s-you, ancestor-chat
    (motto-generator was split into motto-english + motto-latin sub-functions for the two-language output)

  Voice / TTS:
    ancestor-tts               → ElevenLabs: story narration audio

  Email & onboarding:
    send-welcome-email         → Resend: branded HTML+plaintext welcome ("Your story is waiting"). Uses first_name when provided, falls back to "friend".
    sync-to-resend-audience    → Adds contact to Resend Audience with first_name field + fires `ancestorsqr_welcome_started` drip automation event (only for new contacts, idempotent)
    send-preview               → Sends free preview to recipient (viral loop)
    resend-legacy-email        → Resend: re-sends Legacy Pack to customer
    auth-email-hook            → Supabase auth email customizer (magic link template — sender "AncestorsQR" from noreply@notify.ancestorsqr.com)
    auth-callback              → Supabase auth callback handler
    auth-gate                  → Auth gate helper edge function
    process-email-queue        → Background email queue worker

  FamilySearch (all live as of May 12 2026):
    auth-familysearch-callback → Token exchange (requires AncestorsQR auth, exchanges FS code for tokens, upserts familysearch_sessions table)
    familysearch-build-auth-url → Builds OAuth URL server-side so AppKey never exposed to client; returns redirect URL
    familysearch-pull-tree     → Pulls ancestor tree (4 generations default) from FS Tree API
    familysearch-search-records → Searches FS records by surname + location + dates

  Payments & orders:
    create-checkout            → Creates Stripe checkout session
    payments-webhook           → Stripe webhook → triggers Legacy Pack delivery + order fulfillment
    get-stripe-price           → Fetches active Stripe Price for product
    create-product-order       → Generic product order creation
    create-heirloom-order      → Dynamic mug order: PNG via resvg-wasm → Printify
    create-printful-order      → Printful order creation (legacy/fallback)
    create-legacy-book-order   → Gelato book order
    book-waitlist-signup       → Legacy Book waitlist (Coming Soon CTA)

  Print design:
    generate-print-design      → SVG builder for canvas/coaster/clock
    generate-mug-mockup        → Printful mockup preview for mug

  Deep Legacy ($79 premium tier):
    deep-legacy-research       → Web research + ancestor records
    deep-legacy-book           → Generates premium book content

  Gelato (book printing):
    gelato-list-catalogs, gelato-catalog-search, gelato-cover-dims, gelato-placeholder-pdfs
    render-legacy-book-pdf     → Builds full legacy book PDF (interior)
    render-legacy-book-cover-pdf → Builds book cover PDF

  Other:
    printify-proxy             → Printify API proxy
    og-preview                 → Renders OG share image dynamically

DATABASE (Supabase — Lovable Cloud, project_id: fjtkjbnvpobawqqkzrst)

Tables:
  surname_crests          → { surname, image_url, prompt } — cached DALL-E crests
  users                   → Supabase auth (managed by Lovable)
  journey_subscribers     → email + welcome_sent_at (atomic dedup) + source
  purchases               → Legacy Pack purchases (used by usePurchase hook)
  orders                  → physical product orders
  gifts                   → gift sends + recipient tracking
  book_waitlist           → Legacy Book Coming Soon waitlist
  familysearch_sessions   → OAuth tokens per user (for FS integration when approved)

Storage buckets:
  crests                  → Crest PNG files
  print-designs           → Printify SVG/PNG files

STRIPE
  Legacy Pack — $29.99 one-time
  Deep Legacy — $79 one-time
  Family Crest Mug — $49.99 (includes Legacy Pack)
  Plus Canvas (4 sizes $34.99–$89.99), Throw Blanket (3 sizes $39.99–$59.99), Cork Coaster $34.99
  payments-webhook handles Stripe events → triggers Legacy Pack delivery + order fulfillment

PRINTIFY (Physical Products)
  Connected via API. Shop ID + API key in env vars.
  Products created/edited manually at printify.com (except dynamic mug — code-generated per order).
  See PRODUCT CATALOG section below for the live list.

RESEND (Transactional + Marketing Email)
  Sender domain: ancestorsqr.com
  Welcome from: Greg Osmond <greg@ancestorsqr.com>
  Magic link from: AncestorsQR <noreply@notify.ancestorsqr.com> (Supabase auth, sender-branded)
  Resend Audience id: a1eceeb4-b885-4792-a4a2-24b50be60887 (single audience, all subscribers)
  3-step drip automation triggered by custom event ancestorsqr_welcome_started
    Day 3 → "Where did your name come from?"  → https://ancestorsqr.com/tools/surname (template: Surname Discovery)
    Day 7 → "Your family deserves a coat of arms" → https://ancestorsqr.com/tools/motto + https://ancestorsqr.com/journey/1 (template: Family Crest Prompt)
    Day 14 → "Someone in your bloodline left a story" → https://ancestorsqr.com/tools/ancestor (template: Ancestor Introduction)
  All 3 drip templates use {{{first_name}}} merge tag with fallback "friend" (set up May 12 2026).
  All emails CAN-SPAM compliant with Oshawa mailing address (HTML + plaintext).
  Kit.com: deprecated for AncestorsQR (still used for RelocateIQ only).
  Drip URL fix May 12 2026: previously linked to /surname, /motto, /crest (all 404). All corrected.

SIGNUP FLOWS — FIVE ENTRY POINTS, ALL FIRE WELCOME + AUDIENCE SYNC (May 12 2026 unification)

  Every entry point now creates a real Supabase auth account AND fires welcome + drip enrollment.
  No more "I gave you my email but can't sign in" conversion cliff.

  Path A — JourneyGate (Stop 1 surname signup, also inline tool gate via useEmailGate):
    - Inserts journey_subscribers row (source="journey-gate")
    - Sends welcome email (Greg Osmond <greg@ancestorsqr.com>)
    - Syncs to Resend Audience + fires drip automation event
    - Magic-link OTP via signInWithOtp({shouldCreateUser: true}) → creates real auth account
    - Total emails day-0: welcome + magic link = 2. Plus 3 drips = 5 over 14 days.

  Path B1 — AuthGate email + password (navbar Sign In → Create Account):
    - signUp with auto-confirm, then immediate signInWithPassword
    - Inserts journey_subscribers row (source="auth-gate")
    - Sends welcome email (uses first_name if captured)
    - Syncs to Resend Audience with first_name field
    - Total emails: 1 welcome + 3 drips = 4 over 14 days

  Path B2 — AuthGate Google OAuth:
    - lovable.auth.signInWithOAuth("google") → redirect to Google → redirect back
    - AppLayout onAuthStateChange listener catches SIGNED_IN, fires welcome + audience sync via 23505 dedup
    - Total emails: 1 welcome + 3 drips = 4 over 14 days (no separate magic link)

  Path C — FreeToolsEmailCTA (giant gate on /tools, hides for logged-in users):
    - Inserts journey_subscribers (source="free-tools-page")
    - Sends welcome email
    - Syncs to Resend Audience
    - Magic-link OTP via signInWithOtp({shouldCreateUser: true})
    - Total emails: 2 day-0 + 3 drips = 5

  Path D — AppLayout onAuthStateChange listener (safety net for ALL auth methods):
    - Fires on every SIGNED_IN event
    - Attempts journey_subscribers insert with source="oauth"
    - On 23505 dedup → already onboarded, skips silently
    - On success → fires welcome + audience sync
    - Catches Google OAuth, Apple OAuth, future auth methods. Belt+suspenders.

FAMILYSEARCH (Beta — Mostly Live as of May 12 2026)
  Beta AppKey: b00QWS0JL7HB1U0680D0 (received Apr 29 2026 from FS DevSupport)
  Endpoint: https://identbeta.familysearch.org/cis-web/oauth2/v3/authorization
  Redirect URI registered with us: https://ancestorsqr.com/auth/familysearch/callback
  Realm: https://ancestorsqr.com
  Env vars: FAMILYSEARCH_APP_KEY (set), FAMILYSEARCH_APP_SECRET (optional, not set), FAMILYSEARCH_AUTH_BASE_URL (defaults to beta)

  Frontend (deployed):
    Stop 3 has FS UI behind FS_COMING_SOON flag — flipped to false May 12 2026
    src/pages/auth/FamilySearchCallback.tsx — OAuth return handler with loading/success/error states
    src/lib/familySearchAuth.ts — initiateFamilySearchOAuth() helper

  Edge functions (deployed):
    auth-familysearch-callback — token exchange + familysearch_sessions upsert
    familysearch-build-auth-url — server-side URL builder (keeps AppKey hidden)
    familysearch-pull-tree — pulls 4-gen ancestor tree
    familysearch-search-records — surname/location/date record search

  BLOCKED ON FS: redirect URI NOT yet registered on their side. Test on May 12 returns "Invalid Oauth2 Request — unable to find client id".
  Contact: Gordon Clarke <Gordon@familysearch.org> (warm partner, not devsupport queue)
  Action: reply to existing thread "Re: Signature requested on SolutionsAgreementandTermsNov2020B" asking Gordon to confirm activation. Draft email exists in May 12 chat session.

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

BLOCKED — WAITING ON EXTERNAL:
  - FamilySearch redirect URI registration → Gordon Clarke needs to register
    https://ancestorsqr.com/auth/familysearch/callback on FS side. Code is fully built and deployed.
    Test on May 12 returned "Invalid Oauth2 Request — unable to find client id" → AppKey not yet
    activated for OAuth in their system.
  - Production AppKey from FamilySearch (currently on beta — OK for now).

OPERATIONAL — DO NEXT:
  - Send the drafted Gordon Clarke reply email to unblock FS OAuth (draft in May 12 chat).
  - First broadcast email to Resend Audience (CAN-SPAM compliant, all systems ready).
  - Blotato social automation kickoff (video kit ready, n8n workflow exists per memory).
  - Add first_name capture to JourneyGate so Path A users also get personalized drips
    (currently only AuthGate captures first_name; Path A users fall back to "Hi friend,").
  - Verify Day 14 drip lands for gregadosmond+stop5test1@gmail.com on May 14 2026
    (Day 3 and Day 7 already verified May 3 + May 7).

DONE — RECENT (May 12 2026):
  - Unified signup → all 5 entry paths create real auth accounts
  - Fixed AuthGate email leak (was silently bypassing welcome on password signup)
  - Fixed Google OAuth welcome gap (AppLayout listener)
  - Pulled 108 commits from Lovable to local repo
  - Fixed broken drip URLs (/surname → /tools/surname, /motto → /tools/motto, /crest → /journey/1, /ancestor → /tools/ancestor)
  - First-name capture on AuthGate (optional field) piped through to welcome + drips
  - All 3 drip templates personalized with {{{first_name}}} merge tag + "friend" fallback
  - FreeToolsEmailCTA now hides for logged-in users
  - FamilySearch FS_COMING_SOON flag flipped to false (UI fully live, awaiting FS-side activation)
  - All drip templates renamed: Surname Discovery / Family Crest Prompt / Ancestor Introduction

NICE-TO-HAVE:
  - Drip emails branded HTML wrapper → currently plain body text. Welcome is fully branded HTML.
    Improve in Resend templates before any major broadcast push.
  - Stop 3 placeholder tree (era timeline) → replace with real FS tree data once Gordon Clarke activates the redirect URI.

FUTURE:
  - Family Anthem (Suno API) — AI-generated song per family
  - /my-legacy dashboard improvements (post-purchase user portal)
  - T-shirt back: add motto text (needs font embedding solution for resvg-wasm)
  - Gift delivery flow polish (/gifts, /gift/[gift-id])
  - Family Circle — collaborative multi-user family trees
  - Etsy shop spinoff
  - Premium tier extensions beyond Deep Legacy

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
- Edge functions deploy via Lovable Cloud — no CLI needed. Lovable handles deployment.
- Reviews Blotato social queue weekly (15-min sprint).
- Email: gregadosmond@gmail.com

Lovable prompt format Greg uses:
  - "Do not modify any existing pages or components."
  - "One change at a time."
  - Give him the exact prompt to paste into Lovable chat.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUCT CATALOG (PHYSICAL — PRINTIFY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All physical products INCLUDE the Legacy Pack ($29.99 value) at no extra cost.

Drinkware:
  Family Crest Mug 11oz       $49.99    Dynamic per-order via create-heirloom-order
  Cork-Back Coaster           $34.99    Created in Printify

Prints & Wall Art:
  Satin Canvas 8"×10"         $34.99    Created in Printify
  Satin Canvas 12"×16"        $42.99    Created in Printify
  Satin Canvas 18"×24"        $59.99    Best Seller
  Satin Canvas 24"×36"        $89.99    Largest format
  Acrylic Print               TBD       Created in Printify (planned)

Keepsakes:
  Throw Blanket 30"×40"       $39.99    Sublimation throw
  Throw Blanket 50"×60"       $49.99    Most Popular
  Throw Blanket 60"×80"       $59.99    Largest

Legacy Books:
  The Legacy Book             $129      Coming Soon — book_waitlist signup CTA

Future / Not Yet Listed:
  T-Shirt                     TBD       Crest front, blank back (motto pending font solution)
  Charcuterie Board           TBD       Laser engraved, crest only (no QR — single color burn)
  Java Speaker                TBD       Crest + QR

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUCT CATALOG (DIGITAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Legacy Pack             $29.99   9-chapter family story + crest + bloodline + certificate
Deep Legacy             $79      Everything in Legacy Pack + 15-question AI interview + deep
                                 historical research + 12 chapters + 5-generation tree + premium
                                 certificate. 24-hour delivery.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FREE TOOLS (All Claude-wired, all live as of May 2026)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Surname Lookup      → meaning, origin, date, role for any surname → surname-lookup edge fn
2. Bloodline Quiz      → 5 questions → archetype (Warrior/Builder/Explorer/Healer/Scholar) → bloodline-quiz
3. Motto Generator     → 3 values → Latin motto with English translation → motto-generator
4. Meet Your Ancestor  → AI ancestor profile (name, year, occupation, personality) → meet-ancestor
5. The 1700s You       → what your life would look like 300 years ago → the-1700s-you
6. Ancestor Chat       → live chat with AI ancestor character → ancestor-chat

All tools end with a CTA back into the journey funnel.

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
/journey/3           Stop 3: Bloodline timeline + FS Coming Soon banner
/journey/4           Stop 4: Crest forge
/journey/5           Stop 5: Story preview + paywall
/journey/6           Stop 6: Pass it on
/pricing             Free / $29.99 / $79 comparison
/shop                Heirloom shop (live)
/heirloom-order      Mug order form
/product-order       Generic product order form
/cart                Cart page
/checkout            Stripe checkout
/my-legacy           User dashboard (auth-gated)
/deep-legacy         $79 premium tier landing
/deep-legacy/...     Deep Legacy interview subpages
/tools               Free tools hub
/tools/surname       Surname Lookup (Claude-wired)
/tools/quiz          Bloodline Quiz (Claude-wired)
/tools/motto         Motto Generator (Claude-wired)
/tools/ancestor      Meet Your Ancestor (Claude-wired)
/tools/1700s         The 1700s You (Claude-wired)
/tools/chat          Ancestor Chat (Claude-wired)
/about               Founder story
/privacy-policy      Privacy policy
/terms               Terms of service
/f/:surname          Public family share page (dynamic OG)
/auth/familysearch/callback  OAuth callback (built but UI-hidden via FS_COMING_SOON flag)
/404                 On-brand "branch doesn't exist" → Begin Journey CTA
