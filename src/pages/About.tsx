import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import WarmDivider from "@/components/journey/WarmDivider";

const reveal = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

const stats = [
  { value: "12", label: "Generations traced" },
  { value: "80+", label: "Historical documents" },
  { value: "1066", label: "Earliest ancestor" },
  { value: "1688", label: "Crest established" },
];

export default function About() {
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
        style={{ objectPosition: "center 30%", opacity: 0.13, filter: "saturate(0.6)" }}
      />
      <div className="pointer-events-none fixed inset-0" style={{ background: "rgba(13,10,7,0.8)" }} />

      <div className="relative z-10 mx-auto max-w-3xl px-6 pb-32 pt-16">

        {/* Label */}
        <motion.p
          {...reveal}
          className="text-center font-sans text-[10px] uppercase tracking-[4px] text-amber-dim"
        >
          Our Story
        </motion.p>

        {/* Headline */}
        <motion.h1
          {...reveal}
          transition={{ ...reveal.transition, delay: 0.1 }}
          className="mt-3 text-center font-display text-cream-warm"
          style={{ fontSize: "clamp(28px, 5vw, 48px)" }}
        >
          From Labour, We Rise.
        </motion.h1>

        <motion.p
          {...reveal}
          transition={{ ...reveal.transition, delay: 0.2 }}
          className="mx-auto mt-4 max-w-lg text-center font-serif italic text-text-body"
          style={{ fontSize: "18px" }}
        >
          "Ex Labore, Ascendimus" — The Osmond Family Motto. Since 1688.
        </motion.p>

        <div className="mt-10">
          <WarmDivider />
        </div>

        {/* Founder intro */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12"
        >
          <p className="font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">
            The Founder
          </p>
          <h2 className="mt-2 font-display text-2xl text-cream sm:text-3xl">
            Gregory Angus Dean Osmond
          </h2>
          <p className="mt-5 font-sans text-base leading-relaxed text-text-body">
            Ancestra didn't start as a business idea. It started as an obsession.
          </p>
          <p className="mt-4 font-sans text-base leading-relaxed text-text-body">
            Greg spent years chasing his family through historical documents — wills from the 1700s,
            church records in Piddletrenthide, Domesday Book entries from 1066. His ancestors were
            Haywards. Land managers and protectors in Dorset, England. They weren't born wealthy.
            They earned everything through work, resilience, and grit.
          </p>
          <p className="mt-4 font-sans text-base leading-relaxed text-text-body">
            They later migrated to Newfoundland, Canada. Joseph Osmond built a fishing operation from
            nothing. His sons Mark and Ambrose grew it into one of the largest shipping businesses in
            Newfoundland — trading across the West Indies and Caribbean for over 100 years.
          </p>
        </motion.div>

        {/* Pull quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="my-12 rounded-[22px] px-8 py-8"
          style={{
            background: "rgba(26,18,8,0.7)",
            border: "1px solid rgba(212,160,74,0.12)",
            borderLeft: "3px solid rgba(212,160,74,0.4)",
          }}
        >
          <p className="font-serif text-xl italic leading-relaxed text-cream-soft sm:text-2xl">
            "Most people don't know where they come from — and that disconnect affects who they believe they can become."
          </p>
          <p className="mt-4 font-sans text-[11px] uppercase tracking-[3px] text-amber-dim">
            — Gregory Osmond, Founder
          </p>
        </motion.div>

        {/* Discovery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
        >
          <p className="font-sans text-base leading-relaxed text-text-body">
            After years of research, Greg uncovered a real Osmond Coat of Arms — established in 1688.
            He documented 12 generations of lineage, found over 80 historical documents, and discovered
            a family motto that crystallised everything his ancestors had lived:
          </p>
          <p className="mt-6 text-center font-display text-2xl text-amber-light sm:text-3xl">
            "Ex Labore, Ascendimus"
          </p>
          <p className="mt-2 text-center font-sans text-sm uppercase tracking-[3px] text-amber-dim">
            From Labour, We Rise.
          </p>
          <p className="mt-8 font-sans text-base leading-relaxed text-text-body">
            The name Osmond itself means <span className="text-cream-soft italic">Divine Protector</span> in Old English
            — <em>os</em> (god) and <em>mund</em> (protector). A name carrying that weight for over a thousand years.
          </p>
          <p className="mt-4 font-sans text-base leading-relaxed text-text-body">
            Ancestra exists so everyone can have that same experience — in five minutes instead of five years.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.85 }}
          className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-[14px] p-5 text-center"
              style={{
                background: "rgba(26,18,8,0.6)",
                border: "1px solid rgba(212,160,74,0.1)",
              }}
            >
              <p className="font-display text-3xl text-amber-light">{s.value}</p>
              <p className="mt-1 font-sans text-[10px] uppercase tracking-[2px] text-text-dim">
                {s.label}
              </p>
            </div>
          ))}
        </motion.div>

        <div className="mt-14">
          <WarmDivider />
        </div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1 }}
          className="mt-12 text-center"
        >
          <p className="font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">
            The Mission
          </p>
          <h2 className="mt-3 font-display text-2xl text-cream-warm sm:text-3xl">
            Every family has a story worth telling.
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-sans text-base leading-relaxed text-text-body">
            Ancestry.com gives you data. Ancestra gives you identity. We're not competing with
            genealogy tools — we're helping people feel the weight and pride of where they come from,
            and pass it on to the people they love.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="mt-14 text-center"
        >
          <Link
            to="/journey"
            className="inline-block rounded-pill px-10 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-[400ms] hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
          >
            Begin Your Journey
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
