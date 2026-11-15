import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { createXionInteraction, isDrag } from "./interaction";
import { XionCamera } from "./scene/XionCamera";
import { XionSpeech } from "./ui/XionSpeech";
import { Backdrop } from "./scene/Backdrop";
import { SkyDome } from "./scene/SkyDome";
import { FlyingCars } from "./scene/FlyingCars";
import { Suspense } from "react";
import { Deck } from "./scene/Deck";
import { Garden } from "./scene/Garden";
import { Seedling } from "./scene/Seedling";
import { Lounge } from "./scene/Lounge";
import { Xion } from "./scene/Xion";
import { Moonflower, MOONFLOWER_POS } from "./scene/Moonflower";
import { MoonQuestCard } from "./ui/MoonQuestCard";
import { createMoonQuest } from "./plants/moonflower";
import { CarePanel } from "./ui/CarePanel";
import { ALERTS, createPlantCare, type CareAction } from "./plants/care";
import { BEDS, createBedCare, createPlantSelection } from "./plants/beds";
import { PlantCard } from "./ui/PlantCard";
import { PlantCardAnchor, PlantFxLayer } from "./scene/PlantCardAnchor";
import { XionPanel } from "./ui/XionPanel";
import { createXionChat } from "./xion/chat";
import { createJournal, type PlantKey, type Snapshot } from "./xion/journal";
import { askXion } from "@/lib/xion.functions";
import { SEEDLING_STAGES } from "./plants/growth";
import { createGardenHelper, report, HELP, type GardenHelper, type Patient } from "./xion/helper";
import { CARE } from "./plants/care";
import { createAmbience } from "./audio/ambience";
import { BACKDROP, EYE_HEIGHT, LOOK, XION } from "./config";

// Which bed a plant type is tracked in (matches the bed names Xion uses).
const BED_OF: Record<Exclude<PlantKey, "companion">, number> = { tomato: 0, herb: 0, lettuce: 0, strawberry: 1, pepper: 2, rose: 3 };

