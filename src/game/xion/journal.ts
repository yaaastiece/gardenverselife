// Plain TS garden journal; persists to localStorage when available, in memory otherwise.
export type PlantKey = "companion" | "tomato" | "herb" | "rose" | "lettuce" | "strawberry" | "pepper";
export const PLANT_KEYS: PlantKey[] = ["companion", "tomato", "herb", "rose", "lettuce", "strawberry", "pepper"];
export const PLANT_LABELS: Record<PlantKey, string> = { companion: "Pepper Peony", tomato: "Tomato", herb: "Herbs", rose: "Rose", lettuce: "Lettuce", strawberry: "Strawberry", pepper: "Pepper" };
export const TAGS = ["Pests", "Too wet", "Too dry", "Needs sun", "Soil", "Doing great"];
export type Snapshot = { stage: string; water: number; sun: number; soil: number };
export type JournalEntry = { id: string; plant: PlantKey; text: string; tags: string[]; at: number; source: "player" | "xion" } & Snapshot;
const KEY = "gardenverse.journal.v1";

function read(storage: Storage | null): JournalEntry[] {
  try { const raw = storage?.getItem(KEY); const v = raw ? JSON.parse(raw) : []; return Array.isArray(v) ? v : []; } catch { return []; }
}

export function createJournal(storage: Storage | null = safeStorage()) {
  const state = { entries: read(storage) };
  const subs = new Set<() => void>();
  const save = () => { try { storage?.setItem(KEY, JSON.stringify(state.entries)); } catch { /* storage full or blocked: keep in memory */ } subs.forEach((f) => f()); };
  return {
    state,
    subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f); }; },
    add(e: { plant: PlantKey; text: string; tags?: string[]; source?: "player" | "xion" }, snap: Snapshot, at = Date.now()) {
      const text = e.text.trim(); const tags = e.tags ?? [];
      if (!text && !tags.length) return null;
      const entry: JournalEntry = { id: `${at}-${Math.random().toString(36).slice(2, 7)}`, plant: e.plant, text, tags, at, source: e.source ?? "player", stage: snap.stage, water: Math.round(snap.water), sun: Math.round(snap.sun), soil: Math.round(snap.soil) };
      state.entries = [entry, ...state.entries]; save(); return entry;
    },
    remove(id: string) { state.entries = state.entries.filter((e) => e.id !== id); save(); },
    list(plant: PlantKey | "all" = "all") { return [...state.entries].filter((e) => plant === "all" || e.plant === plant).sort((a, b) => b.at - a.at); },
    lastNotes(plant: PlantKey, n = 3) { return this.list(plant).slice(0, n); },
  };
}
export type Journal = ReturnType<typeof createJournal>;
function safeStorage(): Storage | null { try { const s = window.localStorage; const k = "__gv"; s.setItem(k, "1"); s.removeItem(k); return s; } catch { return null; } }
