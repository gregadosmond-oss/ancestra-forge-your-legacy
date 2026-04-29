import { Mic, Search, BookOpen, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLegacyPackPrice } from "@/hooks/useLegacyPackPrice";

const BG = "#0d0a07";
const BG_CARD = "#1a1510";
const AMBER = "#d4a04a";
const CREAM_WARM = "#f0e8da";
const TEXT = "#d0c4b4";
const TEXT_DIM = "#8a7e6e";
const GOLD_LINE = "#3d3020";

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
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
};

const labelStyle: React.CSSProperties = {
  ...sansFont,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 3,
  textTransform: "uppercase",
  color: AMBER,
};

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div
      className="group"
      style={{
        background: BG_CARD,
        borderRadius: 22,
        padding: 32,
        border: `1px solid ${GOLD_LINE}`,
        transition: "border-color 0.3s ease, transform 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = AMBER;
        e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = GOLD_LINE;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: "rgba(212,160,74,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: AMBER,
          marginBottom: 20,
        }}
      >
        {icon}
      </div>
      <h3 style={{ ...displayFont, color: CREAM_WARM, fontSize: 24, marginBottom: 12 }}>{title}</h3>
      <p style={{ ...sansFont, color: TEXT, fontSize: 15, lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

function Cell({ value, highlight }: { value: string; highlight?: boolean }) {
  const isCheck = value === "✓";
  const isDash = value === "—";
  return (
    <td
      style={{
        ...sansFont,
        padding: "18px 16px",
        textAlign: "center",
        color: isDash ? TEXT_DIM : isCheck ? AMBER : highlight ? CREAM_WARM : TEXT,
        fontSize: 15,
        borderBottom: `1px solid ${GOLD_LINE}`,
        background: highlight ? "rgba(212,160,74,0.04)" : "transparent",
      }}
    >
      {isCheck ? <Check size={18} style={{ display: "inline" }} /> : value}
    </td>
  );
}

export default function DeepLegacy() {
  const navigate = useNavigate();
  const legacyPrice = useLegacyPackPrice();
  const rows = [
    ["Surname meaning", "✓", "✓", "✓"],
    ["Family crest", "preview", "full", "full"],
    ["Family story", "—", "3 chapters", "12 chapters"],
    ["Family tree", "—", "3 generations", "5 generations"],
    ["AI Interview", "—", "—", "✓"],
    ["Historical research", "—", "—", "✓"],
    ["Legacy certificate", "—", "✓", "premium"],
    ["Delivery", "instant", "instant", "24 hours"],
  ];

  return (
    <div style={{ background: BG, minHeight: "100vh", color: TEXT }}>
      {/* Section 1 — Hero */}
      <section style={{ padding: "120px 24px 80px", maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
        <div style={labelStyle}>Premium Tier</div>
        <h1
          style={{
            ...displayFont,
            color: CREAM_WARM,
            fontSize: "clamp(40px, 6vw, 68px)",
            lineHeight: 1.1,
            marginTop: 20,
            marginBottom: 24,
          }}
        >
          Your Family's Full Story. Uncovered.
        </h1>
        <p
          style={{
            ...serifItalic,
            color: AMBER,
            fontSize: "clamp(18px, 2.2vw, 24px)",
            lineHeight: 1.5,
            maxWidth: 760,
            margin: "0 auto 40px",
          }}
        >
          A guided AI interview + deep historical research reveals 5 generations of your bloodline in cinematic detail.
        </p>
        <button
          onClick={() => navigate('/deep-legacy/interview')}
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
          Begin Your Deep Legacy — $79
        </button>
        <p style={{ ...sansFont, color: TEXT_DIM, fontSize: 13, marginTop: 16 }}>
          One-time payment. Delivered within 24 hours.
        </p>
      </section>

      {/* Section 2 — What's Included */}
      <section style={{ padding: "80px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={labelStyle}>What's Included</div>
          <h2 style={{ ...displayFont, color: CREAM_WARM, fontSize: "clamp(32px, 4.2vw, 48px)", marginTop: 16 }}>
            Everything Your Bloodline Holds
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
          }}
        >
          <FeatureCard
            icon={<Mic size={28} />}
            title="AI Interview"
            body="Answer 15 guided questions about your family memories, names, and places. The more you share, the richer your story."
          />
          <FeatureCard
            icon={<Search size={28} />}
            title="Deep Research"
            body="We search historical records, genealogy databases, and web archives to uncover your real ancestors."
          />
          <FeatureCard
            icon={<BookOpen size={28} />}
            title="Extended Legacy Pack"
            body="12-chapter family story, 5-generation tree, premium certificate, high-res crest, all delivered digitally."
          />
        </div>
      </section>

      {/* Section 3 — Comparison */}
      <section style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={labelStyle}>Compare Tiers</div>
          <h2 style={{ ...displayFont, color: CREAM_WARM, fontSize: "clamp(32px, 4.2vw, 48px)", marginTop: 16 }}>
            Find Your Tier
          </h2>
        </div>
        <div style={{ overflowX: "auto", borderRadius: 22, border: `1px solid ${GOLD_LINE}`, background: BG_CARD }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
            <thead>
              <tr>
                <th
                  style={{
                    ...sansFont,
                    padding: "24px 16px",
                    textAlign: "left",
                    color: TEXT_DIM,
                    fontSize: 12,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    fontWeight: 600,
                    borderBottom: `1px solid ${GOLD_LINE}`,
                  }}
                >
                  Feature
                </th>
                <th
                  style={{
                    ...displayFont,
                    padding: "24px 16px",
                    textAlign: "center",
                    color: TEXT,
                    fontSize: 18,
                    fontWeight: 400,
                    borderBottom: `1px solid ${GOLD_LINE}`,
                  }}
                >
                  Free
                </th>
                <th
                  style={{
                    ...displayFont,
                    padding: "24px 16px",
                    textAlign: "center",
                    color: CREAM_WARM,
                    fontSize: 18,
                    fontWeight: 400,
                    borderBottom: `1px solid ${GOLD_LINE}`,
                  }}
                >
                  Legacy Pack
                  <div style={{ ...sansFont, fontSize: 13, color: TEXT_DIM, marginTop: 4 }}>{legacyPrice}</div>
                </th>
                <th
                  style={{
                    ...displayFont,
                    padding: "24px 16px",
                    textAlign: "center",
                    color: AMBER,
                    fontSize: 20,
                    fontWeight: 400,
                    borderBottom: `2px solid ${AMBER}`,
                    background: "rgba(212,160,74,0.06)",
                  }}
                >
                  Deep Legacy
                  <div style={{ ...sansFont, fontSize: 13, color: AMBER, marginTop: 4 }}>$79</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([feature, free, pack, deep], i) => (
                <tr key={i}>
                  <td
                    style={{
                      ...sansFont,
                      padding: "18px 16px",
                      color: TEXT,
                      fontSize: 15,
                      borderBottom: `1px solid ${GOLD_LINE}`,
                    }}
                  >
                    {feature}
                  </td>
                  <Cell value={free} />
                  <Cell value={pack} />
                  <Cell value={deep} highlight />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4 — Final CTA */}
      <section style={{ padding: "100px 24px 140px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <h2
          style={{
            ...displayFont,
            color: CREAM_WARM,
            fontSize: "clamp(34px, 5vw, 56px)",
            lineHeight: 1.15,
            marginBottom: 36,
          }}
        >
          Ready to Uncover Your Full Legacy?
        </h2>
        <button
          onClick={() => navigate('/deep-legacy/interview')}
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
          Begin Your Deep Legacy — $79
        </button>
      </section>
    </div>
  );
}
