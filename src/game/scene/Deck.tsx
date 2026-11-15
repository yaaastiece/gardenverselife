import { useMemo } from "react";
import * as THREE from "three";
import { Edges } from "@react-three/drei";
import { PALETTE } from "../config";

const SIZE = 8; // deck is SIZE x SIZE, centered on origin

export function Deck() {
  const slats = useMemo(() => Array.from({ length: 20 }, (_, i) => -SIZE / 2 + 0.2 + i * 0.4), []);
  const _posts = useMemo(() => {
    const p: [number, number, number][] = [];
    for (let i = 0; i <= 16; i++) { const t = -SIZE / 2 + (i * SIZE) / 16; p.push([t, 0, -SIZE / 2], [-SIZE / 2, 0, t], [SIZE / 2, 0, t]); }
    return p;
  }, []);
  const bulbs = useMemo(() => {
    const out: THREE.Vector3[] = [];
    const sides: [THREE.Vector3, THREE.Vector3][] = [
      [new THREE.Vector3(-SIZE / 2, 1.05, SIZE / 2), new THREE.Vector3(-SIZE / 2, 1.05, -SIZE / 2)],
      [new THREE.Vector3(-SIZE / 2, 1.05, -SIZE / 2), new THREE.Vector3(SIZE / 2, 1.05, -SIZE / 2)],
      [new THREE.Vector3(SIZE / 2, 1.05, -SIZE / 2), new THREE.Vector3(SIZE / 2, 1.05, SIZE / 2)],
      [new THREE.Vector3(SIZE / 2, 1.05, SIZE / 2), new THREE.Vector3(-SIZE / 2, 1.05, SIZE / 2)],
    ];
    sides.forEach(([a, b]) => { for (let i = 0; i < 12; i++) { const t = i / 12; const p = a.clone().lerp(b, t); p.y -= Math.sin(((i % 4) / 4) * Math.PI) * 0.18; out.push(p); } });
    return out;
  }, []);
  return (
    <group>
      {slats.map((x, i) => (
        <mesh key={i} position={[x, -0.05, 0]}><boxGeometry args={[0.36, 0.1, SIZE]} /><meshToonMaterial color={i % 3 ? "#4a3a33" : "#3e302b"} /><Edges color={PALETTE.ink} /></mesh>
      ))}
      <mesh position={[0, -6.1, 0]}><boxGeometry args={[SIZE + 0.4, 12, SIZE + 0.4]} /><meshToonMaterial color={PALETTE.wallMid} /><Edges color={PALETTE.ink} /></mesh>
      {([[0, -SIZE / 2, 0], [-SIZE / 2, 0, Math.PI / 2], [SIZE / 2, 0, Math.PI / 2], [0, SIZE / 2, 0]] as [number, number, number][]).map(([x, z, r], i) => (
        <group key={i} position={[x, 0, z]} rotation-y={r}>
          <mesh position={[0, 0.55, 0]}><boxGeometry args={[SIZE, 1.1, 0.02]} /><meshPhysicalMaterial color="#cfe9f0" transparent opacity={0.18} roughness={0.05} metalness={0.1} depthWrite={false} /></mesh>
          <mesh position={[0, 1.12, 0]}><boxGeometry args={[SIZE, 0.04, 0.06]} /><meshStandardMaterial color="#2a282d" metalness={0.8} roughness={0.3} /></mesh>
          <mesh position={[0, 0.03, 0]}><boxGeometry args={[SIZE, 0.06, 0.06]} /><meshStandardMaterial color="#2a282d" metalness={0.8} roughness={0.3} /></mesh>
          {Array.from({ length: 9 }, (_, k) => <mesh key={k} position={[-SIZE / 2 + k * (SIZE / 8), 0.55, 0]}><boxGeometry args={[0.03, 1.1, 0.04]} /><meshStandardMaterial color="#2a282d" metalness={0.8} /></mesh>)}
        </group>
      ))}
      {bulbs.map((p, i) => (
        <mesh key={i} position={p}><sphereGeometry args={[0.05, 8, 6]} /><meshBasicMaterial color={PALETTE.pinkSoft} toneMapped={false} /></mesh>
      ))}
      <RearWall />
      <pointLight position={[0, 1.2, -SIZE / 2 + 0.3]} color={PALETTE.pink} intensity={4} distance={6} />
      <pointLight position={[-SIZE / 2 + 0.3, 1.2, 0]} color={PALETTE.pink} intensity={3} distance={6} />
      <pointLight position={[SIZE / 2 - 0.3, 1.2, 0]} color={PALETTE.pink} intensity={3} distance={6} />
    </group>
  );
}

