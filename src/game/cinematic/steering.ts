import { stagePrompt, stageSuggestions, stageXionSuggestions } from "./prompts";

export const STEERING_LIMIT = 140;
export const STEERING_COOLDOWN_MS = 6000;
export const XION_SUGGESTION_ROTATION_MS = 8000;
export const STEERING_REJECTION = "Try something gentle and garden-like";
export const STEERING_VOICE_UNAVAILABLE = "Voice isn't available here, try the suggestions";

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

export type SteeringState = {
  sending: boolean;
  sent: boolean;
  message: string | null;
  cooldownUntil: number;
  stage: number;
  draft: string;
  xionSuggestions: string[];
  listening: boolean;
  voiceMessage: string | null;
};
export type SteeringDictation = { start(): void; stop(): void };
export type SteeringDictationFactory = (callbacks: {
  heard: (text: string) => void;
  listening: (value: boolean) => void;
  unavailable: () => void;
}) => SteeringDictation | null;
type SteeringOptions = {
  now?: () => number;
  random?: () => number;
  dictation?: SteeringDictationFactory;
};

/** Display-agnostic commands shared by typed text, chips, automatic prompts and voice. */
export function createCinematicSteering(send: (prompt: string, stage: number) => Promise<void>, options: SteeringOptions = {}) {
  const now = options.now ?? Date.now;
  const random = options.random ?? Math.random;
  let state: SteeringState = {
    sending: false, sent: false, message: null, cooldownUntil: 0,
    stage: 0, draft: "", xionSuggestions: [], listening: false, voiceMessage: null,
  };
  const listeners = new Set<() => void>();
  const histories = new Map<number, { used: Set<string>; chosen: Set<string> }>();
  let nextRotationAt = now() + XION_SUGGESTION_ROTATION_MS;
  let input: SteeringDictation | null | undefined;
  let revision = 0;
  const update = (patch: Partial<SteeringState>) => { state = { ...state, ...patch }; listeners.forEach((listener) => listener()); };
  const history = (stage: number) => {
    let value = histories.get(stage);
    if (!value) { value = { used: new Set<string>(), chosen: new Set<string>() }; histories.set(stage, value); }
    return value;
  };
  const draw = (stage: number, current: string[]) => {
    const pool = [...stageXionSuggestions(stage)];
    const past = history(stage);
    const shuffled = (values: string[]) => {
      const result = [...values];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.min(i, Math.floor(random() * (i + 1)));
        [result[i], result[j]] = [result[j]!, result[i]!];
      }
      return result;
    };
    let available = pool.filter((text) => !past.used.has(text) && !past.chosen.has(text) && !current.includes(text));
    if (available.length < 2) {
      past.used.clear();
      available = pool.filter((text) => !past.chosen.has(text) && !current.includes(text));
    }
    // A finite eight-item list eventually cycles; chosen items stay excluded while choices remain.
    if (available.length < 2) available = pool.filter((text) => !current.includes(text));
    if (available.length < 2) available = pool;
    const picked = shuffled(available).slice(0, 2);
    picked.forEach((text) => past.used.add(text));
    return picked;
  };
  const stopVoice = () => { input?.stop(); };
  const controller = {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    remaining() { return Math.max(0, Math.ceil((state.cooldownUntil - now()) / 1000)); },
    chips() { return [...stageSuggestions(state.stage).slice(0, 2), ...state.xionSuggestions].slice(0, 4); },
    edited() { if (state.sent || state.message) update({ sent: false, message: null }); },
    edit(raw: string) {
      update({ draft: raw.slice(0, STEERING_LIMIT), sent: false, message: null, voiceMessage: null });
    },
    setStage(stage: number) {
      stagePrompt(stage);
      revision++;
      stopVoice();
      nextRotationAt = now() + XION_SUGGESTION_ROTATION_MS;
      update({
        stage, draft: "", sending: false, sent: false, message: null, cooldownUntil: 0,
        listening: false, voiceMessage: null, xionSuggestions: draw(stage, []),
      });
    },
    tick() {
      if (now() < nextRotationAt) return;
      nextRotationAt = now() + XION_SUGGESTION_ROTATION_MS;
      update({ xionSuggestions: draw(state.stage, state.xionSuggestions) });
    },
    startVoice() {
      if (state.listening) return;
      if (input === undefined) {
        input = options.dictation?.({
          heard: (text) => update({ draft: sanitizeSteering(text), sent: false, message: null, voiceMessage: null }),
          listening: (listening) => update({ listening }),
          unavailable: () => update({ listening: false, voiceMessage: STEERING_VOICE_UNAVAILABLE }),
        }) ?? null;
      }
      if (!input) { update({ voiceMessage: STEERING_VOICE_UNAVAILABLE, listening: false }); return; }
      update({ draft: "", sent: false, message: null, voiceMessage: null });
      input.start();
    },
    stopVoice,
    dispose() { revision++; stopVoice(); listeners.clear(); },
    async submit(stage: number, raw: string) {
      if (state.sending || state.cooldownUntil > now()) return false;
      const result = validateSteering(raw);
      if (!result.ok) { update({ sent: false, message: result.message }); return false; }
      const ownRevision = revision;
      history(stage).chosen.add(result.text);
      update({ sending: true, sent: false, message: null, voiceMessage: null, cooldownUntil: now() + STEERING_COOLDOWN_MS });
      try {
        await send(steeringPrompt(stage, result.text), stage);
        if (ownRevision === revision) update({ sending: false, sent: true, draft: "" });
        return ownRevision === revision;
      } catch {
        if (ownRevision === revision) update({ sending: false, sent: false, message: "The scene couldn’t change. Try again." });
        return false;
      }
    },
    async submitCurrent(raw = state.draft) { return controller.submit(state.stage, raw); },
  };
  controller.setStage(0);
  return controller;
}

export type CinematicSteering = ReturnType<typeof createCinematicSteering>;
