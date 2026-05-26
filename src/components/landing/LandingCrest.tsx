/**
 * LandingCrest — AncestorsQR branded crest (QR code is baked into the artwork).
 */
import crestImage from "@/assets/ancestorsqr-crest.png";

export default function LandingCrest() {
  return (
    <div className="relative select-none" style={{ width: 420, height: "auto" }}>
      <img
        src={crestImage}
        alt="AncestorsQR crest"
        width={420}
        height={420}
        fetchPriority="high"
        decoding="async"
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          filter: "drop-shadow(0 0 48px rgba(212,160,74,0.6))",
        }}
      />
    </div>
  );
}
