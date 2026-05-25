# AncestorsQR — New User Onboarding Map
_Audit date: May 12, 2026_

This is what actually happens when someone shows up at ancestorsqr.com today. Five different paths, three different account models, four different email experiences. Below is every path, what fires, and where the friction lives.

---

## TL;DR — the simplification opportunities

Three real problems, in order of impact:

1. **Three different account states.** Depending on which door a user walks in, they end up with: (a) just a `journey_subscribers` row and no real account, (b) a magic-link auth account, or (c) an email+password auth account. This is the biggest source of confusion downstream.
2. **Different email counts.** Some users get 5 emails over 14 days. Some get 4. Some get 6. All from the same brand.
3. **No first-name personalization.** Every welcome email says "Hi friend," because no signup form captures first name. Easy fix, real lift on opens.

If we fix #1, #2 mostly fixes itself.

---

## The 5 entry points

### Path A — Begin Your Journey (Stop 1 / surname input)

**Trigger:** User clicks "Begin Your Journey" or lands at `/journey/1` and types a surname.

**Component:** `src/components/JourneyGate.tsx` (modal that opens when they hit Continue)

**Fields collected:** email only

**What fires (in order):**
1. INSERT into `journey_subscribers` table with email + surname + source="journey-gate"
2. send-welcome-email edge function (welcome from greg@ancestorsqr.com)
3. sync-to-resend-audience edge function (adds to Resend + fires drip event)
4. sessionStorage flags set: `journey_email_captured=true`, `journey_captured_email=<email>`
5. "Check your inbox" toast for 2.8 seconds
6. Redirected to Stop 2

**Account created?** **NO.** Just a row in `journey_subscribers`. User is anonymous from Supabase auth's perspective. If they later click "Sign In" they'll be told to create an account.

**Emails received:**
- Welcome ("Your story is waiting") from greg@ancestorsqr.com — immediate
- Day 3 drip — "Where did your name come from?"
- Day 7 drip — "Your family deserves a coat of arms"
- Day 14 drip — "Someone in your bloodline left a story"
- **Total: 4 emails over 14 days**

---

### Path B — Sign In / Create Account (navbar)

**Trigger:** User clicks "Sign In" in the navbar (anywhere on the site)

**Component:** `src/components/AuthGate.tsx` (modal with Google + email/password)

**Fields collected:** email + password (8 char min) OR Google OAuth

**Sub-path B1 — Email + password signup:**
1. `supabase.auth.signUp` (auto-confirm enabled → no confirmation email)
2. `supabase.auth.signInWithPassword` (immediate sign-in)
3. INSERT into `journey_subscribers` with source="auth-gate"
4. send-welcome-email
5. sync-to-resend-audience
6. Modal closes, user lands on whatever page they were on

**Sub-path B2 — Google OAuth signup:**
1. `lovable.auth.signInWithOAuth("google")` → redirect to Google → redirect back
2. Lands on the same page
3. AppLayout's `onAuthStateChange` listener catches the SIGNED_IN event
4. INSERT into `journey_subscribers` with source="oauth"
5. send-welcome-email
6. sync-to-resend-audience

**Account created?** **YES** — full Supabase auth user with password or OAuth provider.

**Emails received:**
- Welcome — immediate
- Day 3 / 7 / 14 drips
- **Total: 4 emails over 14 days**

---

### Path C — Free Tools page email gate

**Trigger:** User clicks `/tools` (the hub) without having captured email yet

**Component:** `src/components/FreeToolsEmailCTA.tsx` (giant card on page)

**Fields collected:** email only

**What fires:**
1. INSERT into `journey_subscribers` with source="free-tools-page"
2. send-welcome-email (source: "free-tools-gate")
3. sync-to-resend-audience
4. **Plus**: `supabase.auth.signInWithOtp({ shouldCreateUser: true })` — this sends a Supabase magic link AND creates a real auth account
5. sessionStorage flag set
6. "Check your inbox" toast for 4.5 seconds

**Account created?** **YES** — full Supabase auth user (passwordless, signs in via magic link)

