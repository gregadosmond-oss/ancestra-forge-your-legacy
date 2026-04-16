import { motion } from "framer-motion";

interface EntryPortalProps {
  onEnter: () => void;
}

const EntryPortal = ({ onEnter }: EntryPortalProps) => (
  <motion.div
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
    style={{
      background: "radial-gradient(ellipse at center, #1a1208 0%, #0d0a07 70%)",
    }}
  >
    {/* Crest */}
    <img
      src="/crest.png"
      alt="Ancestra crest"
      style={{
        width: "180px",
        height: "auto",
        filter: "drop-shadow(0 0 28px rgba(212,160,74,0.35))",
      }}
    />

    {/* Headline */}
    <p
      className="mt-8 font-serif text-2xl italic"
      style={{ color: "#e8b85c" }}
    >
      Welcome to Ancestra
    </p>

    {/* CTA button with pulse */}
    <button
      onClick={onEnter}
      className="mt-10 rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px]"
      style={{
        background: "linear-gradient(135deg, #e8943a, #c47828)",
        color: "#1a1208",
        animation: "portalPulse 2.5s ease-in-out infinite",
      }}
    >
      Begin Your Journey
    </button>

    <style>{`
      @keyframes portalPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(232,148,58,0); }
        50% { box-shadow: 0 0 0 18px rgba(232,148,58,0.18); }
      }
    `}</style>
  </motion.div>
);

export default EntryPortal;
