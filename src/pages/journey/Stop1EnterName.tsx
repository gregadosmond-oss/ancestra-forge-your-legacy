import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SectionLabel from "@/components/journey/SectionLabel";
import StaggerGroup, { staggerItem } from "@/components/journey/StaggerGroup";

const Stop1EnterName = () => {
  const navigate = useNavigate();
  const [surname, setSurname] = useState("");
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/journey/2");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-24">
      <StaggerGroup className="w-full max-w-xl text-center">
        <motion.div variants={staggerItem}>
          <SectionLabel>BEGIN YOUR LEGACY</SectionLabel>
        </motion.div>

        <motion.h1
          variants={staggerItem}
          className="mt-6 font-display text-5xl leading-tight tracking-tight text-cream-warm sm:text-6xl"
        >
          Enter your name.
        </motion.h1>

        <motion.p
          variants={staggerItem}
          className="mt-5 font-serif text-lg italic text-cream-soft"
        >
          Every family has a story. Yours is waiting.
        </motion.p>

        <motion.form
          variants={staggerItem}
          onSubmit={handleSubmit}
          className="mt-12 flex flex-col items-center gap-5"
        >
          <input
            type="text"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            placeholder="e.g. Osmond"
            autoFocus
            className="w-full rounded-pill border border-amber-dim/30 bg-input px-8 py-5 text-center font-display text-2xl text-cream-warm placeholder:text-text-dim focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
          />

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="font-sans text-[11px] uppercase tracking-[3px] text-amber-dim transition-colors hover:text-amber"
          >
            {expanded ? "− Hide details" : "+ Add more details"}
          </button>

          {expanded && (
            <div className="grid w-full gap-3 text-left">
              <input
                type="text"
                placeholder="Parents' names (optional)"
                className="rounded-[14px] border border-amber-dim/20 bg-input px-5 py-3 font-sans text-sm text-foreground placeholder:text-text-dim focus:border-amber focus:outline-none"
              />
              <input
                type="text"
                placeholder="Country of origin (optional)"
                className="rounded-[14px] border border-amber-dim/20 bg-input px-5 py-3 font-sans text-sm text-foreground placeholder:text-text-dim focus:border-amber focus:outline-none"
              />
              <input
                type="text"
                placeholder="Birth year (optional)"
                className="rounded-[14px] border border-amber-dim/20 bg-input px-5 py-3 font-sans text-sm text-foreground placeholder:text-text-dim focus:border-amber focus:outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            className="mt-6 rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #e8943a, #c47828)",
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            Discover My Legacy
          </button>
        </motion.form>
      </StaggerGroup>
    </div>
  );
};

export default Stop1EnterName;
