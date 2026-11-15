import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Outlines, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { useXR } from "@react-three/xr";
import { PALETTE } from "../config";
import { LEAF, leafTexture } from "../plants/leaves";
import { moonVisual, type MoonQuest, type MoonStep } from "../plants/moonflower";

export const MOONFLOWER_POS: [number, number, number] = [1.4, 0, -1.0];
const TRELLIS_H = 1.3;

// Draws quest state only; tapping completes the current task (pointer now, hand pinch later).
export function Moonflower({ quest, onTask }: { quest: MoonQuest; onTask: () => void }) {
  const inVR = useXR((s) => Boolean(s.session));
  const [hovered, setHovered] = useState(false);
  const [step, setStep] = useState<MoonStep>(quest.state.step);
  useEffect(() => quest.subscribe(setStep), [quest]);
  const target = moonVisual(step);
  const vine = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const flowers = useRef<THREE.Group[]>([]);
  const soil = useRef<THREE.MeshStandardMaterial>(null);
  const cur = useRef({ vine: target.vine, bloom: 0 });

  const { curve, leaves } = useMemo(() => {
    const pts = Array.from({ length: 40 }, (_, i) => { const t = i / 39; const a = t * Math.PI * 5; return new THREE.Vector3(Math.cos(a) * 0.09, 0.02 + t * TRELLIS_H, Math.sin(a) * 0.06); });
    const curve = new THREE.CatmullRomCurve3(pts);
    const leaves = Array.from({ length: 16 }, (_, i) => { const t = 0.08 + (i / 16) * 0.9; const p = curve.getPoint(t); return { pos: [p.x * 1.6, p.y, p.z * 1.6] as [number, number, number], rot: [-0.3, i * 2.3, 0.4] as [number, number, number] }; });
    return { curve, leaves };
  }, []);
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 80, 0.012, 6), [curve]);
  const blooms: [number, number, number][] = [[0.12, 1.25, 0.08], [-0.1, 0.95, 0.06], [0.1, 0.65, 0.07]];

  useFrame(({ clock }, d) => {
    const dt = Math.min(d, 0.05);
    cur.current.vine += (target.vine - cur.current.vine) * (1 - Math.exp(-2 * dt));
    cur.current.bloom += (target.bloom - cur.current.bloom) * (1 - Math.exp(-0.8 * dt));
    if (vine.current) vine.current.scale.set(1, cur.current.vine, 1);
    flowers.current.forEach((f, i) => { if (!f) return; const b = Math.max(0, Math.min(1, cur.current.bloom * 1.4 - i * 0.2)); f.scale.setScalar(0.25 + b * 0.75); f.rotation.y = (1 - b) * 3; });
    if (ring.current) { const s = 1 + Math.sin(clock.elapsedTime * 3) * 0.08; ring.current.scale.set(s, s, 1); ring.current.visible = step !== "bloom"; }
    if (soil.current) soil.current.color.set(target.wet ? "#24160f" : "#4a3428");
  });

  const tap = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onTask(); };
  return (
    <group position={MOONFLOWER_POS} rotation-y={-0.5} scale={0.8} onClick={tap} onPointerOver={() => { setHovered(true); if (!inVR) document.body.style.cursor = "pointer"; }} onPointerOut={() => { setHovered(false); if (!inVR) document.body.style.cursor = ""; }}>
      <mesh position={[0, 0.17, 0]}><cylinderGeometry args={[0.24, 0.18, 0.34, 20]} /><meshStandardMaterial color="#2a2530" roughness={0.6} /><Outlines thickness={0.015} color={PALETTE.ink} /></mesh>
      <mesh position={[0, 0.25, 0.22]} rotation-x={-0.18}><torusGeometry args={[0.235, 0.008, 6, 32, Math.PI]} /><meshBasicMaterial color={PALETTE.pink} toneMapped={false} /></mesh>
      <mesh position={[0, 0.335, 0]} rotation-x={-Math.PI / 2}><circleGeometry args={[0.22, 20]} /><meshStandardMaterial ref={soil} color="#4a3428" roughness={1} /></mesh>
      <mesh ref={ring} position={[0, 0.01, 0]} rotation-x={-Math.PI / 2}><ringGeometry args={[0.32, 0.36, 40]} /><meshBasicMaterial color={inVR && hovered ? PALETTE.pinkSoft : PALETTE.green} toneMapped={false} transparent opacity={0.8} /></mesh>
      {/* bamboo trellis */}
      {[-0.14, 0.14].map((x) => <mesh key={x} position={[x, 0.34 + TRELLIS_H / 2, -0.05]}><cylinderGeometry args={[0.012, 0.012, TRELLIS_H, 6]} /><meshStandardMaterial color="#c9b27a" /></mesh>)}
      {[0.5, 0.8, 1.1, 1.4].map((y) => <mesh key={y} position={[0, y, -0.05]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.007, 0.007, 0.3, 5]} /><meshStandardMaterial color="#c9b27a" /></mesh>)}
      <group position={[0, 0.34, 0]}>
        <group ref={vine}>
          <mesh geometry={tube}><meshStandardMaterial color="#3f7a3a" /></mesh>
          {leaves.map((l, i) => <mesh key={i} geometry={LEAF.round} position={l.pos} rotation={l.rot} scale={0.13}><meshStandardMaterial map={leafTexture()} color="#3f8f45" side={THREE.DoubleSide} /></mesh>)}
          {blooms.map((p, i) => (
            <group key={i} position={p} ref={(g) => { if (g) flowers.current[i] = g; }} rotation-x={0.5}>
              <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.1, 0.012, 0.08, 20, 1, true]} /><meshStandardMaterial color="#fffaf2" emissive="#fff6e8" emissiveIntensity={step === "bloom" ? 0.9 : 0.15} side={THREE.DoubleSide} /></mesh>
              <mesh position={[0, 0.07, 0]}><sphereGeometry args={[0.012, 6, 5]} /><meshBasicMaterial color={PALETTE.green} toneMapped={false} /></mesh>
            </group>
          ))}
        </group>
      </group>
      {step === "bloom" && <><pointLight position={[0, 1.3, 0.3]} color="#fff4e0" intensity={1.5} distance={2.2} /><Sparkles count={inVR ? 6 : 24} scale={[0.8, 1.2, 0.8]} position={[0, 1.2, 0]} size={2.5} speed={0.3} color={PALETTE.pinkSoft} /></>}
    </group>
  );
}