**Emails received:**
- Welcome from Greg — immediate
- Supabase magic link from `noreply@notify.ancestorsqr.com` — immediate
- Day 3 / 7 / 14 drips
- **Total: 5 emails over 14 days**

---

### Path D — Inline free-tool email gate (`useEmailGate` hook)

**Trigger:** User clicks "Try this tool" or similar action on an individual free tool page without prior email capture

**Component:** `src/hooks/useEmailGate.ts` + opens JourneyGate modal

**Behavior:** Same as Path A. Hooks into JourneyGate to gate a specific action (run the surname lookup, generate motto, etc.), then runs the action after the email is captured.

**Account created?** **NO** (same as JourneyGate)

**Emails received:** Same as Path A — 4 emails

---

### Path E — AppLayout auth state listener (safety net)

**Trigger:** ANY successful sign-in event from anywhere (Google OAuth from AuthGate, magic link from FreeToolsEmailCTA after click-through, manual session restore in some cases)

**Component:** `src/components/AppLayout.tsx` (post-pull — onAuthStateChange listener)

**What fires:** Same INSERT + welcome + audience sync logic as the others, gated on the journey_subscribers INSERT succeeding (23505 dedup means it skips if email already onboarded).

**Why it exists:** Catches every auth method we'll ever add. Belt + suspenders.

---

## Account state matrix — the actual problem

| Path | journey_subscribers row | Supabase auth account | Sign-in method |
|---|---|---|---|
| A (JourneyGate) | yes | no | None — anonymous email subscriber |
| B1 (AuthGate password) | yes | yes | Email + password |
| B2 (AuthGate Google) | yes | yes | Google OAuth |
| C (FreeToolsEmailCTA) | yes | yes | Magic link (passwordless) |
| D (inline tool gate) | yes | no | None — anonymous email subscriber |

A user who walks in through Stop 1 (Path A) and later tries to access `/my-legacy` cannot sign in. They have no account. They have to go to navbar Sign In, click Create Account, and pick a password — even though they already gave you their email. That's the conversion leak.

The cleanest fix: make Paths A and D use the same magic-link pattern as Path C. One email entry creates one auth account always. Optional Google for users who prefer it. Email+password only as a fallback for users who insist.

---

## Email map — what actually lands in inboxes

### Transactional (immediate)

| Email | Sender | Triggered by | Purpose |
|---|---|---|---|
| Welcome — "Your story is waiting" | greg@ancestorsqr.com | All signup paths | Branded onboarding, 4-bullet list of what to do, single CTA to /journey/1 |
| Magic link | noreply@notify.ancestorsqr.com | Path C (FreeToolsEmailCTA) only | Supabase-generated, used to sign in later |
| Stripe purchase confirmation | Stripe | Successful checkout | Receipt + access link |
| Legacy Pack delivery | (via payments-webhook) | Successful $29.99 purchase | Activation of paid content |

### Drip automation (Resend, triggered by `ancestorsqr_welcome_started` event)

| Day | Subject (per CLAUDE.md) | CTA |
|---|---|---|
| 3 | "Where did your name come from?" | /tools/surname |
| 7 | "Your family deserves a coat of arms" | /motto, /crest |
| 14 | "Someone in your bloodline left a story" | /tools/ancestor |

**Open question:** Are these drips actually configured in Resend's automation UI? Per memory file (resend_audience.md, Apr 29 2026), they were set up but never verified live. The Day-3 drip for `gregadosmond+stop5test1@gmail.com` should have arrived May 3, 2026 — Greg should check his inbox to confirm.

### Welcome email design (already good)

