import { useRef, useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import EntryPortal from "@/components/EntryPortal";

const SESSION_KEY = "ancestra_entered";

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isLanding = location.pathname === "/";
  const journeyMatch = location.pathname.match(/^\/journey\/(\d+)$/);
  const stepNumber = journeyMatch ? journeyMatch[1] : null;
  const isJourneyStep1 = location.pathname === "/journey/1";

  const showBack = !isLanding && !isJourneyStep1;
  const showStepCounter = !!stepNumber;

  // ── Portal + audio state ──
  const [hasEntered, setHasEntered] = useState<boolean>(
    () => sessionStorage.getItem(SESSION_KEY) === "1"
  );
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync mute state to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleEnter = () => {
    // Scroll to top so hero is visible when portal fades out
    window.scrollTo({ top: 0, behavior: "instant" });
    // Create and start audio on user gesture (satisfies browser autoplay policy)
    if (!audioRef.current) {
      const audio = new Audio("/starfields-within.mp3");
      audio.loop = true;
      audio.volume = 0.5;
      audio.muted = isMuted;
      audio.play().catch(() => {/* autoplay blocked — silent fail */});
      audioRef.current = audio;
    }
    sessionStorage.setItem(SESSION_KEY, "1");
    setHasEntered(true);
  };

  const toggleMute = () => setIsMuted((m) => !m);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── ENTRY PORTAL (fullscreen overlay) ── */}
      <AnimatePresence>
        {!hasEntered && <EntryPortal onEnter={handleEnter} />}
      </AnimatePresence>

      {/* ── GLOBAL NAVBAR ── */}
      <nav
        className="relative w-full text-center"
        style={{
          background: "#13100b",
          borderBottom: "1px solid #3d3020",
        }}
      >
        {/* Back button — top-left */}
        {showBack && (
          <button
            aria-label="Go back"
            onClick={() => navigate(-1)}
            className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-300"
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
        )}

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
            to="/gifts"
            className="text-text-dim transition-colors duration-200 hover:text-amber"
            activeClassName="text-amber"
          >
            Gifts
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

      {/* ── PAGE CONTENT ── */}
      <div className="flex-1">
        <Outlet />
      </div>

      {/* ── SOUND TOGGLE (fixed bottom-right, only after portal dismissed) ── */}
      {hasEntered && (
        <button
          aria-label="Toggle sound"
          onClick={toggleMute}
          className="fixed bottom-5 right-5 z-40 flex items-center justify-center transition-opacity duration-200 hover:opacity-70"
          style={{
            width: "32px",
            height: "32px",
          }}
        >
          {isMuted ? (
            // Speaker muted icon
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4a04a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            // Speaker on icon
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4a04a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
};

export default AppLayout;
