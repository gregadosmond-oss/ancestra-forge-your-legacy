/**
 * LandingCrest — the showcase crest on the homepage.
 * Composites the base crest image with an "ANCESTOR" banner
 * and a gold QR code that links to ancestorsqr.com.
 */
const QR_URL =
  "https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=d4a04a&bgcolor=00000000&qzone=1&data=https%3A%2F%2Fwww.ancestorsqr.com";

export default function LandingCrest() {
  return (
    <div
      className="relative select-none"
      style={{ width: 220, height: 260 }}
    >
      {/* Base crest image */}
      <img
        src="/crest.png"
        alt="AncestorsQR crest"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          filter: "drop-shadow(0 0 48px rgba(212,160,74,0.6))",
        }}
      />

      {/* QR code — centred over the shield area */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: "28%",
          width: 64,
          height: 64,
          borderRadius: 8,
          background: "rgba(13,10,7,0.82)",
          border: "1.5px solid rgba(212,160,74,0.5)",
          padding: 4,
          boxShadow: "0 0 16px rgba(212,160,74,0.3)",
        }}
      >
        <img
          src={QR_URL}
          alt="Scan to visit AncestorsQR"
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </div>

      {/* ANCESTOR banner — bottom of crest */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center"
        style={{ width: "100%" }}
      >
        {/* Banner ribbon */}
        <div
          style={{
            background: "linear-gradient(135deg, #a07830, #d4a04a, #a07830)",
            borderRadius: 4,
            padding: "4px 20px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.6)",
          }}
        >
          <span
            className="font-display font-bold uppercase"
            style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#1a1208" }}
          >
            Ancestor
          </span>
        </div>
        {/* Scan hint */}
        <p
          className="mt-1 font-sans uppercase"
          style={{ fontSize: "7px", letterSpacing: "2px", color: "rgba(212,160,74,0.5)" }}
        >
          Scan to discover yours
        </p>
      </div>
    </div>
  );
}
