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
      <RoundedBox args={[w, h, d]} radius={0.1} smoothness={3} position={[0, h / 2, 0]}><meshPhysicalMaterial color="#f6dcea" roughness={0.08} metalness={0.1} transparent opacity={0.55} clearcoat={1} /><Outlines thickness={0.02} color={PALETTE.ink} /></RoundedBox>
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

type Row = { pos: [number, number, number]; rot: number; size: [number, number, number]; kinds: PlantKind[]; bowls?: boolean };
const ROWS: Row[] = [
  // long left planter: tomatoes + herbs
  { pos: [-2.6, 0, -1.2], rot: Math.PI / 2, size: [4.6, 0.55, 0.8], kinds: ["herb", "lettuce", "herb", "tomato", "tomato", "tomato", "herb", "tomato"] },
  // back-left: fruit bowls
  { pos: [-1.2, 0, -3.4], rot: 0, size: [1.8, 0.5, 0.6], kinds: ["tomato", "herb"], bowls: true },
  // back-right + right: flowers
  { pos: [1.4, 0, -3.4], rot: 0, size: [2.2, 0.5, 0.6], kinds: ["lettuce", "rose", "rose", "rose"] },
  { pos: [2.8, 0, -1.6], rot: -Math.PI / 2, size: [2.8, 0.55, 0.7], kinds: ["rose", "rose", "herb", "rose", "rose"] },
];

export function Garden() {
  return (
    <group>
      {ROWS.map((r, i) => {
        const step = (r.size[0] - 0.4) / Math.max(1, r.kinds.length - 1);
        return (
          <group key={i} position={r.pos} rotation-y={r.rot}>
            <Planter position={[0, 0, 0]} size={r.size}>
              {r.kinds.map((k, j) => <Plant key={j} kind={k} position={[-r.size[0] / 2 + 0.2 + j * step, 0, 0]} seed={i * 7 + j} />)}
            </Planter>
            {r.bowls && [-0.3, 0.45].map((x) => <group key={x} position={[x, r.size[1] + 0.06, 0.05]}><mesh><sphereGeometry args={[0.14, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /><meshStandardMaterial color="#f4e6ee" side={THREE.DoubleSide} /></mesh>{[0, 1, 2].map((k) => <mesh key={k} position={[(k - 1) * 0.06, -0.02, 0]}><sphereGeometry args={[0.045, 8, 6]} /><meshStandardMaterial color={["#e8423a", "#ffb02e", "#ff3b6b"][k]!} /></mesh>)}</group>)}
            <pointLight position={[0, 0.9, 0.4]} color="#ffd6ec" intensity={1.2} distance={2.5} />
          </group>
        );
      })}
    </group>
  );
}
