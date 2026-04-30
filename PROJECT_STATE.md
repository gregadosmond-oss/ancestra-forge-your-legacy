# AncestorsQR — Project State
*Last updated: April 30, 2026*

## 1. Architecture Overview

- **Frontend**: React 18 + Vite 5 + TypeScript 5 + Tailwind CSS v3 + Framer Motion
- **Backend**: Supabase Edge Functions (Deno runtime)
- **Database**: Supabase Postgres (Lovable Cloud — managed)
- **Auth**: Supabase Auth (email magic link, Google, Apple)
- **Storage**: Supabase Storage (buckets: `crests`, `print-designs`)
- **Lovable Project ID**: `db56f873-aace-4d12-90df-90f92f62b756`
- **Supabase Project Ref**: `fjtkjbnvpobawqqkzrst`
- **Supabase URL**: `https://fjtkjbnvpobawqqkzrst.supabase.co`
- **GitHub Repo**: connected via Lovable GitHub integration (owner: gregadosmond / AncestorsQR repo)
- **Production Domain**: https://ancestorsqr.com (also www.ancestorsqr.com)
- **Lovable Preview**: https://id-preview--db56f873-aace-4d12-90df-90f92f62b756.lovable.app
- **Lovable Published**: https://legacy-forge-stories.lovable.app

## 2. Pages & Routes

| Path | Component file | Purpose | Status |
|---|---|---|---|
| `/` | `src/pages/Index.tsx` | Landing page (hero, How It Works, Free Tools, Occasions, CTA) | live |
| `/home` | (redirect → `/`) | Legacy redirect | live |
| `/pricing` | `src/pages/Pricing.tsx` | Pricing tiers | live |
| `/tools` | `src/pages/tools/ToolsHub.tsx` | Free tools hub | live |
| `/tools/surname` | `src/pages/tools/SurnameLookup.tsx` | Surname meaning lookup | live |
| `/tools/motto` | `src/pages/tools/MottoGenerator.tsx` | Latin motto generator | live |
| `/tools/quiz` | `src/pages/tools/BloodlineQuiz.tsx` | Bloodline archetype quiz | live |
| `/tools/ancestor` | `src/pages/tools/MeetYourAncestor.tsx` | AI ancestor profile | live |
| `/tools/1700s` | `src/pages/tools/The1700sYou.tsx` | "1700s you" reimagining | live |
| `/tools/chat` | `src/pages/tools/AncestorChat.tsx` | Live chat with AI ancestor | live |
| `/journey` | `src/pages/journey/JourneyLayout.tsx` | Journey shell (redirects to /journey/1) | live |
| `/journey/1` | `src/pages/journey/Stop1EnterName.tsx` | Stop 1: surname input | live |
| `/journey/2` | `src/pages/journey/Stop2NameMeaning.tsx` | Stop 2: name meaning reveal | live |
| `/journey/3` | `src/pages/journey/Stop3Bloodline.tsx` | Stop 3: visual bloodline tree | placeholder (not wired to real data) |
| `/journey/4` | `src/pages/journey/Stop4CrestForge.tsx` | Stop 4: crest forge reveal | live |
| `/journey/5` | `src/pages/journey/Stop5Story.tsx` | Stop 5: story preview + paywall | live |
| `/journey/6` | `src/pages/journey/Stop6PassItOn.tsx` | Stop 6: pass-it-on / gift | live |
| `/checkout` | `src/pages/CheckoutPage.tsx` | Stripe embedded checkout | live |
| `/checkout/return` | `src/pages/CheckoutReturn.tsx` | Post-checkout return | live |
| `/heirloom-order` | `src/pages/HeirloomOrderPage.tsx` | Dynamic mug order flow | live |
| `/product-order` | `src/pages/ProductOrderPage.tsx` | Generic Printify product order | live |
| `/shop` | `src/pages/Shop.tsx` | Product catalog | WIP (basic, Printify integration partial) |
| `/cart` | `src/pages/Cart.tsx` | Cart | live |
| `/confirmation` | `src/pages/Confirmation.tsx` | Order confirmation | live |
| `/about` | `src/pages/About.tsx` | Founder story | live |
| `/my-legacy` | `src/pages/MyLegacy.tsx` | Post-purchase user dashboard | WIP |
| `/f/:surname` | `src/pages/FamilySharePage.tsx` | Public family share page (QR target) | live |
| `/gift/:giftId` | `src/pages/GiftPage.tsx` | Gift recipient landing | live |
| `/gifts/:occasion` | `src/pages/gifts/GiftOccasionPage.tsx` | Gift occasion guide | live |
| `/privacy-policy` | `src/pages/PrivacyPolicy.tsx` | Privacy policy | live |
| `/terms` | `src/pages/Terms.tsx` | Terms | live |
| `/deep-legacy` | `src/pages/DeepLegacy.tsx` | Premium deep legacy intro | WIP |
| `/deep-legacy/interview` | `src/pages/DeepLegacyInterview.tsx` | Interview questions | WIP |
| `/deep-legacy/processing` | `src/pages/DeepLegacyProcessing.tsx` | Processing screen | WIP |
| `/deep-legacy/results` | `src/pages/DeepLegacyResults.tsx` | Results display | WIP |
| `/deep-legacy/checkout` | `src/pages/DeepLegacyCheckout.tsx` | Premium checkout | WIP |
| `/deep-legacy/confirmation` | `src/pages/DeepLegacyConfirmation.tsx` | Premium confirmation | WIP |
| `*` | `src/pages/NotFound.tsx` | 404 | live |

