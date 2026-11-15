import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { PALETTE, WIND } from "../config";
import { LEAF, leafTexture } from "../plants/leaves";

export type PlantKind = "herb" | "tomato" | "strawberry" | "lettuce" | "pepper" | "rose";

const METAL = { color: "#9a97a0", metalness: 0.85, roughness: 0.38 };

// Deep brushed-metal raised bed: thick rounded rim, soil just below it, pink LED strip at the base.
export function Planter({ position, size = [1.4, 0.75, 0.8], children }: { position: [number, number, number]; size?: [number, number, number]; children?: React.ReactNode }) {
  const [w, h, d] = size;
  const t = 0.07; // wall thickness
  const sink = 0.1; // soil sits this far below the rim
  const wall = (args: [number, number, number], pos: [number, number, number], k: string) => (
    <RoundedBox key={k} args={args} radius={0.03} smoothness={2} position={pos}><meshStandardMaterial {...METAL} map={brushedTexture()} /><Outlines thickness={0.015} color={PALETTE.ink} /></RoundedBox>
  );
  return (
    <group position={position}>
      {/* Open trough: four walls around a hollow cavity, not a solid block */}
      {wall([w, h, t], [0, h / 2, d / 2 - t / 2], "f")}
      {wall([w, h, t], [0, h / 2, -d / 2 + t / 2], "b")}
      {wall([t, h, d - t * 2], [w / 2 - t / 2, h / 2, 0], "r")}
      {wall([t, h, d - t * 2], [-w / 2 + t / 2, h / 2, 0], "l")}
      {/* Thick rounded collar */}
      {[[w + 0.06, 0.06, t + 0.05, 0, d / 2 - t / 2], [w + 0.06, 0.06, t + 0.05, 0, -d / 2 + t / 2]].map(([a, b, c, x, z], i) => <RoundedBox key={`cz${i}`} args={[a!, b!, c!]} radius={0.028} smoothness={3} position={[x!, h, z!]}><meshStandardMaterial {...METAL} color="#b4b1ba" roughness={0.28} /><Outlines thickness={0.013} color={PALETTE.ink} /></RoundedBox>)}
      {[1, -1].map((sx) => <RoundedBox key={`cx${sx}`} args={[t + 0.05, 0.06, d + 0.06]} radius={0.028} smoothness={3} position={[sx * (w / 2 - t / 2), h, 0]}><meshStandardMaterial {...METAL} color="#b4b1ba" roughness={0.28} /><Outlines thickness={0.013} color={PALETTE.ink} /></RoundedBox>)}
      {/* Recessed soil with lumps */}
      <mesh position={[0, h - sink, 0]} rotation-x={-Math.PI / 2}><planeGeometry args={[w - t * 2, d - t * 2]} /><meshStandardMaterial color="#221812" map={soilTexture()} roughness={1} /></mesh>
      {Array.from({ length: Math.round(w * 6) }, (_, i) => { const r = rng(i + w * 10); return <mesh key={`m${i}`} position={[(r() - 0.5) * (w - 0.2), h - sink, (r() - 0.5) * (d - 0.2)]} scale={[1, 0.35, 1]}><sphereGeometry args={[0.05 + r() * 0.04, 7, 5]} /><meshStandardMaterial color="#2a1d15" roughness={1} /></mesh>; })}
      {/* Inset groove with neon tube */}
      <mesh position={[0, 0.09, d / 2 + 0.001]}><boxGeometry args={[w * 0.94, 0.05, 0.004]} /><meshStandardMaterial color="#26222a" roughness={0.6} /></mesh>
      <mesh position={[0, 0.09, d / 2 + 0.006]}><boxGeometry args={[w * 0.92, 0.022, 0.01]} /><meshBasicMaterial color={PALETTE.pink} toneMapped={false} /></mesh>
      <pointLight position={[0, 0.1, d / 2 + 0.25]} color={PALETTE.pink} intensity={0.8} distance={1.2} />
      <group position={[0, h - sink, 0]}>{children}</group>
    </group>
  );
}

let soil: THREE.CanvasTexture | null = null;
function soilTexture() {
  if (soil) return soil;
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d")!; g.fillStyle = "#3a2a20"; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) { const v = 20 + Math.random() * 60; g.fillStyle = `rgb(${v},${v * 0.72},${v * 0.55})`; g.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 3, 1 + Math.random() * 2); }
  soil = new THREE.CanvasTexture(c); soil.colorSpace = THREE.SRGBColorSpace; soil.wrapS = soil.wrapT = THREE.RepeatWrapping; soil.repeat.set(3, 1);
  return soil;
}

