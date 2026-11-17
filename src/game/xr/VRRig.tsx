import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { XROrigin, XRSpace, useXR } from "@react-three/xr";
import * as THREE from "three";
import { VR, snapStep } from "./rules";
import { TapPointer } from "./TapPointer";
import { beamObjects } from "./beams";
import { menuBus } from "./menuBus";

// Always-visible aiming beam, drawn on top of the world. The library's own ray only shows when it hits something.
// The pink beams are placed by the library exactly where the controllers are drawn. The tap pointer aims along the same objects,
// so what you click is always what the beam points at, wherever you have walked or turned.
function ControllerLasers() {
  const session = useXR((s) => s.session);
  const [sources, setSources] = useState<XRInputSource[]>([]);
  useEffect(() => {
    if (!session) return;
    const update = () => setSources([...session.inputSources].filter((src) => src.targetRayMode !== "gaze" && src.targetRaySpace));
    update(); session.addEventListener("inputsourceschange", update);
    return () => session.removeEventListener("inputsourceschange", update);
  }, [session]);
  return <>{sources.map((source) => (
    <XRSpace key={source.handedness + sources.indexOf(source)} space={source.targetRaySpace}>
      <group ref={(g) => { if (g) beamObjects.set(source, g); else beamObjects.delete(source); }}>
        <mesh position={[0, 0, -0.6]} renderOrder={999} raycast={() => {}}>
          <boxGeometry args={[0.004, 0.004, 1.2]} />
          <meshBasicMaterial color="#ff8fcf" transparent opacity={0.85} depthTest={false} toneMapped={false} />
        </mesh>
      </group>
    </XRSpace>
  ))}</>;
}

export function VRRig({ snap, onRestart }: { snap: boolean; onRestart?: () => void }) {
  const origin = useRef<THREE.Group>(null);
  const session = useXR((s) => s.session);
  const { gl, camera, scene } = useThree();
  const latched = useRef(false);
  const restartHeld = useRef(false);
  const bothSince = useRef(0);
  const suppress = useRef(false);
  const faceDown = useRef(new Map<string, number>());
  const pose = useMemo(() => ({ position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), pivot: new THREE.Vector3(), offset: new THREE.Vector3() }), []);
  const hiddenLights = useRef(new Set<THREE.PointLight>());
  useEffect(() => {
    if (!session) return;
    pose.position.copy(camera.position); pose.quaternion.copy(camera.quaternion);
    gl.setPixelRatio(VR.pixelRatio);
    gl.shadowMap.enabled = false;
    return () => {
      camera.position.copy(pose.position); camera.quaternion.copy(pose.quaternion);
      hiddenLights.current.forEach((light) => { light.visible = true; }); hiddenLights.current.clear();
      latched.current = false;
    };
  }, [session, camera, gl, pose]);
  useFrame((_, delta) => {
    if (!session) return;
    // Emissive neon stays intact; ambient + directional + image lighting light the garden.
    scene.traverse((object) => {
      if (object instanceof THREE.PointLight && object.visible) { hiddenLights.current.add(object); object.visible = false; }
      // XR's cursor/ray meshes must not become targets of their own pointers.
      if (object instanceof THREE.Mesh && !Array.isArray(object.material) &&
        (object.material.constructor.name === "PointerRayMaterial" || object.material.constructor.name === "PointerCursorMaterial")) {
        object.pointerEvents = "none";
        object.raycast = () => {};
      }
    });
    // Face buttons: a quick press of B / Y / A / X shows or hides the menu. Hold B and Y together for 1.5 s to start over.
    const now = performance.now();
    const bothHeld = [...session.inputSources].filter((s) => s.gamepad?.buttons[5]?.pressed).length >= 2;
    if (bothHeld) { if (!restartHeld.current) { restartHeld.current = true; bothSince.current = now; } else if (bothSince.current && now - bothSince.current > 1500) { bothSince.current = 0; onRestart?.(); } suppress.current = true; }
    else restartHeld.current = false;
    for (const source of session.inputSources) {
      for (const idx of [4, 5]) {
        const key = `${source.handedness}${idx}`; const down = Boolean(source.gamepad?.buttons[idx]?.pressed);
        const since = faceDown.current.get(key);
        if (down && since === undefined) faceDown.current.set(key, now);
        if (!down && since !== undefined) {
          faceDown.current.delete(key);
          if (now - since < 700 && !suppress.current) menuBus.toggle();
        }
      }
    }
    if (faceDown.current.size === 0 && !bothHeld) suppress.current = false;
    // Walk with the left thumbstick, relative to where the head is facing.
    const walker = [...session.inputSources].find((s) => s.handedness === "left" && s.gamepad);
    const walk = walker?.gamepad?.axes;
    const sx = walk?.[walk.length >= 4 ? 2 : 0] ?? 0, sy = walk?.[walk.length >= 4 ? 3 : 1] ?? 0;
    const body = origin.current;
    if (body && (Math.abs(sx) > VR.walkDeadzone || Math.abs(sy) > VR.walkDeadzone)) {
      gl.xr.getCamera().getWorldDirection(pose.offset);
      const length = Math.hypot(pose.offset.x, pose.offset.z) || 1;
      const fx = pose.offset.x / length, fz = pose.offset.z / length;
      const step = VR.walkSpeed * Math.min(delta, 0.05), ahead = -sy * step, right = sx * step;
      body.position.x = THREE.MathUtils.clamp(body.position.x + fx * ahead - fz * right, VR.walkBounds.minX, VR.walkBounds.maxX);
      body.position.z = THREE.MathUtils.clamp(body.position.z + fz * ahead + fx * right, VR.walkBounds.minZ, VR.walkBounds.maxZ);
    }
    const controller = [...session.inputSources].find((s) => s.handedness === "right" && s.gamepad)
      ?? [...session.inputSources].find((s) => s.gamepad);
    const axes = controller?.gamepad?.axes;
    const turnAxis = axes?.[axes.length >= 4 ? 2 : 0] ?? 0;
    const turn = snap ? snapStep(turnAxis, latched.current, snap) : { latched: false, radians: Math.abs(turnAxis) > VR.walkDeadzone ? -turnAxis * VR.smoothTurnDegrees * Math.PI / 180 * Math.min(delta, 0.05) : 0 };
    latched.current = turn.latched;
    const rig = origin.current;
    if (!rig || !turn.radians) return;
    // Rotate around the actual head, not the room origin: no sideways camera jump.
    gl.xr.getCamera().getWorldPosition(pose.pivot);
    pose.offset.copy(rig.position).sub(pose.pivot).applyAxisAngle(THREE.Object3D.DEFAULT_UP, turn.radians);
    rig.position.copy(pose.pivot).add(pose.offset);
    rig.rotation.y += turn.radians;
  }, -60);
  // The beams must live inside the origin, like the controller models do, or they stay behind at the spawn spot when you walk.
  return session ? <><XROrigin ref={origin} position={VR.origin}><ControllerLasers /></XROrigin><TapPointer origin={origin} /></> : null;
}