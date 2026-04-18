interface FreeCrestProps {
  surname: string;
  legacyUrl: string;
}

export default function FreeCrest({ surname, legacyUrl }: FreeCrestProps) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&color=1a1510&bgcolor=ffffff&qzone=1&data=${encodeURIComponent(legacyUrl)}`;

  return (
    <div style={{ position: "relative", display: "inline-block", width: "100%", maxWidth: "420px" }}>
      <img
        src="/crest.png"
        alt={`${surname.toUpperCase()} family crest`}
        style={{ display: "block", width: "100%", height: "auto" }}
      />

      {/* QR stamp — multiply blend removes white, dark modules show on silver shield */}
      <img
        src={qrSrc}
        alt="Scan to view your legacy"
        style={{
          position: "absolute",
          top: "55%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "11%",
          height: "auto",
          mixBlendMode: "multiply",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
