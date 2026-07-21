// ============================================================
//  Balloons.jsx — floating interactive balloons with elastic
//  pop physics, 3D confetti bursts and counting chimes.
//  Also exports <Burst/>, the reusable 3D particle system.
// ============================================================
import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { playPopSound, playChime } from '../audio/soundEngine.js';
import { useGameStore } from '../store/useGameStore.js';

const COUNTING_NOTES = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33, 659.25];
const BALLOONS = [
  { position: [-7.5, 4.2, -2.5], color: '#f5a8bc' },
  { position: [7.2, 5.0, -3.5], color: '#a9d4f0' },
  { position: [-4.5, 5.8, -6.5], color: '#d8c9f2' },
  { position: [4.8, 4.4, -6.8], color: '#a9e5c5' },
  { position: [0.5, 6.4, -8.5], color: '#ffe08a' },
  { position: [-8.5, 3.6, 2.5], color: '#e6b8a2' },
  { position: [8.6, 4.0, 1.8], color: '#f5a8bc' },
  { position: [-3.2, 4.6, 6.8], color: '#a9d4f0' },
  { position: [3.6, 5.4, 6.5], color: '#d8c9f2' },
];

/** Reusable 3D confetti burst (points with gravity + fade). */
export function Burst({
  position,
  colors = ['#f2709c', '#f7b267', '#7bc8a4', '#6aa9e0', '#a58fd6'],
  count = 40,
  speed = 4,
  onDone,
}) {
  const ref = useRef();
  const data = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const vel = [];
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      pos[i * 3] = position[0]; pos[i * 3 + 1] = position[1]; pos[i * 3 + 2] = position[2];
      vel.push(new THREE.Vector3().randomDirection().multiplyScalar(speed * (0.4 + Math.random() * 0.6)));
      c.set(colors[i % colors.length]);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    return { pos, col, vel, life: 1.4 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    const { pos, vel } = data;
    data.life -= d;
    for (let i = 0; i < vel.length; i++) {
      vel[i].y -= 6 * d;
      pos[i * 3] += vel[i].x * d;
      pos[i * 3 + 1] += vel[i].y * d;
      pos[i * 3 + 2] += vel[i].z * d;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    ref.current.material.opacity = Math.max(data.life / 1.4, 0);
    if (data.life <= 0) onDone?.();
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
        <bufferAttribute attach="attributes-color" args={[data.col, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.22} vertexColors transparent opacity={1} depthWrite={false} />
    </points>
  );
}

function Balloon({ position, color }) {
  const group = useRef();
  const mode = useRef('idle'); // idle → popping → waiting → growing → idle
  const timer = useRef(0);
  const seed = useMemo(() => Math.random() * Math.PI * 2, []);
  const [bursts, setBursts] = useState([]);
  const popBalloon = useGameStore((s) => s.popBalloon);

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    const t = state.clock.elapsedTime;
    const g = group.current;
    if (!g) return;

    if (mode.current === 'idle') {
      g.position.y = position[1] + Math.sin(t * 1.2 + seed) * 0.35;
      g.rotation.z = Math.sin(t * 0.8 + seed) * 0.07;
      g.scale.setScalar(1);
    } else if (mode.current === 'popping') {
      timer.current += d;
      const k = timer.current;
      // quick inflate, then elastic shrink to nothing
      const s = k < 0.07 ? 1 + (k / 0.07) * 0.4 : Math.max(1.4 * (1 - (k - 0.07) / 0.2), 0.0001);
      g.scale.setScalar(s);
      if (k > 0.3) { mode.current = 'waiting'; timer.current = 0; g.visible = false; }
    } else if (mode.current === 'waiting') {
      timer.current += d;
      if (timer.current > 3.2) { mode.current = 'growing'; timer.current = 0; g.visible = true; }
    } else if (mode.current === 'growing') {
      timer.current += d;
      const k = Math.min(timer.current / 0.8, 1);
      const c4 = (2 * Math.PI) / 3; // easeOutElastic
      const s = k === 1 ? 1 : Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * c4) + 1;
      g.scale.setScalar(Math.max(s, 0.0001));
      if (k >= 1) mode.current = 'idle';
    }
  });

  function handlePop(e) {
    e.stopPropagation();
    if (mode.current !== 'idle') return;
    mode.current = 'popping';
    timer.current = 0;
    const next = useGameStore.getState().balloonCount + 1;
    playPopSound();
    playChime(COUNTING_NOTES[(next - 1) % COUNTING_NOTES.length]); // ascending counting scale
    popBalloon();
    const p = group.current.position;
    setBursts((b) => [...b, { id: `${Date.now()}-${Math.random()}`, position: [p.x, p.y, p.z] }]);
  }

  return (
    <>
      <group
        ref={group}
        position={position}
        onClick={handlePop}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        <mesh castShadow scale={[1, 1.15, 1]}>
          <sphereGeometry args={[0.55, 24, 18]} />
          <meshStandardMaterial color={color} roughness={0.35} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.68, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.09, 0.14, 10]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
        <mesh position={[0, -1.6, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 1.8, 6]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      </group>
      {bursts.map((b) => (
        <Burst key={b.id} position={b.position} onDone={() => setBursts((bs) => bs.filter((x) => x.id !== b.id))} />
      ))}
    </>
  );
}

export default function Balloons() {
  return (
    <group>
      {BALLOONS.map((b, i) => (
        <Balloon key={i} position={b.position} color={b.color} />
      ))}
    </group>
  );
}
