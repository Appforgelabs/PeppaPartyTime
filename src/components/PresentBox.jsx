// ============================================================
//  PresentBox.jsx — tap a gift box: the lid springs off, a
//  procedural 3D toy floats out, and the UI shows a phonics
//  card (P-I-G!). Tap again to tuck the toy back inside.
// ============================================================
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { playUnwrapSound, playChime } from '../audio/soundEngine.js';
import { useGameStore } from '../store/useGameStore.js';
import { Burst } from './Balloons.jsx';

function ToyPig() {
  const pink = '#f5a8bc';
  return (
    <group>
      <mesh castShadow><sphereGeometry args={[0.3, 20, 16]} /><meshStandardMaterial color={pink} roughness={0.7} /></mesh>
      <mesh castShadow position={[0, 0.16, 0.26]}><sphereGeometry args={[0.2, 18, 14]} /><meshStandardMaterial color={pink} roughness={0.7} /></mesh>
      <mesh position={[0, 0.12, 0.44]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.08, 0.08, 0.08, 12]} /><meshStandardMaterial color="#f8c3d2" roughness={0.7} /></mesh>
      {[-0.09, 0.09].map((x) => (
        <mesh key={`ear${x}`} position={[x, 0.34, 0.24]}><coneGeometry args={[0.06, 0.14, 8]} /><meshStandardMaterial color="#f28ba6" roughness={0.7} /></mesh>
      ))}
      {[-0.07, 0.07].map((x) => (
        <mesh key={`eye${x}`} position={[x, 0.22, 0.42]}><sphereGeometry args={[0.025, 8, 8]} /><meshStandardMaterial color="#33272b" /></mesh>
      ))}
      <mesh position={[0, 0.05, -0.3]}><torusGeometry args={[0.06, 0.02, 8, 12]} /><meshStandardMaterial color="#f28ba6" roughness={0.7} /></mesh>
    </group>
  );
}

function ToyDuck() {
  return (
    <group>
      <mesh castShadow><sphereGeometry args={[0.32, 20, 16]} /><meshStandardMaterial color="#ffd66b" roughness={0.7} /></mesh>
      <mesh castShadow position={[0, 0.3, 0.16]}><sphereGeometry args={[0.2, 18, 14]} /><meshStandardMaterial color="#ffd66b" roughness={0.7} /></mesh>
      <mesh position={[0, 0.28, 0.38]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.08, 0.16, 10]} /><meshStandardMaterial color="#ff9f43" roughness={0.6} /></mesh>
      {[-0.08, 0.08].map((x) => (
        <mesh key={`eye${x}`} position={[x, 0.36, 0.3]}><sphereGeometry args={[0.028, 8, 8]} /><meshStandardMaterial color="#33272b" /></mesh>
      ))}
      <mesh position={[0, 0.08, -0.3]} rotation={[-Math.PI / 2.4, 0, 0]}><coneGeometry args={[0.1, 0.2, 8]} /><meshStandardMaterial color="#ffd66b" roughness={0.7} /></mesh>
    </group>
  );
}

function ToyBall() {
  return (
    <group>
      <mesh castShadow><sphereGeometry args={[0.34, 24, 18]} /><meshStandardMaterial color="#ffffff" roughness={0.4} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.34, 0.035, 10, 32]} /><meshStandardMaterial color="#f5a8bc" roughness={0.5} /></mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.34, 0.035, 10, 32]} /><meshStandardMaterial color="#a9d4f0" roughness={0.5} /></mesh>
    </group>
  );
}

const TOYS = { pig: ToyPig, duck: ToyDuck, ball: ToyBall };

export default function PresentBox({ position = [0, 0, 0], word = 'PIG', toy = 'pig', color = '#f5a8bc', ribbon = '#fff1dc' }) {
  const [open, setOpen] = useState(false);
  const [bursts, setBursts] = useState([]);
  const openPhonics = useGameStore((s) => s.openPhonics);
  const closePhonics = useGameStore((s) => s.closePhonics);
  const lid = useRef();
  const toyG = useRef();
  const Toy = TOYS[toy];

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    const t = state.clock.elapsedTime;
    if (lid.current) {
      lid.current.position.y = THREE.MathUtils.damp(lid.current.position.y, open ? 1.5 : 0.62, 6, d);
      lid.current.position.x = THREE.MathUtils.damp(lid.current.position.x, open ? 0.95 : 0, 6, d);
      lid.current.rotation.z = THREE.MathUtils.damp(lid.current.rotation.z, open ? 0.85 : 0, 6, d);
    }
    if (toyG.current) {
      const s = THREE.MathUtils.damp(toyG.current.scale.x, open ? 1 : 0.0001, 7, d);
      toyG.current.scale.setScalar(Math.max(s, 0.0001));
      toyG.current.position.y = THREE.MathUtils.damp(toyG.current.position.y, open ? 1.35 + Math.sin(t * 2.2) * 0.1 : 0.45, 5, d);
      if (open) toyG.current.rotation.y += d * 1.4;
    }
  });

  function handleClick(e) {
    e.stopPropagation();
    const next = !open;
    setOpen(next);
    if (next) {
      playUnwrapSound();
      openPhonics(word);
      setBursts((b) => [...b, { id: Date.now(), position: [position[0], position[1] + 1.2, position[2]] }]);
    } else {
      playChime(392.0);
      closePhonics();
    }
  }

  return (
    <group
      position={position}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      {/* box base + ribbons */}
      <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[0.95, 0.6, 0.95]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.3, 0]}><boxGeometry args={[1.0, 0.62, 0.16]} /><meshStandardMaterial color={ribbon} roughness={0.55} /></mesh>
      <mesh position={[0, 0.3, 0]}><boxGeometry args={[0.16, 0.62, 1.0]} /><meshStandardMaterial color={ribbon} roughness={0.55} /></mesh>

      {/* spring-off lid with bow */}
      <group ref={lid} position={[0, 0.62, 0]}>
        <mesh castShadow position={[0, 0.1, 0]}>
          <boxGeometry args={[1.05, 0.2, 1.05]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.11, 0]}><boxGeometry args={[1.09, 0.22, 0.17]} /><meshStandardMaterial color={ribbon} roughness={0.55} /></mesh>
        <mesh position={[0, 0.11, 0]}><boxGeometry args={[0.17, 0.22, 1.09]} /><meshStandardMaterial color={ribbon} roughness={0.55} /></mesh>
        <mesh castShadow position={[0, 0.28, 0]}><torusGeometry args={[0.12, 0.045, 10, 20]} /><meshStandardMaterial color={ribbon} roughness={0.5} /></mesh>
      </group>

      {/* hidden toy that floats out */}
      <group ref={toyG} position={[0, 0.45, 0]} scale={0.0001}>
        <Toy />
      </group>

      {bursts.map((b) => (
        <Burst key={b.id} position={b.position} count={44} speed={3.6} onDone={() => setBursts((bs) => bs.filter((x) => x.id !== b.id))} />
      ))}
    </group>
  );
}
