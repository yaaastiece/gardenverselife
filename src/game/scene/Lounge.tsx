import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines, RoundedBox } from "@react-three/drei";
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
      <group position={[1.85, 0, -1.6]} scale={0.75}>
        <mesh position={[0.1, 0.015, 0.2]}><cylinderGeometry args={[0.95, 0.95, 0.03, 40]} /><meshStandardMaterial color="#ff8fc6" roughness={1} /><Outlines thickness={0.012} color={PALETTE.ink} /></mesh>
        <mesh position={[0, 0.3, 0]} scale={[1, 0.62, 0.95]}><sphereGeometry args={[0.5, 32, 20]} /><meshStandardMaterial color="#f2a6c8" roughness={0.95} /><Outlines thickness={0.015} color={PALETTE.ink} /></mesh>
        <mesh position={[0, 0.5, -0.22]} rotation-x={-0.5} scale={[0.85, 0.35, 0.5]}><sphereGeometry args={[0.5, 24, 14]} /><meshStandardMaterial color="#eb96bd" roughness={0.95} /></mesh>
        <group position={[-0.75, 0, 0.3]}>
          <mesh position={[0, 0.06, 0]}><cylinderGeometry args={[0.08, 0.1, 0.12, 12]} /><meshStandardMaterial color="#3a2f36" metalness={0.5} roughness={0.4} /></mesh>
          <mesh position={[0, 0.13, 0]}><sphereGeometry args={[0.025, 8, 6]} /><meshBasicMaterial color="#ffb070" toneMapped={false} /></mesh>
          <group ref={smoke}>{[0, 1, 2, 3, 4].map((i) => <mesh key={i}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color="#e8dce6" transparent depthWrite={false} /></mesh>)}</group>
        </group>
      </group>
    </group>
  );
}
