import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const TOOLS = [
  {
    href: "/tools/chat",
    heading: "Chat With Your Ancestor",
    body: "A live conversation with an AI character drawn from your family's real history.",
    ctaLabel: "Start the Chat",
    bullets: ["Live AI conversation", "Period-accurate voice", "Ask them anything"],
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4a04a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: "/tools/ancestor",
    heading: "Meet Your Ancestor",
    body: "AI generates a historically plausible ancestor — name, era, occupation, personality, and a quote.",
    ctaLabel: "Meet Them",
    bullets: ["Name, era & occupation", "Personality sketch", "A line in their voice"],
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4a04a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/tools/motto",
    heading: "Motto Generator",
    body: "Enter 3 values → get a Latin motto with English translation.",
    ctaLabel: "Generate Motto",
    bullets: ["Three values in", "Latin motto out", "Word-by-word translation"],
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4a04a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    href: "/tools/quiz",
    heading: "Bloodline Quiz",
    body: "5 questions → your ancestry archetype. Warrior, Builder, Explorer, Healer, or Scholar.",
    ctaLabel: "Take the Quiz",
    bullets: ["5 quick questions", "Your archetype revealed", "Shareable result"],
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4a04a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    href: "/tools/surname",
    heading: "Surname Lookup",
    body: "Instant meaning, origin, and historical role for any surname.",
    ctaLabel: "Try the Lookup",
    bullets: ["Origin & meaning", "Historical role", "Era of first record"],
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4a04a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
      </svg>
    ),
  },
  {
    href: "/tools/1700s",
    heading: "The 1700s You",
    body: "What would your life look like 300 years ago based on your surname?",
    ctaLabel: "See Your 1700s Self",
    bullets: ["Your 1700s trade", "Where you'd live", "How you'd be known"],
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4a04a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
] as const;

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" } as const,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const FreeToolsSection = () => (
  <motion.section {...reveal} className="py-16 text-center">
    <p className="mb-3 text-[10px] uppercase tracking-[4px] text-amber-dim">
      Free Tools
    </p>
    <h2 className="font-display text-3xl text-cream-warm sm:text-4xl">
      Curious? Start here — no commitment.
    </h2>
    <p className="mx-auto mt-4 max-w-md font-serif italic text-foreground">
      Free tools to explore your heritage. No account needed.
    </p>

    <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {TOOLS.map((tool, i) => (
        <motion.div
          key={tool.heading}
          {...reveal}
          transition={{ ...reveal.transition, delay: i * 0.08 }}
          className="h-full"
        >
          <Link
            to={tool.href}
            aria-label={tool.heading}
            className="group flex h-full flex-col rounded-[22px] p-9 text-center transition-all duration-[400ms] cursor-pointer"
            style={{
              background: "linear-gradient(180deg, #1e1810 0%, #1a1510 100%)",
              border: "1px solid rgba(212,160,74,0.32)",
              boxShadow: "0 0 0 rgba(232,148,58,0)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = "rgba(232,148,58,0.55)";
              el.style.transform = "translateY(-4px)";
              el.style.boxShadow = "0 12px 40px rgba(232,148,58,0.12)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = "rgba(212,160,74,0.32)";
              el.style.transform = "";
              el.style.boxShadow = "0 0 0 rgba(232,148,58,0)";
            }}
          >
            <div
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "rgba(232,148,58,0.08)", border: "1px solid rgba(212,160,74,0.25)" }}
            >
              {tool.icon}
            </div>

            <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[3px]" style={{ color: "#a07830" }}>
              Free
            </p>

            <h3 className="font-display text-2xl text-cream-warm">
              {tool.heading}
            </h3>

            <p className="mt-3 font-serif italic text-sm leading-relaxed" style={{ color: "#c4b8a6" }}>
              {tool.body}
            </p>

            <ul className="mt-5 flex-1 space-y-2 text-left">
              {tool.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm" style={{ color: "#c4b8a6" }}>
                  <span className="mt-1 font-sans text-[8px]" style={{ color: "#d4a04a" }}>✦</span>
                  {b}
                </li>
              ))}
            </ul>

            <div
              className="mt-7 block rounded-pill py-3 text-center font-sans text-[12px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 group-hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
            >
              {tool.ctaLabel}
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  </motion.section>
);

export default FreeToolsSection;
