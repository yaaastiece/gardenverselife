import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BACKDROP, CARS, PALETTE } from "../config";

// Small gray hover cars drifting across the backdrop along an arc just in front of it.
export function FlyingCars() {
  const cars = useMemo(() => Array.from({ length: CARS.count }, (_, i) => ({
    y: 7 + i * 1.6, speed: CARS.minSpeed + ((i * 37) % 10) / 10 * (CARS.maxSpeed - CARS.minSpeed),
    dir: i % 2 ? 1 : -1, phase: i / CARS.count,
  })), []);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const R = BACKDROP.radius - 2, half = BACKDROP.arc / 2 - 0.1;
  useFrame(({ clock }) => {
    cars.forEach((c, i) => {
      const g = refs.current[i]; if (!g) return;
      const t = (clock.elapsedTime * c.speed * 0.1 + c.phase) % 1;
      const a = Math.PI + c.dir * (-half + t * 2 * half);
      g.position.set(Math.sin(a) * R, c.y + Math.sin(clock.elapsedTime * 0.6 + i) * 0.15, Math.cos(a) * R);
      g.rotation.y = a + (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
    });
  });
  return (
    <group>
      {cars.map((_, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el; }}>
          <mesh scale={[0.9, 0.22, 0.4]}><sphereGeometry args={[1, 14, 8]} /><meshStandardMaterial color="#8d8a92" metalness={0.6} roughness={0.35} /></mesh>
          <mesh position={[0.1, 0.15, 0]} scale={[0.4, 0.15, 0.28]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#4a4652" metalness={0.8} roughness={0.2} /></mesh>
          <mesh position={[-2.2, 0, 0]}><boxGeometry args={[3, 0.05, 0.05]} /><meshBasicMaterial color={PALETTE.pink} transparent opacity={0.55} toneMapped={false} /></mesh>
          <mesh position={[-0.9, 0, 0]}><sphereGeometry args={[0.08, 8, 6]} /><meshBasicMaterial color={PALETTE.pinkSoft} toneMapped={false} /></mesh>
        </group>
      ))}
    </group>
  );
}
