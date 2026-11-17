import { useMemo, useRef, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Puts its children in front of you when it becomes active. With `follow`, it moves itself back within reach
// whenever you walk or turn away. Hidden until it has been placed, so it never sits at the world origin.
export function HeadAnchored({ active, distance = 1, drop = 0.4, side = 0, follow = false, placeKey = 0, maxAway = 1.6, children }: { active: boolean; distance?: number; drop?: number; side?: number; follow?: boolean; placeKey?: number; maxAway?: number; children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const placed = useRef(false);
  const lastKey = useRef(placeKey);
  const { gl } = useThree();
  const pose = useMemo(() => ({ position: new THREE.Vector3(), direction: new THREE.Vector3(), right: new THREE.Vector3(), target: new THREE.Vector3(), toPanel: new THREE.Vector3() }), []);
  useFrame((_, delta) => {
    const g = group.current; if (!g) return;
    if (!active) { placed.current = false; g.visible = false; return; }
    const camera = gl.xr.getCamera(); camera.getWorldPosition(pose.position); camera.getWorldDirection(pose.direction);
    if (pose.position.y < 0.3) { g.visible = placed.current; return; }
    pose.direction.y = 0; pose.direction.normalize();
    pose.right.set(-pose.direction.z, 0, pose.direction.x);
    pose.target.copy(pose.position).addScaledVector(pose.direction, distance).addScaledVector(pose.right, side); pose.target.y = pose.position.y - drop;
    if (lastKey.current !== placeKey) { lastKey.current = placeKey; placed.current = false; }
    if (!placed.current) { g.position.copy(pose.target); placed.current = true; }
    else if (follow) {
      pose.toPanel.set(g.position.x - pose.position.x, 0, g.position.z - pose.position.z);
      const away = pose.toPanel.length();
      const off = Math.acos(Math.min(1, Math.max(-1, pose.toPanel.normalize().dot(pose.direction))));
      if (away > maxAway || off > 2.3) g.position.copy(pose.target);
      else g.position.y += (pose.target.y - g.position.y) * Math.min(1, delta * 3);
    }
    g.visible = true;
  });
  return <group ref={group} visible={false}>{children}</group>;
}
