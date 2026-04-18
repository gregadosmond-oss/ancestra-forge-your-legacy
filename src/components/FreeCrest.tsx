interface FreeCrestProps {
  surname: string;
  legacyUrl: string;
}

export default function FreeCrest({ surname, legacyUrl }: FreeCrestProps) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&color=1a1510&bgcolor=f0e8da&qzone=1&data=${encodeURIComponent(legacyUrl)}`;

  return (
    <div style={{ position: "relative", display: "inline-block", width: "100%", maxWidth: "420px" }}>
      <img
        src="/crest.png"
        alt={`${surname.toUpperCase()} family crest`}
        style={{ display: "block", width: "100%", height: "auto" }}
      />

      {/* QR stamp centered on the silver shield */}
      <div
        style={{
          position: "absolute",
          top: "58%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "11%",
          background: "rgba(240,232,218,0.93)",
          borderRadius: "2px",
          padding: "1px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
        }}
      >
        <img
          src={qrSrc}
          alt="Scan to view your legacy"
          style={{ display: "block", width: "100%", height: "auto", borderRadius: "1px" }}
        />
      </div>
    </div>
  );
}
