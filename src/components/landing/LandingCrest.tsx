/**
 * LandingCrest — the showcase crest on the homepage.
 * Uses the custom AncestorsQR crest with QR code built into the shield
 * and ANCESTOR banner at the bottom.
 */
export default function LandingCrest() {
  return (
    <img
      src="/crest.png"
      alt="AncestorsQR crest"
      style={{
        width: "220px",
        height: "auto",
        filter: "drop-shadow(0 0 48px rgba(212,160,74,0.6))",
      }}
    />
  );
}
