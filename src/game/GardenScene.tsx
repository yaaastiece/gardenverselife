import { PLANTLETS, chosenPlantlet, choosePlantlet, named, plantName, type PlantletId } from "./plants/plantlets";
import { PlantletPicker } from "./ui/PlantletPicker";
import { createStartScreen } from "./start";
import { StartWorldPanel } from "./xr/StartWorldPanel";
import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Volume2, VolumeX } from "lucide-react";
import { VolumeSliders } from "./ui/VolumeSliders";
import { Weather } from "./scene/Weather";
import { weather, WEATHER_ICON, WEATHER_LABEL, type WeatherMode } from "./weather/weather";
import { setRain } from "./weather/rainSound";
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
import { ALERTS, createCompanionCareStates, type CareAction } from "./plants/care";
import { BEDS, createBedCare, createPlantSelection } from "./plants/beds";
import { PlantCard } from "./ui/PlantCard";
import { PlantCardAnchor, PlantFxLayer } from "./scene/PlantCardAnchor";
import { XionPanel } from "./ui/XionPanel";
import { createXionChat } from "./xion/chat";
import { createJournal, type PlantKey, type Snapshot } from "./xion/journal";
import { askXion } from "@/lib/xion.functions";
import { companionStages } from "./plants/growth";
import { createGardenHelper, report, HELP, type GardenHelper, type Patient } from "./xion/helper";
import { CARE } from "./plants/care";
import { createAmbience } from "./audio/ambience";
import { BACKDROP, EYE_HEIGHT, LOOK, XION } from "./config";
import { createGardenCinematic } from "./cinematic/session";
import { createCinematicSteering } from "./cinematic/steering";
import { createDictation, speak, stopSpeaking, xionSpeechEnabled } from "./xion/voice";
import { captureGardenFrame } from "./cinematic/capture";
import { CinematicOverlay } from "./ui/CinematicOverlay";
import { XR } from "@react-three/xr";
import type { RootState } from "@react-three/fiber";
import { createGardenXRStore } from "./xr/store";
import { VRRig } from "./xr/VRRig";
import { GardenPanels } from "./xr/GardenPanels";
import { createCinematicGate } from "./xr/rules";
import { createRadio } from "./audio/radio";
import { currentPlantlet } from "./plants/plantlets";
import { createMeditation } from "./meditation/meditation";
import { SoundBowl } from "./scene/SoundBowl";
import { SoundBowlCard } from "./ui/SoundBowlCard";
import { MeditationOverlay } from "./ui/MeditationOverlay";
import { BowlWorldPanel, MeditationWorldPanel } from "./xr/MeditationPanels";
import { useDockOpen } from "./ui/useDockOpen";
import { meditationPrompt, MOON_STAGE } from "./cinematic/prompts";
import { createCinematicMusic } from "./audio/cinematicMusic";
import type { Meditation } from "./meditation/meditation";

// Which bed a plant type is tracked in (matches the bed names Xion uses).
const BED_OF: Record<Exclude<PlantKey, "companion">, number> = { tomato: 0, herb: 0, lettuce: 0, strawberry: 1, pepper: 2, rose: 3 };

// World-space bed centers at soil height; labels match the bed names Xion uses.
const BED_SPOTS = [{ x: -2.6, y: 0.65, z: -1.2 }, { x: -1.3, y: 0.58, z: -3.4 }, { x: 1.4, y: 0.7, z: -3.4 }, { x: 2.8, y: 0.62, z: -1.7 }];
const BED_LABELS = ["tomatoes", "strawberries", "peppers", "roses"];
function HelperTicker({ helper }: { helper: GardenHelper }) {
  useFrame((_, d) => helper.tick(Math.min(d, 0.05)));
  return null;
}