## 3. Edge Functions

| Name | Purpose | External APIs | Secrets read | Status | Frontend caller(s) |
|---|---|---|---|---|---|
| `generate-legacy` | Generate surname facts + story (cached) | Anthropic Claude | `ANTHROPIC_API_KEY` | live | `src/lib/legacyClient.ts` (Stops 2/5) |
| `generate-crest` | DALL-E 3 crest generation, cached in `surname_crests` | OpenAI | `OPENAI_API_KEY` (via Lovable AI Gateway / `LOVABLE_API_KEY`) | live | Stop 4 |
| `generate-legacy-fixture` | Dev fixture seed | — | — | dev only | none |
| `generate-crest`/`crest.ts` shared | Prompt builder | — | — | live | internal |
| `generate-print-design` | SVG/PNG print files for Printify | — | — | live | product order pages |
| `generate-mug-mockup` | Printful mockup preview for mugs | Printful | `PRINTFUL_API_KEY`, `PRINTFUL_STORE_ID` | live | mug preview UI |
| `create-heirloom-order` | Dynamic mug Printify order (resvg-wasm) | Printify | `PRINTIFY_API_KEY`, `PRINTIFY_SHOP_ID` | live | `HeirloomOrderPage` |
| `create-printful-order` | Printful order pass-through | Printful | `PRINTFUL_API_KEY` | live | product flows |
| `create-product-order` | Printify orders for canvas/coaster/blanket/charcuterie | Printify | `PRINTIFY_API_KEY`, `PRINTIFY_SHOP_ID` | live | `ProductOrderPage` |
| `printify-proxy` | Generic Printify API proxy | Printify | `PRINTIFY_API_KEY`, `PRINTIFY_SHOP_ID` | live | Shop/admin |
| `create-checkout` | Stripe embedded checkout session | Stripe | `MY_STRIPE_SANDBOX_API_KEY` / `MY_STRIPE_LIVE_API_KEY` / `STRIPE_*_API_KEY` + `LOVABLE_API_KEY` | live | `CheckoutPage`, `usePurchase` |
| `get-stripe-price` | Lookup Stripe price by lookup_key | Stripe | as above | live | `useStripePrice`, `useMugPrice`, `useLegacyPackPrice` |
| `payments-webhook` | Stripe webhook → fulfillment + email | Stripe, Resend | `PAYMENTS_LIVE_WEBHOOK_SECRET`, `PAYMENTS_SANDBOX_WEBHOOK_SECRET`, `RESEND_API_KEY` | live | n/a (webhook) |
| `ancestor-chat` | Claude chat with ancestor persona | Anthropic | `ANTHROPIC_API_KEY` | live | `AncestorChat` |
| `ancestor-tts` | ElevenLabs narration | ElevenLabs | `ELEVENLABS_API_KEY` | live | `Stop5Story` |
| `meet-ancestor` | Generate ancestor profile | Anthropic | `ANTHROPIC_API_KEY` | live | `MeetYourAncestor` |
| `the-1700s-you` | "1700s you" generator | Anthropic | `ANTHROPIC_API_KEY` | live | `The1700sYou` |
| `motto-generator` | Latin motto generator | Anthropic | `ANTHROPIC_API_KEY` | live | `MottoGenerator` |
| `bloodline-quiz` | Quiz scoring + archetype | Anthropic | `ANTHROPIC_API_KEY` | live | `BloodlineQuiz` |
| `surname-lookup` | Surname lookup tool | Anthropic | `ANTHROPIC_API_KEY` | live | `SurnameLookup` |
| `expand-chapters` | Expand teaser chapters into full body (post-purchase) | Anthropic | `ANTHROPIC_API_KEY` | live | post-purchase flow |
| `deep-legacy-research` | Deep research (Perplexity + Claude) | Perplexity, Anthropic | `PERPLEXITY_API_KEY`, `ANTHROPIC_API_KEY` | live | `DeepLegacyProcessing` |
| `deep-legacy-book` | Book composition pipeline | Anthropic | `ANTHROPIC_API_KEY` | WIP | deep legacy flow |
| `render-legacy-book-pdf` | Interior PDF render | PDFShift | `PDFSHIFT_API_KEY` | WIP | book pipeline |
| `render-legacy-book-cover-pdf` | Cover PDF render | PDFShift | `PDFSHIFT_API_KEY` | WIP | book pipeline |
| `create-legacy-book-order` | Submit book order to Gelato | Gelato | `GELATO_API_KEY` | WIP | book pipeline |
| `gelato-catalog-search` | Gelato catalog search | Gelato | `GELATO_API_KEY` | dev/admin | admin only |
| `gelato-list-catalogs` | List Gelato catalogs | Gelato | `GELATO_API_KEY` | dev/admin | admin only |
| `gelato-cover-dims` | Compute cover dimensions | Gelato | `GELATO_API_KEY` | dev/admin | admin only |
| `gelato-placeholder-pdfs` | Placeholder PDF helper | — | — | dev/admin | admin only |
| `book-waitlist-signup` | Book waitlist email capture | — | — | live | shop / book CTA |
| `og-preview` | Dynamic OpenGraph preview | — | — | live | meta tags |
| `auth-email-hook` | Custom auth email rendering | Resend | `RESEND_API_KEY` | live | Supabase Auth hook |
| `process-email-queue` | Throttled email queue processor | Resend | `RESEND_API_KEY` | live | scheduled / internal |
| `resend-legacy-email` | Resend Legacy Pack delivery email | Resend | `RESEND_API_KEY` | live | post-purchase flow |
| `send-preview` | Send free preview email | Resend | `RESEND_API_KEY` | live | Stop 6 |
| `send-welcome-email` | Branded welcome email (with `welcome_sent_at` dedup) | Resend | `RESEND_API_KEY` | live | `JourneyGate`, `FreeToolsEmailCTA` |
| `sync-to-resend-audience` | Add contact to Resend Audience + fire `ancestorsqr_welcome_started` event | Resend | `RESEND_API_KEY` | live | `JourneyGate`, `FreeToolsEmailCTA` |

