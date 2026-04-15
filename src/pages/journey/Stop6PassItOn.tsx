import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import SectionLabel from "@/components/journey/SectionLabel";
import WarmDivider from "@/components/journey/WarmDivider";
import ProductCard from "@/components/journey/ProductCard";
import StaggerGroup, { staggerItem } from "@/components/journey/StaggerGroup";
import { MOCK_PRODUCTS } from "@/test/fixtures/legacy";
import { useJourney } from "@/contexts/JourneyContext";

const Stop6PassItOn = () => {
  const [email, setEmail] = useState("");
  const { surname } = useJourney();

  const sendPreview = (e: React.FormEvent) => {
    e.preventDefault();
    const target = email || "your family";
    toast.success(`Preview sent to ${target}.`);
    setEmail("");
  };

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-24">
      <StaggerGroup className="w-full max-w-2xl">
        <motion.div variants={staggerItem} className="text-center">
          <SectionLabel>PASS IT ON</SectionLabel>
          <h1 className="mt-4 font-display text-4xl tracking-tight text-cream-warm sm:text-5xl">
            Who in your family needs to see this?
          </h1>
        </motion.div>

        {/* Action 1: send preview */}
        <motion.div variants={staggerItem} className="mt-16">
          <p className="mb-4 text-center font-serif text-sm italic text-amber-dim">
            Send a free preview
          </p>
          <form onSubmit={sendPreview} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="their@email.com"
              className="flex-1 rounded-pill border border-amber-dim/30 bg-input px-6 py-4 font-sans text-sm text-cream-warm placeholder:text-text-dim focus:border-amber focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-pill px-8 py-4 font-sans text-[12px] font-semibold uppercase tracking-[1.5px] text-primary-foreground"
              style={{ background: "linear-gradient(135deg, #e8943a, #c47828)" }}
            >
              Send Preview
            </button>
          </form>
        </motion.div>

        <motion.div variants={staggerItem}>
          <WarmDivider />
        </motion.div>

        {/* Action 2: gift the legacy pack */}
        <motion.div variants={staggerItem} className="text-center">
          <p className="mb-4 font-serif text-sm italic text-amber-dim">
            Gift the Legacy Pack
          </p>
          <button
            onClick={() => toast.info("Gift flow — launching soon.")}
            className="rounded-pill border border-amber/40 bg-amber/[0.06] px-10 py-4 font-sans text-[12px] font-semibold uppercase tracking-[1.5px] text-amber-light transition-colors hover:bg-amber/[0.12]"
          >
            Gift the Legacy · $29.99
          </button>
        </motion.div>

        <motion.div variants={staggerItem}>
          <WarmDivider />
        </motion.div>

        {/* Action 3: physical keepsake */}
        <motion.div variants={staggerItem}>
          <p className="mb-6 text-center font-serif text-sm italic text-amber-dim">
            Or gift a physical keepsake
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {MOCK_PRODUCTS.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </motion.div>

        <motion.p
          variants={staggerItem}
          className="mt-20 text-center font-serif text-sm italic text-amber-dim"
        >
          An Ancestra Original.
        </motion.p>
      </StaggerGroup>
    </div>
  );
};

export default Stop6PassItOn;
