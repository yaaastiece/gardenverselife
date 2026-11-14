import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import * as THREE from "three";
import { PALETTE, WIND } from "../config";
import { SEEDLING_STAGES, nextStage } from "../plants/growth";

const DROPS = 40;

export function Seedling({ onStageChange }: { onStageChange: (name: string) => void }) {
  const [stage, setStage] = useState(0);
  const [hover, setHover] = useState(false);
  const grow = useRef(1); // 0..1 tween toward current stage
  const plant = useRef<THREE.Group>(null);
  const burst = useRef(-1);
  const drops = useRef<THREE.InstancedMesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const dirs = useMemo(() => Array.from({ length: DROPS }, (_, i) => { const a = (i / DROPS) * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * (0.3 + (i % 3) * 0.2), 1.2 + (i % 5) * 0.25, Math.sin(a) * (0.3 + (i % 3) * 0.2)); }), []);
  const prevHeight = useRef(SEEDLING_STAGES[0].height);
  const s = SEEDLING_STAGES[stage];

  useEffect(() => { onStageChange(s.name); }, [s.name, onStageChange]);
  useEffect(() => { document.body.style.cursor = hover ? "pointer" : "auto"; return () => { document.body.style.cursor = "auto"; }; }, [hover]);

  const water = () => {
    burst.current = 0;
    const n = nextStage(stage);
    if (n !== stage) { prevHeight.current = s.height; grow.current = 0; setStage(n); }
  };

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    grow.current = Math.min(1, grow.current + dt * 0.8);
    if (plant.current) {
      const e = 1 - Math.pow(1 - grow.current, 3);
      const k = THREE.MathUtils.lerp(prevHeight.current / s.height, 1, e);
      plant.current.scale.setScalar(k);
      const t = clock.elapsedTime * WIND.speed;
      plant.current.rotation.z = Math.sin(t) * WIND.strength * 1.2;
    }
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
    <group position={[0, 0, -1.4]}>
      <group onClick={(e) => { e.stopPropagation(); water(); }} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
        <mesh position={[0, 0.06, 0]}><cylinderGeometry args={[0.55, 0.6, 0.12, 32]} /><meshStandardMaterial color="#e9e3ea" metalness={0.6} roughness={0.25} /></mesh>
        <mesh position={[0, 0.125, 0]} rotation-x={Math.PI / 2}><torusGeometry args={[0.56, 0.012, 6, 48]} /><meshBasicMaterial color={hover ? PALETTE.green : PALETTE.pink} toneMapped={false} /></mesh>
        <mesh position={[0, 0.35, 0]}><cylinderGeometry args={[0.24, 0.17, 0.4, 24]} /><meshStandardMaterial color="#ffd3e8" metalness={0.3} roughness={0.2} emissive={PALETTE.pink} emissiveIntensity={hover ? 0.35 : 0.12} /><Outlines thickness={0.015} color={PALETTE.ink} /></mesh>
        <mesh position={[0, 0.555, 0]} rotation-x={-Math.PI / 2}><circleGeometry args={[0.22, 24]} /><meshStandardMaterial color="#3d2a22" /></mesh>
        <group ref={plant} position={[0, 0.56, 0]}>
          <mesh position={[0, s.height / 2, 0]}><cylinderGeometry args={[0.012, 0.02, s.height, 6]} /><meshStandardMaterial color="#3a9a4c" /></mesh>
          {Array.from({ length: s.leaves }, (_, i) => {
            const a = i * 2.4; const y = s.height * (0.45 + (i / s.leaves) * 0.55);
            return <mesh key={`${stage}-${i}`} position={[Math.cos(a) * s.leafSize * 0.8, y, Math.sin(a) * s.leafSize * 0.8]} rotation={[0.5, -a, 0]} scale={[s.leafSize, s.leafSize * 0.25, s.leafSize * 1.7]}>
              <sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color="#6be07a" emissive="#2fae4a" emissiveIntensity={0.45} roughness={0.4} />
            </mesh>;
          })}
        </group>
        <mesh position={[0, 0.8, 0]}><cylinderGeometry args={[0.35, 0.35, 0.8, 8]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>
      </group>
      <instancedMesh ref={drops} args={[undefined, undefined, DROPS]}><sphereGeometry args={[0.03, 6, 5]} /><meshBasicMaterial color="#9fe8ff" toneMapped={false} /></instancedMesh>
      <mesh ref={ring} position={[0, 0.58, 0]} rotation-x={-Math.PI / 2}><ringGeometry args={[0.18, 0.24, 32]} /><meshBasicMaterial color={PALETTE.green} transparent opacity={0} toneMapped={false} /></mesh>
      <pointLight position={[0, 1.2, 0.3]} color="#ffe0f0" intensity={2} distance={3} />
    </group>
  );
}