// World-space bed centers at soil height; labels match the bed names Xion uses.
const BED_SPOTS = [{ x: -2.6, y: 0.65, z: -1.2 }, { x: -1.3, y: 0.58, z: -3.4 }, { x: 1.4, y: 0.7, z: -3.4 }, { x: 2.8, y: 0.62, z: -1.7 }];
const BED_LABELS = ["tomatoes", "strawberries", "peppers", "roses"];
function HelperTicker({ helper }: { helper: GardenHelper }) {
  useFrame((_, d) => helper.tick(Math.min(d, 0.05)));
  return null;
}

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
  const [quest] = useState(createMoonQuest);
  const [care] = useState(createPlantCare);
  useEffect(() => care.onAlert((k) => interaction.say(ALERTS[k])), [care, interaction]);
  const careAction = useCallback((a: CareAction) => { care.act(a); }, [care]);
  const [beds] = useState(() => createBedCare());
  const [selection] = useState(createPlantSelection);
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => beds.onAlert((a) => interaction.say(a.text)), [beds, interaction]);
  const [chat] = useState(() => createXionChat((messages, context) => askXion({ data: { messages, context } })));
  const [journal] = useState(() => createJournal());
  const [chatPlant, setChatPlant] = useState<PlantKey>("companion");
  useEffect(() => selection.subscribe(() => { const k = selection.state.selected?.kind; if (k) setChatPlant(k); }), [selection]);
  const snapshot = useCallback((p: PlantKey): Snapshot => {
    if (p === "companion") return { stage: SEEDLING_STAGES[care.state.stage]?.name ?? "Seedling", water: care.state.water, sun: care.state.sun, soil: care.state.soil };
    const b = beds.beds[BED_OF[p]]!;
    return { stage: "Mature", water: b.water, sun: b.sun, soil: b.soil };
  }, [care, beds]);
  const [, setHelpTick] = useState(0);
  const [helper] = useState(() => createGardenHelper({
    move: (p) => interaction.move(p), position: () => interaction.state.position, say: (t) => interaction.say(t),
    fix: (n) => {
      const a = n.stat;
      if (n.patient.id === "companion") care.assist(a, HELP.target); else beds.assist(Number(n.patient.id), a, HELP.target);
      selection.effectAt(n.patient.fx, a);
    },
    onState: () => setHelpTick((x) => x + 1),
  }));
  const tipIndex = useRef(0);
  const checkGarden = useCallback(() => {
    const patients: Patient[] = [
      { id: "companion", label: "plant companion", stats: care.state, tooWet: care.state.water > CARE.overwater, perch: { x: -0.35, y: 1.25, z: -1.15 }, fx: { x: 0, y: 1.2, z: -1.4 } },
      ...beds.beds.map((b, i): Patient => {
        const c = BED_SPOTS[i]!;
        return { id: String(i), label: BED_LABELS[i]!, stats: b, tooWet: b.water > BEDS.overwater, perch: { x: c.x, y: c.y + 0.6, z: c.z }, fx: { x: c.x, y: c.y + 0.7, z: c.z } };
      }),
    ];
    const r = report(patients, tipIndex.current++);
    interaction.say(r.text); chat.push("assistant", r.text); helper.setOffer(r.needs);
  }, [care, beds, interaction, chat, helper]);
  const acceptHelp = useCallback(() => { helper.start(); }, [helper]);
  const [night, setNight] = useState(false);
  useEffect(() => quest.subscribe((st) => setNight(st === "bloom")), [quest]);
  const doMoonTask = useCallback(() => {
    const lesson = quest.advance();
    interaction.move({ x: MOONFLOWER_POS[0] - 0.35, y: 1.3, z: MOONFLOWER_POS[2] + 0.1 });
    interaction.say(lesson);
  }, [quest, interaction]);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const canvasPress = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const debug = { get state() { return { ...interaction.state }; }, move: interaction.move, tap: () => interaction.release(false), release: () => interaction.release(true), dismiss: interaction.dismiss, say: interaction.say, care, beds };
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
    <div className="gv-stage" data-scene-ready={ready ? "" : undefined}
      onPointerDownCapture={(e) => {
        if (helper.state.busy) helper.stop();
        if (!(e.target instanceof HTMLCanvasElement)) return;
        canvasPress.current = { x: e.clientX, y: e.clientY };
        interaction.state.pointerHandled = false;
      }}
      onPointerUp={(e) => {
        const start = canvasPress.current;
        canvasPress.current = null;
        if (start && !interaction.state.pointerHandled && !isDrag(start, { x: e.clientX, y: e.clientY })) interaction.dismiss();
      }}>
      <Canvas camera={{ position: [0, EYE_HEIGHT, 3], fov: LOOK.fov, near: 0.05, far: 500 }} dpr={[1, LOOK.maxDpr]} onPointerMissed={() => { interaction.dismiss(); selection.clear(); }}>
        <color attach="background" args={[BACKDROP.fill]} />
        <hemisphereLight args={["#ffd9ea", "#3a2a3a", night ? 0.35 : 0.9]} />
        <directionalLight position={[-20, 15, -30]} intensity={night ? 0.2 : 0.6} color={night ? "#b9c4ff" : "#ffe6f2"} />
        <Environment resolution={64}>
          <Lightformer intensity={1.5} color="#ffc6e0" position={[0, 5, 0]} scale={[10, 10, 1]} rotation-x={Math.PI / 2} />
          <Lightformer intensity={0.8} color="#8a6a8a" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
        </Environment>
        <group onClick={() => { interaction.dismiss(); selection.clear(); }}>
          <SkyDome />
          <Suspense fallback={null}><Backdrop /></Suspense>
          <FlyingCars />
          <Deck />
          <Garden beds={beds} selection={selection} />
          <Lounge />
        </group>
        <Suspense fallback={null}><Xion interaction={interaction} /></Suspense>
        <Seedling onStageChange={onStage} care={care} />
        <Moonflower quest={quest} onTask={doMoonTask} />
        <XionCamera interaction={interaction} bubbleRef={bubbleRef} />
        <PlantCardAnchor selection={selection} cardRef={cardRef} />
        <PlantFxLayer selection={selection} />
        <HelperTicker helper={helper} />
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
      <div className="gv-dock"><CarePanel care={care} onAction={careAction} /><MoonQuestCard quest={quest} onTask={doMoonTask} /></div>
      <PlantCard beds={beds} selection={selection} cardRef={cardRef} />
      <XionPanel chat={chat} journal={journal} plant={chatPlant} setPlant={setChatPlant} snapshot={snapshot} onReply={(t) => interaction.say(t)} onCheck={checkGarden} helper={helper} onHelp={acceptHelp} />
      {helper.state.busy && <div className="gv-helping" role="status">✨ Xion is helping · tap to stop</div>}
      <XionSpeech interaction={interaction} bubbleRef={bubbleRef} />
      <div className="gv-hint">Drag to look around · Tap the seedling or moonflower</div>
    </div>
  );
}