// The apartment's rooftop access behind the starting view: wall, door, glowing 214, potted plants.
function RearWall() {
  const z = SIZE / 2 + 0.9;
  return (
    <group position={[0, 0, z]} rotation-y={Math.PI}>
      <mesh position={[0, 1.6, -0.3]}><boxGeometry args={[6, 3.6, 0.6]} /><meshToonMaterial color={PALETTE.wallLight} /><Edges color={PALETTE.ink} /></mesh>
      <mesh position={[0, 0.05, 0.4]}><boxGeometry args={[6, 0.1, 0.8]} /><meshToonMaterial color={PALETTE.wallMid} /><Edges color={PALETTE.ink} /></mesh>
      <mesh position={[0, 3.45, -0.2]}><boxGeometry args={[6.3, 0.15, 1]} /><meshToonMaterial color={PALETTE.wallMid} /><Edges color={PALETTE.ink} /></mesh>
      <mesh position={[0, 1.05, 0.08]}><boxGeometry args={[1.1, 2.1, 0.08]} /><meshToonMaterial color="#3a3238" /><Edges color={PALETTE.ink} /></mesh>
      <mesh position={[0.35, 1.0, 0.03]}><sphereGeometry args={[0.04, 8, 6]} /><meshStandardMaterial color="#c9c6cf" metalness={0.9} /></mesh>
      <mesh position={[0, 1.6, 0.03]}><planeGeometry args={[0.5, 0.6]} /><meshBasicMaterial color="#ffb3d6" toneMapped={false} /></mesh>
      <group position={[0, 2.5, 0.06]}>
        <mesh><boxGeometry args={[0.95, 0.42, 0.04]} /><meshBasicMaterial color={PALETTE.ink} /></mesh>
        {[-0.28, 0, 0.28].map((x, i) => <mesh key={i} position={[x, 0, 0.03]}><boxGeometry args={[0.16, 0.26, 0.02]} /><meshBasicMaterial color={PALETTE.pink} toneMapped={false} /></mesh>)}
      </group>
      {[-1.9, 1.9].map((x) => (
        <group key={x} position={[x, 0, 0.45]}>
          <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.28, 0.22, 0.5, 16]} /><meshToonMaterial color="#5b5660" /><Edges color={PALETTE.ink} /></mesh>
          {Array.from({ length: 7 }, (_, k) => <mesh key={k} position={[Math.sin(k * 2.4) * 0.12, 0.75 + (k % 3) * 0.12, Math.cos(k * 2.4) * 0.12]} rotation={[Math.cos(k) * 0.5, k, Math.sin(k) * 0.5]} scale={[0.12, 0.38, 0.04]}><sphereGeometry args={[1, 8, 6]} /><meshToonMaterial color={k % 2 ? "#3f8a4a" : "#2f6e3c"} /></mesh>)}
        </group>
      ))}
      {Array.from({ length: 14 }, (_, i) => { const x = -2.8 + i * 0.43; return <mesh key={i} position={[x, 3.15 - Math.sin(((i % 7) / 7) * Math.PI) * 0.25, 0.08]}><sphereGeometry args={[0.05, 8, 6]} /><meshBasicMaterial color="#ffd9a8" toneMapped={false} /></mesh>; })}
      <pointLight position={[0, 2.6, 0.8]} color={PALETTE.pink} intensity={3} distance={5} />
      <pointLight position={[0, 3, 0.6]} color="#ffd9a8" intensity={2} distance={5} />
    </group>
  );
}