## 4. Database Tables

| Name | Purpose | Key columns | Notes |
|---|---|---|---|
| `journey_subscribers` | Email captures from journey/free-tool gates | `email`, `surname_searched`, `source`, `welcome_sent_at` (timestamptz), `created_at` | RLS: anyone insert, no select; `welcome_sent_at` used for atomic welcome-email dedup |
| `profiles` | Extended user info | `id` (auth uid), `email`, `surname`, `first_name`, `country_of_origin`, `birth_year` | RLS: owner only |
| `crests` | Per-user generated crests | `user_id`, `surname`, `crest_url`, `prompt_used`, `variables_json`, `motto_latin`, `motto_english` | Anonymous (`user_id IS NULL`) crests publicly readable |
| `surname_crests` | Cached DALL-E crest images per surname | `surname`, `image_url`, `prompt`, `created_at` | Public read; written by service role |
| `surname_facts` | Cached LegacyFacts/story per surname | `surname`, `payload` (jsonb), `story_payload` (jsonb), `model_version` | Public read |
| `purchases` | Stripe purchase records | `stripe_session_id`, `user_id`, `amount_total`, `currency`, `status`, `environment`, `email_sent` | RLS: owner select, service-role manage |
| `gifts` | Gift sends + recipient tracking | `surname`, `recipient_email`, `recipient_name`, `sender_name`, `personal_message`, `status` | Public read by id |
| `book_orders` | Legacy hardcover orders (legacy) | `format`, `surname`, `gelato_order_id`, `tracking_url`, `pdf_url`, `status` | RLS: owner select |
| `legacy_book_orders` | New deep-legacy book orders | `surname`, `display_surname`, `buyer_email`, `cover_pdf_url`, `interior_pdf_url`, `gelato_*`, `stripe_session_id`, `fulfillment_status` | Service-role write; owner read |
| `book_waitlist` | Hardcover book waitlist | `email`, `surname`, `source` | Anyone insert; service-role read |
| `deep_legacy_results` | Premium research outputs | `surname`, `country`, `interview_answers`, `research_summary`, `sources` | Owner read |
| `deep_legacy_chapters` | Expanded chapters | `surname`, `user_id`, `chapter_num`, `title`, `body` | Owner read |
| `email_send_log` | Resend delivery audit log | `recipient_email`, `template_name`, `status`, `message_id`, `metadata` | Service-role only |
| `email_send_state` | Throttle/cadence config | `send_delay_ms`, `batch_size`, `retry_after_until`, TTL settings | Service-role only |
| `email_unsubscribe_tokens` | Unsubscribe tokens | `email`, `token`, `used_at` | Service-role only |
| `suppressed_emails` | Hard-bounce / unsubscribe list | `email`, `reason`, `metadata` | Service-role only |
| `generation_logs` | Crest/legacy generation telemetry | `surname`, `call_type`, `model_version`, `duration_ms`, `cache_hit`, `success`, `error_reason` | No RLS (internal) |

