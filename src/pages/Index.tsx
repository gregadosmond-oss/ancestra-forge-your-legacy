import CrestHero from "@/components/CrestHero";

const Index = () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      {/* SVG grain texture overlay */}
      <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.018]">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* Ambient amber glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '800px',
          height: '600px',
          background: 'radial-gradient(ellipse at center, hsla(30, 80%, 40%, 0.08) 0%, transparent 70%)',
        }}
      />

      {/* 3D Crest Hero */}
      <div className="relative z-10 w-full max-w-4xl">
        <CrestHero />
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center px-6 pb-16 text-center">
        <h1 className="font-display text-4xl leading-tight tracking-tight text-cream-warm sm:text-5xl md:text-6xl lg:text-7xl">
          Every family has a story
          <br />
          worth telling.
        </h1>

        <p className="mt-6 max-w-lg font-serif text-lg italic text-cream-soft sm:text-xl">
          Discover your name. Forge your crest. Pass it on.
        </p>

        <button
          className="mt-10 rounded-pill px-10 py-4 text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-400"
          style={{
            background: 'linear-gradient(135deg, #e8943a, #c47828)',
            transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #f0a848, #e8943a)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #e8943a, #c47828)';
          }}
        >
          Begin Your Journey
        </button>
      </div>
    </div>
  );
};

export default Index;
