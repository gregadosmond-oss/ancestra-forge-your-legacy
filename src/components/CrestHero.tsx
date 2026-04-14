import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import {
  DoubleSide,
  Mesh,
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
  scale = 1,
}: {
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
  scale?: number;
}) {
  const meshRef = useRef<Mesh>(null);
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
    meshRef.current.rotation.y +=
      (targetRotY - meshRef.current.rotation.y) * 0.06;
    meshRef.current.rotation.x +=
      (targetRotX - meshRef.current.rotation.x) * 0.06;
  });

  return (
    <Float speed={0.8} rotationIntensity={0.08} floatIntensity={0.2}>
      <mesh ref={meshRef} material={material} scale={scale}>
        <planeGeometry args={[planeWidth, planeHeight]} />
      </mesh>
    </Float>
  );
}

type CrestHeroProps = {
  /** Min-height of the canvas in vh. Default 42 (landing). Stop 4 uses 75. */
  minHeightVh?: number;
  /** Mesh scale multiplier. Default 1 (landing). Stop 4 uses 1.7 to fill. */
  scale?: number;
};

const CrestHero = ({ minHeightVh = 42, scale = 1 }: CrestHeroProps = {}) => {
  // Track the mouse globally (window) so the crest reacts anywhere on the
  // page, not only when hovering the canvas. Stored in a ref so we don't
  // re-render on every mousemove — useFrame reads it directly.
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to [-1, 1] with y flipped to match three.js conventions
      // (top of viewport = +1, bottom = -1).
      pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      className="relative w-full"
      style={{ minHeight: `${minHeightVh}vh` }}
      aria-label="Ancestra family crest"
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Crest pointerRef={pointerRef} scale={scale} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default CrestHero;
