import { X } from "lucide-react";
import { PLANTLETS, chosenPlantlet, type PlantletId } from "../plants/plantlets";

// Screen chooser only; the same plain-TS catalog can drive large WebXR pinch targets later.
export function PlantletPicker({ onChoose, onClose, canClose }: { onChoose: (id: PlantletId) => void; onClose: () => void; canClose: boolean }) {
  const current = chosenPlantlet();
  return (
    <div className="gv-pick-wrap" role="dialog" aria-modal="true" aria-labelledby="gv-pick-title">
      <div className="gv-pick">
        <div className="gv-bowl-head"><span id="gv-pick-title">Choose your plant companion</span>{canClose && <button type="button" aria-label="Close" onClick={onClose}><X size={16} /></button>}</div>
        <p className="gv-pick-sub"><b>Xion:</b> Which seed will you plant?</p>
        <div className="gv-pick-row">
          {(Object.keys(PLANTLETS) as PlantletId[]).map((id) => {
            const plant = PLANTLETS[id];
            return <button key={id} type="button" className="gv-pick-card" aria-label={`Choose ${plant.name}`} aria-pressed={current === id} onClick={() => onChoose(id)}>
              <img src={plant.sprites[0]} alt="" />
              <b>{plant.name}</b>
              <span>{plant.tagline}</span>
            </button>;
          })}
        </div>
      </div>
    </div>
  );
}
