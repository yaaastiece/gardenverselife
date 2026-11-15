import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const VOICE_ID = "2qfp6zPuviqeCOZIE9RZ";

function toBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf); let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Xion's ElevenLabs voice; the key stays on the server. */
export const xionSpeech = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ text: z.string().trim().min(1).max(1000) }).parse(d))
  .handler(async ({ data }) => {
    const key = process.env["ELEVENLABS_API_KEY"];
    if (!key) return { audio: null, error: "Voice not connected" };
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ text: data.text, model_id: "eleven_turbo_v2_5", voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.35, use_speaker_boost: true } }),
    });
    if (!res.ok) { console.error(`ElevenLabs TTS failed [${res.status}]: ${await res.text()}`); return { audio: null, error: "Voice unavailable" }; }
    return { audio: toBase64(await res.arrayBuffer()), error: null };
  });
