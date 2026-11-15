import { useMemo, useRef, useSyncExternalStore } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { PLANTLETS, type PlantletId } from "../plants/plantlets";
import { START, type StartScreen } from "../start";
import { WorldPanel } from "./WorldPanel";

export function StartWorldPanel({ start }: { start: StartScreen }) {
  const state = useSyncExternalStore(start.subscribe, start.getSnapshot);
  const anchor = useRef<THREE.Group>(null);
  const { gl } = useThree();
  const placed = useRef(false);
  const pose = useMemo(() => ({ position: new THREE.Vector3(), direction: new THREE.Vector3() }), []);
  useFrame(() => {
    if (!placed.current && anchor.current) {
      const camera = gl.xr.getCamera(); camera.getWorldPosition(pose.position); camera.getWorldDirection(pose.direction);
      // Wait until the headset reports a real head height (the first frame can be 0).
      if (pose.position.y < 0.3) return;
      pose.direction.y = 0; pose.direction.normalize();
      anchor.current.position.copy(pose.position).addScaledVector(pose.direction, START.distance);
      anchor.current.position.y = pose.position.y - START.chestOffset;
      anchor.current.rotation.y = Math.atan2(-pose.direction.x, -pose.direction.z);
      placed.current = true;
    }
  });
  const waiting = state.phase === "waiting";
  return <group ref={anchor}>
    <WorldPanel title="Gardenverse · Xion" width={0.78} opacity={state.opacity} lines={waiting ? ["Which seed will you plant?"] : [state.visibleText]} buttons={waiting ? [{ label: "Tap to begin", action: start.begin }] : [
      ...(Object.keys(PLANTLETS) as PlantletId[]).map((id) => ({ label: PLANTLETS[id].name, active: state.selected === id, action: () => start.select(id), disabled: state.phase !== "choosing" })),
      { label: "Enter the garden", disabled: !state.selected || state.phase !== "choosing", action: start.enter },
    ]} />
  </group>;
}