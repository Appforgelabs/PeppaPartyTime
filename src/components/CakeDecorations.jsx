// ============================================================
//  CakeDecorations.jsx — place stars, hearts & candy toppers
//  on the cake, plus candle-blowing: in candle mode the room
//  dims, flames flicker, and tapping a flame blows it out with
//  sparkles. Blow them all for a victory melody!
// ============================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { useGameStore, TOTAL_CANDLES } from '../store/useGameStore.js';
import { CAKE } from './PartyScene.jsx';
import { Burst } from './Balloons.jsx';
import { playBlowOut, playSparkle, playCelebrationFanfare } from '../audio/soundEngine.js';

const TOPPER_COLORS = { star: '#ffd66b', heart: '#f2709c', candy: '#8fd6b4' };
const CANDLE_COLORS = ['#f5a8bc', '#a9d4f0', '#a9e5c5', '#d8c9f2', '#ffe08a'];

function starShape(points = 5, outer = 0.3, inner = 0.14) {
  const shape = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

function heartShape(s = 0.3) {
  const shape = new THREE.Shape();
  shape.moveTo(0, -s);
  shape.bezierCurveTo(-s * 1.6, -s * 0.1, -s * 0.9, s * 1.1, 0, s * 0.45);
  shape.bezierCurveTo(s * 0.9, s * 1.1, s * 1.6, -s * 0.1, 0, -s);
  return shape;
}

function Topper({ type, position }) {
  const ref = useRef();
  const born = useRef(0);
  const geo = useMemo(() => {
    const opts = { depth: 0.12, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 };
    if (type === 'star') return new THREE.ExtrudeGeometry(starShape(), opts);
    if (type === 'heart') return new THREE.ExtrudeGeometry(heartShape(), opts);
    return null;
  }, [type]);

  useFrame((state, dt) => {
    born.current += Math.min(dt, 0.05);
    const k = Math.min(born.current / 0.7, 1);
    const c4 = (2 * Math.PI) / 3; // easeOutElastic pop-in
    const s = k === 1 ? 1 : Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * c4) + 1;
    ref.current.scale.setScalar(Math.max(s, 0.001));
    ref.current.rotation.y = state.clock.elapsedTime * 0.6;
  });

  return (
    <group position={position}>
      <group ref={ref}>
        <mesh castShadow position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.36, 8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.6} />
        </mesh>
        {type === 'candy' ? (
          <group position={[0, 0.52, 0]}>
            <mesh castShadow><sphereGeometry args={[0.18, 16, 12]} /><meshStandardMaterial color={TOPPER_COLORS.candy} roughness={0.5} /></mesh>
            <mesh castShadow position={[0.22, 0, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.09, 0.18, 10]} /><meshStandardMaterial color="#ffffff" roughness={0.6} /></mesh>
            <mesh castShadow position={[-0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]}><coneGeometry args={[0.09, 0.18, 10]} /><meshStandardMaterial color="#ffffff" roughness={0.6} /></mesh>
          </group>
        ) : (
          <mesh castShadow geometry={geo} position={[0, 0.42, -0.06]}>
            <meshStandardMaterial color={TOPPER_COLORS[type]} roughness={0.45} metalness={0.05} />
          </mesh>
        )}
      </group>
    </group>
  );
}

