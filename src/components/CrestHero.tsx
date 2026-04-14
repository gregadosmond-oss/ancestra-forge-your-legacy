import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { Mesh, TextureLoader, SRGBColorSpace } from 'three';

const MAX_TILT_RAD = (15 * Math.PI) / 180; // 15 degrees

function Crest() {
  const meshRef = useRef<Mesh>(null);
  const texture = useLoader(TextureLoader, '/crest.png');
  texture.colorSpace = SRGBColorSpace;

  const aspect = texture.image
    ? texture.image.width / texture.image.height
    : 1;
  const planeHeight = 8;
  const planeWidth = planeHeight * aspect;

  useFrame((state) => {
    if (!meshRef.current) return;
    const targetRotY = state.pointer.x * MAX_TILT_RAD;
    const targetRotX = -state.pointer.y * MAX_TILT_RAD;
    meshRef.current.rotation.y +=
      (targetRotY - meshRef.current.rotation.y) * 0.06;
    meshRef.current.rotation.x +=
      (targetRotX - meshRef.current.rotation.x) * 0.06;
  });

  return (
    <Float speed={0.8} rotationIntensity={0.08} floatIntensity={0.2}>
      <mesh ref={meshRef}>
        <planeGeometry args={[planeWidth, planeHeight]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.05}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>
    </Float>
  );
}

const CrestHero = () => {
  return (
    <div
      className="relative w-full"
      style={{ minHeight: '45vh' }}
      aria-label="Ancestra family crest"
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        {/* Soft warm base light */}
        <ambientLight intensity={0.55} color="#f0d8a8" />
        {/* Primary amber directional key light */}
        <directionalLight
          position={[3, 4, 5]}
          intensity={1.4}
          color="#e8943a"
        />
        {/* Warm rim light from behind */}
        <directionalLight
          position={[-3, 2, -4]}
          intensity={0.8}
          color="#f0a848"
        />
        {/* Subtle fill */}
        <pointLight position={[0, -3, 3]} intensity={0.3} color="#d4a04a" />

        <Suspense fallback={null}>
          <Crest />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default CrestHero;
