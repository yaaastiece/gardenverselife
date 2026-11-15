import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { useXR } from "@react-three/xr";
import * as THREE from "three";

// Our own controller/hand pointer. It aims from each input source's target-ray pose, finds the
// objects that have React Three Fiber handlers (onClick, onPointerOver, ...) and calls them,
// so every existing button and tappable object works without the library's pointer system.

type R3FObject = THREE.Object3D & { __r3f?: { eventCount?: number; handlers?: Record<string, ((event: unknown) => void) | undefined> } };
type Hit = THREE.Intersection;
type Pointer = { id: number; chain: R3FObject[]; hit: Hit | null; hits: Hit[]; downChain: R3FObject[]; downFirst: R3FObject | null };

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

  useEffect(() => {
    if (!session) return;
    const forSource = (event: XRInputSourceEvent) => {
      let p = pointers.current.get(event.inputSource);
      if (!p) { p = { id: next.current++, chain: [], hit: null, hits: [], downChain: [], downFirst: null }; pointers.current.set(event.inputSource, p); }
      return p;
    };
    const pulse = (source: XRInputSource) => { try { void (source.gamepad?.hapticActuators?.[0] as { pulse?: (v: number, ms: number) => void } | undefined)?.pulse?.(0.4, 35); } catch { /* optional */ } };
    const down = (event: XRInputSourceEvent) => {
      const p = forSource(event);
      p.downChain = p.chain; p.downFirst = p.chain[0] ?? null;
      fire(p.chain, "onPointerDown", p, p.hit);
    };
    const up = (event: XRInputSourceEvent) => {
      const p = forSource(event);
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
    for (const source of session.inputSources) {
      if (!source.targetRaySpace) continue;
      const pose = frame.getPose(source.targetRaySpace, refSpace);
      if (!pose) continue;
      let p = pointers.current.get(source);
      if (!p) { p = { id: next.current++, chain: [], hit: null, hits: [], downChain: [], downFirst: null }; pointers.current.set(source, p); }
      tools.matrix.fromArray(pose.transform.matrix);
      if (originMatrix) tools.matrix.premultiply(originMatrix);
      tools.from.setFromMatrixPosition(tools.matrix);
      tools.dir.set(0, 0, -1).transformDirection(tools.matrix);
      tools.raycaster.set(tools.from, tools.dir); tools.raycaster.far = RANGE;
      const hits = tools.raycaster.intersectObjects(interaction.current, true).filter((h) => visible(h.object));
      const first = hits[0] ?? null;
      const chain = first ? chainOf(first.object) : [];
      p.hits = hits; p.hit = first;
      if (chain[0] !== p.chain[0]) {
        fire(p.chain, "onPointerOut", p, first); fire(chain, "onPointerOver", p, first);
      }
      p.chain = chain;
      if (p.downChain.length && first) fire(p.downChain, "onPointerMove", p, first);
    }
  }, -55);
  return null;
}
