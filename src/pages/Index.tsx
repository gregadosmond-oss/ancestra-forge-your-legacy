import { useState } from "react";
import { Link } from "react-router-dom";
import { toggleAmbientPlayback } from "@/lib/ambientAudio";
import WarmDivider from "@/components/journey/WarmDivider";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import PacksSection from "@/components/landing/PacksSection";
import FreeToolsSection from "@/components/landing/FreeToolsSection";

import FinalCtaSection from "@/components/landing/FinalCtaSection";
import LandingCrest from "@/components/landing/LandingCrest";

const Index = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleToggleMusic = () => {
    const playing = toggleAmbientPlayback();
    setIsPlaying(playing);
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

      {/* ── HERO VIDEO BANNER with overlaid content ── */}
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

        {/* Gradient overlay — darkens top and bottom */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(13,10,7,0.5) 0%, rgba(13,10,7,0.1) 35%, rgba(13,10,7,0.1) 55%, rgba(13,10,7,0.85) 100%)",
          }}
        />

        {/* ── CREST + HEADLINE + CTA — centered over video ── */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <LandingCrest />

          <h1 className="mt-6 font-display text-3xl leading-tight tracking-tight text-cream-warm sm:text-4xl md:text-5xl lg:text-6xl" style={{ textShadow: "0 2px 24px rgba(13,10,7,0.8)" }}>
            Every family has a story
            <br />
            worth telling.
          </h1>

          <p className="mt-5 max-w-lg font-serif text-lg italic text-cream-soft sm:text-xl" style={{ textShadow: "0 2px 12px rgba(13,10,7,0.8)" }}>
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

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1" style={{ animation: "scrollBounce 2s ease-in-out infinite" }}>
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
          @keyframes musicPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(232,148,58,0.5), 0 0 18px rgba(232,148,58,0.25); }
            50% { box-shadow: 0 0 0 7px rgba(232,148,58,0), 0 0 30px rgba(232,148,58,0.4); }
          }
          @keyframes musicPulseIdle {
            0%, 100% { box-shadow: 0 0 0 0 rgba(212,160,74,0.3), 0 0 12px rgba(212,160,74,0.1); }
            50% { box-shadow: 0 0 0 5px rgba(212,160,74,0), 0 0 20px rgba(212,160,74,0.2); }
          }
        `}</style>
      </div>

      {/* ── MUSIC BUTTON ── */}
      <div className="relative z-10 flex w-full items-center justify-center py-4" style={{ background: "rgba(20,14,8,0.85)", borderBottom: "1px solid rgba(212,160,74,0.08)" }}>
        <button
          onClick={handleToggleMusic}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            padding: "10px 22px",
            borderRadius: 60,
            border: isPlaying
              ? "1px solid rgba(232,148,58,0.55)"
              : "1px solid rgba(212,160,74,0.3)",
            background: isPlaying
              ? "linear-gradient(135deg, rgba(232,148,58,0.18), rgba(196,120,40,0.12))"
              : "rgba(212,160,74,0.06)",
            color: isPlaying ? "#f0a848" : "#d4a04a",
            fontFamily: "var(--font-sans, DM Sans, sans-serif)",
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            cursor: "pointer",
            animation: isPlaying ? "musicPulse 2s ease-in-out infinite" : "musicPulseIdle 3s ease-in-out infinite",
            transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px) scale(1.04)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "";
          }}
        >
          {/* Icon */}
          {isPlaying ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
          {isPlaying ? "Pause Music" : "Play Music"}
        </button>
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
        <FinalCtaSection />
      </div>

      {/* ── FLOATING MUSIC BUTTON — fixed bottom-right ── */}
      <button
        onClick={handleToggleMusic}
        title={isPlaying ? "Pause Music" : "Play Music"}
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          gap: "7px",
          padding: "9px 16px",
          borderRadius: 60,
          border: isPlaying
            ? "1px solid rgba(232,148,58,0.5)"
            : "1px solid rgba(212,160,74,0.22)",
          background: isPlaying
            ? "rgba(232,148,58,0.14)"
            : "rgba(13,10,7,0.75)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          color: isPlaying ? "#f0a848" : "#a07830",
          fontFamily: "var(--font-sans, DM Sans, sans-serif)",
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "1.4px",
          textTransform: "uppercase",
          cursor: "pointer",
          animation: isPlaying
            ? "musicPulse 2s ease-in-out infinite"
            : "musicPulseIdle 3s ease-in-out infinite",
          transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.color = isPlaying ? "#f0a848" : "#d4a04a";
          el.style.borderColor = isPlaying ? "rgba(232,148,58,0.7)" : "rgba(212,160,74,0.45)";
          el.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.color = isPlaying ? "#f0a848" : "#a07830";
          el.style.borderColor = isPlaying ? "rgba(232,148,58,0.5)" : "rgba(212,160,74,0.22)";
          el.style.transform = "";
        }}
      >
        {isPlaying ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
        {isPlaying ? "Pause" : "Play Music"}
      </button>
    </div>
  );
};

export default Index;
