# Xion pronunciation + Orbis meditation video

## Where things stand
The breathing meditation is already built: tap the sound bowl, choose "Meditate with Xion", and she flies to the pad, sits, and guides about 2 minutes of breathing. The words show as captions and the bowl light breathes with her. An Orbis video option already exists, but it's off by default and shows one calm scene for the whole session.

## 1. Say "Xion" like "Zion"
- Only the voice changes: the spoken text says "Zion" while captions, chat and labels still read "Xion".
- This applies to every line she speaks, including the ElevenLabs voice and the browser backup voice.
- Xion's chat instructions will also note the pronunciation so she can explain it if asked.

## 2. Orbis video that follows the meditation
- Orbis video is on by default for meditation. You can still switch it off on the sound bowl card.
- The video follows the meditation as it goes, without restarting the stream:
  - Arrive: mist over the cushion, the city glowing softly.
  - Breathe in: pink and green light swells through the leaves, fireflies rise.
  - Breathe out: the light softens, petals drift down.
  - Deep calm: the moon brightens over the garden, the chosen plantlet glows (Pepper pink or Lumibud teal).
  - Return: dawn-soft light, Xion's wings shimmer.
- The scene changes at each part of the script, not on every breath, so it stays smooth.
- The video fades behind the captions. Tapping ends the meditation and the video together.
- It still uses its own session with no 15s auto-end. Growth cinematics wait until the meditation is over. VR keeps the bowl light and captions only.

## Unchanged
Art, garden, plants, care, Pepper Peony/Lumibud, growth cinematics, steering, 15s timer, music and VR controls.

## Technical details
- Add `spokenText()` (Xion→Zion, case-aware) in `src/game/xion/voice.ts`, applied inside `speak()` before both TTS paths.
- Add `MEDITATION_PROMPTS` keyed by script step to `cinematic/prompts.ts`, with the companion glow injected. In `meditation.ts`, add a pure `promptForStep(step, plantlet)`. In `GardenScene`, `promptFor` reads the current step, and a step-change subscription calls `meditationVisuals.advance` (prompt-only steer).
- `visualsOn` defaults to true.
- Tests: pronunciation mapping; step→prompt mapping; prompts change only on step change.
- Live Orbis streaming can't be verified here.
