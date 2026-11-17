import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { useXR } from "@react-three/xr";
import * as THREE from "three";
import { beamObjects } from "./beams";

// Our own controller/hand pointer. It aims from each input source's target-ray pose, finds the
// objects that have React Three Fiber handlers (onClick, onPointerOver, ...) and calls them,
// so every existing button and tappable object works without the library's pointer system.

type R3FObject = THREE.Object3D & { __r3f?: { eventCount?: number; handlers?: Record<string, ((event: unknown) => void) | undefined> } };
type Hit = THREE.Intersection;
type Pointer = { id: number; chain: R3FObject[]; hit: Hit | null; hits: Hit[]; downChain: R3FObject[]; downFirst: R3FObject | null; polled: boolean; triggerDown: boolean; triggerAt: number; leftFrom: R3FObject | null; leftAt: number };
const fresh = (id: number): Pointer => ({ id, chain: [], hit: null, hits: [], downChain: [], downFirst: null, polled: false, triggerDown: false, triggerAt: 0, leftFrom: null, leftAt: 0 });

const RANGE = 12;

function visible(object: THREE.Object3D | null) {
  for (let o = object; o; o = o.parent) if (!o.visible) return false;
  return true;
}
// Panels are the UI: they win over anything standing in front of them (like Xion's invisible tap area).
function isPanel(object: THREE.Object3D) {
  for (let o: THREE.Object3D | null = object; o; o = o.parent) if (o.userData?.["gvPanel"]) return true;
  return false;
}
function chainOf(object: THREE.Object3D): R3FObject[] {
  const chain: R3FObject[] = [];
  for (let o: THREE.Object3D | null = object; o; o = o.parent) if ((o as R3FObject).__r3f?.eventCount) chain.push(o as R3FObject);
  return chain;
}

