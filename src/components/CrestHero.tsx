type CrestHeroProps = {
  /** Container height in vh. Default 52. Stop 4 uses 75. */
  heightVh?: number;
};

const CrestHero = ({ heightVh = 52 }: CrestHeroProps = {}) => {
  return (
    <div
      className="relative flex w-full select-none items-center justify-center"
      style={{ height: `${heightVh}vh` }}
      aria-label="AncestorsQR family crest"
    >
      {/* Soft amber glow behind crest */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        style={{
          background: 'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(212,160,74,0.10) 0%, transparent 70%)',
        }}
      />

      {/* Crest — fully static */}
      <img
        src="/crest.png"
        alt="AncestorsQR family crest"
        draggable={false}
        style={{
          height: '88%',
          width: 'auto',
          maxWidth: '100%',
          display: 'block',
        }}
      />
    </div>
  );
};

export default CrestHero;
