import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { PALETTE, WIND } from "../config";

export type PlantKind = "herb" | "tomato" | "strawberry" | "lettuce" | "pepper" | "rose";

export function Planter({ position, size = [1.4, 0.5, 0.6], children }: { position: [number, number, number]; size?: [number, number, number]; children?: React.ReactNode }) {
  const [w, h, d] = size;
  return (
    <group position={position}>
      <RoundedBox args={[w, h, d]} radius={0.1} smoothness={3} position={[0, h / 2, 0]}><meshStandardMaterial color="#2c2630" roughness={0.4} metalness={0.3} /><Outlines thickness={0.02} color={PALETTE.ink} /></RoundedBox>
      <mesh position={[0, h * 0.25, d / 2 + 0.006]}><boxGeometry args={[w * 0.85, 0.035, 0.01]} /><meshBasicMaterial color={PALETTE.pink} toneMapped={false} /></mesh>
      <mesh position={[0, 0.02, d / 2 + 0.006]}><boxGeometry args={[w * 0.85, 0.02, 0.01]} /><meshBasicMaterial color={PALETTE.pink} toneMapped={false} /></mesh>
      <pointLight position={[0, 0.1, d / 2 + 0.25]} color={PALETTE.pink} intensity={0.8} distance={1.2} />
      <mesh position={[0, h + 0.005, 0]}><boxGeometry args={[w * 0.94, 0.02, d * 0.9]} /><meshStandardMaterial color="#3d2a22" roughness={1} /></mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (w / 2 - 0.08), h * 0.65, d / 2 + 0.008]}><circleGeometry args={[0.025, 10]} /><meshBasicMaterial color={s > 0 ? PALETTE.green : PALETTE.pinkSoft} toneMapped={false} /></mesh>
      ))}
      <group position={[0, h, 0]}>{children}</group>
    </group>
  );
}

function Sway({ children, seed }: { children: React.ReactNode; seed: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (!ref.current) return; const t = clock.elapsedTime * WIND.speed + seed;
    ref.current.rotation.z = Math.sin(t) * WIND.strength; ref.current.rotation.x = Math.sin(t * 0.7 + 1) * WIND.strength * 0.6; });
  return <group ref={ref}>{children}</group>;
}

const LEAF_COLORS = ["#3fae5a", "#58c46c", "#2f8f4e", "#77d47e"];

export function Plant({ kind, position, seed }: { kind: PlantKind; position: [number, number, number]; seed: number }) {
  const leaves = useMemo(() => Array.from({ length: kind === "lettuce" ? 9 : 6 }, (_, i) => i), [kind]);
  const fruitColor = kind === "tomato" ? "#e8423a" : kind === "strawberry" ? "#ff3b6b" : kind === "pepper" ? "#ffb02e" : kind === "rose" ? "#ff8fc8" : null;
  const height = kind === "herb" ? 0.35 : kind === "lettuce" ? 0.12 : 0.5;
  return (
    <group position={position}>
      <Sway seed={seed}>
        {kind !== "lettuce" && <mesh position={[0, height / 2, 0]}><cylinderGeometry args={[0.012, 0.018, height, 5]} /><meshStandardMaterial color="#2f7a3e" /></mesh>}
        {leaves.map((i) => {
          const a = (i / leaves.length) * Math.PI * 2 + seed;
          const y = kind === "lettuce" ? 0.06 : 0.08 + (i / leaves.length) * height;
          const s = kind === "lettuce" ? 0.11 : kind === "herb" ? 0.06 : 0.08;
          return (
            <mesh key={i} position={[Math.cos(a) * s * 0.7, y, Math.sin(a) * s * 0.7]} rotation={[0.6, -a, 0]} scale={[s, s * 0.25, s * 1.6]}>
              <sphereGeometry args={[1, 8, 6]} />
              <meshStandardMaterial color={LEAF_COLORS[i % 4]!} emissive="#1b5e2b" emissiveIntensity={0.35} roughness={0.5} />
            </mesh>
          );
        })}
        {fruitColor && [0, 1, 2].map((i) => {
          const a = i * 2.1 + seed;
          return <mesh key={i} position={[Math.cos(a) * 0.08, height * (0.45 + i * 0.15), Math.sin(a) * 0.08]}>{kind === "rose" ? <dodecahedronGeometry args={[0.05]} /> : <sphereGeometry args={[kind === "strawberry" ? 0.035 : 0.045, 10, 8]} />}<meshStandardMaterial color={fruitColor} emissive={fruitColor} emissiveIntensity={0.25} roughness={0.25} /></mesh>;
        })}
        {kind === "herb" && <mesh position={[0, height + 0.02, 0]}><sphereGeometry args={[0.025, 8, 6]} /><meshStandardMaterial color="#c89bff" emissive="#c89bff" emissiveIntensity={0.5} /></mesh>}
      </Sway>
    </group>
  );
}

export function Garden() {
  const rows: { pos: [number, number, number]; rot: number; kinds: PlantKind[] }[] = [
    { pos: [-1.8, 0, -3.2], rot: 0, kinds: ["tomato", "herb", "tomato"] },
    { pos: [1.8, 0, -3.2], rot: 0, kinds: ["strawberry", "lettuce", "strawberry"] },
    { pos: [-3.2, 0, -0.6], rot: Math.PI / 2, kinds: ["herb", "pepper", "herb"] },
    { pos: [3.2, 0, -0.6], rot: -Math.PI / 2, kinds: ["rose", "lettuce", "rose"] },
    { pos: [3.2, 0, 2.6], rot: -Math.PI / 2, kinds: ["rose", "herb", "rose"] },
  ];
  return (
    <group>
      {rows.map((r, i) => (
        <group key={i} position={r.pos} rotation-y={r.rot}>
          <Planter position={[0, 0, 0]}>
            {r.kinds.map((k, j) => <Plant key={j} kind={k} position={[(j - 1) * 0.42, 0, 0]} seed={i * 3 + j} />)}
          </Planter>
          {i < 2 && [-0.55, 0.55].map((x) => <group key={x} position={[x, 0.52, 0.22]}><mesh><sphereGeometry args={[0.09, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /><meshStandardMaterial color="#f4e6ee" side={THREE.DoubleSide} /></mesh>{[0, 1, 2].map((k) => <mesh key={k} position={[(k - 1) * 0.04, 0.02, 0]}><sphereGeometry args={[0.03, 8, 6]} /><meshStandardMaterial color={["#e8423a", "#ffb02e", "#ff3b6b"][k]!} /></mesh>)}</group>)}
          <pointLight position={[0, 0.9, 0.4]} color="#ffd6ec" intensity={1.2} distance={2.2} />
        </group>
      ))}
    </group>
  );
}
