import { useEffect, useState } from "react";
import StripeEmbeddedCheckout from "@/components/StripeEmbeddedCheckout";

const BG = "#0d0a07";
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
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
};

function TrustBadge({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        ...sansFont,
        background: "rgba(212,160,74,0.06)",
        border: `1px solid ${GOLD_LINE}`,
        color: TEXT,
        padding: "12px 20px",
        borderRadius: 60,
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: 0.5,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}

export default function DeepLegacyCheckout() {
  const [surname, setSurname] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Prefer the Deep Legacy-specific keys, fall back to the legacy userSurname key
      const sn =
        localStorage.getItem("deepLegacy_surname") ||
        localStorage.getItem("userSurname") ||
        "";
      const co = localStorage.getItem("deepLegacy_country") || "";
      setSurname(sn);
      setCountry(co);
    }
    // Brief loading state to give the checkout iframe time to settle
    const t = setTimeout(() => setMounted(true), 250);
    return () => clearTimeout(t);
  }, []);

  // Listen for global errors from the embedded checkout fetch
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      const msg = String(e.reason?.message || e.reason || "");
      if (msg.toLowerCase().includes("checkout")) {
        setHasError(true);
      }
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  const returnUrl = `${window.location.origin}/deep-legacy/confirmation?session_id={CHECKOUT_SESSION_ID}`;

  return (
    <div style={{ background: BG, minHeight: "100vh", color: TEXT }}>
      {/* Header */}
      <section
        style={{
          padding: "100px 24px 40px",
          maxWidth: 880,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <div style={labelStyle}>Secure Checkout</div>
        <h1
          style={{
            ...displayFont,
            color: CREAM_WARM,
            fontSize: "clamp(32px, 4.6vw, 48px)",
            lineHeight: 1.15,
            marginTop: 18,
            marginBottom: 18,
          }}
        >
          Complete Your Deep Legacy — $79
        </h1>
        <p
          style={{
            ...serifItalic,
            color: AMBER,
            fontSize: "clamp(16px, 2vw, 20px)",
            lineHeight: 1.5,
            maxWidth: 640,
            margin: "0 auto",
          }}
        >
          One-time payment. Your full legacy delivered by email within 24 hours.
        </p>
        {surname && (
          <p style={{ ...sansFont, color: TEXT_DIM, fontSize: 13, marginTop: 16, letterSpacing: 1 }}>
            For the {surname} family
          </p>
        )}
      </section>

      {/* Checkout */}
      <section style={{ padding: "20px 24px 40px", maxWidth: 720, margin: "0 auto" }}>
        {!mounted ? (
          <LoadingState />
        ) : hasError ? (
          <ErrorState
            onRetry={() => {
              setHasError(false);
              setReloadKey((k) => k + 1);
            }}
          />
        ) : (
          <div
            key={reloadKey}
            style={{
              background: "#13100b",
              border: `1px solid ${GOLD_LINE}`,
              borderRadius: 22,
              padding: "clamp(16px, 3vw, 28px)",
              minHeight: 360,
            }}
          >
            <StripeEmbeddedCheckout
              priceId="deep_legacy_once"
              returnUrl={returnUrl}
              surname={surname}
              productType="deep_legacy"
              shippingAddress={country ? { country } : undefined}
            />
          </div>
        )}
      </section>

      {/* Trust badges */}
      <section style={{ padding: "20px 24px 120px", maxWidth: 880, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <TrustBadge>🔒 Secure Payment</TrustBadge>
          <TrustBadge>✉ Delivered by Email</TrustBadge>
          <TrustBadge>↩ Satisfaction Guaranteed</TrustBadge>
        </div>
      </section>

      <style>{`
        @keyframes amberPulseSpin {
          0%, 100% {
            transform: scale(1);
            opacity: 0.85;
            box-shadow: 0 0 30px rgba(232,148,58,0.18);
          }
          50% {
            transform: scale(1.08);
            opacity: 1;
            box-shadow: 0 0 60px rgba(232,148,58,0.32);
          }
        }
      `}</style>
    </div>
  );
}

function LoadingState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        background: "#13100b",
        border: `1px solid ${GOLD_LINE}`,
        borderRadius: 22,
        minHeight: 360,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,148,58,0.25), rgba(232,148,58,0))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "amberPulseSpin 1.8s ease-in-out infinite",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: AMBER,
            boxShadow: `0 0 20px ${AMBER}`,
          }}
        />
      </div>
      <p style={{ ...sansFont, color: TEXT, fontSize: 15, letterSpacing: 0.5 }}>
        Preparing your secure checkout...
      </p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "60px 24px",
        background: "#13100b",
        border: `1px solid ${GOLD_LINE}`,
        borderRadius: 22,
      }}
    >
      <p
        style={{
          ...displayFont,
          color: CREAM_WARM,
          fontSize: 22,
          marginBottom: 24,
        }}
      >
        Unable to load checkout. Please try again.
      </p>
      <button
        onClick={onRetry}
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
        Try Again
      </button>
    </div>
  );
}
