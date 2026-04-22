import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const BG = "#0d0a07";
const AMBER = "#d4a04a";
const HONEY = "#e8943a";
const CREAM_WARM = "#f0e8da";
const TEXT = "#d0c4b4";
const TEXT_DIM = "#8a7e6e";

const displayFont = { fontFamily: "'Libre Caslon Display', serif" };
const sansFont = { fontFamily: "'DM Sans', sans-serif" };

const STATUS_MESSAGES = [
  "Searching historical records...",
  "Tracing your bloodline...",
  "Uncovering your ancestors...",
  "Weaving your family story...",
  "Preparing your legacy...",
];

const SUPABASE_URL = "https://fjtkjbnvpobawqqkzrst.supabase.co";

const ctaButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #e8943a, #c47828)",
  color: "#1a1208",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  padding: "16px 40px",
  borderRadius: 60,
  border: "none",
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
};

export default function DeepLegacyProcessing() {
  const navigate = useNavigate();
  const [statusIndex, setStatusIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const inFlightRef = useRef(false);

  // Rotating status messages
  useEffect(() => {
    if (error) return;
    const id = setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 3000);
    return () => clearInterval(id);
  }, [error]);

  const runResearch = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setError(null);

    try {
      const surname =
        (localStorage.getItem("deepLegacy_surname") || "").trim() ||
        (localStorage.getItem("userSurname") || "").trim();
      const country = (localStorage.getItem("deepLegacy_country") || "").trim();

      if (!surname) {
        throw new Error("No surname found. Please complete the interview first.");
      }

      const savedAnswers = localStorage.getItem("deepLegacy_interviewAnswers");
      const interviewAnswers = savedAnswers ? JSON.parse(savedAnswers) : [];

      const body = { surname, country, interviewAnswers };

      const res = await fetch(`${SUPABASE_URL}/functions/v1/deep-legacy-research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`Research failed (${res.status})`);
      }

      const data = await res.json();
      localStorage.setItem("deepLegacyResearch", JSON.stringify(data));

      // Persist interview answers to deep_legacy_results so the post-purchase
      // webhook can use them to generate the 12-chapter book.
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("deep_legacy_results").upsert(
            {
              user_id: user.id,
              surname: surname.trim().toLowerCase(),
              country: country || null,
              interview_answers: interviewAnswers,
            },
            { onConflict: "user_id" }
          );
        }
      } catch (saveErr) {
        console.warn("Failed to save interview answers:", saveErr);
      }

      navigate("/deep-legacy/results");
    } catch (err) {
      setError((err as Error).message || "Unknown error");
    } finally {
      inFlightRef.current = false;
    }
  }, [navigate]);

  useEffect(() => {
    runResearch();
  }, [runResearch, attempt]);

  return (
    <div
      style={{
        background: BG,
        minHeight: "100vh",
        color: TEXT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: 560, width: "100%", textAlign: "center" }}>
        {/* Pulsing crest icon */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 48,
          }}
        >
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "radial-gradient(circle, rgba(232,148,58,0.15), rgba(232,148,58,0))",
              animation: error ? "none" : "amberPulse 2.4s ease-in-out infinite",
            }}
          >
            <svg
              width="72"
              height="84"
              viewBox="0 0 72 84"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                filter: error ? "none" : `drop-shadow(0 0 18px ${HONEY})`,
              }}
            >
              <path
                d="M36 4 L66 14 L66 42 C66 60 52 74 36 80 C20 74 6 60 6 42 L6 14 Z"
                stroke={AMBER}
                strokeWidth="2"
                fill="rgba(212,160,74,0.06)"
              />
              <path
                d="M36 24 L36 56 M24 36 L48 36"
                stroke={AMBER}
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.7"
              />
            </svg>
          </div>
        </div>

        {error ? (
          <>
            <h1
              style={{
                ...displayFont,
                color: CREAM_WARM,
                fontSize: "clamp(28px, 4vw, 40px)",
                lineHeight: 1.2,
                marginBottom: 16,
              }}
            >
              Something Went Wrong
            </h1>
            <p
              style={{
                ...sansFont,
                color: TEXT,
                fontSize: 16,
                lineHeight: 1.6,
                marginBottom: 32,
              }}
            >
              Something went wrong uncovering your legacy. Please try again.
            </p>
            <button
              style={ctaButtonStyle}
              onClick={() => setAttempt((a) => a + 1)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 40px rgba(232,148,58,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Try Again
            </button>
          </>
        ) : (
          <>
            <h1
              style={{
                ...displayFont,
                color: CREAM_WARM,
                fontSize: "clamp(30px, 4.4vw, 44px)",
                lineHeight: 1.2,
                marginBottom: 20,
              }}
            >
              Your Legacy is Being Uncovered
            </h1>
            <p
              style={{
                ...sansFont,
                color: TEXT_DIM,
                fontSize: 14,
                marginBottom: 40,
              }}
            >
              This takes about 30 seconds. Do not close this page.
            </p>

            {/* Rotating status */}
            <div
              key={statusIndex}
              style={{
                ...sansFont,
                fontStyle: "italic",
                color: TEXT_DIM,
                fontSize: 16,
                minHeight: 28,
                animation: "fadeInStatus 0.6s ease",
              }}
            >
              {STATUS_MESSAGES[statusIndex]}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes amberPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 40px rgba(232,148,58,0.15), 0 0 80px rgba(232,148,58,0.08);
          }
          50% {
            transform: scale(1.06);
            box-shadow: 0 0 70px rgba(232,148,58,0.28), 0 0 140px rgba(232,148,58,0.12);
          }
        }
        @keyframes fadeInStatus {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