- Subject: "Your story is waiting"
- From: Greg Osmond <greg@ancestorsqr.com>
- Reply-to: same
- HTML: warm cream background (#f5f0e6), white card, Lora italic h1, gold (#c9a86b) CTA button
- Plain-text fallback included
- CAN-SPAM compliant with Oshawa address
- **Issue: greeting is "Hi friend," because no path captures first_name** (all paths pass `first_name: null`)

---

## Friction points found in this audit

### Inside the journey

1. **Stop 1 has both a "DISCOVER MY LEGACY" button AND a JourneyGate modal.** User types surname → clicks Discover → modal opens asking for email. Two steps that could be one if the surname field accepted email below it, OR if the button skipped the modal for already-captured users (already does, but the modal mounts briefly anyway).

2. **Stop 3 (Bloodline) auto-redirects to /journey/1 if surname isn't in JourneyContext.** Correct gating but if user refreshes mid-journey they lose state and bounce back. Could persist the surname in sessionStorage like the email.

3. **Free Tools email gate triggers even for logged-in users.** The `FreeToolsEmailCTA` component only checks the sessionStorage flag, not the auth state. A returning user who's signed in via Google still sees "Unlock All Free Heritage Tools" — annoying. Easy fix: check `supabase.auth.getSession()` first like `useEmailGate` does.

### Inside the emails

4. **No first-name personalization anywhere.** Every email greets "Hi friend." Add a first_name field on at least the AuthGate signup (the most committed path). Resend automation supports `{{first_name}}` merge tags if you pass the field through.

5. **Drips not branded.** Welcome is fully branded HTML. The Day 3/7/14 drips (per CLAUDE.md) are plain text in Resend. Worth wrapping in the same HTML shell before any major audience broadcast.

6. **Path C users get a confusing TWO emails on signup** — welcome from Greg + magic link from noreply. They'll wonder which to click. Possible fix: skip the magic link unless they explicitly request sign-in, OR combine "welcome + your sign-in link" into a single email.

### Auth UX

7. **AuthGate defaults to "Create your account"** but most users hitting Sign In are returning. First impression suggests they need to make a new account. Either auto-detect by email lookup or default to sign-in mode.

8. **"Continue with Google" path doesn't extract first name.** Even though Google KNOWS their first name, we never pull it from the OAuth payload. Free win.

9. **Email+password signup auto-confirms with no email verification.** Standard for low-friction onboarding, but means users could mistype their email and never realize it bounced. Worth showing a "we just sent a welcome to <email> — wrong? change it" toast after signup.

---

## Recommended simplification — Phase 1 (this week)

In Greg's "sequential" style, in order:

**Step 1 — Unify accounts (biggest win)**
- Make JourneyGate (Path A) and inline tool gate (Path D) call `supabase.auth.signInWithOtp({ email, shouldCreateUser: true })` like FreeToolsEmailCTA does
- Now every email entry creates a real auth account
- Removes the "I gave you my email but can't sign in" cliff

**Step 2 — Standardize drips**
- Confirm Day 3/7/14 drips are firing (check Greg's inbox for stop5test1 — Day 3 was May 3, Day 7 was May 7)
- Wrap drip bodies in the same branded HTML shell as welcome
- Add unsubscribe link to all (CAN-SPAM compliance)

**Step 3 — Add first-name field**
- One additional field on AuthGate (most committed path)
- Pass `first_name` through to send-welcome-email and sync-to-resend-audience
- Update drip templates to use `{{first_name}}` instead of "friend"

**Step 4 — Hide FreeToolsEmailCTA for logged-in users**
- Check `supabase.auth.getSession()` on mount in addition to sessionStorage flag
- One-liner fix

Each step is a small, focused Lovable prompt. None of them are bundled.

---

## What's NOT broken

- Stripe checkout flow (live + sandbox secrets present, two webhook secrets configured)
- Welcome email design (genuinely beautiful, well-built, atomic dedup, idempotent)
- Resend Audience sync (idempotent, event only fires for new contacts)
- AppLayout listener (verified working today — catches OAuth signups)
- FamilySearch integration (90% built, blocked on Gordon Clarke replying)
- 6-stop journey content (Claude generation, DALL-E crest, TTS narration all working)
- Page-meta hook (per-page titles + og:image working on every route)
- 404 page (on-brand "branch doesn't exist")

---

_Sources: src/components/JourneyGate.tsx, AuthGate.tsx, FreeToolsEmailCTA.tsx, AppLayout.tsx; src/hooks/useEmailGate.ts; supabase/functions/send-welcome-email/index.ts, sync-to-resend-audience/index.ts. Live verified via Chrome MCP._
