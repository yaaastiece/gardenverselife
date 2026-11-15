import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { status, type PlantCare } from "../plants/care";
import { PLANT_INFO, bedStatus, type BedCare, type PlantSelection } from "../plants/beds";
import { MOON_TASKS, type MoonQuest } from "../plants/moonflower";
import { SEEDLING_STAGES } from "../plants/growth";
import { FADE_MS, SPEECH_MS, type XionInteraction } from "../interaction";
import { WorldPanel } from "./WorldPanel";

function useRefresh(subscribe: (cb: () => void) => () => void) {
  const [, force] = useState(0);
  useEffect(() => { let last = 0; return subscribe(() => { const now = performance.now(); if (now - last > 200) { last = now; force((v) => v + 1); } }); }, [subscribe]);
}
const stats = (s: { water: number; sun: number; soil: number }) => [
  { label: "Water", value: s.water }, { label: "Sun", value: s.sun }, { label: "Soil", value: s.soil },
];
export function GardenPanels({ care, beds, selection, quest, interaction, onMoon, snap, setSnap, pending, playCinematic, exit }: {
  care: PlantCare; beds: BedCare; selection: PlantSelection; quest: MoonQuest; interaction: XionInteraction;
  onMoon: () => void; snap: boolean; setSnap: (v: boolean) => void; pending: number | null; playCinematic: () => void; exit: () => void;
}) {
  useRefresh(care.subscribe); useRefresh(beds.subscribe); useRefresh(selection.subscribe);
  const [, refreshQuest] = useState(0);
  useEffect(() => quest.subscribe(() => refreshQuest((v) => v + 1)), [quest]);
  const pick = selection.state.selected;
  const bed = pick ? beds.beds[pick.bed] : undefined;
  const task = MOON_TASKS[quest.state.step];
  return <>
    <WorldPanel position={[-0.9, 1.28, -0.85]} title={`Care · ${status(care.state)}`} bars={stats(care.state)}
      lines={[...(care.state.water > 90 ? ["Too much water"] : []), SEEDLING_STAGES.map((stage, i) => `${i === care.state.stage ? "● " : ""}${stage.name}`).join(" · ")]}
      buttons={[{ label: "Water", action: () => care.act("water") }, { label: "Sun", action: () => care.act("sun") }, { label: "Feed soil", action: () => care.act("soil") }, { label: `Snap turn 30°: ${snap ? "On" : "Off"}`, action: () => setSnap(!snap) }, { label: "Exit VR", action: exit }]} />
    <WorldPanel position={[0.95, 1.25, -0.85]} title="Moonflower" lines={[task.task]} buttons={[{ label: task.action, action: onMoon }]} />
    {pick && bed && <WorldPanel position={[pick.pos.x, pick.pos.y + 0.35, pick.pos.z]} title={`${PLANT_INFO[pick.kind].name} · ${bedStatus(bed)}`} bars={stats(bed)}
      lines={[...(bed.water > 90 ? ["Too much water"] : []), PLANT_INFO[pick.kind].likes]}
      buttons={(["water", "sun", "soil"] as const).map((action) => ({ label: action === "soil" ? "Feed soil" : action === "sun" ? "Sun" : "Water", action: () => { beds.act(pick.bed, action); selection.effect(action); } })).concat([{ label: "Close", action: () => selection.clear() }])} />}
    <XionWorldSpeech interaction={interaction} />
    {pending !== null && <WorldPanel position={[0, 1.7, -1.15]} title="Cinematic ready" buttons={[{ label: "Exit VR & play", action: playCinematic }]} />}
  </>;
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