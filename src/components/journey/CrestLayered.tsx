type CrestLayeredProps = {
  surname: string;
};

/**
 * Layered heraldic crest built from transparent PNG assets.
 * Assets must exist at /crest-layers/{helmet,shield,lion-left,lion-right,banner}.png
 *
 * To revert to the AI-generated Ideogram crest, delete this component
 * and restore the <img src={crest.data.imageUrl}> in Stop4CrestForge.tsx.
 */
const CrestLayered = ({ surname }: CrestLayeredProps) => {
  return (
    <div
      className="relative mx-auto select-none"
      style={{ width: 360, height: 460 }}
      aria-label={`${surname} family crest`}
    >
      {/* Helmet — top center, above shield */}
      <img
        src="/crest-layers/helmet.png"
        alt=""
        draggable={false}
        className="pointer-events-none absolute"
        style={{
          width: 155,
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 30,
        }}
      />

      {/* Left lion — faces right (inward toward shield) */}
      <img
        src="/crest-layers/lion-left.png"
        alt=""
        draggable={false}
        className="pointer-events-none absolute"
        style={{
          width: 148,
          top: 110,
          left: 0,
          zIndex: 10,
        }}
      />

      {/* Right lion — mirrored so it faces left (inward toward shield) */}
      <img
        src="/crest-layers/lion-right.png"
        alt=""
        draggable={false}
        className="pointer-events-none absolute"
        style={{
          width: 148,
          top: 110,
          right: 0,
          transform: "scaleX(-1)",
          zIndex: 10,
        }}
      />

      {/* Shield — center foreground */}
      <img
        src="/crest-layers/shield.png"
        alt=""
        draggable={false}
        className="pointer-events-none absolute"
        style={{
          width: 188,
          top: 95,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 20,
        }}
      />

      {/* Banner + surname — bottom */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: 300,
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 40,
        }}
      >
        <img
          src="/crest-layers/banner.png"
          alt=""
          draggable={false}
          className="w-full"
        />
        {/* Surname text centered over the banner flat section */}
        <p
          className="absolute w-full text-center font-display font-bold uppercase tracking-widest"
          style={{
            top: "38%",
            fontSize: "0.8rem",
            color: "#1a1208",
            letterSpacing: "0.18em",
          }}
        >
          {surname}
        </p>
      </div>
    </div>
  );
};

export default CrestLayered;
