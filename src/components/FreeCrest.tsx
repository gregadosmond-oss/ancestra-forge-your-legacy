interface FreeCrestProps {
  surname: string;
  legacyUrl: string;
}

export default function FreeCrest({ surname, legacyUrl }: FreeCrestProps) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&color=1a1510&bgcolor=f0e8da&qzone=1&data=${encodeURIComponent(legacyUrl)}`;
  const display = surname.toUpperCase();

  return (
    <div style={{ position: "relative", display: "inline-block", width: "100%", maxWidth: "420px" }}>
      <img
        src="/crest.png"
        alt={`${display} family crest`}
        style={{ display: "block", width: "100%", height: "auto" }}
      />

      {/* QR stamp — small, centered on shield */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "13%",
          background: "rgba(240,232,218,0.93)",
          borderRadius: "3px",
          padding: "2px",
          boxShadow: "0 1px 5px rgba(0,0,0,0.45)",
        }}
      >
        <img
          src={qrSrc}
          alt="Scan to view your legacy"
          style={{ display: "block", width: "100%", height: "auto", borderRadius: "2px" }}
        />
      </div>

      {/* Banner surname — parchment bg covers ANCESTOR text, shows user's name */}
      <div
        style={{
          position: "absolute",
          bottom: "13%",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(195,183,163,0.96)",
          padding: "1px 10px 2px",
          whiteSpace: "nowrap",
          fontFamily: "'Libre Caslon Display', serif",
          fontSize: "clamp(12px, 3.5vw, 19px)",
          fontWeight: 700,
          letterSpacing: "3px",
          color: "#1a1208",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {display}
      </div>
    </div>
  );
}
