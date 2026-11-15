import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { XROrigin, useXR } from "@react-three/xr";
import * as THREE from "three";
import { VR, snapStep } from "./rules";

export function VRRig({ snap }: { snap: boolean }) {
  const origin = useRef<THREE.Group>(null);
  const session = useXR((s) => s.session);
  const { gl, camera, scene } = useThree();
  const latched = useRef(false);
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
        object.raycast = () => {};
      }
    });
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
  return session ? <XROrigin ref={origin} position={VR.origin} /> : null;
}