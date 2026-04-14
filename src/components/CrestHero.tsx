import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
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
    // On first frame after mount, snap to target so the crest doesn't
    // visibly lerp from flat (0,0) to the current pointer angle — that
    // ~1s drift read as "not lined up" on the Stop 4 reveal.
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

  // No <Float> wrapper: drei's Float seeds each instance with random phase
  // offsets on rotation/translation, so on mount the mesh appeared tilted a
  // few degrees Y-axis ("loads to the left") and drifted back to centre
  // over ~1s. Pointer tracking below gives the crest all the life it needs.
  return (
    <mesh ref={meshRef} material={material}>
      <planeGeometry args={[planeWidth, planeHeight]} />
    </mesh>
  );
}

type CrestHeroProps = {
  /**
   * Explicit canvas height in vh. Default 42 (landing thumbnail).
   * Stop 4 uses ~75 to make the crest dominate the reveal.
   * Using `height` (not `minHeight`) so the R3F canvas, which sizes to
   * parent, actually grows. `minHeight` alone leaves the child height
   * ambiguous and the canvas collapses to content.
   */
  heightVh?: number;
};

const CrestHero = ({ heightVh = 42 }: CrestHeroProps = {}) => {
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
      style={{ height: `${heightVh}vh` }}
      aria-label="Ancestra family crest"
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Crest pointerRef={pointerRef} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default CrestHero;
