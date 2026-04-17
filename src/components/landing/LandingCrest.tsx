/**
 * LandingCrest — AncestorsQR branded crest with a real scannable QR code
 * overlaid on the shield area.
 */
export default function LandingCrest() {
  return (
    <div className="relative select-none" style={{ width: 420, height: "auto" }}>
      {/* Crest image */}
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

      {/* Real scannable QR code — overlaid on the shield */}
      <img
        src="/qr-code.png"
        alt="Scan to visit AncestorsQR"
        style={{
          position: "absolute",
          top: "72%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "14%",
          height: "auto",
          borderRadius: 2,
          mixBlendMode: "multiply" as const,
        }}
      />
    </div>
  );
}
