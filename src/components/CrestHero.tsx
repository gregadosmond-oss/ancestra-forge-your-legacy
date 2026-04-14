import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  DynamicDrawUsage,
  Group,
  Mesh,
  Points,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
} from 'three';

const MAX_TILT_RAD = (15 * Math.PI) / 180;

// ─── Crest shader ────────────────────────────────────────────────────────────

const crestVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Chroma-keys the dark background of the PNG so the crest floats cleanly
 * over the page. Keeps colourful pixels (saturation test) and bright pixels
 * (luminance test — the white banner).
 */
const crestFragment = /* glsl */ `
  uniform sampler2D map;
  varying vec2 vUv;
  void main() {
    vec4 tex = texture2D(map, vUv);
    float mx  = max(max(tex.r, tex.g), tex.b);
    float mn  = min(min(tex.r, tex.g), tex.b);
    float sat = mx > 0.001 ? (mx - mn) / mx : 0.0;
    float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    float alpha = max(smoothstep(0.05, 0.18, sat), smoothstep(0.32, 0.50, lum));
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(tex.rgb, alpha);
  }
`;

// ─── Glow border shader ───────────────────────────────────────────────────────

const glowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Transparent in the centre, amber at the edges — creates a soft glowing
 * border rect behind the crest plane.
 */
const glowFragment = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vec2  d      = abs(vUv - 0.5) * 2.0;   // 0 = centre, 1 = corner
    float edge   = max(d.x, d.y);           // box distance
    float border = smoothstep(0.60, 1.00, edge) * 0.80;
    float corona = smoothstep(0.35, 0.65, edge) * 0.28;
    float alpha  = border + corona;
    gl_FragColor = vec4(0.91, 0.58, 0.22, alpha);
  }
`;

// ─── CrestWithGlow ────────────────────────────────────────────────────────────

/**
 * Renders the crest plane + the glowing border rect as a single group so
 * both tilt together with the mouse.
 */
function CrestWithGlow({
  pointerRef,
}: {
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const groupRef      = useRef<Group>(null);
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

  const glowMat = useMemo(
    () => new ShaderMaterial({
      vertexShader: glowVertex,
      fragmentShader: glowFragment,
      transparent: true,
      depthWrite: false,
    }),
    [],
  );

  useFrame(() => {
    if (!groupRef.current) return;
    const targetRotY = pointerRef.current.x * MAX_TILT_RAD;
    const targetRotX = -pointerRef.current.y * MAX_TILT_RAD;
    if (!initializedRef.current) {
      groupRef.current.rotation.y = targetRotY;
      groupRef.current.rotation.x = targetRotX;
      initializedRef.current = true;
      return;
    }
    groupRef.current.rotation.y += (targetRotY - groupRef.current.rotation.y) * 0.06;
    groupRef.current.rotation.x += (targetRotX - groupRef.current.rotation.x) * 0.06;
  });

  return (
    <group ref={groupRef}>
      {/* Glow border — slightly behind and slightly larger than the crest */}
      <mesh position={[0, 0, -0.08]} material={glowMat}>
        <planeGeometry args={[planeWidth + 0.55, planeHeight + 0.55]} />
      </mesh>
      {/* Crest plane */}
      <mesh material={crestMat}>
        <planeGeometry args={[planeWidth, planeHeight]} />
      </mesh>
    </group>
  );
}

// ─── Embers ───────────────────────────────────────────────────────────────────

function Embers() {
  const count     = 32;
  const geoRef    = useRef<BufferGeometry>(null!);
  const pointsRef = useRef<Points>(null!);
  const positions = useRef(new Float32Array(count * 3));
  const speeds    = useRef(new Float32Array(count));
  const drifts    = useRef(new Float32Array(count));

  useEffect(() => {
    const geo = geoRef.current;
    if (!geo) return;
    for (let i = 0; i < count; i++) {
      positions.current[i * 3]     = (Math.random() - 0.5) * 5.5;
      positions.current[i * 3 + 1] = (Math.random() - 0.5) * 7;
      positions.current[i * 3 + 2] = 0.2 + Math.random() * 0.8;
      speeds.current[i]  = 0.35 + Math.random() * 0.6;
      drifts.current[i]  = (Math.random() - 0.5) * 0.5;
    }
    geo.setAttribute('position', new BufferAttribute(positions.current, 3).setUsage(DynamicDrawUsage));
    return () => { geo.dispose(); };
  }, []);

  useFrame((_state, delta) => {
    if (!geoRef.current?.attributes.position) return;
    const pos = positions.current;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += speeds.current[i] * delta;
      pos[i * 3]     += drifts.current[i] * delta;
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
      <pointsMaterial color="#e8943a" size={0.038} transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

// ─── CrestHero ────────────────────────────────────────────────────────────────

type CrestHeroProps = {
  /** Canvas height in vh. Default 42. Stop 4 uses ~75. */
  heightVh?: number;
};

const CrestHero = ({ heightVh = 42 }: CrestHeroProps = {}) => {
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
    <>
      <style>{`
        @keyframes crestPulse {
          0%   { opacity: 0.55; transform: scale(1);    }
          100% { opacity: 0.95; transform: scale(1.10); }
        }
      `}</style>
      <div
        className="relative w-full"
        style={{ height: `${heightVh}vh` }}
        aria-label="Ancestra family crest"
      >
        {/* Pulsing ambient glow behind the canvas */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 55% 60% at 50% 50%, rgba(232,148,58,0.25) 0%, rgba(200,80,20,0.10) 45%, transparent 72%)',
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
            <CrestWithGlow pointerRef={pointerRef} />
            <Embers />
          </Suspense>
        </Canvas>
      </div>
    </>
  );
};

export default CrestHero;
