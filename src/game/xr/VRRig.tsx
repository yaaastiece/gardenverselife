import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { XROrigin, XRSpace, useXR, useXRInputSourceStates } from "@react-three/xr";
import * as THREE from "three";
import { VR, snapStep } from "./rules";

// Always-visible aiming beam, drawn on top of the world. The library's own ray only shows when it hits something.
function ControllerLasers() {
  const states = useXRInputSourceStates();
  return <>{states.filter((state) => state.type === "controller").map((state) => (
    <XRSpace key={state.inputSource.handedness + state.id} space={state.inputSource.targetRaySpace}>
      <mesh position={[0, 0, -0.6]} renderOrder={999} raycast={() => {}}>
        <boxGeometry args={[0.004, 0.004, 1.2]} />
        <meshBasicMaterial color="#ff8fcf" transparent opacity={0.85} depthTest={false} toneMapped={false} />
      </mesh>
    </XRSpace>
  ))}</>;
}

export function VRRig({ snap, onRestart }: { snap: boolean; onRestart?: () => void }) {
  const origin = useRef<THREE.Group>(null);
  const session = useXR((s) => s.session);
  const { gl, camera, scene } = useThree();
  const latched = useRef(false);
  const restartHeld = useRef(false);
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
  useFrame(() => {
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
    // Press the lower face buttons (X/A or Y/B) on both controllers together to start over.
    const lowerPressed = [...session.inputSources].filter((s) => s.gamepad?.buttons[5]?.pressed).length;
    if (lowerPressed >= 2 && !restartHeld.current) { restartHeld.current = true; onRestart?.(); }
    if (lowerPressed < 2) restartHeld.current = false;
    const controller = [...session.inputSources].find((s) => s.handedness === "right" && s.gamepad)
      ?? [...session.inputSources].find((s) => s.gamepad);
    const axes = controller?.gamepad?.axes;
    const turn = snapStep(axes?.[axes.length >= 4 ? 2 : 0] ?? 0, latched.current, snap);
    latched.current = turn.latched;
    const rig = origin.current;
    if (!rig || !turn.radians) return;
    // Rotate around the actual head, not the room origin: no sideways camera jump.
    gl.xr.getCamera().getWorldPosition(pose.pivot);
    pose.offset.copy(rig.position).sub(pose.pivot).applyAxisAngle(THREE.Object3D.DEFAULT_UP, turn.radians);
    rig.position.copy(pose.pivot).add(pose.offset);
    rig.rotation.y += turn.radians;
  }, -60);
  return session ? <><XROrigin ref={origin} position={VR.origin} /><ControllerLasers /></> : null;
}