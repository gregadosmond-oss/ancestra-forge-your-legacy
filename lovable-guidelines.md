# Ancestra — Lovable Project Guidelines

Paste this entire document into Lovable → Project Settings → Knowledge Base / Custom Instructions.

---

## WHAT IS ANCESTRA

AI-powered family legacy platform. User enters surname → in 5 minutes they get a custom 3D coat of arms, family story, family tree, and can order physical products (framed prints, mugs, ornaments, books).

One-liner: "Every family has a story worth telling."

Core UX: a linear 6-stop guided journey. No dashboard. No menu maze. Just forward.

## TECH STACK (already connected)

- **Lovable Cloud** — ENABLED. Handles database, auth (email/Google/Apple), storage, edge functions. Do NOT suggest setting up Supabase separately.
- **Stripe** — payments ($29 Legacy Pack + physical products)
- **n8n Cloud** — external automations, connects to Lovable Cloud DB via Supabase node
- **Claude API** — AI (stories, mottos, ancestor chat, lyrics)
- **FamilySearch API** — genealogy data
- **Printful / Gelato / Printify** — physical product fulfillment
- **Resend** — transactional email
- **Kit.com** — marketing email
- **Suno API** — family anthem song generation
- **Blotato** — social media automation

## DATABASE RULES

- Ancestra uses Lovable Cloud — isolated dedicated database
- **NO table prefixes.** Use clean names: `users`, `crests`, `stories`, `trees`, `orders`, `gifts`, `quiz_results`, `anthems`
- Use Lovable Cloud auth (not custom auth). Email + Google + Apple sign-in only.
- Store images (crests, product mockups) in Lovable Cloud Storage
- Edge Functions preferred over external webhooks for Stripe, Claude API calls, and Printful calls

## CRITICAL LOVABLE RULES

1. **One change at a time.** Never bundle multiple features per prompt.
2. **Always include**: "Do not modify any existing pages or components" — unless explicitly told otherwise.
3. **Use the Ancestra design system below.** NOT RelocateIQ's design. NOT any generic Tailwind default.
4. **No cold colors ever.** No blue, no gray, no pure black, no pure white. Everything warm.
5. **Every button is pill-shaped** (border-radius: 60px).
6. **Every card has rounded corners** (14–32px).

## DESIGN SYSTEM — "FIRESIDE LUXURY"

The app must feel like sitting by a fire in a beautiful old library. Warm, rich, inviting.

### Colors (use these hex values exactly)

```css
/* Backgrounds */
--bg:              #0d0a07;   /* main background — warm near-black */
--bg-warm:         #13100b;
--bg-card:         #1a1510;
--bg-card-hover:   #221c14;
--bg-input:        #161210;

/* Primary — Amber */
--amber:           #d4a04a;
--amber-light:     #e8b85c;
--amber-dim:       #a07830;

/* Accent — Honey (CTA buttons) */
--honey:           #e8943a;   /* ALL primary CTAs */
--honey-light:     #f0a848;
--honey-dim:       #c47828;

/* Text */
--cream:           #e8ddd0;
--cream-soft:      #d8cdbf;
--cream-warm:      #f0e8da;   /* hero headlines */
--text:            #d0c4b4;   /* body */
--text-body:       #c4b8a6;
--text-dim:        #8a7e6e;   /* labels */

/* Borders */
--gold-line:       #3d3020;
--dark-line:       #2a2018;

/* Specialty */
--rose:            #c47070;   /* wedding/valentines */
--green:           #4a9e6a;   /* success */
```

### Typography (Google Fonts — load these)

- `Libre Caslon Display` — all headings, product names, prices
- `Libre Caslon Text` (italic) — quotes, subtitles, mottos
- `DM Sans` — body, buttons, labels, UI

Never use Inter, Roboto, Arial, or system fonts.

### Buttons

Primary CTA:
```css
background: linear-gradient(135deg, #e8943a, #c47828);
color: #1a1208;
font-size: 13px;
font-weight: 600;
letter-spacing: 1.5px;
text-transform: uppercase;
padding: 16px 40px;
border-radius: 60px;
```

Secondary:
```css
background: rgba(232,148,58,0.06);
border: 1px solid rgba(232,148,58,0.18);
color: #d4a04a;
padding: 15px 40px;
border-radius: 60px;
```

### Radius tokens

```css
--radius:      14px;   /* cards, inputs */
--radius-lg:   22px;   /* large panels */
--radius-xl:   32px;   /* hero cards, modals */
--radius-pill: 60px;   /* ALL buttons */
```

## BRAND VOICE

- Warm, emotional, direct. NOT corporate. NOT techy. NOT academic.
- Like a friend who discovered something incredible about their family.
- **Never say**: "genealogy database," "data processing," "algorithm," "optimize," "leverage"
- **Always say**: "legacy," "bloodline," "House," "story," "discover," "forge," "pass it on"

## THE 6-STOP JOURNEY (the core product)

1. **Enter Your Name** — surname input, optional details → "Discover My Legacy"
2. **Your Name Has a Story** — surname meaning, origin, date, ancestral role → "Meet Your Bloodline"
3. **Meet Your Bloodline** — vertical family tree, user highlighted in gold → "Forge Your Crest"
4. **Your Crest is Forged** — 3D crest reveal with glow, motto in Latin + English → "Read Your Story"
5. **Your Story is Written** — Chapter 1 typewriter reveal → PAYWALL $29 Legacy Pack
6. **Pass It On** — gift options (free preview, $29 digital gift, physical products)

## ROUTES

```
/                    → Landing page (marketing)
/journey/step/1-6    → The 6-stop guided experience
/tools               → Free tools hub
/tools/quiz          → Bloodline quiz
/tools/surname       → Surname lookup
/tools/ancestor      → Meet your ancestor
/tools/1700s         → 1700s you
/tools/motto         → Motto generator
/tools/chat          → Ancestor chat
/shop                → Product catalog
/shop/[id]           → Product detail
/gifts/[occasion]    → Gift guides by occasion
/about               → Founder story
/checkout            → Stripe
/my-legacy           → User dashboard (post-purchase)
/gift/[gift-id]      → Gift recipient landing
```

## 3D / IMAGERY

- Use Lovable's 3D library (React Three Fiber + drei) for the crest hero and crest reveal animation
- Crest PNG lives at `/public/crest.png` — use as texture on a 3D plane with subtle depth and rim lighting
- All lighting is warm amber (`#e8943a`), never cold blue
- Background of 3D scenes: warm-black `#0d0a07` with soft amber radial glow

## DO NOT

- Do not use Supabase directly — Lovable Cloud wraps it
- Do not add prefixes to table names
- Do not bundle multiple features per prompt
- Do not modify existing pages/components without being told
- Do not use cold/blue colors
- Do not use Inter or system fonts
- Do not use square corners on buttons
- Do not suggest dashboards — the app is linear
