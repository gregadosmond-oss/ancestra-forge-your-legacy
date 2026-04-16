import { Link } from "react-router-dom";
import WarmDivider from "@/components/journey/WarmDivider";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import PacksSection from "@/components/landing/PacksSection";
import FreeToolsSection from "@/components/landing/FreeToolsSection";
import OccasionsSection from "@/components/landing/OccasionsSection";
import FinalCtaSection from "@/components/landing/FinalCtaSection";

const Index = () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background">
      {/* SVG grain texture overlay */}
      <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.018]">
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* ── HERO VIDEO BANNER ── */}
      <div className="relative w-full" style={{ height: "100vh" }}>
        {/* 3D hero video */}
        <video
          src="/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
          style={{
            objectPosition: "center 40%",
            filter: "brightness(0.85) saturate(0.9)",
          }}
        />

        {/* Bottom fade into page background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(13,10,7,0.3) 0%, rgba(13,10,7,0.05) 50%, rgba(13,10,7,0.9) 100%)",
          }}
        />

        {/* Crest overlaid on video — centered, lower third */}
        <img
          src="/crest.png"
          alt="Ancestra family crest"
          className="absolute left-1/2 z-10 -translate-x-1/2"
          style={{
            bottom: "18%",
            width: "200px",
            height: "auto",
            filter: "drop-shadow(0 0 36px rgba(212,160,74,0.5))",
          }}
        />
      </div>

      {/* ── HEADLINE + CTA below the video ── */}
      <div className="relative z-10 flex flex-col items-center px-6 pb-16 text-center">

        <h1 className="mt-6 font-display text-3xl leading-tight tracking-tight text-cream-warm sm:text-4xl md:text-5xl lg:text-6xl">
          Every family has a story
          <br />
          worth telling.
        </h1>

        <p className="mt-5 max-w-lg font-serif text-lg italic text-cream-soft sm:text-xl">
          Discover your name. Forge your crest. Pass it on.
        </p>

        <Link
          to="/journey"
          className="mt-10 inline-block rounded-pill px-10 py-4 text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-400"
          style={{
            background: "linear-gradient(135deg, #e8943a, #c47828)",
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background =
              "linear-gradient(135deg, #f0a848, #e8943a)";
            (e.currentTarget as HTMLAnchorElement).style.transform =
              "translateY(-2px)";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow =
              "0 12px 40px rgba(232,148,58,0.2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background =
              "linear-gradient(135deg, #e8943a, #c47828)";
            (e.currentTarget as HTMLAnchorElement).style.transform = "";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "";
          }}
        >
          Begin Your Journey
        </Link>
      </div>

      {/* ── LANDING SECTIONS ── */}
      <div className="relative z-10 w-full max-w-4xl px-6 pb-24">
        <WarmDivider />
        <PacksSection />
        <WarmDivider />
        <HowItWorksSection />
        <WarmDivider />
        <FreeToolsSection />
        <WarmDivider />
        <OccasionsSection />
        <WarmDivider />
        <FinalCtaSection />
      </div>
    </div>
  );
};

export default Index;
