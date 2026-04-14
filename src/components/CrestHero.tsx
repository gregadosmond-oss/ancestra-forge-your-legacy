import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  DynamicDrawUsage,
  Mesh,
  Points,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
} from 'three';

const MAX_TILT_RAD = (15 * Math.PI) / 180; // 15 degrees

/**
 * Vertex shader — passes UVs to the fragment stage.
 */
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Fragment shader — chroma-keys the dark textured background of the source
 * PNG by combining a saturation test (keep anything colourful) with a
 * luminance test (keep anything very bright, e.g. the white banner). This
 * lets the crest float cleanly over the page background without needing a
 * pre-cut transparent PNG.
 */
const fragmentShader = /* glsl */ `
  uniform sampler2D map;
  varying vec2 vUv;
  void main() {
    vec4 tex = texture2D(map, vUv);
    float mx = max(max(tex.r, tex.g), tex.b);
    float mn = min(min(tex.r, tex.g), tex.b);
    float sat = mx > 0.001 ? (mx - mn) / mx : 0.0;
    float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    float satAlpha = smoothstep(0.05, 0.18, sat);
    float lumAlpha = smoothstep(0.32, 0.50, lum);
    float alpha = max(satAlpha, lumAlpha);
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(tex.rgb, alpha);
  }
`;

/**
 * Crest — renders the family crest as a tilting plane that tracks the
 * user's cursor anywhere on the page (not just over the canvas).
 */
function Crest({
  pointerRef,
}: {
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const meshRef = useRef<Mesh>(null);
  const initializedRef = useRef(false);
  const texture = useLoader(TextureLoader, '/crest.png');
  texture.colorSpace = SRGBColorSpace;

  const aspect = texture.image
    ? texture.image.width / texture.image.height
    : 1;
  const planeHeight = 4.3;
  const planeWidth = planeHeight * aspect;

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { map: { value: texture } },
        vertexShader,
        fragmentShader,
        transparent: true,
        side: DoubleSide,
      }),
    [texture],
  );

  useFrame(() => {
    if (!meshRef.current) return;
    const targetRotY = pointerRef.current.x * MAX_TILT_RAD;
    const targetRotX = -pointerRef.current.y * MAX_TILT_RAD;
    if (!initializedRef.current) {
      meshRef.current.rotation.y = targetRotY;
      meshRef.current.rotation.x = targetRotX;
      initializedRef.current = true;
      return;
    }
    meshRef.current.rotation.y +=
      (targetRotY - meshRef.current.rotation.y) * 0.06;
    meshRef.current.rotation.x +=
      (targetRotX - meshRef.current.rotation.x) * 0.06;
  });

  return (
    <mesh ref={meshRef} material={material}>
      <planeGeometry args={[planeWidth, planeHeight]} />
    </mesh>
  );
}

/**
 * Embers — rising spark particles that drift up past the crest, cycling
 * back to the bottom when they escape the top. Gives a forge-fire feel
 * without blocking the crest itself.
 */
function Embers() {
  const count = 32;
  const geoRef = useRef<BufferGeometry>(null!);
  const pointsRef = useRef<Points>(null!);
  const positions = useRef(new Float32Array(count * 3));
  const speeds = useRef(new Float32Array(count));
  const drifts = useRef(new Float32Array(count));

  useEffect(() => {
    const geo = geoRef.current;
    if (!geo) return;

    for (let i = 0; i < count; i++) {
      positions.current[i * 3]     = (Math.random() - 0.5) * 5.5; // x spread
      positions.current[i * 3 + 1] = (Math.random() - 0.5) * 7;   // y spread (random start height)
      positions.current[i * 3 + 2] = 0.2 + Math.random() * 0.8;   // z in front of crest
      speeds.current[i] = 0.35 + Math.random() * 0.6;
      drifts.current[i] = (Math.random() - 0.5) * 0.5;
    }

    geo.setAttribute(
      'position',
      new BufferAttribute(positions.current, 3).setUsage(DynamicDrawUsage),
    );

    return () => { geo.dispose(); };
  }, []);

  useFrame((_state, delta) => {
    if (!geoRef.current?.attributes.position) return;
    const pos = positions.current;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += speeds.current[i] * delta;
      pos[i * 3]     += drifts.current[i] * delta;
      // reset particle when it drifts above the top
      if (pos[i * 3 + 1] > 4) {
        pos[i * 3]     = (Math.random() - 0.5) * 5.5;
        pos[i * 3 + 1] = -4;
        pos[i * 3 + 2] = 0.2 + Math.random() * 0.8;
        drifts.current[i] = (Math.random() - 0.5) * 0.5;
      }
    }
    geoRef.current.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geoRef} />
      <pointsMaterial
        color="#e8943a"
        size={0.038}
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  );
}

type CrestHeroProps = {
  /**
   * Explicit canvas height in vh. Default 42 (landing thumbnail).
   * Stop 4 uses ~75 to make the crest dominate the reveal.
   */
  heightVh?: number;
};

const CrestHero = ({ heightVh = 42 }: CrestHeroProps = {}) => {
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <style>{`
        @keyframes crestPulse {
          0%   { opacity: 0.55; transform: scale(1); }
          100% { opacity: 0.95; transform: scale(1.1); }
        }
      `}</style>
      <div
        className="relative w-full"
        style={{ height: `${heightVh}vh` }}
        aria-label="Ancestra family crest"
      >
        {/* Pulsing amber glow backdrop */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 55% 60% at 50% 50%, rgba(232,148,58,0.25) 0%, rgba(200,80,20,0.10) 45%, transparent 72%)',
            animation: 'crestPulse 3s ease-in-out infinite alternate',
            pointerEvents: 'none',
          }}
        />
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          gl={{ alpha: true, antialias: true }}
          style={{ background: 'transparent', position: 'relative', zIndex: 1 }}
        >
          <Suspense fallback={null}>
            <Crest pointerRef={pointerRef} />
            <Embers />
          </Suspense>
        </Canvas>
      </div>
    </>
  );
};

export default CrestHero;
