import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { toggleAmbientPlayback } from "@/lib/ambientAudio";
import { useAuth } from "@/hooks/useAuth";
import AuthGate from "@/components/AuthGate";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(true);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const { user, loading } = useAuth();

  const isLanding = location.pathname === "/";
  const journeyMatch = location.pathname.match(/^\/journey\/(\d+)$/);
  const stepNumber = journeyMatch ? journeyMatch[1] : null;
  const isJourneyStep1 = location.pathname === "/journey/1";

  const showBack = !isLanding;
  const showStepCounter = !!stepNumber;

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Sign out failed. Please try again.");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── GLOBAL NAVBAR ── */}
      <nav
        className="sticky top-0 z-50 w-full text-center"
        style={{
          background: "rgba(19,16,11,0.97)",
          borderBottom: "1px solid #3d3020",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
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
          AncestorsQR
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
            className="transition-colors duration-200 hover:text-amber"
            activeClassName="text-amber"
            style={{ color: "#c4b8a6" }}
          >
            Free Tools
          </NavLink>
          <NavLink
            to="/pricing"
            className="transition-colors duration-200 hover:text-amber"
            activeClassName="text-amber"
            style={{ color: "#c4b8a6" }}
          >
            Pricing
          </NavLink>
          <NavLink
            to="/about"
            className="transition-colors duration-200 hover:text-amber"
            activeClassName="text-amber"
            style={{ color: "#c4b8a6" }}
          >
            Our Story
          </NavLink>
          {loading ? null : user ? (
            <>
              <NavLink
                to="/my-legacy"
                className="transition-colors duration-200 hover:text-amber"
                activeClassName="text-amber"
                style={{ color: "#e8b85c" }}
              >
                My Legacy
              </NavLink>
              <button
                onClick={handleSignOut}
                className="transition-colors duration-200 hover:text-amber"
                style={{ color: "#c4b8a6" }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAuthGate(true)}
              className="transition-colors duration-200 hover:text-amber"
              style={{ color: "#c4b8a6" }}
            >
              Sign In
            </button>
          )}
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
        <div className="relative z-40 px-5 pt-4">
          <button
            aria-label="Go back"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center transition-all duration-300"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              border: "1px solid rgba(212,160,74,0.5)",
              background: "rgba(212,160,74,0.1)",
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

      {/* ── MUSIC PAUSE/PLAY (fixed bottom-right, hidden on landing where Index has its own) ── */}
      {!isLanding && <button
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
      </button>}

      {/* AuthGate Modal */}
      {showAuthGate && (
        <AuthGate
          onAuthenticated={() => setShowAuthGate(false)}
          onClose={() => setShowAuthGate(false)}
        />
      )}
    </div>
  );
};

export default AppLayout;
