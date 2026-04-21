import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const BG = "#0d0a07";
const BG_CARD = "#1a1510";
const AMBER = "#d4a04a";
const CREAM_WARM = "#f0e8da";
const TEXT = "#d0c4b4";
const TEXT_DIM = "#8a7e6e";
const GOLD_LINE = "rgba(212,160,74,0.12)";

const displayFont = { fontFamily: "'Libre Caslon Display', serif" };
const serifItalic = { fontFamily: "'Libre Caslon Text', serif", fontStyle: "italic" as const };
const sansFont = { fontFamily: "'DM Sans', sans-serif" };

const labelStyle: React.CSSProperties = {
  ...sansFont,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 3,
  textTransform: "uppercase",
  color: AMBER,
};

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
  display: "inline-block",
  textDecoration: "none",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
};

type Source = { title?: string; url?: string };
type ResearchData = {
  surname?: string;
  country?: string;
  researchSummary?: string;
  sources?: Source[];
};

// Render the researchSummary string. Treat lines starting with "## " as
// amber subheadings, "- " as bullets, blank lines as paragraph breaks.
function RenderedSummary({ text }: { text: string }) {
  const blocks = useMemo(() => {
    const lines = text.split("\n");
    const out: Array<
      | { type: "heading"; content: string }
      | { type: "bullet"; content: string }
      | { type: "paragraph"; content: string }
    > = [];
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith("## ")) {
        out.push({ type: "heading", content: line.slice(3).trim() });
      } else if (line.startsWith("- ")) {
        out.push({ type: "bullet", content: line.slice(2).trim() });
      } else {
        out.push({ type: "paragraph", content: line });
      }
    }
    return out;
  }, [text]);

  // Render bold markdown **text** as emphasis
  const renderInline = (s: string) => {
    const parts = s.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith("**") && p.endsWith("**") ? (
        <strong key={i} style={{ color: CREAM_WARM, fontWeight: 600 }}>
          {p.slice(2, -2)}
        </strong>
      ) : (
        <span key={i}>{p}</span>
      )
    );
  };

  return (
    <div>
      {blocks.map((b, i) => {
        if (b.type === "heading") {
          return (
            <h3
              key={i}
              style={{
                ...displayFont,
                color: AMBER,
                fontSize: 20,
                marginTop: i === 0 ? 0 : 28,
                marginBottom: 12,
                lineHeight: 1.3,
              }}
            >
              {b.content}
            </h3>
          );
        }
        if (b.type === "bullet") {
          return (
            <div
              key={i}
              style={{
                ...sansFont,
                color: TEXT,
                fontSize: 15,
                lineHeight: 1.7,
                paddingLeft: 18,
                position: "relative",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 11,
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: AMBER,
                }}
              />
              {renderInline(b.content)}
            </div>
          );
        }
        return (
          <p
            key={i}
            style={{
              ...sansFont,
              color: TEXT,
              fontSize: 15,
              lineHeight: 1.7,
              marginBottom: 14,
            }}
          >
            {renderInline(b.content)}
          </p>
        );
      })}
    </div>
  );
}

function FeatureChip({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        ...sansFont,
        background: "rgba(212,160,74,0.08)",
        border: `1px solid ${GOLD_LINE}`,
        color: AMBER,
        padding: "10px 18px",
        borderRadius: 60,
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: 0.5,
      }}
    >
      {children}
    </div>
  );
}

