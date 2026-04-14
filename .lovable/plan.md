

# Ancestra — Brand Foundation & Landing Page

## What we're building
A single landing page with the Fireside Luxury design system fully configured. No other pages, no auth, no backend.

## Design system setup
- Replace all CSS variables with the Ancestra warm palette (warm-black bg, amber/honey accents, cream text)
- Load Google Fonts: Libre Caslon Display, Libre Caslon Text, DM Sans
- Set up pill-shaped buttons, warm border radii, and hover transitions
- Add SVG grain texture overlay and ambient amber radial glow

## Landing page (Index)
- Full-viewport hero, centered content
- Headline: **"Every family has a story worth telling."** (Libre Caslon Display, cream-warm)
- Sub-headline: *"Discover your name. Forge your crest. Pass it on."* (Libre Caslon Text italic, cream-soft)
- Primary CTA: **"BEGIN YOUR JOURNEY"** (honey-orange gradient, pill shape, uppercase DM Sans)
- Warm ambient glow behind the hero text area
- Subtle grain overlay across the page

## Files changed
- `src/index.css` — full palette + font imports + grain texture
- `tailwind.config.ts` — extended with Ancestra color tokens
- `src/pages/Index.tsx` — hero landing page
- `index.html` — Google Fonts link tags

