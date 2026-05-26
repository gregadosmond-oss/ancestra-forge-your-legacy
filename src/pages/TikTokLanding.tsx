import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, ScrollText, Sparkles } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function TikTokLanding() {
  usePageMeta({
    title: "Discover Your Family Crest — AncestorsQR",
    description: "Enter your last name and discover your family's coat of arms, motto, and story. Free.",
  });

  const navigate = useNavigate();
  const [surname, setSurname] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const clean = surname.trim();
    if (!clean) return;
    // Persist UTM context for downstream attribution
    try {
      sessionStorage.setItem("anc_source", "tiktok");
      sessionStorage.setItem("anc_surname_seed", clean);
    } catch {}
    navigate(`/journey/1?surname=${encodeURIComponent(clean)}&utm_source=tiktok&utm_medium=bio&utm_campaign=tiktok_landing`);
  };

  return (
    <main className="min-h-screen bg-bg text-text flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden">
      {/* Warm amber glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(232,148,58,0.18) 0%, transparent 55%), radial-gradient(ellipse at bottom, rgba(212,160,74,0.10) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2 mb-6 text-amber-dim text-xs tracking-[0.25em] uppercase font-sans"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>From TikTok</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display text-cream-warm text-4xl sm:text-5xl leading-[1.05] tracking-tight"
        >
          Your family name
          <br />
          <span className="italic font-serif text-amber-light">has a story.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="mt-5 text-text-body font-sans text-base leading-relaxed max-w-sm"
        >
          Enter your last name. Discover your House crest, motto, and bloodline — in under a minute. Free.
        </motion.p>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="mt-9 w-full flex flex-col gap-3"
        >
          <input
            type="text"
            inputMode="text"
            autoCapitalize="words"
            autoComplete="family-name"
            placeholder="Enter your surname"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            className="w-full bg-bg-input border border-gold-line rounded-2xl px-5 py-4 text-cream-warm placeholder:text-text-dim font-sans text-lg text-center focus:outline-none focus:border-amber transition-colors"
          />
          <button
            type="submit"
            disabled={!surname.trim()}
            className="w-full font-sans font-semibold tracking-[0.15em] uppercase text-sm py-4 px-8 rounded-full text-[#1a1208] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #e8943a, #c47828)",
              boxShadow: "0 10px 30px rgba(232,148,58,0.18)",
            }}
          >
            Forge My Crest
          </button>
        </motion.form>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.85 }}
          className="mt-10 grid grid-cols-3 gap-3 w-full"
        >
          {[
            { icon: Crown, label: "Custom Crest" },
            { icon: ScrollText, label: "Family Motto" },
            { icon: Sparkles, label: "Bloodline" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl bg-bg-card border border-dark-line"
            >
              <Icon className="w-5 h-5 text-amber" />
              <span className="text-text-dim font-sans text-[11px] tracking-wide">{label}</span>
            </div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="mt-8 font-serif italic text-amber-dim text-sm"
        >
          "Every family has a story worth telling."
        </motion.p>
      </div>
    </main>
  );
}