let brushed: THREE.CanvasTexture | null = null;
function brushedTexture() {
  if (brushed) return brushed;
  const c = document.createElement("canvas"); c.width = 256; c.height = 64;
  const g = c.getContext("2d")!; g.fillStyle = "#c8c6cc"; g.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${Math.random() > 0.5 ? "255,255,255" : "40,40,48"},${0.05 + Math.random() * 0.08})`; g.fillRect(Math.random() * 256, Math.random() * 64, 30 + Math.random() * 120, 1); }
  brushed = new THREE.CanvasTexture(c); brushed.colorSpace = THREE.SRGBColorSpace; brushed.wrapS = brushed.wrapT = THREE.RepeatWrapping;
  return brushed;
}

/** Leaves spilling over the rim on all four sides, one instanced draw. */
function Spill({ w, d, seed }: { w: number; d: number; seed: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = Math.round((w + d) * 5);
  useEffect(() => {
    const m = ref.current; if (!m) return; const r = rng(seed + 77); const o = new THREE.Object3D(); const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const t = r(); const side = i % 4; const along = side < 2 ? (t - 0.5) * w : (t - 0.5) * d;
      const out = (side < 2 ? d : w) / 2 + 0.02;
      const x = side < 2 ? along : side === 2 ? out : -out; const z = side < 2 ? (side === 0 ? out : -out) : along;
      o.position.set(x, -0.02 - r() * 0.05, z); o.rotation.set(0, Math.atan2(x - x * 0.5 * (side >= 2 ? 1 : 0), z) , 0);
      o.lookAt(x * 3, -0.6, z * 3); o.rotateX(-0.3 - r() * 0.6); o.rotateZ((r() - 0.5) * 1.2);
      o.scale.setScalar(0.16 + r() * 0.12); o.updateMatrix(); m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, c.set(["#3f8f45", "#5aa84a", "#2f7a3c", "#77c25a"][i % 4]!));
    }
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [w, d, seed, count]);
  return <instancedMesh ref={ref} args={[LEAF.serrated, undefined, count]}><meshStandardMaterial map={leafTexture()} side={THREE.DoubleSide} roughness={0.6} /></instancedMesh>;
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
        {kind === "tomato" && <><mesh position={[0.05, 0.4, -0.04]}><cylinderGeometry args={[0.009, 0.011, 0.8, 5]} /><meshStandardMaterial color="#a9875a" roughness={0.9} /></mesh>{[0.25, 0.5].map((y) => <mesh key={y} position={[0.05, y, -0.04]}><torusGeometry args={[0.022, 0.004, 4, 10]} /><meshStandardMaterial color="#d8c7a0" /></mesh>)}</>}
        {parts.stems.map((st, i) => <mesh key={i} position={[Math.sin(-st.tilt[2]) * st.h / 2, st.h / 2, Math.sin(st.tilt[0]) * st.h / 2]} rotation={st.tilt}><cylinderGeometry args={[0.006, 0.011, st.h, 5]} /><meshStandardMaterial color="#3d6b2f" roughness={0.8} /></mesh>)}
        {parts.leaves.map((l, i) => <Leaf key={i} {...l} />)}
        {parts.fruit.map((f, i) => <group key={i} position={f.pos}><mesh scale={[1, 0.85, 1]}><sphereGeometry args={[f.r, 14, 10]} /><meshPhysicalMaterial color={f.c} roughness={0.25} clearcoat={0.8} /></mesh><mesh position={[0, f.r * 0.85, 0]}><coneGeometry args={[f.r * 0.5, f.r * 0.3, 5]} /><meshStandardMaterial color="#2f6a2a" /></mesh></group>)}
        {parts.blooms.map((b, i) => <Bloom key={i} pos={b.pos} color={b.c} s={b.s} />)}
      </Sway>
    </group>
  );
}

type Row = { pos: [number, number, number]; rot: number; size: [number, number, number]; kinds: PlantKind[]; bowls?: boolean };
// Varied lengths, heights and mixes; positions match CARE_TARGETS in interaction.ts.
const ROWS: Row[] = [
  { pos: [-2.6, 0, -1.2], rot: Math.PI / 2, size: [4.6, 0.75, 0.85], kinds: ["herb", "lettuce", "herb", "tomato", "lettuce", "tomato", "herb", "tomato", "lettuce", "rose"] },
  { pos: [-1.3, 0, -3.4], rot: 0, size: [1.6, 0.68, 0.7], kinds: ["tomato", "herb", "lettuce", "strawberry"] },
  { pos: [1.4, 0, -3.4], rot: 0, size: [2.4, 0.8, 0.75], kinds: ["lettuce", "rose", "herb", "rose", "rose", "pepper"] },
  { pos: [2.8, 0, -1.7], rot: -Math.PI / 2, size: [2.2, 0.72, 0.75], kinds: ["rose", "herb", "rose", "rose", "lettuce"] },
];

export function Garden() {
  return (
    <group>
      {ROWS.map((r, i) => {
        const [w, , d] = r.size;
        const n = r.kinds.length; const step = (w - 0.3) / Math.max(1, n - 1);
        return (
          <group key={i} position={r.pos} rotation-y={r.rot}>
            <Planter position={[0, 0, 0]} size={r.size}>
              {r.kinds.map((k, j) => <group key={j} position={[-w / 2 + 0.15 + j * step, 0, (j % 2 ? -1 : 1) * d * 0.18]} scale={1.25}><Plant kind={k} position={[0, 0, 0]} seed={i * 11 + j} /></group>)}
              {r.kinds.map((k, j) => k === "tomato" && <mesh key={`ft${j}`} position={[-w / 2 + 0.15 + j * step + 0.12, 0.025, d * 0.2]}><sphereGeometry args={[0.035, 10, 8]} /><meshPhysicalMaterial color="#d9302b" roughness={0.3} clearcoat={0.7} /></mesh>)}
              <group position={[0, 0.1, 0]}><Spill w={w + 0.02} d={d + 0.02} seed={i} /></group>
            </Planter>
            <pointLight position={[0, 1.2, 0.5]} color="#ffd6ec" intensity={1.2} distance={2.5} />
          </group>
        );
      })}
    </group>
  );
}
