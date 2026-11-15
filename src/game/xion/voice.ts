// All of Xion's speaking goes through speak(); swap this file's body for ElevenLabs later.
type Rec = { lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };

const subs = new Set<(speaking: boolean) => void>();
const notify = (v: boolean) => subs.forEach((f) => f(v));
export function onSpeaking(f: (speaking: boolean) => void) { subs.add(f); return () => { subs.delete(f); }; }

function pickVoice() {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
  const soft = /samantha|zira|aria|jenny|google uk english female|female|serena|karen|moira|tessa|victoria/i;
  return voices.find((v) => soft.test(v.name)) ?? voices[0];
}

export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice(); if (v) u.voice = v;
  u.pitch = 1.25; u.rate = 0.98; u.volume = 0.9;
  u.onstart = () => notify(true); u.onend = () => notify(false); u.onerror = () => notify(false);
  window.speechSynthesis.speak(u);
}
export function stopSpeaking() { if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel(); notify(false); }

export const VOICE_UNSUPPORTED = "Voice input isn't supported in this browser, try typing.";
export function speechInputSupported() {
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w["SpeechRecognition"] || w["webkitSpeechRecognition"]);
}
/** Push-to-talk: call start() on press, stop() on release; onText gets the final transcript. */
export function createDictation(onText: (text: string) => void, onState: (listening: boolean) => void) {
  const w = window as unknown as Record<string, (new () => Rec) | undefined>;
  const Ctor = w["SpeechRecognition"] ?? w["webkitSpeechRecognition"];
  if (!Ctor) return null;
  let rec: Rec | null = null; let text = "";
  return {
    start() {
      if (rec) return; text = "";
      rec = new Ctor(); rec.lang = "en-US"; rec.interimResults = false; rec.continuous = true;
      rec.onresult = (e) => { text = Array.from(e.results).map((r) => r[0]?.transcript ?? "").join(" "); };
      rec.onend = () => { rec = null; onState(false); if (text.trim()) onText(text.trim()); };
      rec.onerror = () => { rec = null; onState(false); };
      try { rec.start(); onState(true); } catch { rec = null; onState(false); }
    },
    stop() { rec?.stop(); },
  };
}
