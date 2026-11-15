import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { createXionInteraction } from "./interaction";
import { XionCamera } from "./scene/XionCamera";
import { XionSpeech } from "./ui/XionSpeech";
import { Backdrop } from "./scene/Backdrop";
import { FlyingCars } from "./scene/FlyingCars";
import { Suspense } from "react";
import { Deck } from "./scene/Deck";
import { Garden } from "./scene/Garden";
import { Seedling } from "./scene/Seedling";
import { Lounge } from "./scene/Lounge";
import { Xion } from "./scene/Xion";
import { createAmbience } from "./audio/ambience";
import { BACKDROP, EYE_HEIGHT, LOOK, XION } from "./config";

function ReadySignal({ onReady }: { onReady: () => void }) {
  const n = useRef(0);
  useFrame(() => { if (++n.current === 3) onReady(); });
  return null;
}

export function GardenScene() {
  const [ready, setReady] = useState(false);
  const [stageName, setStageName] = useState("Seedling");
  const [playing, setPlaying] = useState(false);
  const audio = useRef<ReturnType<typeof createAmbience> | null>(null);
  const [interaction] = useState(() => createXionInteraction({ x: XION.position[0], y: XION.position[1], z: XION.position[2] }));
  const bubbleRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const debug = { get state() { return { ...interaction.state }; }, move: interaction.move, tap: () => interaction.release(false), release: () => interaction.release(true), dismiss: interaction.dismiss };
    Object.assign(window, { __game: debug });
    return () => { Reflect.deleteProperty(window, "__game"); };
  }, [interaction]);
  useEffect(() => () => audio.current?.dispose(), []);
  const toggleSound = async () => {
    if (!audio.current) audio.current = createAmbience();
    await audio.current.setPlaying(!playing);
    setPlaying(!playing);
  };
  const onStage = useCallback((n: string) => setStageName(n), []);

  return (
    <div className="gv-stage" data-scene-ready={ready ? "" : undefined}>
      <Canvas camera={{ position: [0, EYE_HEIGHT, 3], fov: LOOK.fov, near: 0.05, far: 500 }} dpr={[1, 2]} onPointerMissed={() => interaction.dismiss()}>
        <color attach="background" args={[BACKDROP.fill]} />
        <hemisphereLight args={["#ffd9ea", "#3a2a3a", 0.9]} />
        <directionalLight position={[-20, 15, -30]} intensity={0.6} color="#ffe6f2" />
        <Environment resolution={64}>
          <Lightformer intensity={1.5} color="#ffc6e0" position={[0, 5, 0]} scale={[10, 10, 1]} rotation-x={Math.PI / 2} />
          <Lightformer intensity={0.8} color="#8a6a8a" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
        </Environment>
        <group onClick={() => interaction.dismiss()}>
          <Suspense fallback={null}><Backdrop /></Suspense>
          <FlyingCars />
          <Deck />
          <Garden />
          <Lounge />
        </group>
        <Suspense fallback={null}><Xion interaction={interaction} /></Suspense>
        <Seedling onStageChange={onStage} />
        <XionCamera interaction={interaction} bubbleRef={bubbleRef} />
        <ReadySignal onReady={() => setReady(true)} />
      </Canvas>

      <header className="gv-header grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0"><div className="gv-title"><h1 className="truncate">Gardenverse</h1><p>Rooftop garden · dusk</p></div>
          <div className="gv-chip" aria-live="polite">🌱 {stageName}</div>
        </div>
        <Button variant="ghost" className="gv-sound shrink-0" onClick={toggleSound} aria-label={playing ? "Mute ambience" : "Play ambience"}>
          {playing ? <Volume2 /> : <VolumeX />}{playing ? "Sound on" : "Play sound"}
        </Button>
      </header>
      <XionSpeech interaction={interaction} bubbleRef={bubbleRef} />
      <div className="gv-hint">Drag to look around · Click the seedling to water it</div>
    </div>
  );
}
