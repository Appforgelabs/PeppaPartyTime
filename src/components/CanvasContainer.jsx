// ============================================================
//  CanvasContainer.jsx — R3F Canvas, cinematic lighting,
//  soft shadows and a damped isometric-leaning camera.
// ============================================================
import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import PartyScene from './PartyScene.jsx';
import Balloons from './Balloons.jsx';
import { useGameStore } from '../store/useGameStore.js';

function Lights() {
  const ambient = useRef();
  const key = useRef();
  const isCandleMode = useGameStore((s) => s.isCandleBlowingMode);

  useFrame((_, dt) => {
    // Cinematic dimming when it's time to blow out the candles
    const d = Math.min(dt, 0.05);
    const targetA = isCandleMode ? 0.14 : 0.75;
    const targetK = isCandleMode ? 0.25 : 1.6;
    if (ambient.current) ambient.current.intensity = THREE.MathUtils.damp(ambient.current.intensity, targetA, 4, d);
    if (key.current) key.current.intensity = THREE.MathUtils.damp(key.current.intensity, targetK, 4, d);
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0.75} color="#fff5ec" />
      <directionalLight
        ref={key}
        position={[7, 12, 6]}
        intensity={1.6}
        color="#fff1dd"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />
      <hemisphereLight args={['#cfe4ff', '#ffe3ee', 0.5]} />
    </>
  );
}

export default function CanvasContainer() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [10, 9, 13], fov: 42, near: 0.1, far: 120 }}
      style={{ position: 'fixed', inset: 0, touchAction: 'none' }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#dcecff']} />
      <fog attach="fog" args={['#dcecff', 30, 70]} />
      <Suspense fallback={null}>
        <Lights />
        <PartyScene />
        <Balloons />
        <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={40} blur={2.4} far={12} color="#c98ba7" />
      </Suspense>
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        minDistance={9}
        maxDistance={26}
        minPolarAngle={0.5}
        maxPolarAngle={1.32}
        target={[0, 1.6, 0]}
      />
    </Canvas>
  );
}