## 5. External Integrations

- **Resend** — connected. Used for: branded welcome email (`send-welcome-email`), Legacy Pack delivery (`resend-legacy-email`, `payments-webhook`), free preview (`send-preview`), auth emails (`auth-email-hook`), audience sync + drip trigger (`sync-to-resend-audience`). Secret: `RESEND_API_KEY`.
- **Kit (ConvertKit)** — **NOT used by AncestorsQR** as of Apr 29, 2026 migration. Frontend `sync-to-kit` invocations and edge function were deleted. `KIT_API_SECRET` still present in secrets but inert (RelocateIQ only).
- **Stripe** — connected. Sandbox + live. Used for: Legacy Pack ($29.99), physical product checkout, deep-legacy checkout. Secrets: `MY_STRIPE_SANDBOX_API_KEY`, `STRIPE_SANDBOX_API_KEY`, `STRIPE_LIVE_API_KEY`, `PAYMENTS_SANDBOX_WEBHOOK_SECRET`, `PAYMENTS_LIVE_WEBHOOK_SECRET`.
- **Printify** — connected. Live products: White 11oz Mug (Blueprint 478, Provider 99 — dynamic via `create-heirloom-order`), Canvas 8×10 (BP 900, Provider 72, variant 77255), Ceramic Coaster (BP 510, Provider 48, variant 72872), Sherpa Blanket (BP 522, Provider 99, variant 68323), Charcuterie Board (BP 2020, Provider 261, variant 123101). Secrets: `PRINTIFY_API_KEY`, `PRINTIFY_SHOP_ID`.
- **Printful** — connected (legacy / mockup previews only). Secrets: `PRINTFUL_API_KEY`, `PRINTFUL_STORE_ID`.
- **OpenAI (DALL-E 3)** — connected via Lovable AI Gateway for crest generation. Secret: `LOVABLE_API_KEY` (managed).
- **Anthropic Claude** — connected. Used by all narrative/Claude tools and chapter expansion. Secret: `ANTHROPIC_API_KEY`.
- **ElevenLabs** — connected. Story TTS in Stop 5. Secret: `ELEVENLABS_API_KEY`.
- **Perplexity** — connected. Deep legacy research. Secret: `PERPLEXITY_API_KEY`.
- **Ideogram** — secret stored, not yet wired (planned alt crest generator). Secret: `IDEOGRAM_API_KEY`.
- **Remove.bg** — secret stored, not yet wired (crest bg removal for dark products). Secret: `REMOVE_BG_API_KEY`.
- **PDFShift** — connected. Used by `render-legacy-book-pdf` and `render-legacy-book-cover-pdf`. Secret: `PDFSHIFT_API_KEY`.
- **Gelato (books)** — connected, WIP. Used by `create-legacy-book-order` and gelato-* edge functions. Secret: `GELATO_API_KEY`.
- **FamilySearch** — beta access pending. AppKey stored in `FAMILYSEARCH_APP_KEY`. No edge function yet wired.
- **Suno (anthems)** — NOT wired. No secret stored. Planned via n8n.

