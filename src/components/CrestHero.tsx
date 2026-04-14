import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import {
  DoubleSide,
  Group,
  Mesh,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
} from 'three';

const MAX_TILT_RAD = (15 * Math.PI) / 180;

// ─── Crest shader ─────────────────────────────────────────────────────────────

const crestVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Chroma-keys the dark background so the crest floats cleanly over the page.
 * Keeps colourful pixels (saturation) and bright pixels (luminance — the banner).
 */
const crestFragment = /* glsl */ `
  uniform sampler2D map;
  varying vec2 vUv;
  void main() {
    vec4  tex = texture2D(map, vUv);
    float mx  = max(max(tex.r, tex.g), tex.b);
    float mn  = min(min(tex.r, tex.g), tex.b);
    float sat = mx > 0.001 ? (mx - mn) / mx : 0.0;
    float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    float alpha = max(smoothstep(0.05, 0.18, sat), smoothstep(0.32, 0.50, lum));
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(tex.rgb, alpha);
  }
`;

// ─── Shadow shader ────────────────────────────────────────────────────────────

const shadowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Soft elliptical shadow cast on the "surface" behind the crest.
 * Transparent at the edges, dark at the centre — shifts with mouse tilt
 * to imply the crest is a solid object floating in space.
 */
const shadowFragment = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vec2  d    = (vUv - 0.5) * vec2(2.0, 3.2); // squash vertically → ellipse
    float dist = length(d);
    float a    = (1.0 - smoothstep(0.2, 1.0, dist)) * 0.45;
    gl_FragColor = vec4(0.0, 0.0, 0.0, a);
  }
`;

// ─── Scene ────────────────────────────────────────────────────────────────────

function CrestScene({
  pointerRef,
}: {
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const groupRef       = useRef<Group>(null);
  const shadowRef      = useRef<Mesh>(null);
  const initializedRef = useRef(false);

  const texture = useLoader(TextureLoader, '/crest.png');
  texture.colorSpace = SRGBColorSpace;

  const aspect      = texture.image ? texture.image.width / texture.image.height : 1;
  const planeHeight = 4.3;
  const planeWidth  = planeHeight * aspect;

  const crestMat = useMemo(
    () => new ShaderMaterial({
      uniforms: { map: { value: texture } },
      vertexShader: crestVertex,
      fragmentShader: crestFragment,
      transparent: true,
      side: DoubleSide,
    }),
    [texture],
  );

  const shadowMat = useMemo(
    () => new ShaderMaterial({
      vertexShader: shadowVertex,
      fragmentShader: shadowFragment,
      transparent: true,
      depthWrite: false,
    }),
    [],
  );

  useFrame(() => {
    if (!groupRef.current || !shadowRef.current) return;

    const px = pointerRef.current.x;
    const py = pointerRef.current.y;

    const targetRotY = px * MAX_TILT_RAD;
    const targetRotX = -py * MAX_TILT_RAD;

    // Snap on first frame so there's no lerp drift from (0,0) on mount
    if (!initializedRef.current) {
      groupRef.current.rotation.y = targetRotY;
      groupRef.current.rotation.x = targetRotX;
      initializedRef.current = true;
    } else {
      groupRef.current.rotation.y += (targetRotY - groupRef.current.rotation.y) * 0.06;
      groupRef.current.rotation.x += (targetRotX - groupRef.current.rotation.x) * 0.06;
    }

    // Shadow drifts opposite to tilt — light appears to come from the front,
    // so when you tilt right the shadow shifts left (parallax).
    shadowRef.current.position.x = -px * 0.35;
    shadowRef.current.position.y = -py * 0.20 - 0.55; // always slightly below
  });

  return (
    <>
      {/* Drop shadow — behind and below the crest, not part of the tilt group */}
      <mesh
        ref={shadowRef}
        position={[0, -0.55, -0.6]}
        material={shadowMat}
      >
        <planeGeometry args={[planeWidth * 0.88, planeHeight * 0.5]} />
      </mesh>

      {/* Crest — tilts with the mouse */}
      <group ref={groupRef}>
        <mesh material={crestMat}>
          <planeGeometry args={[planeWidth, planeHeight]} />
        </mesh>
      </group>
    </>
  );
}

// ─── CrestHero ────────────────────────────────────────────────────────────────

type CrestHeroProps = {
  /** Canvas height in vh. Default 52. Stop 4 uses ~75. */
  heightVh?: number;
};

const CrestHero = ({ heightVh = 52 }: CrestHeroProps = {}) => {
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pointerRef.current.x =  (e.clientX / window.innerWidth)  * 2 - 1;
      pointerRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div
      className="relative w-full"
      style={{ height: `${heightVh}vh` }}
      aria-label="Ancestra family crest"
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <CrestScene pointerRef={pointerRef} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default CrestHero;
