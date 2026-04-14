import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { Mesh, MeshStandardMaterial, SRGBColorSpace, TextureLoader } from 'three';

const MAX_TILT_RAD = (15 * Math.PI) / 180;

function CrestMedallion({
  pointerRef,
}: {
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const meshRef = useRef<Mesh>(null);
  const autoRotY = useRef(0);

  const texture = useLoader(TextureLoader, '/crest.png');
  texture.colorSpace = SRGBColorSpace;

  const materials = useMemo(
    () => [
      new MeshStandardMaterial({ color: '#1a1510' }), // +x right
      new MeshStandardMaterial({ color: '#1a1510' }), // -x left
      new MeshStandardMaterial({ color: '#1a1510' }), // +y top
      new MeshStandardMaterial({ color: '#1a1510' }), // -y bottom
      new MeshStandardMaterial({ map: texture }),      // +z front ← crest
      new MeshStandardMaterial({ color: '#1a1510' }), // -z back
    ],
    [texture],
  );

  useFrame((_state, delta) => {
    if (!meshRef.current) return;
    autoRotY.current += delta * ((Math.PI * 2) / 20);
    const targetRotY = autoRotY.current + pointerRef.current.x * MAX_TILT_RAD;
    const targetRotX = -pointerRef.current.y * MAX_TILT_RAD;
    meshRef.current.rotation.y += (targetRotY - meshRef.current.rotation.y) * 0.06;
    meshRef.current.rotation.x += (targetRotX - meshRef.current.rotation.x) * 0.06;
  });

  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={meshRef} material={materials}>
        <boxGeometry args={[3, 3, 0.05]} />
      </mesh>
    </Float>
  );
}

const LandingCrestHero = () => {
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
    <div
      className="relative w-full"
      style={{ minHeight: '60vh' }}
      aria-label="Ancestra family crest"
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[0, 2, 3]} color="#e8943a" intensity={2.5} />
        <Suspense fallback={null}>
          <CrestMedallion pointerRef={pointerRef} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default LandingCrestHero;
