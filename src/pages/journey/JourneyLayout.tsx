import { AnimatePresence, motion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import { JourneyProvider } from "@/contexts/JourneyContext";

const JourneyLayout = () => {
  const location = useLocation();

  return (
    <JourneyProvider>
      <div className="relative min-h-screen overflow-hidden bg-background">
        {/* Castle video background — fixed so it stays as user scrolls */}
              <img src="/hero.jpg" alt="" className="pointer-events-none fixed inset-0 h-full w-full object-cover" style={{ objectPosition: "center 30%", opacity: 0.38, filter: "saturate(0.7) brightness(0.95)" }} />

        {/* Dark overlay to keep content readable */}
        <div
          className="pointer-events-none fixed inset-0"
          style={{ background: "rgba(13,10,7,0.72)" }}
        />

        {/* SVG grain overlay */}
        <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.018]">
          <filter id="journey-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#journey-grain)" />
        </svg>

        {/* Ambient amber glow */}
        <div
          className="pointer-events-none fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "900px",
            height: "700px",
            background:
              "radial-gradient(ellipse at center, hsla(30, 80%, 40%, 0.07) 0%, transparent 70%)",
          }}
        />

        {/* Animated page content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
    </JourneyProvider>
  );
};

export default JourneyLayout;
