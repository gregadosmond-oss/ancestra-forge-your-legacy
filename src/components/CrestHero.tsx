import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

type CrestHeroProps = {
  /** Container height in vh. Default 52. Stop 4 uses 75. */
  heightVh?: number;
};

/**
 * Crest hero — pure CSS version.
 * Mouse tilt via CSS perspective transforms (no Three.js).
 * mix-blend-mode:screen removes the dark PNG background on the dark page.
 * Parallax shadow shifts opposite to tilt for depth illusion.
 */
const CrestHero = ({ heightVh = 52 }: CrestHeroProps = {}) => {
  const crestRef  = useRef<HTMLImageElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const px =  (e.clientX / window.innerWidth)  * 2 - 1; // -1 → 1
      const py = -((e.clientY / window.innerHeight) * 2 - 1); // -1 → 1 (inverted)

      if (crestRef.current) {
        crestRef.current.style.transform =
          `perspective(800px) rotateY(${px * 12}deg) rotateX(${py * 8}deg)`;
      }
      if (shadowRef.current) {
        // Shadow drifts opposite to tilt — light appears to come from the front
        shadowRef.current.style.transform =
          `translate(calc(-50% + ${-px * 24}px), ${-py * 12}px)`;
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div
      className="relative flex w-full select-none items-center justify-center"
      style={{ height: `${heightVh}vh` }}
      aria-label="Ancestra family crest"
    >
      {/* Parallax drop shadow */}
      <div
        ref={shadowRef}
        className="pointer-events-none absolute"
        style={{
          width: '55%',
          height: '20%',
          bottom: '6%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 70%)',
          filter: 'blur(18px)',
          transition: 'transform 0.08s cubic-bezier(0.22,1,0.36,1)',
        }}
      />

      {/* Crest with enter animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ height: '88%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <img
          ref={crestRef}
          src="/crest.png"
          alt="Ancestra family crest"
          draggable={false}
          style={{
            height: '100%',
            width: 'auto',
            maxWidth: '100%',
            mixBlendMode: 'screen',
            transition: 'transform 0.08s cubic-bezier(0.22,1,0.36,1)',
          }}
        />
      </motion.div>
    </div>
  );
};

export default CrestHero;
