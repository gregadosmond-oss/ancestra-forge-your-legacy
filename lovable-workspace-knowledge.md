# Lovable Workspace Knowledge — Greg Osmond

Universal rules for every Lovable project in this workspace (RelocateIQ, Life By Design, Ancestra, and future projects).

---

## ABOUT ME

I'm Greg, solo founder. No coding background — I build entirely with AI tools. I'm non-technical, so explanations should be in plain English and instructions should be copy-paste ready.

## STACK (all my projects)

- **Lovable** — frontend + Lovable Cloud backend (DB, auth, storage, edge functions)
- **Lovable Cloud auth** — always use the built-in auth (email + Google + Apple). Never suggest external auth providers, never suggest configuring Supabase directly.
- **n8n Cloud** — for multi-step automations and external integrations only
- **Claude API** — primary AI engine for content generation
- **Stripe** — all payments
- **Resend** — transactional email
- **Kit.com** — marketing email

## CRITICAL RULES — ALWAYS FOLLOW

1. **One change at a time.** Never bundle multiple features into a single build. If I ask for multiple things, build them sequentially and confirm one is working before moving to the next.
2. **Never modify existing pages or components** unless I explicitly ask for it. New features = new components. Additions, not edits.
3. **Never edit components I haven't mentioned.** If I ask for a change to the Header, only touch the Header file.
4. **Never create placeholder content.** If you need data, ask me — don't invent fake user names, fake testimonials, or fake product listings.
5. **Never suggest setting up Supabase separately.** Lovable Cloud is always enabled in my projects.
6. **Never suggest dashboards unless I ask.** My apps are linear user flows.

## CODING STYLE PREFERENCES

- **TypeScript** everywhere, not plain JavaScript
- **React functional components** with hooks — no class components
- **Tailwind CSS** for styling — no styled-components, no CSS modules
- **File naming**: PascalCase for components (`HeroSection.tsx`), camelCase for utilities (`formatDate.ts`), kebab-case for routes (`/my-legacy`)
- **Component structure**: one component per file, default export
- **Keep files under 300 lines** — split into smaller components when a file grows past that
- **No inline styles** — everything in Tailwind classes or design tokens

## DATABASE NAMING

- **No table prefixes.** Each project uses Lovable Cloud (isolated DB per project), so tables should have clean names: `users`, `orders`, `crests`, etc.
- **snake_case** for column names (`created_at`, `user_id`, `surname`)
- **Always include**: `id` (uuid), `created_at` (timestamp default now), `updated_at` (timestamp default now) on every table
- **Always enable Row-Level Security** on every table — users can only read/modify their own rows unless I specify otherwise

## LIBRARIES I PREFER

- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Animations**: Framer Motion for UI animations, Lovable's 3D library (React Three Fiber + drei) for 3D scenes
- **Date handling**: date-fns (not moment)
- **HTTP**: the built-in fetch, or Lovable Cloud's client SDK
- **Toast notifications**: Sonner (built into Lovable)

## LIBRARIES I AVOID

- Bootstrap, MUI, Chakra — I use Tailwind with custom design tokens per project
- Redux, Zustand — React state + Lovable Cloud is enough for my apps
- jQuery, Lodash — use modern JS built-ins

## COMMUNICATION STYLE

- **Direct and concise.** Skip the fluff. No "Great question!" or "I'd be happy to help!"
- **Give me the practical next step**, not theory
- **If something is risky, tell me plainly.** Don't bury warnings in paragraph 4.
- **Sequential workflows.** Step 1, then step 2. Don't dump a 10-step plan on me unless I ask.
- **Don't over-explain** things I already know from context
- **English only** in all outputs (code, comments, copy)

## WHEN I ASK FOR A FEATURE

Always confirm before building:
1. Which specific page/component this affects
2. Any data model changes needed
3. Any new routes needed

Then build exactly that, nothing more.

## WHEN YOU HIT AN ERROR

1. Tell me what failed and why, in plain English
2. Tell me the fix in one sentence
3. Apply the fix if it's safe (doesn't modify other components)
4. If it requires modifying something else, ask me first

## DOMAIN DETAILS

- My domains use non-standard TLDs. Example: RelocateIQ is `relocateiq.io`, not `.com`. Ancestra targets `ancestra.com`. Don't assume `.com` for any of my brands — check the project knowledge.
- I live in Playa del Carmen, Mexico — but my target audience is mostly US/Canada/UK
