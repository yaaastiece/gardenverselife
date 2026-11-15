import { plantName } from "../plants/plantlets";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { status, type PlantCare } from "../plants/care";
import { PLANT_INFO, bedStatus, type BedCare, type PlantSelection } from "../plants/beds";
import { MOON_TASKS, type MoonQuest } from "../plants/moonflower";
import { SEEDLING_STAGES } from "../plants/growth";
import { FADE_MS, SPEECH_MS, type XionInteraction } from "../interaction";
import type { CinematicSession } from "../cinematic/session";
import type { CinematicSteering } from "../cinematic/steering";
import { WorldPanel, type PanelButton } from "./WorldPanel";

function useRefresh(subscribe: (cb: () => void) => () => void) {
  const [, force] = useState(0);
  useEffect(() => { let last = 0; return subscribe(() => { const now = performance.now(); if (now - last > 200) { last = now; force((v) => v + 1); } }); }, [subscribe]);
}
const stats = (s: { water: number; sun: number; soil: number }) => [
  { label: "Water", value: s.water }, { label: "Sun", value: s.sun }, { label: "Soil", value: s.soil },
];
export function GardenPanels({ care, beds, selection, quest, interaction, onMoon, snap, setSnap, pending, playCinematic, exit, cinematic, steering }: {
  care: PlantCare; beds: BedCare; selection: PlantSelection; quest: MoonQuest; interaction: XionInteraction;
  onMoon: () => void; snap: boolean; setSnap: (v: boolean) => void; pending: number | null; playCinematic: () => void; exit: () => void;
  cinematic: CinematicSession; steering: CinematicSteering;
}) {
  useRefresh(care.subscribe); useRefresh(beds.subscribe); useRefresh(selection.subscribe);
  const [, refreshQuest] = useState(0);
  useEffect(() => quest.subscribe(() => refreshQuest((v) => v + 1)), [quest]);
  const pick = selection.state.selected;
  const bed = pick ? beds.beds[pick.bed] : undefined;
  const task = MOON_TASKS[quest.state.step];
  return <>
    <WorldPanel position={[-0.9, 1.28, -0.85]} title={`${plantName()} · ${status(care.state)}`} bars={stats(care.state)}
      lines={[...(care.state.water > 90 ? ["Too much water"] : []), SEEDLING_STAGES.map((stage, i) => `${i === care.state.stage ? "● " : ""}${stage.name}`).join(" · ")]}
      buttons={[{ label: "Water", action: () => care.act("water") }, { label: "Sun", action: () => care.act("sun") }, { label: "Feed soil", action: () => care.act("soil") }, { label: `Snap turn 30°: ${snap ? "On" : "Off"}`, action: () => setSnap(!snap) }, { label: "Exit VR", action: exit }]} />
    <WorldPanel position={[1.45, 1.25, -0.85]} title="Moonflower" lines={[task.task]} buttons={[{ label: task.action, action: onMoon }]} />
    {pick && bed && <WorldPanel position={[pick.pos.x, pick.pos.y + 0.35, pick.pos.z]} title={`${PLANT_INFO[pick.kind].name} · ${bedStatus(bed)}`} bars={stats(bed)}
      lines={[...(bed.water > 90 ? ["Too much water"] : []), PLANT_INFO[pick.kind].likes]}
      buttons={(["water", "sun", "soil"] as const).map((action) => ({ label: action === "soil" ? "Feed soil" : action === "sun" ? "Sun" : "Water", action: () => { beds.act(pick.bed, action); selection.effect(action); } })).concat([{ label: "Close", action: () => selection.clear() }])} />}
    <XionWorldSpeech interaction={interaction} />
    {pending !== null && <SteeringWorldPanel stage={pending} cinematic={cinematic} steering={steering} playCinematic={playCinematic} />}
  </>;
}

function SteeringWorldPanel({ stage, cinematic, steering, playCinematic }: {
  stage: number; cinematic: CinematicSession; steering: CinematicSteering; playCinematic: () => void;
}) {
  const state = useSyncExternalStore(steering.subscribe, steering.getSnapshot, steering.getSnapshot);
  const [, setClock] = useState(0);
  useEffect(() => {
    steering.setStage(stage);
    return () => steering.stopVoice();
  }, [stage, steering]);
  useEffect(() => {
    const timer = window.setInterval(() => { steering.tick(); setClock((value) => value + 1); }, 250);
    return () => window.clearInterval(timer);
  }, [steering]);
  const remaining = steering.remaining();
  const blocked = state.sending || remaining > 0;
  const submit = (text?: string) => {
    if (blocked) return;
    cinematic.resetCountdown();
    void steering.submitCurrent(text);
  };
  const heard = state.draft.trim();
  const statusLine = state.listening
    ? `Listening · ${heard || "speak now"}`
    : state.voiceMessage ?? state.message ?? (state.sent ? "Request ready for the cinematic" : "Hold the mic, or choose a suggestion");
  const buttons: PanelButton[] = steering.chips().map((text, index) => ({
    label: index >= 2 ? `Xion suggests · ${text}` : text,
    disabled: blocked,
    action: () => submit(text),
  }));
  buttons.push(
    { label: state.listening ? "Listening · release to stop" : "Hold to talk", active: state.listening,
      press: () => { cinematic.resetCountdown(); steering.startVoice(); }, release: steering.stopVoice },
    { label: remaining > 0 ? `Send heard request · ${remaining}s` : "Send heard request", disabled: blocked || !heard, action: () => submit() },
    { label: "Exit VR & play", action: playCinematic },
  );
  return <WorldPanel position={[0, 1.25, -1.05]} width={0.86} title="Steer the cinematic"
    lines={["Xion suggests · two fresh ideas every 8 seconds", ...(heard && !state.listening ? [`Heard: ${heard}`] : []), statusLine]}
    buttons={buttons} />;
}

function XionWorldSpeech({ interaction }: { interaction: XionInteraction }) {
  const [speech, setSpeech] = useState(interaction.state.speech);
  const [phase, setPhase] = useState("show");
  const anchor = useRef<Group>(null);
  useEffect(() => interaction.subscribe(setSpeech), [interaction]);
  useEffect(() => {
    setPhase("show"); if (!speech) return;
    const fade = setTimeout(() => setPhase("fade"), SPEECH_MS);
    const hide = setTimeout(() => setPhase("gone"), SPEECH_MS + FADE_MS);
    return () => { clearTimeout(fade); clearTimeout(hide); };
  }, [speech]);
  useFrame(({ camera }) => {
    const p = interaction.state.position; const group = anchor.current; if (!group) return;
    // Anchor below her feet, offset sideways in the viewer's horizontal plane.
    const rightX = Math.cos(camera.rotation.y), rightZ = -Math.sin(camera.rotation.y);
    group.position.set(p.x + rightX * 0.4, p.y - 0.6, p.z + rightZ * 0.4);
  });
  if (!speech || phase === "gone") return null;
  return <group ref={anchor}><WorldPanel title="Xion" lines={[speech.text]} width={0.58} opacity={phase === "fade" ? 0.35 : 1} /></group>;
}
