import { useEffect, useState } from "react";
import { Droplet, Sun, Leaf } from "lucide-react";
import { BEDS, PLANT_INFO, bedStatus, type BedCare, type PlantSelection } from "../plants/beds";
import type { CareAction } from "../plants/care";

// Screen card for a hovered/selected bed plant; PlantCardAnchor positions it on desktop.
export function PlantCard({ beds, selection, cardRef }: { beds: BedCare; selection: PlantSelection; cardRef: React.RefObject<HTMLDivElement | null> }) {
  const [, force] = useState(0);
  useEffect(() => selection.subscribe(() => force((x) => x + 1)), [selection]);
  useEffect(() => { let last = 0; return beds.subscribe(() => { const n = performance.now(); if (n - last > 250) { last = n; force((x) => x + 1); } }); }, [beds]);
  const sel = selection.state.selected;
  const pick = sel ?? selection.state.hover;
  if (!pick) return null;
  const b = beds.beds[pick.bed]!;
  const info = PLANT_INFO[pick.kind];
  const word = bedStatus(b);
  const act = (a: CareAction) => { beds.act(pick.bed, a); selection.effect(a); };
  const bars = [
    { k: "water" as const, label: "Water", icon: <Droplet size={14} /> },
    { k: "sun" as const, label: "Sun", icon: <Sun size={14} /> },
    { k: "soil" as const, label: "Soil", icon: <Leaf size={14} /> },
  ];
  return (
    <div ref={cardRef} className="gv-care gv-plant-card" data-selected={sel ? "" : undefined} aria-label={`${info.name} care`}>
      <div className="gv-care-head"><span>{info.name}</span><b data-status={word}>{word}</b></div>
      {b.water > BEDS.overwater && <p className="gv-care-warn">Too much water</p>}
      {bars.map((x) => <div key={x.k} className="gv-bar"><span className="gv-bar-label">{x.icon}{x.label}</span><span className="gv-bar-track"><span style={{ width: `${b[x.k]}%` }} data-low={b[x.k] < BEDS.low ? "" : undefined} /></span></div>)}
      <p className="gv-plant-likes">{info.likes}</p>
      {sel && <div className="gv-care-actions">
        <button type="button" onClick={() => act("water")}><Droplet size={13} />Water</button>
        <button type="button" onClick={() => act("sun")}><Sun size={13} />Sun</button>
        <button type="button" onClick={() => act("soil")}><Leaf size={13} />Feed soil</button>
      </div>}
    </div>
  );
}
