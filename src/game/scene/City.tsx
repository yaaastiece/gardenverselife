import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import * as THREE from "three";
import { PALETTE, CARS } from "../config";

function seeded(n: number) { let s = n; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

function makeFacade(seed: number) {
  const c = document.createElement("canvas"); c.width = 128; c.height = 256;
  const g = c.getContext("2d")!; const r = seeded(seed);
  g.fillStyle = "#000"; g.fillRect(0, 0, 128, 256);
  const emissive = document.createElement("canvas"); emissive.width = 128; emissive.height = 256;
  const e = emissive.getContext("2d")!; e.fillStyle = "#000"; e.fillRect(0, 0, 128, 256);
  for (let y = 8; y < 250; y += 16) for (let x = 8; x < 124; x += 16) {
    const v = r(); g.fillStyle = "#222"; g.fillRect(x, y, 9, 10);
    if (v > 0.82) { e.fillStyle = v > 0.97 ? PALETTE.green : PALETTE.pink; e.fillRect(x, y, 9, 10); }
  }
  const t = new THREE.CanvasTexture(emissive); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

type B = { x: number; z: number; w: number; d: number; h: number; tone: string; tex: number };

export function City() {
  const facades = useMemo(() => [1, 2, 3].map(makeFacade), []);
  const buildings = useMemo<B[]>(() => {
    const r = seeded(42); const list: B[] = [];
    const tones = [PALETTE.wallLight, PALETTE.wallMid, PALETTE.wallDark];
    for (let i = 0; i < 70; i++) {
      const a = r() * Math.PI * 2; const dist = 28 + r() * 70;
      const tall = r() > 0.6;
      list.push({ x: Math.sin(a) * dist, z: Math.cos(a) * dist, w: 4 + r() * 6, d: 4 + r() * 6, h: tall ? 25 + r() * 45 : 6 + r() * 14, tone: tones[Math.floor(r() * 3)], tex: Math.floor(r() * 3) });
    }
    return list;
  }, []);
  return (
    <group position={[0, -12, 0]}>
      <mesh rotation-x={-Math.PI / 2}><circleGeometry args={[120, 32]} /><meshBasicMaterial color="#1a181c" /></mesh>
      {buildings.map((b, i) => {
        const tex = facades[b.tex].clone(); tex.repeat.set(b.w / 8, b.h / 16); tex.needsUpdate = true;
        return (
          <group key={i} position={[b.x, b.h / 2, b.z]}>
            <mesh>
              <boxGeometry args={[b.w, b.h, b.d]} />
              <meshToonMaterial color={b.tone} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={1.6} />
              <Edges color={PALETTE.ink} />
            </mesh>
            {b.h > 30 && <mesh position={[0, b.h / 2 + 0.3, 0]}><boxGeometry args={[b.w * 0.9, 0.25, b.d * 0.9]} /><meshBasicMaterial color={i % 5 === 0 ? PALETTE.green : PALETTE.pink} toneMapped={false} /></mesh>}
          </group>
        );
      })}
      <FlyingCars />
    </group>
  );
}

function FlyingCars() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const cars = useMemo(() => { const r = seeded(9); return Array.from({ length: CARS.count }, () => ({ radius: 30 + r() * 40, y: 22 + r() * 18, speed: (CARS.minSpeed + r() * (CARS.maxSpeed - CARS.minSpeed)) * (r() > 0.5 ? 1 : -1), phase: r() * Math.PI * 2 })); }, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    cars.forEach((c, i) => { const g = refs.current[i]; if (!g) return; const a = c.phase + t * c.speed;
      g.position.set(Math.sin(a) * c.radius, c.y + Math.sin(t * 0.5 + i) * 0.4, Math.cos(a) * c.radius);
      g.rotation.y = a + (c.speed > 0 ? Math.PI / 2 : -Math.PI / 2); });
  });
  return <>{cars.map((_, i) => (
    <group key={i} ref={(el) => { refs.current[i] = el; }}>
      <mesh><capsuleGeometry args={[0.5, 1.6, 4, 8]} /><meshToonMaterial color={PALETTE.wallMid} /><Edges color={PALETTE.ink} /></mesh>
      <mesh rotation-z={Math.PI / 2} position={[0, 0, 0]}><boxGeometry args={[0.15, 0.15, 0.15]} /><meshBasicMaterial color={PALETTE.pink} toneMapped={false} /></mesh>
      <mesh position={[0, 0, 4.5]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.18, 0.02, 7, 6, 1, true]} /><meshBasicMaterial color={PALETTE.pink} transparent opacity={0.35} toneMapped={false} depthWrite={false} /></mesh>
    </group>
  ))}</>;
}