## 6. Lovable Cloud Secrets

(Names only — values never displayed.)

- `ANTHROPIC_API_KEY`
- `ELEVENLABS_API_KEY`
- `FAMILYSEARCH_APP_KEY`
- `GELATO_API_KEY`
- `IDEOGRAM_API_KEY`
- `KIT_API_SECRET` *(inert for AncestorsQR; RelocateIQ legacy)*
- `LOVABLE_API_KEY` *(managed)*
- `MY_STRIPE_SANDBOX_API_KEY`
- `PAYMENTS_LIVE_WEBHOOK_SECRET` *(managed)*
- `PAYMENTS_SANDBOX_WEBHOOK_SECRET` *(managed)*
- `PDFSHIFT_API_KEY`
- `PERPLEXITY_API_KEY`
- `PRINTFUL_API_KEY`
- `PRINTFUL_STORE_ID`
- `PRINTIFY_API_KEY`
- `PRINTIFY_SHOP_ID`
- `REMOVE_BG_API_KEY`
- `RESEND_API_KEY`
- `STRIPE_LIVE_API_KEY` *(managed)*
- `STRIPE_SANDBOX_API_KEY` *(managed)*

## 7. Resend Configuration

- **Verified sender domain**: `ancestorsqr.com`
- **Sender identity**: `greg@ancestorsqr.com` (transactional + welcome)
- **Audience ID**: auto-discovered at runtime by `sync-to-resend-audience` (calls `GET /audiences` and uses the default audience).
- **Custom event fired**: `ancestorsqr_welcome_started` — fired only on 201-Created (new contact) by `sync-to-resend-audience`. Skipped for existing contacts (409). Triggers the welcome series automation in Resend.
- **Automations**:
  - Welcome series (Day 3 / Day 7 / Day 14) — triggered by `ancestorsqr_welcome_started` event in Resend dashboard.
