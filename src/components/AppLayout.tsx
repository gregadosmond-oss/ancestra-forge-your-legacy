import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { toggleAmbientPlayback } from "@/lib/ambientAudio";

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(true);

  const isLanding = location.pathname === "/";
  const journeyMatch = location.pathname.match(/^\/journey\/(\d+)$/);
  const stepNumber = journeyMatch ? journeyMatch[1] : null;
  const isJourneyStep1 = location.pathname === "/journey/1";

  const showBack = !isLanding;
  const showStepCounter = !!stepNumber;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── GLOBAL NAVBAR ── */}
      <nav
        className="relative w-full text-center"
        style={{
          background: "#13100b",
          borderBottom: "1px solid #3d3020",
        }}
      >
        {/* Step counter — top-right (journey only) */}
        {showStepCounter && (
          <div
            className="absolute right-5 top-1/2 -translate-y-1/2 font-sans text-[10px] uppercase tracking-[3px]"
            style={{ color: "#a07830" }}
          >
            {String(stepNumber).padStart(2, "0")} / 06
          </div>
        )}

        {/* Logo */}
        <Link
          to="/"
          className="inline-block pt-3 font-display text-xl uppercase"
          style={{ color: "#e8b85c", letterSpacing: "3px" }}
        >
          Ancestra
        </Link>

        {/* Links row */}
        <div
          className="flex items-center justify-center gap-8 px-8 pb-3 pt-2 font-sans text-[10px] font-semibold uppercase"
          style={{
            letterSpacing: "2px",
            borderTop: "1px solid #2a2018",
            marginTop: "10px",
          }}
        >
          <NavLink
            to="/tools"
            className="text-text-dim transition-colors duration-200 hover:text-amber"
            activeClassName="text-amber"
          >
            Free Tools
          </NavLink>
          <NavLink
            to="/shop"
            className="text-text-dim transition-colors duration-200 hover:text-amber"
            activeClassName="text-amber"
          >
            Shop
          </NavLink>
          <NavLink
            to="/pricing"
            className="text-text-dim transition-colors duration-200 hover:text-amber"
            activeClassName="text-amber"
          >
            Pricing
          </NavLink>
          <NavLink
            to="/about"
            className="text-text-dim transition-colors duration-200 hover:text-amber"
            activeClassName="text-amber"
          >
            About
          </NavLink>
          <Link
            to="/journey"
            className="transition-colors duration-200 hover:opacity-80"
            style={{ color: "#e8943a" }}
          >
            Begin Journey →
          </Link>
        </div>
      </nav>

      {/* ── BACK BUTTON — below navbar ── */}
      {showBack && (
        <div className="px-5 pt-4">
          <button
            aria-label="Go back"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center transition-all duration-300"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              border: "1px solid rgba(212,160,74,0.2)",
              background: "rgba(212,160,74,0.04)",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d4a04a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M5 12l7-7M5 12l7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* ── PAGE CONTENT ── */}
      <div className="flex-1">
        <Outlet />
      </div>

      {/* ── MUSIC PAUSE/PLAY (fixed bottom-right) ── */}
      <button
        aria-label={isPlaying ? "Pause music" : "Play music"}
        onClick={() => setIsPlaying(toggleAmbientPlayback())}
        className="fixed bottom-5 right-5 z-40 flex items-center justify-center transition-opacity duration-200 hover:opacity-70"
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          border: "1px solid rgba(212,160,74,0.25)",
          background: "rgba(13,10,7,0.7)",
        }}
      >
        {isPlaying ? (
          // Pause icon
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#d4a04a">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          // Play icon
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#d4a04a">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default AppLayout;
