import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import * as THREE from "three";
import { PALETTE } from "../config";

// Cozy nook (right deck) + rooftop access door with "214" neon sign.
export function Lounge() {
  const smoke = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    smoke.current?.children.forEach((c, i) => {
      const t = (clock.elapsedTime * 0.25 + i / 5) % 1;
      c.position.set(Math.sin(t * 6 + i) * 0.04, 0.15 + t * 0.7, 0);
      c.scale.setScalar(0.03 + t * 0.08);
      ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.35 * (1 - t);
    });
  });
  return (
    <group>
      <group position={[1.8, 0, -2.2]} rotation-y={-0.4} scale={0.75}>
        {/* Meditation pad: woven round mat, flat zabuton, round zafu cushion */}
        <mesh position={[0, 0.012, 0]}><cylinderGeometry args={[0.7, 0.7, 0.024, 48]} /><meshStandardMaterial color="#d9c8a8" roughness={1} /><Outlines thickness={0.012} color={PALETTE.ink} /></mesh>
        <mesh position={[0, 0.026, 0]} rotation-x={-Math.PI / 2}><ringGeometry args={[0.6, 0.63, 48]} /><meshBasicMaterial color={PALETTE.pink} toneMapped={false} /></mesh>
        <mesh position={[0, 0.06, 0]}><boxGeometry args={[0.75, 0.07, 0.6]} /><meshStandardMaterial color="#ff8fc6" roughness={1} /><Outlines thickness={0.012} color={PALETTE.ink} /></mesh>
        <mesh position={[0, 0.16, -0.05]} scale={[1, 0.45, 1]}><sphereGeometry args={[0.26, 32, 16]} /><meshStandardMaterial color="#c2457f" roughness={0.95} /><Outlines thickness={0.015} color={PALETTE.ink} /></mesh>
        <group position={[-0.55, 0, 0.25]}>
          <mesh position={[0, 0.06, 0]}><cylinderGeometry args={[0.08, 0.1, 0.12, 12]} /><meshStandardMaterial color="#3a2f36" metalness={0.5} roughness={0.4} /></mesh>
          <mesh position={[0, 0.13, 0]}><sphereGeometry args={[0.025, 8, 6]} /><meshBasicMaterial color="#ffb070" toneMapped={false} /></mesh>
          <group ref={smoke}>{[0, 1, 2, 3, 4].map((i) => <mesh key={i}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color="#e8dce6" transparent depthWrite={false} /></mesh>)}</group>
        </group>
      </group>
    </group>
  );
}