- **Day-0 welcome**: NOT in Resend automation — sent directly by `send-welcome-email` edge function with atomic `welcome_sent_at` claim on `journey_subscribers` to prevent duplicates.

## 8. Recent Major Changes (last 30 days)

**Email & lifecycle**
- Apr 30 — Added `ancestorsqr_welcome_started` Resend custom event firing on new contact only (idempotent).
- Apr 30 — **Removed Kit (ConvertKit) integration** entirely from AncestorsQR. Deleted `sync-to-kit` edge function and frontend invocations in `JourneyGate` and `FreeToolsEmailCTA`.
- Apr 30 — Created `sync-to-resend-audience` edge function (auto-discovers default audience, idempotent contact create).
- Apr 30 — Added welcome-email deduplication: `welcome_sent_at` column on `journey_subscribers` + atomic claim in `send-welcome-email`.
- Apr 30 — Fixed `firstName` fallback in `send-welcome-email` from email local-part to literal `"friend"`.

**Backend / payments**
- Apr 29 — Email infra hardening (suppressed emails, unsubscribe tokens, throttled queue).
- Apr 24 — Schema additions for legacy book orders pipeline.
- Apr 20 — Email infra migration (`email_send_log`, `email_send_state`).

**Deep Legacy (premium WIP)**
- Apr 19–28 — Deep legacy research (Perplexity + Claude) wired; book pipeline (Gelato + PDFShift) scaffolded.

**Frontend**
- Apr 17 — Gift occasion pages launched.
- Apr 14–18 — Journey prototype + crest generation hardened; landing page redesign shipped.

## 9. Known Issues / TODOs

- `Stop3Bloodline` — placeholder data; not wired to a real bloodline data source.

- `resvg-wasm` cannot render SVG `<text>` without embedded fonts → motto text on T-shirt back not rendered.
- QR code can be cut off on canvas prints if placed within ~600px of the edge (Printify wrap zone).
- `KIT_API_SECRET` still present in Lovable Cloud secrets despite Kit being fully removed from code — safe but should eventually be deleted.
- Charcuterie board: laser engraver is single-color — crest only, no QR (enforced at design time).

## 10. Incomplete Features (WIP)

- **Deep Legacy ($99 tier)** — research + chapter generation working; PDF rendering and Gelato hardcover order pipeline (`render-legacy-book-pdf`, `render-legacy-book-cover-pdf`, `create-legacy-book-order`) scaffolded but not end-to-end tested in production.
- **`/shop`** — basic page exists; full Printify product fetch + cart integration incomplete.
- **`/my-legacy` dashboard** — basic post-purchase view; needs richer content (chapters, downloads, gift management).
- **Bloodline tree (Stop 3)** — placeholder; needs real visual tree data.
- **Family Anthem (Suno)** — not started.
- **FamilySearch integration** — AppKey stored; awaiting beta approval before wiring.
- **Combined Wedding Crest ($79)** — product defined, no flow built.

## 11. Pending External Items

- **FamilySearch** — beta API access request submitted; awaiting approval reply. AppKey stored in `FAMILYSEARCH_APP_KEY`.
- **Printify** — manual product creation pending for: Wall Clock, Acrylic Print, Java Speaker, T-Shirt, 11oz Whiskey Glass, 15oz Mug variant. (Greg creates these at printify.com.)
- **Resend** — welcome series automation (Day 3/7/14) needs to be configured in Resend dashboard to listen for `ancestorsqr_welcome_started` event (edge function fires it; automation wiring is dashboard-side).
- **Gelato** — production test order for hardcover book pending end-to-end validation.
- **Stripe** — go-live for premium ($99) Deep Legacy SKU pending QA of book pipeline.
- **Suno** — partner / API access not yet pursued.
