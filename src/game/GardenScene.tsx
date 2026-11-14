import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Lightformer } from "@react-three/drei";
import { Backdrop } from "./scene/Backdrop";
import { FlyingCars } from "./scene/FlyingCars";
import { Suspense } from "react";
import { Deck } from "./scene/Deck";
import { Garden } from "./scene/Garden";
import { Seedling } from "./scene/Seedling";
import { Lounge } from "./scene/Lounge";
import { createAmbience } from "./audio/ambience";
import { BACKDROP, EYE_HEIGHT, LOOK } from "./config";

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
  useEffect(() => () => audio.current?.dispose(), []);
  const toggleSound = async () => {
    if (!audio.current) audio.current = createAmbience();
    await audio.current.setPlaying(!playing);
    setPlaying(!playing);
  };
  const onStage = useCallback((n: string) => setStageName(n), []);

  return (
    <div className="gv-stage" data-scene-ready={ready ? "" : undefined}>
      <Canvas camera={{ position: [0, EYE_HEIGHT, 1.2], fov: LOOK.fov, near: 0.05, far: 500 }} dpr={[1, 2]}>
        <color attach="background" args={[BACKDROP.fill]} />
        <hemisphereLight args={["#ffd9ea", "#3a2a3a", 0.9]} />
        <directionalLight position={[-20, 15, -30]} intensity={0.6} color="#ffe6f2" />
        <Environment resolution={64}>
          <Lightformer intensity={1.5} color="#ffc6e0" position={[0, 5, 0]} scale={[10, 10, 1]} rotation-x={Math.PI / 2} />
          <Lightformer intensity={0.8} color="#8a6a8a" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
        </Environment>
        <Suspense fallback={null}><Backdrop /></Suspense>
        <FlyingCars />
        <Deck />
        <Garden />
        <Lounge />
        <Seedling onStageChange={onStage} />
        <OrbitControls target={[0, EYE_HEIGHT - 0.12, 0.7]} enableZoom={false} enablePan={false} rotateSpeed={-0.35} minPolarAngle={LOOK.polarMin} maxPolarAngle={LOOK.polarMax} minAzimuthAngle={-LOOK.yaw} maxAzimuthAngle={LOOK.yaw} />
        <ReadySignal onReady={() => setReady(true)} />
      </Canvas>

      <header className="gv-title"><h1>Gardenverse</h1><p>Rooftop garden · dusk</p></header>
      <div className="gv-hint">Drag to look around · Click the seedling to water it</div>
      <div className="gv-chip" aria-live="polite">🌱 {stageName}</div>
      <button className="gv-sound" onClick={toggleSound} aria-label={playing ? "Mute ambience" : "Play ambience"}>
        {playing ? "🔊 Sound on" : "🔇 Play sound"}
      </button>
    </div>
  );
}
