# Readable Xion replies and an ElevenLabs voice for Xion

## What changes
1. **Readable chat replies** — Xion's reply bubbles get a dark glass background with light text and a pink name label, so her words stand out clearly. Your own messages stay as they are.
2. **Xion's real voice** — Xion speaks with the ElevenLabs voice you chose (ID 2qfp6zPuviqeCOZIE9RZ) whenever "Xion speaks" is on: chat replies and the test greeting when you turn voice on.
   - Connect your ElevenLabs account once with the connect card. The key stays private on the server.
   - If ElevenLabs can't be reached or your credits run out, Xion falls back to the browser voice so she's never silent.
   - The Stop button and the "speaking" state work the same as now.

Nothing else changes: the garden, art, panels and mic behavior stay the same.

## Technical details
- `src/styles.css`: assistant `.gv-xp-msg` uses a dark `--glass`/`--ink` background with `--color-background` text; keep `--neon` name label.
- Link the ElevenLabs App connector (`ELEVENLABS_API_KEY`, direct API, not the gateway).
- New `createServerFn` `xionSpeech` in `src/lib/xion-voice.functions.ts`: validates text (1–1000 chars), calls `https://api.elevenlabs.io/v1/text-to-speech/2qfp6zPuviqeCOZIE9RZ?output_format=mp3_44100_128` with `eleven_turbo_v2_5`, and returns base64 audio (encoded in chunks, no Node Buffer dependency).
- `src/game/xion/voice.ts`: `speak(text)` stays the single entry point. It plays the returned MP3 through one shared `Audio` element, cancels the previous clip, keeps `onSpeaking` notifications, and falls back to `speechSynthesis` on error.
- Update AGENTS.md: Xion's voice goes through a server function so no key reaches the browser.
- Save the voice ID to project memory.
