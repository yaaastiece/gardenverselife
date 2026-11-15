import { useMemo, useRef, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Puts its children in front of you at the moment it becomes active, then leaves them in the world.
export function HeadAnchored({ active, distance = 1, drop = 0.4, children }: { active: boolean; distance?: number; drop?: number; children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const placed = useRef(false);
  const { gl } = useThree();
  const pose = useMemo(() => ({ position: new THREE.Vector3(), direction: new THREE.Vector3() }), []);
  useFrame(() => {
    const g = group.current; if (!g) return;
    g.visible = active;
    if (!active) { placed.current = false; return; }
    if (placed.current) return;
    const camera = gl.xr.getCamera(); camera.getWorldPosition(pose.position); camera.getWorldDirection(pose.direction);
    if (pose.position.y < 0.3) return;
    pose.direction.y = 0; pose.direction.normalize();
    g.position.copy(pose.position).addScaledVector(pose.direction, distance); g.position.y = pose.position.y - drop;
    placed.current = true;
  });
  return <group ref={group} visible={false}>{children}</group>;
}
