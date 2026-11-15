import { named, plantName } from "../plants/plantlets";
import { useEffect, useState } from "react";
import { Droplet, Sun, Sprout, Leaf, ChevronDown, ChevronUp } from "lucide-react";
import { CARE, health, status, type CareAction, type PlantCare } from "../plants/care";
import { SEEDLING_STAGES } from "../plants/growth";

// Screen view of plant care; WebXR panels can subscribe to the same PlantCare later.
export function CarePanel({ care, onAction, open, setOpen, onChangePlantlet }: { onChangePlantlet?: () => void; care: PlantCare; onAction: (a: CareAction) => void; open: boolean; setOpen: (open: boolean) => void }) {
  const [, force] = useState(0);
  useEffect(() => { let last = 0; return care.subscribe(() => { const n = performance.now(); if (n - last > 250) { last = n; force((x) => x + 1); } }); }, [care]);
  const s = care.state;
  const word = status(s);
  const last = SEEDLING_STAGES.length - 1;
  const showNote = s.note && s.time - s.noteAt < 5;
  const hist = [...s.history, health(s)];
  const pts = hist.map((h, i) => `${(i / Math.max(1, hist.length - 1)) * 100},${30 - (h / 100) * 28}`).join(" ");
  const bars: { k: CareAction; label: string; icon: React.ReactNode }[] = [
    { k: "water", label: "Water", icon: <Droplet size={14} /> },
    { k: "sun", label: "Sun", icon: <Sun size={14} /> },
    { k: "soil", label: "Soil", icon: <Leaf size={14} /> },
  ];
  return (
    <div className="gv-care-wrap">
      <button type="button" className="gv-care-toggle" aria-expanded={open} aria-label={open ? "Hide care panels" : "Show care panels"} onClick={() => setOpen(!open)}><Sprout size={14} /> Care {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}</button>
      {open && <aside className="gv-care" aria-label="Plant care">
        <div className="gv-care-head"><span>{plantName()}</span>{onChangePlantlet && <button type="button" className="gv-care-switch" onClick={onChangePlantlet}>Change plantlet</button>}</div>
        <div className="gv-care-head"><span>Condition</span><b data-status={word}>{word}</b></div>
        {s.water > CARE.overwater && <p className="gv-care-warn">Too much water</p>}
        {bars.map((b) => <div key={b.k} className="gv-bar"><span className="gv-bar-label">{b.icon}{b.label}</span><span className="gv-bar-track"><span style={{ width: `${s[b.k]}%` }} data-low={s[b.k] < CARE.low ? "" : undefined} /></span></div>)}
        <div className="gv-care-actions">
          <button type="button" onClick={() => onAction("water")}><Droplet size={13} />Water</button>
          <button type="button" onClick={() => onAction("sun")}><Sun size={13} />Sun</button>
          <button type="button" onClick={() => onAction("soil")}><Leaf size={13} />Feed soil</button>
        </div>
        <div className="gv-care-head"><span>Growth</span></div>
        <ol className="gv-timeline">{SEEDLING_STAGES.map((st, i) => <li key={st.name} data-on={i <= s.stage ? "" : undefined} data-cur={i === s.stage ? "" : undefined}>{st.name}</li>)}</ol>
        <div className="gv-bar-track gv-progress"><span style={{ width: s.stage >= last ? "100%" : `${(s.points / CARE.pointsPerStage) * 100}%` }} /></div>
        {showNote && <p className="gv-care-note">{named(s.note ?? "")}</p>}
        <svg className="gv-chart" viewBox="0 0 100 32" preserveAspectRatio="none" aria-label="Health over time"><line x1="0" x2="100" y1={30 - 0.4 * 28} y2={30 - 0.4 * 28} /><polyline points={pts} /></svg>
      </aside>}
    </div>
  );
}
