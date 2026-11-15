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
      // Aim slightly below her so she sits higher on screen, above the docked dialogue box.
      vectors.target.y -= mobile ? 0.22 : 0.1;
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
    if (bubble) placeBubble(bubble, state, camera, size, vectors.anchor);
  });
  return <OrbitControls ref={controls} target={[0, 0.82, -1.4]} enableZoom={false} enablePan={false} rotateSpeed={-0.35} minPolarAngle={LOOK.polarMin} maxPolarAngle={LOOK.polarMax} minAzimuthAngle={-yaw} maxAzimuthAngle={yaw} />;
}

const GAP = 12; // px between bubble and Xion's sprite
const TOP_LIMIT = 130; // keep clear of the header
// Close-up: dock at the bottom. Otherwise: above her head, or beside her when there is no room above.
function placeBubble(bubble: HTMLDivElement, state: XionInteraction["state"], camera: THREE.Camera, size: { width: number; height: number }, v: THREE.Vector3) {
  const st = bubble.style;
  if (state.focused && !state.dragging) {
    bubble.dataset["mode"] = "dock";
    const stage = bubble.parentElement?.getBoundingClientRect();
    const hint = bubble.parentElement?.querySelector(".gv-hint")?.getBoundingClientRect();
    let limit = hint ? hint.top : size.height - 60;
    if (size.width < 768) { const dock = bubble.parentElement?.querySelector(".gv-dock")?.getBoundingClientRect(); if (dock && dock.height) limit = Math.min(limit, dock.top); }
    st.left = ""; st.top = "";
    st.bottom = `${Math.round((stage ? stage.bottom : size.height) - limit + 10)}px`;
    return;
  }
  st.bottom = "";
  const p = state.position;
  const proj = (y: number) => { v.set(p.x, y, p.z).project(camera); return { x: (v.x + 1) * size.width / 2, y: (1 - v.y) * size.height / 2 }; };
  const head = proj(p.y + XION.height / 2 + 0.02);
  const feet = proj(p.y - XION.height / 2);
  const spriteH = Math.abs(feet.y - head.y);
  const spriteHalfW = spriteH * 0.32;
  const w = bubble.offsetWidth, h = bubble.offsetHeight;
  const clampX = (x: number) => Math.max(w / 2 + 12, Math.min(size.width - w / 2 - 12, x));
  if (head.y - GAP - 12 - h >= TOP_LIMIT) {
    bubble.dataset["mode"] = "above";
    const left = clampX(head.x);
    st.left = `${left}px`; st.top = `${head.y - GAP}px`;
    bubble.style.setProperty("--tail-x", `${Math.max(16, Math.min(w - 16, head.x - left + w / 2))}px`);
    return;
  }
  const midY = (head.y + feet.y) / 2;
  const roomRight = size.width - (head.x + spriteHalfW + GAP + 12);
  const right = roomRight >= w || roomRight >= head.x - spriteHalfW - GAP - 12;
  bubble.dataset["mode"] = right ? "right" : "left";
  const x = right ? head.x + spriteHalfW + GAP + 10 : head.x - spriteHalfW - GAP - 10 - w;
  st.left = `${Math.max(12, Math.min(size.width - w - 12, x))}px`;
  st.top = `${Math.max(TOP_LIMIT, Math.min(size.height - h - 30, midY - h / 2))}px`;
}
