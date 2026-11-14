import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { PALETTE, WIND } from "../config";
import { LEAF, leafTexture } from "../plants/leaves";

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

function rng(seed: number) { let x = Math.sin(seed * 999) * 10000; return () => { x = Math.sin(x) * 10000; return x - Math.floor(x); }; }
const BASE: Record<PlantKind, string> = { herb: "#3f9a45", tomato: "#3a7f3a", lettuce: "#86c75a", rose: "#2f6e3c", strawberry: "#3c8a40", pepper: "#3a8040" };

function Leaf({ geo, color, pos, rot, s }: { geo: THREE.BufferGeometry; color: THREE.Color; pos: [number, number, number]; rot: [number, number, number]; s: number }) {
  return <mesh geometry={geo} position={pos} rotation={rot} scale={s * 1.8}><meshStandardMaterial map={leafTexture()} color={color} side={THREE.DoubleSide} roughness={0.55} /></mesh>;
}

function Bloom({ pos, color, s }: { pos: [number, number, number]; color: string; s: number }) {
  return (
    <group position={pos} scale={s}>
      {[0, 1, 2].map((ring) => Array.from({ length: 5 + ring }, (_, k) => {
        const a = (k / (5 + ring)) * Math.PI * 2 + ring;
        return <mesh key={`${ring}-${k}`} geometry={LEAF.petal} position={[0, ring * 0.012, 0]} rotation={[-(0.25 + ring * 0.45), a, 0]} scale={0.05 - ring * 0.012}><meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.6} emissive={color} emissiveIntensity={0.08} /></mesh>;
      }))}
      <mesh position={[0, 0.02, 0]}><sphereGeometry args={[0.012, 8, 6]} /><meshStandardMaterial color={color} /></mesh>
    </group>
  );
}

export function Plant({ kind, position, seed }: { kind: PlantKind; position: [number, number, number]; seed: number }) {
  const parts = useMemo(() => {
    const r = rng(seed + 1);
    const base = new THREE.Color(BASE[kind]).offsetHSL((r() - 0.5) * 0.04, (r() - 0.5) * 0.1, (r() - 0.5) * 0.08);
    const col = () => base.clone().offsetHSL((r() - 0.5) * 0.03, 0, (r() - 0.5) * 0.08);
    const leaves: { geo: THREE.BufferGeometry; color: THREE.Color; pos: [number, number, number]; rot: [number, number, number]; s: number }[] = [];
    const fruit: { pos: [number, number, number]; r: number; c: string }[] = [];
    const blooms: { pos: [number, number, number]; c: string; s: number }[] = [];
    const stems: { pos: [number, number, number]; h: number; tilt: [number, number, number] }[] = [];
    if (kind === "lettuce") {
      for (let i = 0; i < 16; i++) { const a = i * 2.4; const inner = i / 16; leaves.push({ geo: LEAF.ruffle, color: col().offsetHSL(0, 0, inner * 0.1), pos: [0, 0.01, 0], rot: [-(0.5 + inner * 0.9), a, 0], s: 0.2 - inner * 0.08 }); }
    } else if (kind === "herb") {
      for (let st = 0; st < 5; st++) { const a = st * 1.3 + r(); const tilt: [number, number, number] = [Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25]; const h = 0.22 + r() * 0.12; stems.push({ pos: [0, 0, 0], h, tilt });
        for (let k = 0; k < 4; k++) { const y = 0.06 + (k / 4) * h; const off: [number, number, number] = [Math.sin(tilt[2]) * -y * 0.9, y, Math.sin(tilt[0]) * y * 0.9];
          for (const side of [0, Math.PI]) leaves.push({ geo: LEAF.round, color: col(), pos: off, rot: [-0.5, a + side + k * 1.57, 0], s: 0.07 - k * 0.008 }); } }
    } else {
      const h = kind === "tomato" ? 0.65 : kind === "rose" ? 0.5 : 0.4;
      stems.push({ pos: [0, 0, 0], h, tilt: [0, 0, 0] });
      const nodes = kind === "tomato" ? 8 : 7;
      for (let k = 0; k < nodes; k++) { const y = 0.06 + (k / nodes) * h * 0.95; const a = k * 2.4 + r();
        const leaflets = kind === "tomato" ? 5 : 3;
        for (let l = 0; l < leaflets; l++) { const spread = (l - (leaflets - 1) / 2) * 0.5; leaves.push({ geo: LEAF.serrated, color: col(), pos: [Math.cos(a) * 0.03, y, Math.sin(a) * 0.03], rot: [-0.35 - Math.abs(spread) * 0.3, a + spread + Math.PI / 2, 0], s: (kind === "tomato" ? 0.12 : 0.09) * (1 - Math.abs(spread) * 0.3) }); }
        if (kind === "tomato" && k % 2 === 1) for (let f = 0; f < 3; f++) fruit.push({ pos: [Math.cos(a + 1 + f * 0.5) * 0.09, y - 0.03 - f * 0.03, Math.sin(a + 1 + f * 0.5) * 0.09], r: 0.03 + r() * 0.012, c: r() > 0.25 ? "#d9302b" : "#e8843a" });
        if (kind === "pepper" && k % 3 === 2) fruit.push({ pos: [Math.cos(a) * 0.08, y - 0.04, Math.sin(a) * 0.08], r: 0.035, c: "#f0a020" });
        if (kind === "strawberry" && k % 3 === 1) fruit.push({ pos: [Math.cos(a) * 0.1, 0.05, Math.sin(a) * 0.1], r: 0.028, c: "#e8304f" });
        if (kind === "rose" && k >= 3 && k % 2 === 1) blooms.push({ pos: [Math.cos(a) * 0.09, y + 0.05, Math.sin(a) * 0.09], c: r() > 0.3 ? "#ff8fc0" : "#fff0f6", s: 0.9 + r() * 0.4 });
      }
      if (kind === "rose") blooms.push({ pos: [0, h + 0.02, 0], c: "#ff6fae", s: 1.2 });
    }
    return { leaves, fruit, blooms, stems };
  }, [kind, seed]);
  return (
    <group position={position}>
      <Sway seed={seed}>
        {parts.stems.map((st, i) => <mesh key={i} position={[Math.sin(-st.tilt[2]) * st.h / 2, st.h / 2, Math.sin(st.tilt[0]) * st.h / 2]} rotation={st.tilt}><cylinderGeometry args={[0.006, 0.011, st.h, 5]} /><meshStandardMaterial color="#3d6b2f" roughness={0.8} /></mesh>)}
        {parts.leaves.map((l, i) => <Leaf key={i} {...l} />)}
        {parts.fruit.map((f, i) => <group key={i} position={f.pos}><mesh scale={[1, 0.85, 1]}><sphereGeometry args={[f.r, 14, 10]} /><meshPhysicalMaterial color={f.c} roughness={0.25} clearcoat={0.8} /></mesh><mesh position={[0, f.r * 0.85, 0]}><coneGeometry args={[f.r * 0.5, f.r * 0.3, 5]} /><meshStandardMaterial color="#2f6a2a" /></mesh></group>)}
        {parts.blooms.map((b, i) => <Bloom key={i} pos={b.pos} color={b.c} s={b.s} />)}
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
