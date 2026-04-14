import { motion } from "framer-motion";
import type { MigrationWaypoint } from "@/types/legacy";

type Props = {
  waypoints: MigrationWaypoint[];
};

const MigrationPath = ({ waypoints }: Props) => (
  <div className="relative flex flex-col items-center gap-4 py-4">
    {/* Vertical amber gradient line */}
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-0 h-full w-[1px] -translate-x-1/2"
      style={{
        background:
          "linear-gradient(to bottom, transparent, hsl(38 60% 56% / 0.5), transparent)",
      }}
    />

    {waypoints.map((w, i) => (
      <motion.div
        key={`${w.region}-${w.century}-${i}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.7,
          delay: 0.3 + i * 0.18,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative z-10 w-full max-w-md rounded-[14px] border border-amber-dim/20 bg-card/60 px-6 py-4 text-center backdrop-blur-sm"
      >
        <p className="font-display text-base text-cream-warm">{w.region}</p>
        <p className="mt-1 font-sans text-[11px] uppercase tracking-[3px] text-amber-dim">
          {w.century}
        </p>
        <p className="mt-2 font-serif text-sm italic text-text-body">{w.role}</p>
      </motion.div>
    ))}
  </div>
);

export default MigrationPath;
