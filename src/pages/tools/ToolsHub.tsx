import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import WarmDivider from "@/components/journey/WarmDivider";

const tools = [
  {
    to: "/tools/surname",
    label: "Surname Lookup",
    tag: "FREE",
    description: "Discover the meaning, origin, and history hiding in your family name.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4a04a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
      </svg>
    ),
  },
  {
    to: "/tools/quiz",
    label: "Bloodline Quiz",
    tag: "FREE",
    description: "5 questions. Centuries of instinct. Discover your ancestral archetype.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4a04a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    to: "/tools/motto",
    label: "Motto Generator",
    tag: "FREE",
    description: "Enter three values and receive a Latin motto with full word breakdown.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4a04a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    to: "/tools/ancestor",
    label: "Meet Your Ancestor",
    tag: "FREE",
    description: "A historically plausible ancestor from your bloodline — their life, their world, their words.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4a04a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    to: "/tools/1700s",
    label: "The 1700s You",
    tag: "FREE",
    description: "What would your life look like 300 years ago? Step back into history.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4a04a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    to: "/tools/chat",
    label: "Ancestor Chat",
    tag: "FREE",
    description: "Chat live with an AI character based on your family history. Ask them anything.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4a04a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    to: "/journey",
    label: "Full Legacy Journey",
    tag: "BEGIN",
    description: "The complete experience — crest, story, family tree, and gifts.",
    cta: true,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e8943a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function ToolsHub() {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Castle video background */}
      <video
        src="/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="pointer-events-none fixed inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center 30%", opacity: 0.12, filter: "saturate(0.6)" }}
      />
      <div className="pointer-events-none fixed inset-0" style={{ background: "rgba(13,10,7,0.78)" }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 pb-24 pt-16 text-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-sans text-[10px] uppercase tracking-[4px] text-amber-dim"
        >
          Free Tools
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-3 font-display text-cream-warm"
          style={{ fontSize: "clamp(28px, 5vw, 48px)" }}
        >
          What's hiding in your name?
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 max-w-md font-serif italic text-text-body"
          style={{ fontSize: "17px" }}
        >
          Explore your ancestry for free. Every tool ends with a story worth sharing.
        </motion.p>

        <div className="mt-8 w-full max-w-xs">
          <WarmDivider />
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mt-10 grid w-full max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {tools.map((tool) => (
            <motion.div key={tool.to} variants={item}>
              <Link
                to={tool.to}
                className="group flex flex-col items-start rounded-[22px] p-7 text-left transition-all duration-[400ms]"
                style={{
                  background: tool.cta ? "rgba(232,148,58,0.06)" : "rgba(26,18,8,0.7)",
                  border: tool.cta
                    ? "1px solid rgba(232,148,58,0.25)"
                    : "1px solid rgba(212,160,74,0.08)",
                  backdropFilter: "blur(8px)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = tool.cta
                    ? "rgba(232,148,58,0.12)"
                    : "rgba(26,18,8,0.9)";
                  e.currentTarget.style.borderColor = tool.cta
                    ? "rgba(232,148,58,0.4)"
                    : "rgba(212,160,74,0.2)";
                  e.currentTarget.style.transform = "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = tool.cta
                    ? "rgba(232,148,58,0.06)"
                    : "rgba(26,18,8,0.7)";
                  e.currentTarget.style.borderColor = tool.cta
                    ? "rgba(232,148,58,0.25)"
                    : "rgba(212,160,74,0.08)";
                  e.currentTarget.style.transform = "";
                }}
              >
                <div className="mb-4 flex w-full items-start justify-between">
                  {tool.icon}
                  <span
                    className="font-sans text-[9px] font-semibold uppercase tracking-[2.5px]"
                    style={{
                      color: tool.cta ? "#e8943a" : "#a07830",
                      background: tool.cta
                        ? "rgba(232,148,58,0.1)"
                        : "rgba(212,160,74,0.08)",
                      padding: "3px 8px",
                      borderRadius: "60px",
                    }}
                  >
                    {tool.tag}
                  </span>
                </div>

                <h3
                  className="font-display text-xl"
                  style={{ color: tool.cta ? "#e8b85c" : "#e8ddd0" }}
                >
                  {tool.label}
                </h3>

                <p className="mt-2 font-sans text-sm leading-relaxed text-text-dim">
                  {tool.description}
                </p>

                <div
                  className="mt-5 font-sans text-[11px] font-semibold uppercase tracking-[1.5px] transition-opacity duration-200 group-hover:opacity-100"
                  style={{
                    color: tool.cta ? "#e8943a" : "#a07830",
                    opacity: 0.7,
                  }}
                >
                  {tool.cta ? "Begin →" : "Try it →"}
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-16 text-center"
        >
          <p className="font-sans text-sm text-text-dim">
            Ready to discover your full legacy?
          </p>
          <Link
            to="/journey"
            className="mt-4 inline-block rounded-pill px-10 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-[400ms] hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
          >
            Begin Your Journey
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
