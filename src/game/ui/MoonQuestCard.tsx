import { useEffect, useState } from "react";
import { MOON_STEPS, MOON_TASKS, type MoonQuest, type MoonStep } from "../plants/moonflower";

// Screen task card; a WebXR panel can subscribe to the same quest later.
export function MoonQuestCard({ quest, onTask }: { quest: MoonQuest; onTask: () => void }) {
  const [step, setStep] = useState<MoonStep>(quest.state.step);
  useEffect(() => quest.subscribe(setStep), [quest]);
  const i = MOON_STEPS.indexOf(step);
  return (
    <aside className="gv-quest" aria-live="polite">
      <p className="gv-quest-kicker">🌙 Moonflower · {step === "bloom" ? "Complete" : `Task ${i + 1} of 4`}</p>
      <h2>{MOON_TASKS[step].task}</h2>
      <div className="gv-quest-dots">{MOON_STEPS.map((s, k) => <span key={s} data-done={k < i || step === "bloom" ? "" : undefined} />)}</div>
      <button type="button" className="gv-quest-btn" onClick={onTask}>{MOON_TASKS[step].action}</button>
    </aside>
  );
}
