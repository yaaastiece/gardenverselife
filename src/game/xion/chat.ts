import { currentPlantlet } from "../plants/plantlets";
// Plain TS chat state; screen panel now, WebXR panel later.
export type ChatMsg = { id: number; role: "user" | "assistant"; text: string; error?: boolean };
export type AskFn = (messages: { role: "user" | "assistant"; text: string }[], context: string) => Promise<{ ok: true; text: string } | { ok: false; reason: "rate" | "credits" | "failed" }>;
export const SUGGESTIONS = ["How do I keep tomatoes alive?", "Why are my plant's leaves drooping?", "Tell me a Gardenverse story"];
export const ERRORS = {
  rate: "Whew, lots of questions at once! Give me a moment to catch my breath, then ask again.",
  credits: "My magic is running low right now. Please try again a little later.",
  failed: "Hmm, my words got tangled in the vines. Could you try asking again?",
};

export function createXionChat(ask: AskFn) {
  const state = { messages: [] as ChatMsg[], thinking: false };
  const subs = new Set<() => void>();
  const emit = () => subs.forEach((f) => f());
  let id = 0;
  return {
    state,
    subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f); }; },
    /** Adds a local message (e.g. a garden check report) without calling the AI. */
    push(role: "user" | "assistant", text: string) { state.messages = [...state.messages, { id: ++id, role, text }]; emit(); },
    /** Sends a question; resolves with Xion's reply text (or a friendly error text). */
    async send(text: string, context: string): Promise<ChatMsg | null> {
      const q = text.trim();
      if (!q || state.thinking) return null;
      state.messages = [...state.messages, { id: ++id, role: "user", text: q }];
      state.thinking = true; emit();
      let reply: ChatMsg;
      try {
        const history = state.messages.filter((m) => !m.error).slice(-10).map(({ role, text: t }) => ({ role, text: t }));
        const plant = currentPlantlet();
        const r = await ask(history, `Plant companion in the center planter: ${plant.name}\nStages: ${plant.stageNames.join(", ")}\nCare note: ${plant.careProfile.likes}\n${context}`);
        reply = r.ok ? { id: ++id, role: "assistant", text: r.text } : { id: ++id, role: "assistant", text: ERRORS[r.reason], error: true };
      } catch {
        reply = { id: ++id, role: "assistant", text: ERRORS.failed, error: true };
      }
      state.messages = [...state.messages, reply];
      state.thinking = false; emit();
      return reply;
    },
  };
}
export type XionChat = ReturnType<typeof createXionChat>;
