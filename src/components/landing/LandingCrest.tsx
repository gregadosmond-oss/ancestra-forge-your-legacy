/**
 * LandingCrest — the showcase crest on the homepage.
 * Crest image with a small QR code stamp in the bottom-right corner.
 */
const QR_URL = "/qr-code.png";

export default function LandingCrest() {
  return (
    <div className="relative select-none" style={{ width: 220, height: "auto" }}>
      {/* Base crest image */}
      <img
        src="/crest.png"
        alt="AncestorsQR crest"
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          filter: "drop-shadow(0 0 48px rgba(212,160,74,0.6))",
        }}
      />

      {/* QR code stamp — bottom-right corner */}
      <div
        className="absolute"
        style={{
          bottom: "14%",
          right: "-8px",
          width: 44,
          height: 44,
          borderRadius: 6,
          background: "#13100b",
          border: "1.5px solid rgba(212,160,74,0.6)",
          padding: 3,
          boxShadow: "0 0 12px rgba(212,160,74,0.25)",
        }}
      >
        <img
          src={QR_URL}
          alt="Scan to visit AncestorsQR"
          style={{ width: "100%", height: "100%", display: "block", borderRadius: 3 }}
        />
      </div>
    </div>
  );
}