function Candle({ index, position, lit, onBlow }) {
  const flame = useRef();

  useFrame((state) => {
    if (!flame.current) return;
    const t = state.clock.elapsedTime;
    const f = 1 + Math.sin(t * 11 + index * 2.4) * 0.18;
    flame.current.scale.set(f, 1 + Math.sin(t * 13 + index) * 0.25, f);
  });

  return (
    <group
      position={position}
      onClick={(e) => { e.stopPropagation(); if (lit) onBlow(index, e.point); }}
      onPointerOver={(e) => { if (lit) { e.stopPropagation(); document.body.style.cursor = 'pointer'; } }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      <mesh castShadow position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.5, 12]} />
        <meshStandardMaterial color={CANDLE_COLORS[index % CANDLE_COLORS.length]} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.53, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.06, 6]} />
        <meshStandardMaterial color="#5b4636" roughness={0.9} />
      </mesh>
      {lit && (
        <group ref={flame} position={[0, 0.68, 0]}>
          <mesh>
            <coneGeometry args={[0.07, 0.2, 10]} />
            <meshStandardMaterial color="#ff9f43" emissive="#ff8c1a" emissiveIntensity={2.2} toneMapped={false} />
          </mesh>
          <mesh position={[0, -0.02, 0]}>
            <sphereGeometry args={[0.045, 10, 8]} />
            <meshStandardMaterial color="#fff3b0" emissive="#ffe066" emissiveIntensity={3} toneMapped={false} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default function CakeDecorations() {
  const decorations = useGameStore((s) => s.cakeDecorations);
  const isCandleBlowingMode = useGameStore((s) => s.isCandleBlowingMode);
  const candlesBlown = useGameStore((s) => s.candlesBlown);
  const blowCandle = useGameStore((s) => s.blowCandle);
  const toggleCandleMode = useGameStore((s) => s.toggleCandleMode);
  const [blown, setBlown] = useState(() => Array(TOTAL_CANDLES).fill(false));
  const [bursts, setBursts] = useState([]);
  const cakeLight = useRef();

  // fresh candles each time candle mode starts
  useEffect(() => {
    if (isCandleBlowingMode) setBlown(Array(TOTAL_CANDLES).fill(false));
  }, [isCandleBlowingMode]);

  // all candles out → victory!
  useEffect(() => {
    if (isCandleBlowingMode && candlesBlown >= TOTAL_CANDLES) {
      playCelebrationFanfare();
      confetti({
        particleCount: 160,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#f7a8b8', '#a8e6cf', '#a9d4f0', '#d8c9f2'],
      });
      const t = setTimeout(() => toggleCandleMode(), 2600);
      return () => clearTimeout(t);
    }
  }, [candlesBlown, isCandleBlowingMode, toggleCandleMode]);

  useFrame((_, dt) => {
    if (!cakeLight.current) return;
    const target = isCandleBlowingMode ? 3.2 : 0;
    cakeLight.current.intensity = THREE.MathUtils.damp(cakeLight.current.intensity, target, 5, Math.min(dt, 0.05));
  });

  function handleBlow(index, point) {
    setBlown((b) => { const n = [...b]; n[index] = true; return n; });
    blowCandle();
    playBlowOut();
    playSparkle();
    setBursts((bs) => [
      ...bs,
      { id: `${Date.now()}-${index}`, position: point ? [point.x, point.y, point.z] : [0, 4.4, 0] },
    ]);
  }

  return (
    <group>
      {/* player-placed toppers, golden-angle layout on tier 2 */}
      {decorations.map((d) => {
        const angle = d.slot * 2.39996;
        const r = 1.02;
        return (
          <Topper
            key={d.id}
            type={d.type}
            position={[Math.cos(angle) * r, CAKE.tier2TopY, Math.sin(angle) * r]}
          />
        );
      })}

      {/* birthday candles on the top tier */}
      {Array.from({ length: TOTAL_CANDLES }).map((_, i) => {
        const a = (i / TOTAL_CANDLES) * Math.PI * 2 + Math.PI / 5;
        return (
          <Candle
            key={i}
            index={i}
            position={[Math.cos(a) * 0.5, CAKE.tier3TopY, Math.sin(a) * 0.5]}
            lit={isCandleBlowingMode && !blown[i]}
            onBlow={handleBlow}
          />
        );
      })}

      {/* warm glow that fades in for candle mode */}
      <pointLight ref={cakeLight} position={[0, 4.7, 0]} color="#ffb36b" intensity={0} distance={14} decay={2} />

      {bursts.map((b) => (
        <Burst
          key={b.id}
          position={b.position}
          count={36}
          speed={3}
          colors={['#a9d4f0', '#ffffff', '#d8c9f2', '#ffe08a']}
          onDone={() => setBursts((bs) => bs.filter((x) => x.id !== b.id))}
        />
      ))}
    </group>
  );
}
