import { stagePrompt } from "./prompts";

export const STEERING_LIMIT = 140;
export const STEERING_COOLDOWN_MS = 6000;
export const STEERING_REJECTION = "Try something gentle and garden-like";

const BLOCKED = [
  // Violence and gore.
  "kill", "murder", "blood", "bloody", "gore", "gory", "gun", "shoot", "weapon", "bomb", "stab", "fight", "attack", "death", "dead", "suicide", "torture", "dismember",
  // Sexual content.
  "sex", "sexual", "sexy", "nude", "naked", "porn", "erotic", "fetish", "orgasm", "explicit",
  // Hate and harassment.
  "hate", "racist", "racism", "nazi", "white supremacy", "ethnic cleansing", "slur",
  // Real people and public figures.
  "real person", "real people", "celebrity", "famous person", "president", "politician", "actor", "actress", "taylor swift", "beyonce", "barack obama", "donald trump", "elon musk", "mrbeast", "billie eilish", "rihanna", "drake", "zendaya",
  // Brands and protected franchises.
  "disney", "pixar", "marvel", "star wars", "pokemon", "nintendo", "netflix", "apple", "google", "meta", "nike", "coca cola", "pepsi", "mcdonalds", "mcdonald's", "barbie", "harry potter", "minecraft", "fortnite", "lego",
];

const escapePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const BLOCKED_PATTERNS = BLOCKED.map((term) => new RegExp(`\\b${escapePattern(term)}\\b`, "i"));

/** Keep ordinary multilingual words, spaces and simple sentence punctuation only. */
export function sanitizeSteering(raw: string) {
  return raw.replace(/[^\p{L}\p{N}\s.,!?'"():;-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, STEERING_LIMIT).trim();
}

export function validateSteering(raw: string): { ok: true; text: string } | { ok: false; message: string } {
  const text = sanitizeSteering(raw);
  if (!text || BLOCKED_PATTERNS.some((pattern) => pattern.test(text))) return { ok: false, message: STEERING_REJECTION };
  return { ok: true, text };
}

export function steeringPrompt(stage: number, raw: string) {
  const result = validateSteering(raw);
  if (!result.ok) throw new Error(result.message);
  return `${stagePrompt(stage)} Then: ${result.text}.`;
}

export type SteeringState = { sending: boolean; sent: boolean; message: string | null; cooldownUntil: number };

/** Display-agnostic command gate; a future WebXR panel can use this same controller. */
export function createCinematicSteering(send: (prompt: string) => Promise<void>, now: () => number = Date.now) {
  let state: SteeringState = { sending: false, sent: false, message: null, cooldownUntil: 0 };
  const listeners = new Set<() => void>();
  const update = (patch: Partial<SteeringState>) => { state = { ...state, ...patch }; listeners.forEach((listener) => listener()); };
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    remaining() { return Math.max(0, Math.ceil((state.cooldownUntil - now()) / 1000)); },
    edited() { if (state.sent || state.message) update({ sent: false, message: null }); },
    async submit(stage: number, raw: string) {
      if (state.sending || state.cooldownUntil > now()) return false;
      const result = validateSteering(raw);
      if (!result.ok) { update({ sent: false, message: result.message }); return false; }
      update({ sending: true, sent: false, message: null, cooldownUntil: now() + STEERING_COOLDOWN_MS });
      try {
        await send(steeringPrompt(stage, result.text));
        update({ sending: false, sent: true });
        return true;
      } catch {
        update({ sending: false, sent: false, message: "The scene couldn’t change. Try again." });
        return false;
      }
    },
  };
}

export type CinematicSteering = ReturnType<typeof createCinematicSteering>;
