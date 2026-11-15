import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Outlines } from "@react-three/drei";
import { Plant } from "./Garden";
import { PALETTE, PLANTER } from "../config";
import { companionStages } from "../plants/growth";
import { Sparkles } from "@react-three/drei";
import { Suspense } from "react";
import { PlantCompanion } from "./PlantCompanion";
import { useXR } from "@react-three/xr";
import type { PlantCare } from "../plants/care";

const DROPS = 40;
// Full, round bush packed in a ring around the plantlet, set low in the soil.
const BUSH = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2 + 0.2; const r = i % 2 ? 0.3 : 0.22;
  return { kind: (i % 3 === 0 ? "rose" : "herb") as "herb" | "rose", pos: [Math.cos(a) * r, 0.47, Math.sin(a) * r] as [number, number, number] };
});
/** The plantlet's feet stand just above the bush top. */
const COMPANION_LIFT = 0.64;
// Round pedestal table planter.
const tableBody = new THREE.CylinderGeometry(0.42, 0.34, 0.5, 48);
const tableTop = new THREE.CircleGeometry(0.38, 48);
export function Seedling({ onStageChange, care, paused = false }: { onStageChange: (name: string) => void; care: PlantCare; paused?: boolean }) {
  const [stage, setStage] = useState(care.state.stage);
  const [compost, setCompost] = useState(-1);
  const stages = companionStages();
  const glow = useRef<THREE.PointLight>(null);
  const cone = useRef<THREE.Mesh>(null);
  useEffect(() => care.subscribe((st) => { setStage((p) => { if (st.stage !== p) { prevHeight.current = stages[p]!.height; grow.current = 0; } return st.stage; }); setCompost(st.compostAt); }), [care]);
  const [hover, setHover] = useState(false);
  const grow = useRef(1); // 0..1 tween toward current stage
  const plant = useRef<THREE.Group>(null);
  const burst = useRef(-1);
  const drops = useRef<THREE.InstancedMesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const dirs = useMemo(() => Array.from({ length: DROPS }, (_, i) => { const a = (i / DROPS) * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * (0.3 + (i % 3) * 0.2), 1.2 + (i % 5) * 0.25, Math.sin(a) * (0.3 + (i % 3) * 0.2)); }), []);
  const prevHeight = useRef(stages[0]!.height);
  const s = stages[stage]!;

  useEffect(() => { onStageChange(s.name); }, [s.name, onStageChange]);
  useEffect(() => { document.body.style.cursor = hover ? "pointer" : "auto"; return () => { document.body.style.cursor = "auto"; }; }, [hover]);

  const water = () => {
    burst.current = 0;
    care.act("water");
  };

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!paused) care.tick(dt);
    const lit = care.state.time < care.state.lightUntil;
    if (glow.current) glow.current.intensity = THREE.MathUtils.lerp(glow.current.intensity, lit ? 6 : 0, 0.1);
    if (cone.current) { const m = cone.current.material as THREE.MeshBasicMaterial; m.opacity = THREE.MathUtils.lerp(m.opacity, lit ? 0.18 : 0, 0.1); }
    grow.current = Math.min(1, grow.current + dt * 0.8);
    if (drops.current) {
      const active = burst.current >= 0 && burst.current < 1.2;
      if (active) burst.current += dt;
      dirs.forEach((d, i) => {
        const tt = burst.current;
        if (!active) dummy.scale.setScalar(0);
        else { dummy.position.set(d.x * tt, 0.25 + d.y * tt - 2.5 * tt * tt, d.z * tt); dummy.scale.setScalar(Math.max(0, 1 - tt / 1.2)); }
        dummy.updateMatrix(); drops.current!.setMatrixAt(i, dummy.matrix);
      });
      drops.current.instanceMatrix.needsUpdate = true;
      if (ring.current) { const tt = Math.max(0, burst.current); ring.current.scale.setScalar(active ? 0.2 + tt * 1.4 : 0.001); (ring.current.material as THREE.MeshBasicMaterial).opacity = active ? 0.7 * (1 - tt / 1.2) : 0; }
    }
  });

  return (
    <group position={[PLANTER.x, 0, PLANTER.z]} scale={PLANTER.scale}>
      <group onClick={(e) => { e.stopPropagation(); water(); }} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
        <group><mesh geometry={tableBody} position={[0, 0.25, 0]}><meshStandardMaterial color="#a8a5ae" metalness={0.85} roughness={0.32} /><Outlines thickness={0.015} color={PALETTE.ink} /></mesh>
        <mesh position={[0, 0.5, 0]} rotation-x={Math.PI / 2}><torusGeometry args={[0.4, 0.03, 10, 48]} /><meshStandardMaterial color="#b4b1ba" metalness={0.85} roughness={0.28} /></mesh>
        <mesh geometry={tableTop} position={[0, 0.49, 0]} rotation-x={-Math.PI / 2}><meshStandardMaterial color="#1f1510" roughness={1} /></mesh></group>
        <mesh position={[0, 0.05, 0]} rotation-x={Math.PI / 2}><torusGeometry args={[0.38, 0.012, 6, 48]} /><meshBasicMaterial color={hover ? PALETTE.green : PALETTE.pink} toneMapped={false} /></mesh>
        {BUSH.map((p, i) => <group key={i} position={p.pos} scale={p.kind === "rose" ? 0.42 : 0.6}><Plant kind={p.kind} position={[0, 0, 0]} seed={40 + i} /></group>)}
      </group>
      <group ref={plant} position={[0, COMPANION_LIFT, 0]}><Suspense fallback={null}><PlantCompanion stage={stage} care={care} onWater={water} onHover={setHover} /></Suspense></group>
      <instancedMesh ref={drops} args={[undefined, undefined, DROPS]}><sphereGeometry args={[0.03, 6, 5]} /><meshBasicMaterial color="#9fe8ff" toneMapped={false} /></instancedMesh>
      <mesh ref={ring} position={[0, 0.58, 0]} rotation-x={-Math.PI / 2}><ringGeometry args={[0.18, 0.24, 32]} /><meshBasicMaterial color={PALETTE.green} transparent opacity={0} toneMapped={false} /></mesh>
      <pointLight ref={glow} position={[0, 1.6, 0]} color="#ffc070" intensity={0} distance={3} />
      <mesh ref={cone} position={[0, 1.15, 0]}><coneGeometry args={[0.45, 1.3, 24, 1, true]} /><meshBasicMaterial color="#ffc070" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} /></mesh>
      {compost >= 0 && <CompostSparkle key={compost} />}
      <pointLight position={[0, 1.2, 0.3]} color="#ffe0f0" intensity={2} distance={3} />
    </group>
  );
}

function CompostSparkle() {
  const inVR = useXR((s) => Boolean(s.session));
  const [on, setOn] = useState(true);
  useEffect(() => { const t = setTimeout(() => setOn(false), 1800); return () => clearTimeout(t); }, []);
  return on ? <Sparkles position={[0, 0.6, 0]} count={inVR ? 6 : 30} scale={[0.6, 0.3, 0.6]} size={4} speed={1.5} color="#c9a26b" /> : null;
}
