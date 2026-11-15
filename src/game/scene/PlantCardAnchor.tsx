import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import type { PlantFx, PlantSelection } from "../plants/beds";

// Projects the picked plant above its head each frame; phones pin the card by CSS instead.
export function PlantCardAnchor({ selection, cardRef }: { selection: PlantSelection; cardRef: React.RefObject<HTMLDivElement | null> }) {
  const { camera, size } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const el = cardRef.current; const p = selection.state.selected ?? selection.state.hover;
    if (!el || !p) return;
    if (window.matchMedia("(max-width: 767px)").matches) { el.style.transform = ""; return; }
    v.set(p.pos.x, p.pos.y, p.pos.z).project(camera);
    const behind = v.z > 1;
    const x = (v.x * 0.5 + 0.5) * size.width; const y = (-v.y * 0.5 + 0.5) * size.height;
    el.style.visibility = behind ? "hidden" : "visible";
    el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -100%)`;
  });
  return null;
}

const DROPS = 24;
function Fx({ fx }: { fx: PlantFx }) {
  const drops = useRef<THREE.InstancedMesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const t = useRef(0);
  const [done, setDone] = useState(false);
  const o = useMemo(() => new THREE.Object3D(), []);
  const dirs = useMemo(() => Array.from({ length: DROPS }, (_, i) => { const a = (i / DROPS) * Math.PI * 2; return [Math.cos(a) * (0.2 + (i % 3) * 0.12), 0.9 + (i % 4) * 0.2, Math.sin(a) * (0.2 + (i % 3) * 0.12)] as const; }), []);
  useEffect(() => { const id = setTimeout(() => setDone(true), fx.action === "sun" ? 5000 : 1800); return () => clearTimeout(id); }, [fx]);
  useFrame((_, d) => {
    t.current += Math.min(d, 0.05); const tt = t.current;
    if (drops.current) {
      dirs.forEach((dd, i) => { o.position.set(dd[0] * tt, dd[1] * tt - 2.5 * tt * tt, dd[2] * tt); o.scale.setScalar(Math.max(0, 1 - tt / 1.1)); o.updateMatrix(); drops.current!.setMatrixAt(i, o.matrix); });
      drops.current.instanceMatrix.needsUpdate = true;
    }
    if (light.current) light.current.intensity = Math.min(1, tt * 2) * Math.max(0, Math.min(1, (5 - tt) * 2)) * 5;
  });
  if (done) return null;
  const base: [number, number, number] = [fx.pos.x, fx.pos.y - 0.7, fx.pos.z];
  return <group position={base}>
    {fx.action === "water" && <instancedMesh ref={drops} args={[undefined, undefined, DROPS]}><sphereGeometry args={[0.025, 6, 5]} /><meshBasicMaterial color="#9fe8ff" toneMapped={false} /></instancedMesh>}
    {fx.action === "sun" && <pointLight ref={light} position={[0, 0.9, 0]} color="#ffc070" intensity={0} distance={2.2} />}
    {fx.action === "soil" && <Sparkles position={[0, 0.15, 0]} count={24} scale={[0.4, 0.25, 0.4]} size={4} speed={1.5} color="#c9a26b" />}
  </group>;
}

export function PlantFxLayer({ selection }: { selection: PlantSelection }) {
  const [fx, setFx] = useState<PlantFx | null>(null);
  useEffect(() => selection.subscribe(() => setFx(selection.state.fx)), [selection]);
  return fx ? <Fx key={fx.id} fx={fx} /> : null;
}
