// ============================================================
//  PartyScene.jsx — pastel garden: hills, clouds, trees,
//  the multi-tiered birthday cake and the gift tables.
//  All meshes are procedural Three.js primitives.
// ============================================================
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import CakeDecorations from './CakeDecorations.jsx';
import PresentBox from './PresentBox.jsx';
import { useGameStore } from '../store/useGameStore.js';

// Shared cake measurements (used by CakeDecorations to place toppers & candles)
export const CAKE = {
  tableTopY: 1.22,
  tier2TopY: 2.9,
  tier3TopY: 3.55,
};

const C = {
  mint: '#a9e5c5',
  mintDark: '#8fd3ab',
  pink: '#f5a8bc',
  pinkDeep: '#f28ba6',
  cream: '#fff1dc',
  lavender: '#d8c9f2',
  blue: '#a9d4f0',
  roseGold: '#e6b8a2',
  white: '#ffffff',
  trunk: '#c9a28a',
};

// One-liner matte mesh with soft PBR material
function Soft({ color, children, ...props }) {
  return (
    <mesh castShadow receiveShadow {...props}>
      {children}
      <meshStandardMaterial color={color} roughness={0.85} metalness={0.02} />
    </mesh>
  );
}

function Cloud({ position, scale = 1, speed = 0.15 }) {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    ref.current.position.x = position[0] + Math.sin(t * speed + position[2]) * 3;
  });
  const puffs = useMemo(
    () => [[0, 0, 0, 1.2], [1.2, 0.15, 0, 0.9], [-1.15, 0.1, 0, 0.95], [0.45, 0.55, 0, 0.8], [-0.55, 0.5, 0, 0.75]],
    []
  );
  return (
    <group ref={ref} position={position} scale={scale}>
      {puffs.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[r, 20, 14]} />
          <meshStandardMaterial color="#ffffff" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function Tree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <Soft color={C.trunk} position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.22, 0.3, 1.8, 10]} />
      </Soft>
      <Soft color={C.mintDark} position={[0, 2.3, 0]}>
        <sphereGeometry args={[1.15, 18, 14]} />
      </Soft>
      <Soft color={C.mint} position={[0.7, 1.9, 0.3]}>
        <sphereGeometry args={[0.75, 16, 12]} />
      </Soft>
      <Soft color={C.mint} position={[-0.65, 2.0, -0.25]}>
        <sphereGeometry args={[0.7, 16, 12]} />
      </Soft>
    </group>
  );
}

function Cake() {
  const tiers = [
    { r: 1.9, h: 0.85, y: 1.725, color: C.pink },
    { r: 1.35, h: 0.75, y: 2.525, color: C.cream },
    { r: 0.85, h: 0.65, y: 3.225, color: C.lavender },
  ];
  return (
    <group>
      {/* table */}
      <Soft color={C.roseGold} position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.35, 0.45, 1.0, 16]} />
      </Soft>
      <Soft color={C.white} position={[0, 1.11, 0]}>
        <cylinderGeometry args={[2.6, 2.6, 0.22, 32]} />
      </Soft>
      {/* cake plate */}
      <Soft color={C.roseGold} position={[0, 1.26, 0]}>
        <cylinderGeometry args={[2.15, 2.15, 0.08, 32]} />
      </Soft>
      {/* tiers + icing rims */}
      {tiers.map((t, i) => (
        <group key={i}>
          <Soft color={t.color} position={[0, t.y, 0]}>
            <cylinderGeometry args={[t.r, t.r, t.h, 36]} />
          </Soft>
          <mesh castShadow position={[0, t.y + t.h / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[t.r - 0.04, 0.1, 12, 40]} />
            <meshStandardMaterial color={C.white} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function GiftTable({ position }) {
  return (
    <group position={position}>
      <Soft color={C.roseGold} position={[0, 0.36, 0]}>
        <cylinderGeometry args={[0.2, 0.28, 0.72, 12]} />
      </Soft>
      <Soft color={C.white} position={[0, 0.81, 0]}>
        <cylinderGeometry args={[1.25, 1.25, 0.18, 24]} />
      </Soft>
    </group>
  );
}

// Falling 3D confetti while Celebration Mode is on
function ConfettiRain() {
  const ref = useRef();
  const COUNT = 160;
  const data = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const spd = new Float32Array(COUNT);
    const palette = ['#f2709c', '#f7b267', '#7bc8a4', '#6aa9e0', '#a58fd6', '#ffe08a'];
    const c = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 1] = Math.random() * 14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 24;
      spd[i] = 1.6 + Math.random() * 2.4;
      c.set(palette[i % palette.length]);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    return { pos, col, spd };
  }, []);

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    const t = state.clock.elapsedTime;
    const { pos, spd } = data;
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3 + 1] -= spd[i] * d;
      pos[i * 3] += Math.sin(t * 2 + i) * d * 0.6;
      if (pos[i * 3 + 1] < 0) pos[i * 3 + 1] = 14;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
        <bufferAttribute attach="attributes-color" args={[data.col, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.18} vertexColors transparent opacity={0.95} depthWrite={false} />
    </points>
  );
}

export default function PartyScene() {
  const celebrating = useGameStore((s) => s.celebrating);

  return (
    <group>
      {/* ground + rolling hills */}
      <mesh receiveShadow position={[0, -0.3, 0]}>
        <cylinderGeometry args={[22, 22, 0.6, 56]} />
        <meshStandardMaterial color={C.mint} roughness={0.95} />
      </mesh>
      <Soft color={C.mintDark} position={[-14, -0.6, -12]} scale={[1, 0.35, 1]}>
        <sphereGeometry args={[7, 20, 14]} />
      </Soft>
      <Soft color={C.mintDark} position={[13, -0.7, -14]} scale={[1, 0.32, 1]}>
        <sphereGeometry args={[8, 20, 14]} />
      </Soft>
      <Soft color={C.mintDark} position={[0, -0.8, -19]} scale={[1, 0.3, 1]}>
        <sphereGeometry args={[9, 20, 14]} />
      </Soft>

      {/* sky */}
      <Cloud position={[-9, 9, -12]} scale={1.2} />
      <Cloud position={[7, 10.5, -14]} scale={1.5} speed={0.1} />
      <Cloud position={[0, 11, -18]} scale={1.1} speed={0.2} />
      <Cloud position={[12, 8.5, -8]} scale={0.9} speed={0.25} />

      {/* trees */}
      <Tree position={[-10.5, 0, -6]} scale={1.2} />
      <Tree position={[10.8, 0, -7]} scale={1.4} />
      <Tree position={[-13, 0, 2]} scale={0.95} />
      <Tree position={[13.5, 0, 3]} scale={1.05} />

      {/* centerpiece */}
      <Cake />
      <CakeDecorations />

      {/* gift tables + unboxable presents */}
      <GiftTable position={[-5.4, 0, 0.8]} />
      <PresentBox position={[-5.4, 0.9, 0.8]} word="PIG" toy="pig" color={C.pink} ribbon={C.cream} />
      <GiftTable position={[5.4, 0, 0.8]} />
      <PresentBox position={[5.4, 0.9, 0.8]} word="DUCK" toy="duck" color={C.blue} ribbon={C.white} />
      <PresentBox position={[0, 0, 5.8]} word="BALL" toy="ball" color={C.lavender} ribbon={C.cream} />

      {celebrating && <ConfettiRain />}
    </group>
  );
}
