// "♪ Music · Meditate" tag above the sound bowl: bright until the player first opens the bowl, then faint.
const KEY = "gv-bowl-hint-seen";
let seen = false;
try { seen = typeof localStorage !== "undefined" && localStorage.getItem(KEY) === "1"; } catch { /* private mode */ }
const subs = new Set<() => void>();
export const BOWL_HINT_TEXT = "♪ Music · Meditate";
export const bowlHint = {
  get seen() { return seen; },
  /** Tag opacity at time t: soft pink pulse before first use, faint glow after. */
  opacity(t: number) { return seen ? 0.35 : 0.75 + 0.25 * Math.sin(t * 2.5); },
  markSeen() { if (seen) return; seen = true; try { localStorage.setItem(KEY, "1"); } catch { /* ignore */ } subs.forEach((f) => f()); },
  subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f); }; },
};