function MeditationTicker({ meditation }: { meditation: Meditation }) {
  useFrame((_, d) => meditation.tick(Math.min(d, 0.1)));
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
  const [xrStore] = useState(createGardenXRStore);
  const [inVR, setInVR] = useState(false);
  const [vrSupported, setVRSupported] = useState(false);
  const [vrError, setVRError] = useState("");
  const [snap, setSnap] = useState(true);
  const [pendingStage, setPendingStage] = useState<number | null>(null);
  const audio = useRef<ReturnType<typeof createAmbience> | null>(null);
  const [interaction] = useState(() => createXionInteraction({ x: XION.position[0], y: XION.position[1], z: XION.position[2] }));
  const [quest] = useState(createMoonQuest);
  const [careStates] = useState(createCompanionCareStates);
  const [plantletId, setPlantletId] = useState<PlantletId>(() => chosenPlantlet() ?? "pepper");
  const care = careStates[plantletId];
  const gardenCanvas = useRef<HTMLCanvasElement | null>(null);
  const renderer = useRef<RootState | null>(null);
  const captureFrame = useCallback(() => {
    const canvas = gardenCanvas.current;
    if (!canvas) return Promise.reject(new Error("Garden frame unavailable"));
    const root = renderer.current;
    if (!root || root.gl.xr.isPresenting) return Promise.reject(new Error("Exit VR to capture the garden"));
    // Draw and copy synchronously; preserveDrawingBuffer stays disabled.
    root.gl.render(root.scene, root.camera);
    return captureGardenFrame(canvas);
  }, []);
  const [cinematic] = useState(() => createGardenCinematic(captureFrame));
  const [meditationVisuals] = useState(() => createGardenCinematic(captureFrame, { promptFor: (step) => meditationPrompt(step, { name: currentPlantlet().name, glowName: currentPlantlet().id === "lumibud" ? "soft teal-green glow" : "soft pink glow" }), autoEnd: false }));
  const [radio] = useState(() => createRadio());
  const [bowlOpen, setBowlOpen] = useState(false);
  const [visualsOn, setVisualsOn] = useState(true);
  const [dockOpen, setDockOpen] = useDockOpen();
  const [picking, setPicking] = useState(true);
  const pickPlantlet = useCallback((id: PlantletId) => {
    choosePlantlet(id);
    setPlantletId(id);
  }, []);
  const [start] = useState(() => createStartScreen({
    speak, speechEnabled: xionSpeechEnabled,
    enter: (id) => {
      pickPlantlet(id);
      if (!audio.current) audio.current = createAmbience();
      audio.current.duck(radio.getSnapshot().playing);
      void audio.current.setPlaying(true).then(() => setPlaying(true)).catch(() => setPlaying(false));
    },
    finish: () => setPicking(false),
  }));
  useEffect(() => {
    if (!picking) return;
    const timer = window.setInterval(() => start.tick(), 30);
    return () => window.clearInterval(timer);
  }, [start, picking]);
  const [cinematicGate] = useState(() => createCinematicGate((stage) => { void cinematic.advance(stage); }));
  const [meditation] = useState(() => createMeditation({
    move: (p) => interaction.move(p),
    speak: (t) => { if (xionSpeechEnabled()) speak(t); },
    stopSpeaking,
    music: { playing: () => radio.getSnapshot().playing, play: () => { void radio.play(); }, pause: () => radio.pause() },
    onEnd: () => {
      void meditationVisuals.close();
      // Growth cinematics wait for the meditation to finish.
      if (!xrStore.getState().session) requestAnimationFrame(() => { cinematicGate.flush(); setPendingStage(null); });
    },
  }));
  const [cinematicMusic] = useState(() => createCinematicMusic(radio));
  useEffect(() => {
    const sync = () => { if (cinematic.getSnapshot().open && !meditation.getSnapshot().active) cinematicMusic.start(); else cinematicMusic.stop(); };
    const off = cinematic.subscribe(sync);
    return () => { off(); cinematicMusic.stop(); };
  }, [cinematic, cinematicMusic, meditation]);
  useEffect(() => radio.subscribe(() => audio.current?.duck(radio.getSnapshot().playing)), [radio]);
  useEffect(() => () => { meditation.stop(); radio.dispose(); void meditationVisuals.close(); }, [meditation, radio, meditationVisuals]);
  useEffect(() => {
    let last = -1;
    return meditation.subscribe(() => {
      const s = meditation.getSnapshot();
      if (!s.active || !s.visuals) { last = -1; return; }
      if (s.step !== last) { const first = last === -1; last = s.step; if (!first) void meditationVisuals.advance(s.step); }
    });
  }, [meditation, meditationVisuals]);
  const queuedSteering = useRef<{ prompt: string; stage: number } | null>(null);
  const [steering] = useState(() => createCinematicSteering(async (prompt, stage) => {
    // VR keeps the established exit-to-play handoff; the validated request follows it into the same stream.
    if (xrStore.getState().session) { queuedSteering.current = { prompt, stage }; return; }
    await cinematic.steer(prompt);
  }, {
    dictation: (callbacks) => createDictation(callbacks.heard, callbacks.listening, callbacks.unavailable, callbacks.heard),
  }));
  useEffect(() => cinematic.subscribe(() => {
    const state = cinematic.getSnapshot();
    const queued = queuedSteering.current;
    if (queued && state.open && queued.stage !== state.stage) queuedSteering.current = null;
    if (!queued || !state.open || state.phase !== "playing" || xrStore.getState().session) return;
    if (queued.stage !== state.stage) return;
    queuedSteering.current = null;
    void cinematic.steer(queued.prompt).catch(() => undefined);
  }), [cinematic, xrStore]);
  useEffect(() => () => steering.dispose(), [steering]);
  useEffect(() => {
    let alive = true;
    const xr = navigator.xr;
    const check = () => { void xr?.isSessionSupported("immersive-vr").then((supported) => { if (alive) setVRSupported(supported); }).catch(() => { if (alive) setVRSupported(false); }); };
    check(); xr?.addEventListener("devicechange", check);
    return () => { alive = false; xr?.removeEventListener("devicechange", check); };
  }, []);
  useEffect(() => xrStore.subscribe((state, previous) => {
    if (state.session === previous.session) return;
    setInVR(Boolean(state.session));
    if (!state.session && previous.session) {
      interaction.state.dragging = false;
      requestAnimationFrame(() => requestAnimationFrame(() => { cinematicGate.flush(); setPendingStage(null); }));
    }
  }), [xrStore, cinematicGate, interaction]);
  useEffect(() => {
    const session = xrStore.getState().session;
    if (!session) return;
    const stopHelp = () => helper.stop();
    session.addEventListener("selectstart", stopHelp); session.addEventListener("squeezestart", stopHelp);
    return () => { session.removeEventListener("selectstart", stopHelp); session.removeEventListener("squeezestart", stopHelp); };
  }, [inVR]);
  useEffect(() => {
    let lastStage = care.state.stage;
    const unsubscribe = care.subscribe((state) => {
      if (state.stage <= lastStage) return;
      lastStage = state.stage;
      cinematicGate.advance(state.stage, Boolean(xrStore.getState().session) || meditation.getSnapshot().active);
      setPendingStage(cinematicGate.pending);
    });
    return () => { unsubscribe(); void cinematic.close(); };
  }, [care, cinematic, cinematicGate, xrStore, meditation]);
  useEffect(() => care.onAlert((k) => interaction.say(named(ALERTS[k]))), [care, interaction]);
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
    if (p === "companion") return { stage: companionStages()[care.state.stage]?.name ?? PLANTLETS[plantletId].stageNames[0], water: care.state.water, sun: care.state.sun, soil: care.state.soil };
    const b = beds.beds[BED_OF[p]];
    if (!b) return { stage: "Mature", water: 0, sun: 0, soil: 0 };
    return { stage: "Mature", water: b.water, sun: b.sun, soil: b.soil };
  }, [care, beds, plantletId]);
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
      { id: "companion", label: plantName(), stats: care.state, tooWet: care.state.water > CARE.overwater, perch: { x: -0.5, y: 1.35, z: -0.95 }, fx: { x: 0, y: 1.3, z: -1.2 } },
      ...beds.beds.map((b, i): Patient => {
        const c = BED_SPOTS[i] ?? { x: 0, y: 0.6, z: 0 };
        return { id: String(i), label: BED_LABELS[i] ?? "garden", stats: b, tooWet: b.water > BEDS.overwater, perch: { x: c.x, y: c.y + 0.6, z: c.z }, fx: { x: c.x, y: c.y + 0.7, z: c.z } };
      }),
    ];
    const r = report(patients, tipIndex.current++);
    interaction.say(r.text); chat.push("assistant", r.text); helper.setOffer(r.needs);
  }, [care, beds, interaction, chat, helper]);
  const acceptHelp = useCallback(() => { helper.start(); }, [helper]);
  const [night, setNight] = useState(false);
  useEffect(() => quest.subscribe((st) => setNight(st === "bloom")), [quest]);
  // Moonflower story: plays its three beats through the shared cinematic when the quest blooms.
  useEffect(() => {
    const timers: number[] = [];
    const off = quest.subscribe((st) => {
      if (st !== "bloom") return;
      const wait = Boolean(xrStore.getState().session) || meditation.getSnapshot().active || cinematic.getSnapshot().open;
      if (wait) { cinematicGate.advance(MOON_STAGE, true); setPendingStage(cinematicGate.pending); return; }
      void cinematic.advance(MOON_STAGE);
    });
    const offStage = cinematic.subscribe(() => {
      const c = cinematic.getSnapshot();
      if (!c.open && cinematicGate.pending !== null && !xrStore.getState().session && !meditation.getSnapshot().active) { requestAnimationFrame(() => { cinematicGate.flush(); setPendingStage(null); }); return; }
      if (c.open && c.phase === "playing" && c.stage >= MOON_STAGE && c.stage < MOON_STAGE + 2 && timers.length === 0) {
        timers.push(window.setTimeout(() => { timers.length = 0; const n = cinematic.getSnapshot(); if (n.open && n.stage === c.stage) void cinematic.advance(c.stage + 1); }, 6000));
      }
    });
    return () => { off(); offStage(); timers.forEach(clearTimeout); };
  }, [quest, cinematic, cinematicGate, xrStore, meditation]);
  const doMoonTask = useCallback(() => {
    const lesson = quest.advance();
    interaction.move({ x: MOONFLOWER_POS[0] - 0.35, y: 1.3, z: MOONFLOWER_POS[2] + 0.1 });
    interaction.say(lesson);
  }, [quest, interaction]);
  const startMeditation = useCallback(() => {
    helper.stop(); interaction.dismiss(); setBowlOpen(false);
    const vr = Boolean(xrStore.getState().session);
    const withVisuals = visualsOn && !vr && !cinematic.getSnapshot().open;
    meditation.start(interaction.state.position, withVisuals);
    if (withVisuals) void meditationVisuals.advance(0);
  }, [helper, interaction, xrStore, visualsOn, cinematic, meditation, meditationVisuals]);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const canvasPress = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const debug = { start, get state() { return { ...interaction.state }; }, move: interaction.move, tap: () => interaction.release(false), release: () => interaction.release(true), dismiss: interaction.dismiss, say: interaction.say, care, careStates, plantletId, beds, xr: xrStore, renderer: () => renderer.current, selection, cinematic, steering, radio, meditation, meditationVisuals };
    Object.assign(window, { __game: debug });
    return () => { Reflect.deleteProperty(window, "__game"); };
  }, [interaction, care, careStates, plantletId, beds, xrStore, selection, cinematic, steering, radio, meditation, meditationVisuals]);
  useEffect(() => () => audio.current?.dispose(), []);
  const [volOpen, setVolOpen] = useState(false);
  const [sky, setSky] = useState<WeatherMode>(weather.getSnapshot());
  useEffect(() => weather.subscribe(() => { setSky(weather.getSnapshot()); setRain(weather.getSnapshot() === "rain"); }), []);
  const toggleSound = async () => {
    if (!audio.current) { audio.current = createAmbience(); audio.current.duck(radio.getSnapshot().playing); }
    await audio.current.setPlaying(!playing);
    setPlaying(!playing);
  };
  const onStage = useCallback((n: string) => setStageName(n), []);

  // Back to the start screen for the next judge, without leaving VR.
  function startOver() {
    helper.stop(); meditation.stop(); interaction.dismiss(); selection.clear(); setBowlOpen(false);
    Object.values(careStates).forEach((c) => c.reset());
    start.reset(); setPicking(true); setPendingStage(null);
    void audio.current?.setPlaying(false); setPlaying(false);
  }
  const exitVR = () => { void xrStore.getState().session?.end().catch(() => setVRError("Use the Quest menu to leave VR.")); };
  const enterVR = async () => {
    setVRError("");
    try {
      const entering = xrStore.enterVR();
      if (!picking) {
        if (!audio.current) audio.current = createAmbience();
        void audio.current.setPlaying(true).then(() => setPlaying(true)).catch(() => setVRError("Ambient sound could not start."));
      }
      await entering;
    } catch { setVRError("VR could not start. Open the published garden in the Quest browser and try again."); }
  };
  return (
    <div className="gv-stage" data-vr={inVR ? "" : undefined} data-scene-ready={ready ? "" : undefined}
      onPointerDownCapture={(e) => {
        if (helper.state.busy) helper.stop();
        if (!(e.target instanceof HTMLCanvasElement)) return;
        if (meditation.getSnapshot().active) meditation.stop();
        canvasPress.current = { x: e.clientX, y: e.clientY };
        interaction.state.pointerHandled = false;
      }}
      onPointerUp={(e) => {
        const start = canvasPress.current;
        canvasPress.current = null;
        if (start && !interaction.state.pointerHandled && !isDrag(start, { x: e.clientX, y: e.clientY })) interaction.dismiss();
      }}>
      <Canvas gl={{ preserveDrawingBuffer: false }} onCreated={(root) => { gardenCanvas.current = root.gl.domElement; renderer.current = root; root.gl.xr.setReferenceSpaceType("local-floor"); }} camera={{ position: [0, EYE_HEIGHT, 3], fov: LOOK.fov, near: 0.05, far: 500 }} dpr={inVR ? 1 : [1, LOOK.maxDpr]} onPointerMissed={() => { interaction.dismiss(); selection.clear(); }}>
        <XR store={xrStore}>
        <VRRig snap={snap} onRestart={startOver} />
        <group>
        <color attach="background" args={[BACKDROP.fill]} />
        <hemisphereLight args={["#ffd9ea", "#3a2a3a", night ? 0.35 : 0.9]} />
        <directionalLight position={[-20, 15, -30]} intensity={night ? 0.2 : 0.6} color={night ? "#b9c4ff" : "#ffe6f2"} />
        <Environment resolution={64}>
          <Lightformer intensity={1.5} color="#ffc6e0" position={[0, 5, 0]} scale={[10, 10, 1]} rotation-x={Math.PI / 2} />
          <Lightformer intensity={0.8} color="#8a6a8a" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
        </Environment>
        <group onClick={() => { interaction.dismiss(); selection.clear(); }}>
          <SkyDome />
          <Weather weather={weather} />
          <Suspense fallback={null}><Backdrop /></Suspense>
          <FlyingCars />
          <Deck />
          <Garden beds={beds} selection={selection} />
          <Lounge />
        </group>
        <SoundBowl radio={radio} meditation={meditation} onOpen={() => setBowlOpen(true)} />
        <Suspense fallback={null}><Xion interaction={interaction} meditation={meditation} /></Suspense>
        <Seedling key={plantletId} onStageChange={onStage} care={care} paused={picking} />
        <Moonflower quest={quest} onTask={doMoonTask} />
        {!inVR && <XionCamera interaction={interaction} bubbleRef={bubbleRef} />}
        {!inVR && <PlantCardAnchor selection={selection} cardRef={cardRef} />}
        {!inVR && <PlantFxLayer selection={selection} />}
        {inVR && picking && <Suspense fallback={null}><StartWorldPanel start={start} /></Suspense>}
        {inVR && !picking && <GardenPanels care={care} beds={beds} selection={selection} quest={quest} interaction={interaction} onMoon={doMoonTask} snap={snap} setSnap={setSnap} pending={pendingStage} playCinematic={exitVR} exit={exitVR} onStartOver={startOver} cinematic={cinematic} steering={steering} />}
        {inVR && bowlOpen && <BowlWorldPanel radio={radio} onMeditate={startMeditation} onClose={() => setBowlOpen(false)} />}
        {inVR && <MeditationWorldPanel meditation={meditation} />}
        <HelperTicker helper={helper} />
        <MeditationTicker meditation={meditation} />
        <ReadySignal onReady={() => setReady(true)} />
        </group>
        </XR>
      </Canvas>

      <header className="gv-header grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0"><div className="gv-title"><h1 className="truncate">Gardenverse</h1><p>Rooftop garden · dusk</p></div>
          <div className="gv-chip" aria-live="polite">🌱 {stageName}</div>
        </div>
        <div className="relative flex shrink-0 gap-1">
          <Button variant="ghost" className="gv-sound" onClick={toggleSound} aria-label={playing ? "Mute ambience" : "Play ambience"}>
            {playing ? <Volume2 /> : <VolumeX />}{playing ? "Sound on" : "Play sound"}
          </Button>
          <Button variant="ghost" className="gv-sound" aria-label={`Weather: ${WEATHER_LABEL[sky]}. Tap to change`} onClick={() => weather.cycle()}>{WEATHER_ICON[sky]} <span className="max-sm:hidden">{WEATHER_LABEL[sky]}</span></Button>
          <Button variant="ghost" className="gv-sound" aria-label="Volume" aria-expanded={volOpen} onClick={() => setVolOpen((v) => !v)}><SlidersHorizontal /></Button>
          {volOpen && <div className="gv-volpop" role="dialog" aria-label="Volume controls"><VolumeSliders radio={radio} garden /></div>}
        </div>
      </header>
      {!inVR && picking && <PlantletPicker start={start} onVR={vrSupported ? enterVR : undefined} vrError={vrError} />}
      {vrSupported && !inVR && !picking && <div className="gv-vr-entry"><Button variant="outline" onClick={enterVR}>Enter VR</Button>{vrError && <p role="status">{vrError}</p>}</div>}
      <div className="gv-dock"><CarePanel care={care} onAction={careAction} onChangePlantlet={startOver} open={dockOpen} setOpen={setDockOpen} />{dockOpen && <MoonQuestCard quest={quest} onTask={doMoonTask} />}</div>
      {!inVR && bowlOpen && <SoundBowlCard radio={radio} onMeditate={startMeditation} visuals={visualsOn} setVisuals={setVisualsOn} onClose={() => setBowlOpen(false)} />}
      {!inVR && <MeditationOverlay meditation={meditation} visuals={meditationVisuals} radio={radio} />}
      <PlantCard beds={beds} selection={selection} cardRef={cardRef} />
      <XionPanel chat={chat} journal={journal} plant={chatPlant} setPlant={setChatPlant} snapshot={snapshot} onReply={(t) => interaction.say(t)} onCheck={checkGarden} helper={helper} onHelp={acceptHelp} />
      {helper.state.busy && <div className="gv-helping" role="status">✨ Xion is helping · tap to stop</div>}
      {!picking && <XionSpeech interaction={interaction} bubbleRef={bubbleRef} />}
      <div className="gv-hint">Drag to look around · Tap {plantName()}, the moonflower or the sound bowl</div>
      {!inVR && <CinematicOverlay session={cinematic} steering={steering} />}
    </div>
  );
}
