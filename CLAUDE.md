═══════════════════════════════════════════════════════
ANCESTRA — COMPLETE PROJECT BRIEF & SKILLS GUIDE
═══════════════════════════════════════════════════════
Paste this into: Claude Code, Lovable system prompt,
Claude Projects, or any AI tool working on Ancestra.
═══════════════════════════════════════════════════════
WHAT IS ANCESTRA
Ancestra is an AI-powered family legacy platform that helps people discover their ancestry, generate a custom coat of arms, and turn their family history into shareable stories and physical products.
It is NOT a genealogy database. It is an emotional identity discovery experience. The user enters their surname, and within 5 minutes they have a custom crest, a family story, a visual family tree, and the option to gift physical products with their crest on them.
One-liner: "Every family has a story worth telling."
Core product: A guided 6-stop journey from surname input → crest reveal → story → gift.
Business model:

* Free: surname lookup, bloodline quiz, motto generator, ancestor personality, 1700s you, ancestor chat
* Paid ($29): Legacy Pack — full crest (high-res), AI-written family story, visual family tree, legacy certificate, ancestor chat
* Physical products ($29-$149): Framed crest, beer mug, ornament, legacy book, metal wall sign, coasters, combined wedding crest
* Premium ($99+): Deep genealogy research, extended tree, hardcover book, Family Circle (collaborative)
Founder: Gregory Angus Dean Osmond. Traced his own Osmond lineage back to Dorset, England, 1066. Family motto: "Ex Labore, Ascendimus" — From Labour, We Rise. Since 1688.
BRAND VOICE
Tone: Warm, emotional, direct. Not corporate. Not techy. Not academic. Like a friend who just discovered something incredible about their family and can't wait to show you.
Never say: "genealogy database," "data processing," "algorithm," "optimize," "leverage"
Always say: "legacy," "bloodline," "House," "story," "discover," "forge," "pass it on"
Emotional register: Pride, identity, connection, warmth, nostalgia, strength. The feeling of discovering you come from something meaningful.
Competitive positioning: Ancestry.com gives you data. Ancestra gives you identity. We're not competing with genealogy tools — we're competing with gift cards and generic presents.
DESIGN SYSTEM — "FIRESIDE LUXURY"
The design must feel like sitting by a fire in a beautiful old library, discovering something meaningful. Warm, rich, inviting — not cold, not techy, not blue.
Colors

```
/* ═══ CORE PALETTE ═══ */

/* Backgrounds */
--bg:              #0d0a07;     /* Main background — warm near-black */
--bg-warm:         #13100b;     /* Slightly warmer sections */
--bg-card:         #1a1510;     /* Card/panel background */
--bg-card-hover:   #221c14;     /* Card hover state */
--bg-input:        #161210;     /* Input field background */

/* Primary — Amber */
--amber:           #d4a04a;     /* Primary gold/amber */
--amber-light:     #e8b85c;     /* Headlines in italic, emphasis */
--amber-dim:       #a07830;     /* Labels, subtle accents, dividers */

/* Accent — Honey (CTAs and warmth) */
--honey:           #e8943a;     /* Primary CTA button color */
--honey-light:     #f0a848;     /* Button hover */
--honey-dim:       #c47828;     /* Button gradient end */

/* Text */
--cream:           #e8ddd0;     /* Section headings */
--cream-soft:      #d8cdbf;     /* Secondary headings */
--cream-warm:      #f0e8da;     /* Hero headlines — warmest white */
--text:            #d0c4b4;     /* Body text — clearly readable */
--text-body:       #c4b8a6;     /* Extended body copy */
--text-dim:        #8a7e6e;     /* Labels, captions, hints */

/* Borders & Lines */
--gold-line:       #3d3020;     /* Subtle border color */
--dark-line:       #2a2018;     /* Very subtle separator */

/* Specialty */
--rose:            #c47070;     /* Wedding/Valentine's accent */
--green:           #4a9e6a;     /* Success/confirmation */

```

CRITICAL COLOR RULES

