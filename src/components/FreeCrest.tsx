interface FreeCrestProps {
  surname: string;
  legacyUrl: string;
}

export default function FreeCrest({ surname, legacyUrl }: FreeCrestProps) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=1a1510&bgcolor=f0e8da&qzone=1&data=${encodeURIComponent(legacyUrl)}`;
  const display = surname.toUpperCase();

  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        width: "100%",
        maxWidth: "420px",
      }}
    >
      <img
        src="/crest.png"
        alt={`${display} family crest`}
        style={{ display: "block", width: "100%", height: "auto" }}
      />

      {/* QR code on the shield centre */}
      <div
        style={{
          position: "absolute",
          top: "32%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "22%",
          background: "rgba(240,232,218,0.92)",
          borderRadius: "6px",
          padding: "3px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
        }}
      >
        <img
          src={qrSrc}
          alt="Scan to view your legacy"
          style={{ display: "block", width: "100%", height: "auto", borderRadius: "4px" }}
        />
      </div>

      {/* Surname overlay on the banner (covers ANCESTOR text) */}
      <div
        style={{
          position: "absolute",
          bottom: "14%",
          left: "50%",
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          fontFamily: "'Libre Caslon Display', serif",
          fontSize: "clamp(11px, 3.2%, 18px)",
          fontWeight: 700,
          letterSpacing: "3px",
          color: "#1a1208",
          textShadow: "none",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {display}
      </div>
    </div>
  );
}
