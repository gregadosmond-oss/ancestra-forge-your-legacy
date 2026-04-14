import { motion } from "framer-motion";

type Generation = {
  name: string;
  years: string;
  location: string;
  role?: string;
  isYou?: boolean;
};

type Props = { generations: Generation[] };

const BloodlineTree = ({ generations }: Props) => (
  <div className="relative mx-auto flex w-full max-w-md flex-col items-center">
    {/* Continuous connector line */}
    <div
      className="absolute top-0 h-full w-px bg-gradient-to-b from-transparent via-amber-dim/40 to-transparent"
      style={{ left: "50%", transform: "translateX(-50%)" }}
    />

    {generations.map((g, i) => (
      <motion.div
        key={g.name}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.7,
          delay: 0.2 + i * 0.18,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={`relative z-10 my-3 w-full rounded-[14px] border px-6 py-4 text-center backdrop-blur-sm ${
          g.isYou
            ? "border-amber/50 bg-amber/[0.06] shadow-[0_0_40px_rgba(232,148,58,0.15)]"
            : "border-amber-dim/15 bg-card/60"
        }`}
      >
        {g.isYou && (
          <p className="mb-1 font-sans text-[10px] uppercase tracking-[4px] text-amber">
            YOU
          </p>
        )}
        <h3
          className={`font-display ${
            g.isYou ? "text-2xl text-cream-warm" : "text-lg text-cream-soft"
          }`}
        >
          {g.name}
        </h3>
        <p className="mt-1 font-sans text-xs text-text-dim">
          {g.years} · {g.location}
        </p>
        {g.role && (
          <p className="mt-1 font-serif text-sm italic text-amber-dim">
            {g.role}
          </p>
        )}
      </motion.div>
    ))}
  </div>
);

export default BloodlineTree;
