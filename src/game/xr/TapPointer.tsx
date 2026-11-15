import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { useXR } from "@react-three/xr";
import * as THREE from "three";

// Our own controller/hand pointer. It aims from each input source's target-ray pose, finds the
// objects that have React Three Fiber handlers (onClick, onPointerOver, ...) and calls them,
// so every existing button and tappable object works without the library's pointer system.

type R3FObject = THREE.Object3D & { __r3f?: { eventCount?: number; handlers?: Record<string, ((event: unknown) => void) | undefined> } };
type Hit = THREE.Intersection;
type Pointer = { id: number; chain: R3FObject[]; hit: Hit | null; hits: Hit[]; downChain: R3FObject[]; downFirst: R3FObject | null; polled: boolean; triggerDown: boolean; triggerAt: number };
const fresh = (id: number): Pointer => ({ id, chain: [], hit: null, hits: [], downChain: [], downFirst: null, polled: false, triggerDown: false, triggerAt: 0 });

const RANGE = 12;

function visible(object: THREE.Object3D | null) {
  for (let o = object; o; o = o.parent) if (!o.visible) return false;
  return true;
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

  const fire = (chain: R3FObject[], name: string, pointer: Pointer, hit: Hit | null) => {
    if (!chain.length) return;
    const target = { setPointerCapture() {}, releasePointerCapture() {}, hasPointerCapture: () => true };
    let stopped = false;
    for (const object of chain) {
      const handler = object.__r3f?.handlers?.[name];
      if (!handler) continue;
      handler({
        type: name.slice(2).toLowerCase(), object: hit?.object ?? object, eventObject: object, currentTarget: object, target,
        point: hit?.point ?? new THREE.Vector3(), distance: hit?.distance ?? 0, ray: tools.raycaster.ray.clone(), intersections: pointer.hits,
        pointerId: pointer.id, pointerType: "xr", button: 0, buttons: 1, clientX: 0, clientY: 0, nativeEvent: {},
        stopPropagation() { stopped = true; }, preventDefault() {}, delta: 0,
      });
      if (stopped) break;
    }
  };

  const pulse = (source: XRInputSource) => { try { void (source.gamepad?.hapticActuators?.[0] as { pulse?: (v: number, ms: number) => void } | undefined)?.pulse?.(0.4, 35); } catch { /* optional */ } };
  const press = (p: Pointer) => { p.downChain = p.chain; p.downFirst = p.chain[0] ?? null; fire(p.chain, "onPointerDown", p, p.hit); };
  const release = (p: Pointer, source: XRInputSource) => {
    fire(p.downChain, "onPointerUp", p, p.hit);
    if (p.downFirst && p.chain[0] === p.downFirst) { fire(p.chain, "onClick", p, p.hit); pulse(source); }
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
      if (p.downFirst && p.chain[0] === p.downFirst) { fire(p.chain, "onClick", p, p.hit); pulse(event.inputSource); }
      p.downChain = []; p.downFirst = null;
    };
    session.addEventListener("selectstart", down); session.addEventListener("selectend", up);
    const map = pointers.current;
    return () => { session.removeEventListener("selectstart", down); session.removeEventListener("selectend", up); map.clear(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useFrame((root, _delta, frame) => {
    if (!session || !frame || !refSpace) return;
    state.current = root.internal as unknown as { interaction: THREE.Object3D[] };
    interaction.current = state.current.interaction.filter((object) => visible(object));
    const originMatrix = origin.current?.matrixWorld;
    dots.current.forEach((dot) => { if (dot) dot.visible = false; });
    glows.current.forEach((glow) => { if (glow) glow.visible = false; });
    let slot = 0;
    for (const source of session.inputSources) {
      if (!source.targetRaySpace) continue;
      const pose = frame.getPose(source.targetRaySpace, refSpace);
      if (!pose) continue;
      let p = pointers.current.get(source);
      if (!p) { p = fresh(next.current++); pointers.current.set(source, p); }
      tools.matrix.fromArray(pose.transform.matrix);
      if (originMatrix) tools.matrix.premultiply(originMatrix);
      tools.from.setFromMatrixPosition(tools.matrix);
      tools.dir.set(0, 0, -1).transformDirection(tools.matrix);
      tools.raycaster.set(tools.from, tools.dir); tools.raycaster.far = RANGE;
      const hits = tools.raycaster.intersectObjects(interaction.current, true).filter((h) => visible(h.object));
      const first = hits[0] ?? null;
      const chain = first ? chainOf(first.object) : [];
      p.hits = hits; p.hit = first;
      // A green dot shows where each controller is pointing at something tappable.
      const dot = dots.current[slot++];
      if (dot && first && chain.length) { dot.visible = true; dot.position.copy(first.point); }
      // A soft green box glows around whatever is being pointed at.
      const glow = glows.current[slot - 1];
      const target = chain[0];
      if (glow && target) {
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
  return <>{[0, 1].map((i) => (
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
