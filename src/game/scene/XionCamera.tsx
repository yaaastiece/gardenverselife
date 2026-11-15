import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as Controls } from "three-stdlib";
import * as THREE from "three";
import { LOOK, XION, lookYawLimit } from "../config";
import type { XionInteraction } from "../interaction";

export function XionCamera({ interaction, bubbleRef }: { interaction: XionInteraction; bubbleRef: RefObject<HTMLDivElement | null> }) {
  const controls = useRef<Controls>(null);
  const { camera, size, gl } = useThree();
  const yaw = lookYawLimit(size.width, size.height);
  const moving = useRef(true);
  const previous = useRef(false);
  const vectors = useMemo(() => ({ target: new THREE.Vector3(), position: new THREE.Vector3(), anchor: new THREE.Vector3() }), []);
  useEffect(() => { moving.current = true; }, [size.width, size.height]);
  useFrame((_, delta) => {
    const orbit = controls.current;
    if (!orbit) return;
    // XR owns the head pose: never apply desktop clamps or camera glides to it.
    if (gl.xr.isPresenting) { orbit.enabled = false; return; }
    const state = interaction.state;
    const mobile = size.width < 768;
    if (previous.current !== state.focused) { previous.current = state.focused; moving.current = true; }
    if (state.focused) {
      vectors.target.set(state.position.x, state.position.y, state.position.z);
      vectors.position.copy(vectors.target).add(new THREE.Vector3(0, 0.18, mobile ? 1.7 : 1.25));
    } else {
      vectors.target.set(0, 0.82, -1.4);
      const aspect = size.width / size.height;
      const distance = Math.max(3, 2.05 / (2 * Math.tan(THREE.MathUtils.degToRad(LOOK.fov / 2)) * aspect));
      vectors.position.set(0, 1.6, -1.4 + distance);
      // Look around in place: pivot sits just in front of the eye, aimed at the seedling.
      vectors.target.sub(vectors.position).setLength(0.05).add(vectors.position);
    }
    orbit.enabled = !state.dragging && !moving.current && !state.focused;
    if (moving.current || state.focused) {
      const k = 1 - Math.exp(-5 * Math.min(delta, 0.05));
      camera.position.lerp(vectors.position, k);
      orbit.target.lerp(vectors.target, k);
      orbit.update();
      if (camera.position.distanceTo(vectors.position) < 0.008 && orbit.target.distanceTo(vectors.target) < 0.008) moving.current = false;
    }
    const bubble = bubbleRef.current;
    if (bubble) {
      vectors.anchor.set(state.position.x, state.position.y + XION.height / 2 + 0.05, state.position.z).project(camera);
      const x = (vectors.anchor.x + 1) * size.width / 2;
      const y = (1 - vectors.anchor.y) * size.height / 2;
      const halfWidth = bubble.offsetWidth / 2;
      bubble.style.left = `${Math.max(halfWidth + 12, Math.min(size.width - halfWidth - 12, x))}px`;
      bubble.style.top = `${Math.max(150 + bubble.offsetHeight, Math.min(size.height - 30, y - 18))}px`;
    }
  });
  return <OrbitControls ref={controls} target={[0, 0.82, -1.4]} enableZoom={false} enablePan={false} rotateSpeed={-0.35} minPolarAngle={LOOK.polarMin} maxPolarAngle={LOOK.polarMax} minAzimuthAngle={-yaw} maxAzimuthAngle={yaw} />;
}