export default function DeepLegacyResults() {
  const [research, setResearch] = useState<ResearchData | null>(null);
  const [surname, setSurname] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("deepLegacyResearch");
      const answersRaw = localStorage.getItem("deepLegacyAnswers");
      const answers: Record<string, string> = answersRaw ? JSON.parse(answersRaw) : {};
      const data: ResearchData | null = raw ? JSON.parse(raw) : null;

      const sn =
        (data?.surname && data.surname.trim()) ||
        (answers.surname && answers.surname.trim()) ||
        localStorage.getItem("userSurname") ||
        "";

      setResearch(data);
      setSurname(sn);
    } catch {
      setResearch(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  if (!loaded) return null;

  // Empty / error state
  if (!research || !research.researchSummary) {
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
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <div style={labelStyle}>Deep Legacy</div>
          <h1
            style={{
              ...displayFont,
              color: CREAM_WARM,
              fontSize: "clamp(28px, 4vw, 40px)",
              marginTop: 16,
              marginBottom: 16,
              lineHeight: 1.2,
            }}
          >
            No Research Found
          </h1>
          <p style={{ ...sansFont, color: TEXT, fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
            No research found. Please complete the interview first.
          </p>
          <Link
            to="/deep-legacy/interview"
            style={ctaButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(232,148,58,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Start Interview →
          </Link>
        </div>
      </div>
    );
  }

  const sources = research.sources || [];

  return (
    <div style={{ background: BG, minHeight: "100vh", color: TEXT }}>
      {/* 1. Header */}
      <section style={{ padding: "100px 24px 60px", maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
        <div style={labelStyle}>Your Deep Legacy</div>
        <h1
          style={{
            ...displayFont,
            color: CREAM_WARM,
            fontSize: "clamp(32px, 5vw, 52px)",
            lineHeight: 1.1,
            marginTop: 20,
            marginBottom: 20,
          }}
        >
          The {surname || "Family"} Legacy. Uncovered.
        </h1>
        <p
          style={{
            ...serifItalic,
            color: AMBER,
            fontSize: "clamp(17px, 2vw, 22px)",
            lineHeight: 1.5,
          }}
        >
          Here is what we found in the historical record.
        </p>
      </section>

      {/* 2. Research summary card */}
      <section style={{ padding: "20px 24px 60px", maxWidth: 880, margin: "0 auto" }}>
        <div
          style={{
            background: BG_CARD,
            border: `1px solid ${GOLD_LINE}`,
            borderRadius: 22,
            padding: "40px clamp(24px, 4vw, 40px)",
          }}
        >
          <div style={{ ...labelStyle, marginBottom: 24 }}>Historical Findings</div>

          <RenderedSummary text={research.researchSummary} />

          {sources.length > 0 && (
            <div style={{ marginTop: 40, paddingTop: 28, borderTop: `1px solid ${GOLD_LINE}` }}>
              <div style={{ ...labelStyle, fontSize: 11, marginBottom: 16 }}>Sources</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {sources.map((s, i) => (
                  <li key={i} style={{ marginBottom: 8 }}>
                    {s.url ? (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          ...sansFont,
                          color: TEXT_DIM,
                          fontSize: 13,
                          textDecoration: "none",
                          lineHeight: 1.5,
                          transition: "color 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = AMBER;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = TEXT_DIM;
                        }}
                      >
                        {s.title || s.url} →
                      </a>
                    ) : (
                      <span style={{ ...sansFont, color: TEXT_DIM, fontSize: 13 }}>{s.title}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* 3. What happens next */}
      <section style={{ padding: "60px 24px", maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
        <h2
          style={{
            ...displayFont,
            color: CREAM_WARM,
            fontSize: "clamp(28px, 4vw, 40px)",
            lineHeight: 1.2,
            marginBottom: 20,
          }}
        >
          Your Full Legacy Book is Being Written
        </h2>
        <p
          style={{
            ...sansFont,
            color: TEXT,
            fontSize: 16,
            lineHeight: 1.7,
            maxWidth: 640,
            margin: "0 auto 36px",
          }}
        >
          Our AI is now weaving your interview answers and historical research into a 12-chapter
          family story. You'll receive it by email within 24 hours.
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <FeatureChip>12-Chapter Story</FeatureChip>
          <FeatureChip>5-Generation Tree</FeatureChip>
          <FeatureChip>Premium Certificate</FeatureChip>
        </div>
      </section>

      {/* 4. CTA */}
      <section style={{ padding: "60px 24px 140px", maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
        <h2
          style={{
            ...displayFont,
            color: CREAM_WARM,
            fontSize: "clamp(26px, 3.6vw, 36px)",
            lineHeight: 1.25,
            marginBottom: 32,
          }}
        >
          Ready to receive your complete legacy?
        </h2>
        <Link
          to="/deep-legacy/checkout"
          style={ctaButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 12px 40px rgba(232,148,58,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Complete Your Order — $79
        </Link>
        <p style={{ ...sansFont, color: TEXT_DIM, fontSize: 13, marginTop: 16 }}>
          Secure checkout · One-time payment · Delivered by email
        </p>
      </section>
    </div>
  );
}