export function TapPointer({ origin }: { origin: RefObject<THREE.Group | null> }) {
  const session = useXR((s) => s.session);
  const refSpace = useXR((s) => s.originReferenceSpace);
  const pointers = useRef(new Map<XRInputSource, Pointer>());
  const next = useRef(100);
  const tools = useMemo(() => ({ raycaster: new THREE.Raycaster(), matrix: new THREE.Matrix4(), from: new THREE.Vector3(), dir: new THREE.Vector3() }), []);
  const interaction = useRef<THREE.Object3D[]>([]);
  const dots = useRef<(THREE.Mesh | null)[]>([]);
  const glows = useRef<(THREE.Group | null)[]>([]);
  const box = useMemo(() => new THREE.Box3(), []);
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const size = useMemo(() => new THREE.Vector3(), []);
  const center = useMemo(() => new THREE.Vector3(), []);
  const state = useRef<{ interaction: THREE.Object3D[] } | null>(null);
  const hud = useRef<THREE.Mesh>(null);
  const hudOn = useRef(false);
  const hudHeld = useRef(false);
  const hudDrawn = useRef("");
  const hudTexture = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = 1024; canvas.height = 512;
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
  }, []);
  const rigToWorld = useMemo(() => new THREE.Matrix4(), []);
  const viewerMatrix = useMemo(() => new THREE.Matrix4(), []);
  const cameraPos = useMemo(() => new THREE.Vector3(), []);
  const cameraDir = useMemo(() => new THREE.Vector3(), []);

  const log = useRef<string[]>([]);
  const note = (line: string) => { log.current = [...log.current.slice(-5), line]; };
  if (import.meta.env.DEV) Object.assign(window, { __tap: { log, pointers } });
  const fire = (chain: R3FObject[], name: string, pointer: Pointer, hit: Hit | null) => {
    if (!chain.length) return;
    const target = { setPointerCapture() {}, releasePointerCapture() {}, hasPointerCapture: () => true };
    let stopped = false;
    for (const object of chain) {
      const handler = object.__r3f?.handlers?.[name];
      if (!handler) continue;
      try { handler({
        type: name.slice(2).toLowerCase(), object: hit?.object ?? object, eventObject: object, currentTarget: object, target,
        point: hit?.point ?? new THREE.Vector3(), distance: hit?.distance ?? 0, ray: tools.raycaster.ray.clone(), intersections: pointer.hits,
        pointerId: pointer.id, pointerType: "xr", button: 0, buttons: 1, clientX: 0, clientY: 0, nativeEvent: {},
        stopPropagation() { stopped = true; }, preventDefault() {}, delta: 0,
      }); if (name === "onClick" || name === "onPointerDown") note(`${name} ok on ${object.type}`); } catch (error) { note(`${name} THREW: ${String((error as Error)?.message ?? error).slice(0, 60)}`); }
      if (stopped) break;
    }
  };

  const pulse = (source: XRInputSource) => { try { void (source.gamepad?.hapticActuators?.[0] as { pulse?: (v: number, ms: number) => void } | undefined)?.pulse?.(0.4, 35); } catch { /* optional */ } };
  const press = (p: Pointer) => {
    p.downChain = p.chain; p.downFirst = p.chain[0] ?? null;
    if (!p.chain.length) note("press: pointing at nothing tappable");
    fire(p.chain, "onPointerDown", p, p.hit);
  };
  // A click still counts if your hand drifted off the button in the last quarter second before you let go.
  const stillOn = (p: Pointer) => p.chain[0] === p.downFirst || (p.leftFrom === p.downFirst && performance.now() - p.leftAt < 250);
  const release = (p: Pointer, source: XRInputSource) => {
    fire(p.downChain, "onPointerUp", p, p.hit);
    if (p.downFirst && stillOn(p)) { fire(p.downChain, "onClick", p, p.hit); pulse(source); }
    else note(p.downFirst ? "release: aim moved off the item" : "release: nothing was pressed");
    p.downChain = []; p.downFirst = null;
  };

  useEffect(() => {
    if (!session) return;
    const forSource = (event: XRInputSourceEvent) => {
      let p = pointers.current.get(event.inputSource);
      if (!p) { p = fresh(next.current++); pointers.current.set(event.inputSource, p); }
      return p;
    };
    const down = (event: XRInputSourceEvent) => {
      const p = forSource(event);
      if (p.polled) return;
      p.downChain = p.chain; p.downFirst = p.chain[0] ?? null;
      fire(p.chain, "onPointerDown", p, p.hit);
    };
    const up = (event: XRInputSourceEvent) => {
      const p = forSource(event);
      if (p.polled) return;
      fire(p.downChain, "onPointerUp", p, p.hit);
      if (p.downFirst && stillOn(p)) { fire(p.downChain.length ? p.downChain : p.chain, "onClick", p, p.hit); pulse(event.inputSource); }
      p.downChain = []; p.downFirst = null;
    };
    session.addEventListener("selectstart", down); session.addEventListener("selectend", up);
    const map = pointers.current;
    return () => { session.removeEventListener("selectstart", down); session.removeEventListener("selectend", up); map.clear(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useFrame((root, _delta, frame) => {
    if (!session || !frame || !refSpace) return;
    // Debug readout: click both thumbsticks together to show or hide it.
    const sticks = [...session.inputSources].filter((src) => src.gamepad?.buttons[3]?.pressed).length;
    if (sticks >= 2 && !hudHeld.current) { hudHeld.current = true; hudOn.current = !hudOn.current; }
    if (sticks < 2) hudHeld.current = false;
    const panel = hud.current;
    if (panel) {
      panel.visible = hudOn.current;
      if (hudOn.current) {
        const head = root.gl.xr.getCamera(); head.getWorldPosition(cameraPos); head.getWorldDirection(cameraDir);
        cameraDir.y = 0; cameraDir.normalize();
        panel.position.copy(cameraPos).addScaledVector(cameraDir, 1.1); panel.position.y = cameraPos.y - 0.3;
        panel.lookAt(cameraPos.x, panel.position.y, cameraPos.z);
        const lines = [`interactive objects: ${root.internal.interaction.length}`];
        pointers.current.forEach((ptr, src) => {
          const handlers = ptr.chain[0] ? Object.keys(ptr.chain[0].__r3f?.handlers ?? {}).join(",") : "-";
          lines.push(`${src.handedness}: trig=${(src.gamepad?.buttons[0]?.value ?? 0).toFixed(2)} chain=${ptr.chain.length} polled=${ptr.polled} aim=${ptr.chain[0]?.type ?? "none"} [${handlers}]`);
        });
        lines.push("— last events —", ...log.current);
        const text = lines.join("\n");
        if (text !== hudDrawn.current) {
          hudDrawn.current = text;
          const canvas = hudTexture.image as HTMLCanvasElement; const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "rgba(10,8,14,0.92)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#6dffb0"; ctx.font = "bold 26px monospace"; ctx.textBaseline = "top";
            lines.forEach((line, i) => ctx.fillText(line.slice(0, 62), 16, 14 + i * 34));
            hudTexture.needsUpdate = true;
          }
        }
      }
    }
    state.current = root.internal as unknown as { interaction: THREE.Object3D[] };
    interaction.current = state.current.interaction.filter((object) => visible(object));
    // Map controller poses into the world using the headset itself as the anchor: world head pose x inverse(head pose in the
    // controller's space). This stays right however the rig offset is applied, so the aim never drifts when you walk.
    let originMatrix: THREE.Matrix4 | undefined = origin.current?.matrixWorld;
    const viewer = frame.getViewerPose(refSpace);
    if (viewer) {
      const head = root.gl.xr.getCamera(); head.updateMatrixWorld();
      rigToWorld.copy(viewerMatrix.fromArray(viewer.transform.matrix)).invert().premultiply(head.matrixWorld);
      originMatrix = rigToWorld;
    }
    dots.current.forEach((dot) => { if (dot) dot.visible = false; });
    glows.current.forEach((glow) => { if (glow) glow.visible = false; });
    let slot = 0;
    for (const source of session.inputSources) {
      if (!source.targetRaySpace) continue;
      const pose = frame.getPose(source.targetRaySpace, refSpace);
      if (!pose) continue;
      let p = pointers.current.get(source);
      if (!p) { p = fresh(next.current++); pointers.current.set(source, p); }
      const beam = beamObjects.get(source);
      if (beam) { beam.updateWorldMatrix(true, false); tools.matrix.copy(beam.matrixWorld); }
      else { tools.matrix.fromArray(pose.transform.matrix); if (originMatrix) tools.matrix.premultiply(originMatrix); }
      tools.from.setFromMatrixPosition(tools.matrix);
      tools.dir.set(0, 0, -1).transformDirection(tools.matrix);
      tools.raycaster.set(tools.from, tools.dir); tools.raycaster.far = RANGE;
      const hits = tools.raycaster.intersectObjects(interaction.current, true).filter((h) => visible(h.object));
      const first = hits.find((h) => isPanel(h.object)) ?? hits[0] ?? null;
      const chain = first ? chainOf(first.object) : [];
      p.hits = hits; p.hit = first;
      // A green dot shows where each controller is pointing at something tappable.
      const dot = dots.current[slot++];
      if (dot && first && chain.length) { dot.visible = true; dot.position.copy(first.point); }
      // A soft green box glows around whatever is being pointed at.
      const glow = glows.current[slot - 1];
      const target = chain[0];
      if (glow && target && !isPanel(target)) {
        const mesh = target as unknown as THREE.Mesh;
        const geometry = mesh.isMesh ? mesh.geometry : null;
        let ok = false;
        if (geometry) {
          if (!geometry.boundingBox) geometry.computeBoundingBox();
          box.copy(geometry.boundingBox as THREE.Box3); m4.copy(mesh.matrixWorld); ok = true;
        } else {
          box.setFromObject(target); m4.identity(); ok = !box.isEmpty();
        }
        if (ok) {
          box.getSize(size); box.getCenter(center);
          const w = (m4.elements[0] ** 2 + m4.elements[1] ** 2 + m4.elements[2] ** 2) ** 0.5;
          const big = size.x * w > 3 || size.y * w > 3 || size.z * w > 3;
          if (!big) {
            size.set(Math.max(size.x, 0.03 / w), Math.max(size.y, 0.03 / w), Math.max(size.z, 0.03 / w));
            glow.matrix.copy(m4).multiply(new THREE.Matrix4().compose(center, new THREE.Quaternion(), size).multiply(new THREE.Matrix4().makeScale(1.06, 1.06, 1.06)));
            glow.visible = true;
            const fill = glow.children[0] as THREE.Mesh | undefined;
            if (fill) (fill.material as THREE.MeshBasicMaterial).opacity = p.triggerDown || p.downFirst ? 0.6 : 0.2;
          }
        }
      }
      if (chain[0] !== p.chain[0]) {
        p.leftFrom = p.chain[0] ?? null; p.leftAt = performance.now();
        fire(p.chain, "onPointerOut", p, first); fire(chain, "onPointerOver", p, first);
      }
      p.chain = chain;
      // Also read the trigger button directly: some Quest browsers never send the select events.
      const trigger = (source.gamepad?.buttons[0]?.value ?? 0) > 0.6 || Boolean(source.gamepad?.buttons[0]?.pressed);
      const now = performance.now();
      if (trigger && !p.triggerDown) { p.triggerDown = true; p.triggerAt = now; }
      if (trigger && p.triggerDown && !p.polled && !p.downFirst && now - p.triggerAt > 90) { p.polled = true; press(p); }
      if (!trigger && p.triggerDown) { p.triggerDown = false; if (p.polled) { p.polled = false; release(p, source); } }
      if (p.downChain.length && first) fire(p.downChain, "onPointerMove", p, first);
    }
  }, -55);
  return <>
    <mesh ref={hud} visible={false} renderOrder={2000} raycast={() => {}}>
      <planeGeometry args={[0.8, 0.4]} /><meshBasicMaterial map={hudTexture} transparent depthTest={false} toneMapped={false} />
    </mesh>
    {[0, 1].map((i) => (
    <group key={`glow${i}`} ref={(g) => { glows.current[i] = g; }} visible={false} matrixAutoUpdate={false} renderOrder={999}>
      <mesh raycast={() => {}} renderOrder={999}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#6dffb0" transparent opacity={0.2} depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>
      <lineSegments raycast={() => {}} renderOrder={1000}><edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} /><lineBasicMaterial color="#9dffc8" transparent opacity={0.9} depthTest={false} toneMapped={false} /></lineSegments>
    </group>
  ))}{[0, 1].map((i) => (
    <mesh key={i} ref={(m) => { dots.current[i] = m; }} visible={false} renderOrder={1000} raycast={() => {}}>
      <sphereGeometry args={[0.012, 12, 8]} />
      <meshBasicMaterial color="#6dffb0" depthTest={false} toneMapped={false} />
    </mesh>
  ))}</>;
}
