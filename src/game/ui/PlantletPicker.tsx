import { X } from "lucide-react";
import pepperArt from "@/assets/companion_3_young.png.asset.json";
import lumibudArt from "@/assets/lumibud_3.png.asset.json";
import { PLANTLETS, chosenPlantlet, type PlantletId } from "../plants/plantlets";

const ART: Record<PlantletId, string> = { pepper: pepperArt.url, lumibud: lumibudArt.url };

// Screen chooser for the center-planter plant person; the choice itself lives in plants/plantlets.ts.
export function PlantletPicker({ onChoose, onClose, canClose }: { onChoose: (id: PlantletId) => void; onClose: () => void; canClose: boolean }) {
  const current = chosenPlantlet();
  return (
    <div className="gv-pick-wrap" role="dialog" aria-modal="true" aria-labelledby="gv-pick-title">
      <div className="gv-pick">
        <div className="gv-bowl-head"><span id="gv-pick-title">Choose your plantlet</span>{canClose && <button type="button" aria-label="Close" onClick={onClose}><X size={16} /></button>}</div>
        <p className="gv-pick-sub">{canClose ? "Switching starts your new plantlet back at Seedling." : "Who will grow with you in the center planter?"}</p>
        <div className="gv-pick-row">
          {(Object.keys(PLANTLETS) as PlantletId[]).map((id) => (
            <button key={id} type="button" className="gv-pick-card" aria-pressed={current === id} onClick={() => onChoose(id)}>
              <img src={ART[id]} alt="" />
              <b>{PLANTLETS[id].name}</b>
              <span>{PLANTLETS[id].blurb}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
