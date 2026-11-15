import { xionSpeech } from "@/lib/xion-voice.functions";
// All of Xion's speaking goes through speak(); swap this file's body for ElevenLabs later.
type Rec = { lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; onerror: ((e: { error?: string }) => void) | null };

let xionSpeaks = true;
const preferenceSubs = new Set<() => void>();
export function xionSpeechEnabled() { return xionSpeaks; }
export function setXionSpeechEnabled(enabled: boolean) { xionSpeaks = enabled; preferenceSubs.forEach((f) => f()); }
export function onXionSpeechPreference(f: () => void) { preferenceSubs.add(f); return () => { preferenceSubs.delete(f); }; }

const subs = new Set<(speaking: boolean) => void>();
const notify = (v: boolean) => subs.forEach((f) => f(v));
export function onSpeaking(f: (speaking: boolean) => void) { subs.add(f); return () => { subs.delete(f); }; }

function pickVoice() {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
  const soft = /samantha|zira|aria|jenny|google uk english female|female|serena|karen|moira|tessa|victoria/i;
  return voices.find((v) => soft.test(v.name)) ?? voices[0];
}

if (typeof window !== "undefined" && "speechSynthesis" in window) { window.speechSynthesis.getVoices(); window.speechSynthesis.addEventListener?.("voiceschanged", () => window.speechSynthesis.getVoices()); }
function browserSpeak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) { notify(false); return; }
  window.speechSynthesis.cancel(); window.speechSynthesis.resume();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice(); if (v) u.voice = v;
  u.pitch = 1.25; u.rate = 0.98; u.volume = 0.9;
  u.onstart = () => notify(true); u.onend = () => notify(false); u.onerror = () => notify(false);
  window.speechSynthesis.speak(u);
}
let player: HTMLAudioElement | null = null; let turn = 0;
/** Xion's ElevenLabs voice, falling back to the browser voice. */
export function speak(text: string) {
  if (typeof window === "undefined") return;
  stopSpeaking(); const my = ++turn;
  player ??= new Audio(); const a = player; // created inside the click gesture so playback is allowed
  notify(true);
  xionSpeech({ data: { text: text.slice(0, 1000) } }).then((r) => {
    if (my !== turn) return;
    if (!r.audio) return browserSpeak(text);
    a.src = `data:audio/mpeg;base64,${r.audio}`;
    a.onended = () => { if (my === turn) notify(false); };
    a.onerror = () => { if (my === turn) browserSpeak(text); };
    a.play().catch(() => { if (my === turn) browserSpeak(text); });
  }).catch(() => { if (my === turn) browserSpeak(text); });
}
export function stopSpeaking() {
  turn++;
  if (player) { player.pause(); player.removeAttribute("src"); }
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  notify(false);
}

export const VOICE_UNSUPPORTED = "Voice input isn't supported in this browser, try typing.";
export function speechInputSupported() {
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w["SpeechRecognition"] || w["webkitSpeechRecognition"]);
}
/** Push-to-talk: call start() on press, stop() on release; onText gets the final transcript. */
export function createDictation(onText: (text: string) => void, onState: (listening: boolean) => void, onError?: (msg: string) => void, onHeard?: (text: string) => void) {
  const w = window as unknown as Record<string, (new () => Rec) | undefined>;
  const Ctor = w["SpeechRecognition"] ?? w["webkitSpeechRecognition"];
  if (!Ctor) return null;
  let rec: Rec | null = null; let text = "";
  return {
    start() {
      if (rec) return; text = "";
      rec = new Ctor(); rec.lang = "en-US"; rec.interimResults = Boolean(onHeard); rec.continuous = true;
      rec.onresult = (e) => { text = Array.from(e.results).map((r) => r[0]?.transcript ?? "").join(" "); onHeard?.(text.trim()); };
      rec.onend = () => { rec = null; onState(false); if (text.trim()) onText(text.trim()); };
      rec.onerror = (e) => { rec = null; onState(false); onError?.(e?.error === "not-allowed" || e?.error === "service-not-allowed" ? "Microphone is blocked. Allow mic access for this site (try opening the app in its own tab)." : e?.error === "no-speech" ? "I didn't hear anything, try again." : "Voice input stopped, try again or type."); };
      try { rec.start(); onState(true); } catch { rec = null; onState(false); }
    },
    stop() { rec?.stop(); },
    get listening() { return rec !== null; },
  };
}