* NEVER use cold blue, cold gray, or cold white
* NEVER use pure black (#000000) — always warm-black (#0d0a07)
* NEVER use pure white (#ffffff) — always warm-cream (#f0e8da)
* ALL glows and shadows should be amber/orange tinted, never blue
* Body text must be #d0c4b4 or lighter — readability is critical
* CTA buttons are ALWAYS honey-orange (#e8943a), never cold gold
Typography

```
/* Fonts — load from Google Fonts */
--display:     'Libre Caslon Display', serif;   /* Headlines, product names, large text */
--serif:       'Libre Caslon Text', serif;       /* Italic quotes, subtitles, accents */
--sans:        'DM Sans', sans-serif;            /* Body text, labels, buttons, UI */

```

Usage rules:

* `--display` for all headings (h1-h4), product names, prices, stats
* `--serif` italic for quotes, subtitles, warm accent text, mottos
* `--sans` for body paragraphs, labels, buttons, navigation, UI elements
* NEVER use Inter, Roboto, Arial, or system fonts
* Headlines: cream-warm (#f0e8da)
* Italic accents: amber-light (#e8b85c)
* Body: text (#d0c4b4)
* Labels/captions: text-dim (#8a7e6e) with letter-spacing: 2-4px, uppercase
Border Radius

```
--radius:      14px;     /* Standard cards, inputs */
--radius-lg:   22px;     /* Large cards, panels */
--radius-xl:   32px;     /* Hero cards, modals */
--radius-pill: 60px;     /* ALL buttons — always pill-shaped */

```

CRITICAL: All buttons must be pill-shaped (border-radius: 60px). All cards must have rounded corners (14-32px). No sharp edges anywhere.
Buttons
Primary CTA (btn-warm):

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

Hover: translateY(-2px) + box-shadow: 0 12px 40px rgba(232,148,58,0.2)
Secondary (btn-soft):

```css
background: rgba(232,148,58,0.06);
border: 1px solid rgba(232,148,58,0.18);
color: #d4a04a;
padding: 15px 40px;
border-radius: 60px;

```

Hover: background rgba(232,148,58,0.12)
Texture & Atmosphere

* Subtle grain overlay on body (fractalNoise SVG filter, opacity 0.018)
* Warm ambient radial gradient behind hero elements (rgba(232,148,58,0.02))
* Card borders: rgba(232,148,58,0.03) default → rgba(232,148,58,0.12) on hover
* Hover transitions: all 0.4s cubic-bezier(0.22, 1, 0.36, 1)
* Scroll reveal animations: fade up 28px with stagger delay
Dividers

```html
<div class="wd">
  <div class="wd-line"></div>   <!-- 40px, gradient amber line -->
  <div class="wd-dot"></div>    <!-- 5px amber circle -->
  <div class="wd-line"></div>
</div>

```

Section Headers Pattern

```
.s-label   — 10px, uppercase, letter-spacing 4px, amber-dim, centered
.s-title   — Libre Caslon Display, clamp(24-42px), cream, centered
.s-sub     — Libre Caslon Text italic, 17px, text color, centered, max-width 480px

```

TECH STACK
Tool Purpose Notes Lovable Frontend app + Cloud backend Separate project from RelocateIQ and Life By Design. Lovable Cloud enabled (handles DB, auth, storage, edge functions) Stripe Payments $29 Legacy Pack + physical products n8n Cloud Automations Separate workflow folder from other projects. Connects to Lovable Cloud DB via Supabase-compatible API Claude API AI — story writing, surname research, motto generation, ancestor chat Primary AI engine FamilySearch API Genealogy data Free API, up to 8 generations of ancestors Printful API Print-on-demand fulfillment Mugs, framed prints, ornaments, coasters Gelato API Book printing Hardcover and softcover legacy books Resend Transactional email Order confirmations, gift delivery emails Kit.com Email marketing Newsletter, launch sequences Etsy Sales channel Connected to Printful for auto-fulfillment
Database Rules (Lovable Cloud)

* Ancestra uses Lovable Cloud — a dedicated, isolated database for this project (NOT shared with RelocateIQ or Life By Design)
* Lovable Cloud is built on Supabase under the hood, so all Supabase-compatible tools (n8n Supabase node, edge functions) work normally
* Table naming: NO prefixes needed. Use clean names since the DB is isolated per project.
   * `users` — user accounts (managed by Lovable Cloud auth — email, Google, Apple)
   * `crests` — generated crest images and data
   * `stories` — generated family stories
   * `trees` — family tree data
   * `orders` — product orders
   * `gifts` — gift sends and recipient data
   * `quiz_results` — bloodline quiz results
   * `anthems` — generated family songs (Suno API)
* Cross-brand funnel tracking (e.g., Life By Design → Ancestra → RelocateIQ) happens via email matching in n8n, NOT shared tables
* RelocateIQ and Life By Design have their own separate databases with their own schemas
Lovable Rules

* This is a SEPARATE Lovable project from RelocateIQ and Life By Design
* Lovable Cloud is ENABLED — DB, auth, storage, and edge functions are built-in. Never suggest setting up Supabase separately.
* Use Lovable Cloud auth for all user sign-in (email, Google, Apple — zero config)
* Use Lovable Cloud Edge Functions for server-side work (Stripe webhooks, Claude API calls, Printful calls) instead of external n8n where possible
* n8n Cloud is still used for multi-step automations and external integrations (FamilySearch, Suno, Blotato, Resend, Kit.com) — n8n connects to Lovable Cloud DB via the Supabase node
* One change at a time — never bundle multiple features in one prompt
* Always specify "do not modify any existing pages or components" unless told otherwise
* Use the Ancestra design system defined above — NOT the RelocateIQ design system
* All new components must follow the Fireside Luxury palette
THE GUIDED JOURNEY (Core UX)
The app is a linear 6-stop journey. The user moves forward through each stop. No dashboard. No menu confusion. Just forward.
Stop 1 — "Enter Your Name"

* Single input: surname
* Optional expand: parents, country, birth date
* CTA: "Discover My Legacy"
* Behind the scenes: n8n fires → FamilySearch API + Claude API
Stop 2 — "Your Name Has a Story"

* Surname meaning, origin, date, ancestral role
* Historical context quote
* Elements stagger in one by one
* CTA: "Meet Your Bloodline"
Stop 3 — "Meet Your Bloodline"

* Vertical family tree with names, years, locations
* Migration badge at bottom
* User's name highlighted gold at bottom
* CTA: "Forge Your Crest"
Stop 4 — "Your Crest is Forged"

* Loading animation with forge messages
* Crest reveals with glow animation
* Motto in Latin + English
* Symbolism breakdown (eagle, chevron, gold)
* CTA: "Read Your Story"
Stop 5 — "Your Story is Written"

* Chapter I appears in typewriter style
* Cinematic narrative from Claude API
* Fades out after preview with "8 more chapters..."
* PAYWALL: "Unlock your full Legacy Pack — $29"
* CTA: "See the Full Legacy" (Stripe checkout)
Stop 6 — "Pass It On"

* "Who in your family needs to see this?"
* Option A: Send free preview (email/text — viral loop)
* Option B: Gift the Legacy Pack ($29)
* Option C: Gift physical products (linked to shop)
* Product cards with occasion tags (Father's Day, Christmas, Wedding)
FREE TOOLS (6 tools, all Claude API calls)

1. Bloodline Quiz — 5 personality questions → archetype result (Warrior/Builder/Explorer/Healer/Scholar) → shareable card
2. Surname Lookup — instant meaning, origin, date, role for any surname
3. Meet Your Ancestor — AI generates a historically plausible ancestor profile with name, year, occupation, personality, diet, skills, quote
4. The 1700s You — what your life would look like 300 years ago based on your surname
5. Motto Generator — enter 3 values → get a Latin motto with English translation and word breakdown
6. Chat With Your Ancestor — live chat interface with an AI character based on family history
All tools end with CTA: "Want to discover your full legacy? → Begin Your Journey"
PRODUCT CATALOG
Digital Products
Product Price Fulfillment Legacy Pack (crest + story + tree + certificate) $29 Instant digital delivery Custom Crest Download (high-res PNG/SVG) $19 Instant digital delivery Legacy Certificate (PDF) $49 Instant digital delivery Combined Wedding Crest (digital) $79 24-48hr delivery
Physical Products (Printful)
Product Price Supplier Framed Crest Print (11x14) $79 Printful Framed Crest Print (16x20) $99 Printful Beer Mug / Whiskey Glass $39 Printful Christmas Ornament $29 Printful Coaster Set (4) $24 Printful Phone Case $29 Printful Blanket/Throw $59 Printful Canvas Print $89 Printful
Physical Products (Gelato)
Product Price Supplier Hardcover Legacy Book $89 Gelato Softcover Legacy Book $59 Gelato
Physical Products (Specialty)
Product Price Supplier Metal Wall Sign $149 Printify Wax Seal Stamp $49 Artisaire Crest Cufflinks $39 CustomInk
Bundles
Bundle Contents Price Dad Bundle Framed crest + whiskey glass + certificate $129 Mom Bundle Legacy book + family tree print + certificate $139 Christmas Bundle 3x ornaments + legacy book + coaster set $129 Wedding Bundle Combined crest + framed print + toasting glasses + wax seal $249 Grad Bundle Certificate + framed crest + mug $119 Reunion Bundle 10x ornaments + family tree poster + legacy book $249
Occasions
Father's Day, Mother's Day, Christmas, Wedding, Graduation, Birthday, Anniversary, New Baby, Housewarming, Retirement, Valentine's Day, Family Reunion
N8N AUTOMATION WORKFLOWS
Workflow 1: Legacy Pack Generation

```
Trigger: Stripe payment webhook ($29)
→ Extract surname + country from Supabase
→ Call FamilySearch API (search ancestors, up to 8 generations)
→ Call Claude API (generate story, motto, surname meaning, crest symbolism)
→ Call AI Image API (generate crest image)
→ Save all outputs to Lovable Cloud DB (crests, stories, trees)
→ Generate PDF (certificate + story)
→ Send delivery email via Resend

```

Workflow 2: Physical Product Order

```
Trigger: Stripe payment webhook (product order)
→ Pull crest image from Supabase storage
→ Send to Printful API (product type + crest image + shipping address)
→ Receive tracking number from Printful
→ Update orders table in Lovable Cloud DB
→ Send tracking email via Resend

```

Workflow 3: Gift Delivery

```
Trigger: Gift purchase on app
→ Generate gift preview page URL
→ Send gift email to recipient via Resend
→ Include personal message from sender
→ Track gift opens in Supabase

```

Workflow 4: Etsy Order (manual at first, automate later)

```
Trigger: Etsy order notification
→ Extract surname from order personalization
→ Generate crest (same as Workflow 1)
→ Send to Printful via Etsy-Printful integration
→ Auto-fulfills and ships

```

PAGES / ROUTES

```
/                    → Landing page (marketing)
/journey             → The 6-stop guided experience
/journey/step/1      → Enter your name
/journey/step/2      → Name meaning reveal
/journey/step/3      → Family tree
/journey/step/4      → Crest reveal
/journey/step/5      → Story preview + paywall
/journey/step/6      → Pass it on (gift options)
/tools               → Free tools hub
/tools/quiz          → Bloodline quiz
/tools/surname       → Surname lookup
/tools/ancestor      → Meet your ancestor
/tools/1700s         → The 1700s you
/tools/motto         → Motto generator
/tools/chat          → Ancestor chat
/shop                → Product catalog
/shop/[product-id]   → Product detail page
/shop/wedding        → Combined wedding crest experience
/gifts               → Gift guide by occasion
/gifts/fathers-day   → Father's Day collection
/gifts/christmas     → Christmas collection
/gifts/wedding       → Wedding collection
/gifts/mothers-day   → Mother's Day collection
/gifts/graduation    → Graduation collection
/gifts/birthday      → Birthday collection
/gifts/anniversary   → Anniversary collection
/gifts/new-baby      → New baby collection
/gifts/housewarming  → Housewarming collection
/gifts/retirement    → Retirement collection
/gifts/valentines    → Valentine's Day collection
/gifts/reunion       → Family reunion collection
/about               → Founder story (Gregory Osmond)
/pricing             → Pricing page
/cart                → Shopping cart
/checkout            → Stripe checkout
/confirmation        → Order confirmation
/gift/[gift-id]      → Gift recipient landing page
/my-legacy           → User dashboard (after purchase)

```

FOUNDER STORY (Use in marketing copy)
Gregory Angus Dean Osmond spent years tracing his family through historical documents — wills from the 1700s, church records in Piddletrenthide, Domesday Book entries from 1066. His ancestors were Haywards — land managers and protectors in Dorset, England. They weren't born wealthy. They earned everything through work, resilience, and grit.
They later migrated to Newfoundland, Canada, where Joseph Osmond built a fishing operation from nothing. His sons Mark and Ambrose grew it into one of the largest shipping businesses in Newfoundland, trading across the West Indies and Caribbean for over 100 years.
Gregory uncovered a real Osmond Coat of Arms (since 1688), documented 12 generations of lineage, 80+ historical documents, and a family motto that crystallized everything:
"Ex Labore, Ascendimus" — From Labour, We Rise.
Ancestra exists so everyone can have that same experience — in five minutes instead of five years.
Key quote: "Most people don't know where they come from — and that disconnect affects who they believe they can become."
IMPORTANT RULES

1. Ancestra is a SEPARATE brand/project from RelocateIQ and Life By Design
2. Never mix design systems — Ancestra uses Fireside Luxury, not RelocateIQ's design
3. Lovable Cloud is used for DB/auth/storage/edge functions — no table prefixes (DB is isolated per project)
4. Every page must use the warm color palette — no cold blues/grays
5. All buttons are pill-shaped (border-radius: 60px)
6. All cards have rounded corners (14-32px)
7. Body text must be readable — minimum #d0c4b4 on dark backgrounds
8. The journey is LINEAR — no complex navigation, no dashboards at launch
9. Free tools exist to drive virality — they must be shareable
10. Every experience ends with a gift CTA — "Who needs to see this?"
11. The domain target is ancestra.com — if unavailable, alternatives: ancestra.co, ancestra.io, getancestra.com
12. Physical products are fulfilled by Printful (most items) and Gelato (books)
13. Do not modify any existing pages or components unless explicitly asked
14. One change at a time — never bundle multiple features
BRAND NAME — ANCESTRA
Name: Ancestra Pronunciation: an-SESS-truh Domain target: ancestra.com (alternatives: ancestra.co, ancestra.io, getancestra.com)
Why Ancestra:

* Sounds like "ancestry" but isn't — unique, ownable
* Latin feminine ending — feels ancient, premium, European
* Easy to spell, easy to say, easy to remember
* Works as a verb: "Ancestra your family"
* The "-a" ending gives it warmth and femininity (all bloodlines pass through mothers)
Brand lines:

* "Ancestra — What's hiding in your name?"
* "Ancestra — Every family has a story worth telling."
* "Ancestra — Discover. Forge. Pass it on."
* "Forged by Ancestra"
* "An Ancestra Original"
Product stamps:

* On physical products: "Forged by Ancestra"
* On digital deliverables: "An Ancestra Original"
* On certificates: "Ancestra — Est. 2026"
Founder hidden layer — GADO: The founder's initials (Gregory Angus Dean Osmond) spell GADO, which is an anagram of "A GOD." His surname "Osmond" means "Divine Protector" in Old English (os = god, mund = protector). This is used in founder story marketing content, NOT in the brand name. Ancestra is the public brand. GADO is the founder's personal story.
Etsy shop name: AncestraShop or AncestraHeritage Social handles target: @ancestra on all platforms
FAMILY ANTHEM (Song Generation)
The most unique feature — nobody else offers this. AI generates a custom song about the user's family using their actual surname, motto, ancestor names, and family story.
Tool: Suno AI API Integration: n8n → Claude API (lyrics) → Suno API (music generation)
Flow:

1. User completes the Legacy Journey (has surname, motto, story, crest)
2. Claude API writes custom song lyrics using their specific family data
3. Suno API generates a 2-3 minute produced song
4. User receives MP3 + lyric card in the app
Claude Lyric Prompt Template:

```
Write an epic cinematic folk anthem about the [SURNAME] family.
They come from [ORIGIN]. Their motto is "[MOTTO_EN]."
They were [ANCESTRAL_ROLE]. Key ancestors: [ANCESTOR_NAMES].
Key events: [KEY_EVENTS].
End with the Latin motto: "[MOTTO_LATIN]."

Style: Cinematic folk, epic orchestral, deep vocals,
Celtic instruments, building crescendo

```

Style Options (user selects):

* Epic Cinematic Folk (default — Celtic, orchestral, dramatic)
* Modern Hip-Hop (younger audience, urban)
* Classical Piano Ballad (emotional, Mother's Day, soft)
* Rock Anthem (Father's Day, man cave energy, power)
* Acoustic Indie (warm, personal, intimate)
Pricing:

* 30-second preview: FREE (viral hook — plays after crest reveal)
* Full song MP3 download: +$9 add-on to Legacy Pack
* Song + AI lyric video with crest visuals: +$19
* Song + QR code printed on physical plaque: +$29
Placement in Journey:

* Appears after Stop 5 (story reveal)
* "Your story has been written. Now hear it."
* 30-sec preview plays automatically with crest visual animation
* Full song is behind the Legacy Pack paywall
* Share button generates 15-sec TikTok/Reels clip
Viral Strategy:

* Shareable 15-sec clip auto-formatted for TikTok/Reels/Stories
* Caption template: "This AI just made a song about MY family 🔥"
* QR code on all physical products links to the family anthem
* Gift option: "Send their anthem" via email/text with crest visual
QR Code Integration:
Every physical product (framed crest, mug, ornament, wall sign) includes a small QR code that links to the family's anthem. Scan the QR on the framed crest hanging on the wall → the family song plays. This turns every product into a multimedia experience.
SOCIAL MEDIA AUTOMATION
Tool: Blotato (blotato.com) — Greg already uses this Integration: n8n native node + Blotato API + Claude Code/Cowork
Content Pipeline:

1. Claude Code/Cowork generates platform-specific content
2. Blotato receives content via n8n workflow or Blotato API
3. Blotato auto-formats for each platform's requirements
4. Posts queue as drafts in Blotato calendar
5. Greg reviews weekly (15-minute sprint)
6. Approved posts publish on schedule automatically
Platforms:
LinkedIn, TikTok, Instagram, X (Twitter), Facebook, Pinterest, YouTube, Threads
Content Pillars:

1. Product showcases — Crest reveals, unboxing videos, product mockups
2. Emotional story clips — Ancestor discoveries, family revelations
3. Occasion marketing — Father's Day, Christmas, wedding content
4. Free tool shares — Bloodline quiz results, motto generator outputs
5. Founder story — Greg's Osmond discovery journey, real documents
6. User stories — Customer reactions, review videos, gift moments
7. Anthem clips — 15-sec family song previews (highly shareable)
Blotato Features Used:

* AI content remixing (1 piece → 10+ platform versions)
* Faceless video generation (TikTok content without showing face)
* Calendar scheduling across all platforms
* Native n8n node for automated publishing triggers
Review Process:

* Blotato queues all AI-generated posts as DRAFTS
* Greg reviews queue once per week (15 minutes)
* Approve, tweak, or reject each post
* Approved posts publish automatically on schedule
* Never auto-publish without review (brand quality control)
EMAIL STRATEGY
Transactional Email (Resend)

* Order confirmations
* Gift delivery notifications ("Someone sent you a family legacy")
* Digital product delivery (Legacy Pack, anthem MP3)
* Shipping/tracking updates (from Printful via n8n)
* Password reset, account notifications
Marketing Email (Kit.com)

* Welcome sequence (5 emails after signup)
* Lead magnet: "5 Things Hiding in Your Surname" PDF
* Occasion campaigns (Father's Day, Christmas — 3-4 weeks before)
* New product announcements
* Founder story series (Greg's journey emails)
* Win-back sequences for abandoned carts
Email Flows (n8n automated):

1. New user signup → Kit welcome sequence triggers
2. Free tool used → Kit tags user with interest (quiz, motto, etc.)
3. Legacy Pack purchased → Resend delivers files + Kit moves to buyer segment
4. Physical product ordered → Resend sends confirmation + tracking
5. Gift sent → Resend delivers gift email to recipient with preview
6. No purchase after 7 days → Kit sends "Your crest is waiting" nudge