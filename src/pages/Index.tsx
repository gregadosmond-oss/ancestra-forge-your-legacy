import { useState } from "react";
import { Link } from "react-router-dom";
import { startAmbientAudio } from "@/lib/ambientAudio";
import WarmDivider from "@/components/journey/WarmDivider";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import PacksSection from "@/components/landing/PacksSection";
import FreeToolsSection from "@/components/landing/FreeToolsSection";
import OccasionsSection from "@/components/landing/OccasionsSection";
import FinalCtaSection from "@/components/landing/FinalCtaSection";

const Index = () => {
  const [musicStarted, setMusicStarted] = useState(false);

  const handleStartMusic = () => {
    startAmbientAudio();
    setMusicStarted(true);
  };

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

        {/* Scroll indicator */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1" style={{ animation: "scrollBounce 2s ease-in-out infinite" }}>
          <span className="font-sans text-[9px] uppercase tracking-[3px]" style={{ color: "rgba(212,160,74,0.5)" }}>Scroll</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(212,160,74,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>

        <style>{`
          @keyframes scrollBounce {
            0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.7; }
            50% { transform: translateX(-50%) translateY(6px); opacity: 1; }
          }
        `}</style>
      </div>

      {/* ── MUSIC INVITE ── */}
      {!musicStarted && (
        <div className="relative z-10 flex w-full items-center justify-center gap-3 py-3" style={{ background: "rgba(26,18,8,0.8)", borderBottom: "1px solid rgba(212,160,74,0.08)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a07830" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
          <span className="font-sans text-[11px]" style={{ color: "#8a7e6e" }}>Want the full experience?</span>
          <button
            onClick={handleStartMusic}
            className="font-sans text-[11px] font-semibold transition-opacity hover:opacity-70"
            style={{ color: "#d4a04a", textDecoration: "underline", textUnderlineOffset: "3px" }}
          >
            Enable music
          </button>
        </div>
      )}

      {/* ── CREST + HEADLINE + CTA below the video ── */}
      <div className="relative z-10 flex flex-col items-center px-6 pb-16 text-center">
        <img
          src="/crest.png"
          alt="Ancestra family crest"
          style={{
            width: "260px",
            height: "auto",
            marginTop: "48px",
            filter: "drop-shadow(0 0 36px rgba(212,160,74,0.5))",
          }}
        />

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
