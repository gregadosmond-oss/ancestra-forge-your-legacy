import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const BG = "#0d0a07";
const AMBER = "#d4a04a";
const AMBER_DIM = "#a07830";
const CREAM_WARM = "#f0e8da";
const TEXT = "#d0c4b4";
const TEXT_BODY = "#c4b8a6";
const TEXT_DIM = "#8a7e6e";
const GOLD_LINE = "rgba(212,160,74,0.12)";

const displayFont = { fontFamily: "'Libre Caslon Display', serif" };
const serifItalic = { fontFamily: "'Libre Caslon Text', serif", fontStyle: "italic" as const };
const sansFont = { fontFamily: "'DM Sans', sans-serif" };

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
  textDecoration: "none",
  display: "inline-block",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
};

const softButtonStyle: React.CSSProperties = {
  background: "rgba(232,148,58,0.06)",
  border: "1px solid rgba(232,148,58,0.18)",
  color: AMBER,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  padding: "15px 40px",
  borderRadius: 60,
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
  textDecoration: "none",
  display: "inline-block",
};

function capitalize(name: string) {
  return name
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function DeepLegacyConfirmation() {
  const [displaySurname, setDisplaySurname] = useState("");
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw =
      localStorage.getItem("deepLegacy_surname") ||
      localStorage.getItem("userSurname") ||
      "";
    setDisplaySurname(capitalize(raw));

    const summary = localStorage.getItem("deepLegacy_researchSummary") || "";
    if (summary) {
      const trimmed = summary.trim().slice(0, 300);
      setPreview(summary.length > 300 ? `${trimmed}…` : trimmed);
    }
  }, []);

  return (
    <div style={{ background: BG, minHeight: "100vh", color: TEXT }}>
      <section
        style={{
          padding: "120px 24px 80px",
          maxWidth: 760,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        {/* Top label */}
        <div
          style={{
            ...sansFont,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: AMBER_DIM,
          }}
        >
          Deep Legacy Research Complete
        </div>

        {/* Heading */}
        <h1
          style={{
            ...displayFont,
            color: CREAM_WARM,
            fontSize: "clamp(32px, 4.4vw, 42px)",
            lineHeight: 1.15,
            marginTop: 22,
            marginBottom: 16,
          }}
        >
          House {displaySurname || "—"}
        </h1>

        {/* Italic subtext */}
        <p
          style={{
            ...serifItalic,
            color: TEXT_BODY,
            fontSize: "clamp(16px, 2vw, 19px)",
            lineHeight: 1.55,
            margin: "0 auto",
            maxWidth: 560,
          }}
        >
          Your full genealogical record has been forged.
        </p>

        {/* Amber divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            margin: "36px auto",
          }}
          aria-hidden
        >
          <span style={{ width: 40, height: 1, background: AMBER }} />
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: AMBER,
              boxShadow: `0 0 12px ${AMBER}`,
            }}
          />
          <span style={{ width: 40, height: 1, background: AMBER }} />
        </div>

        {/* Research preview */}
        {preview && (
          <div
            style={{
              background: "#13100b",
              border: `1px solid ${GOLD_LINE}`,
              borderRadius: 22,
              padding: "clamp(20px, 3vw, 32px)",
              textAlign: "left",
              marginTop: 8,
            }}
          >
            <div
              style={{
                ...sansFont,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: AMBER_DIM,
                marginBottom: 14,
              }}
            >
              From Your Research
            </div>
            <p
              style={{
                ...serifItalic,
                color: TEXT,
                fontSize: 16,
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {preview}
            </p>
          </div>
        )}

        {/* Email delivery note */}
        <p
          style={{
            ...sansFont,
            color: TEXT_DIM,
            fontSize: 13,
            letterSpacing: 0.5,
            marginTop: 36,
            lineHeight: 1.6,
          }}
        >
          Your full Deep Legacy report — sources, bloodline trail, and bound
          chapters — will arrive in your inbox within 24 hours.
        </p>

        {/* CTAs */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 14,
            flexWrap: "wrap",
            marginTop: 32,
          }}
        >
          <Link
            to="/my-legacy"
            style={ctaButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 12px 40px rgba(232,148,58,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            View My Legacy
          </Link>
          <Link to="/" style={softButtonStyle}>
            Return Home
          </Link>
        </div>
      </section>
    </div>
  );
}
