# Sound bowl hint, working volume sliders, bigger center planter

## 1. Show that the bowl has a meditation
- When the garden opens, a small glowing tag floats above the sound bowl: "♪ Music · Meditate". It pulses softly in pink, the same style as the other garden labels.
- The first time you use the bowl, the tag fades to a faint glow.
- When the bowl card opens, the "Meditate with Xion" button is bigger and placed at the top, with a short line under it: "2-minute breathing with Xion."
- In VR, the bowl panel shows the same tag.

## 2. Make the volume sliders work, for music and voice
- I'll first try the slider in the preview to see why it isn't working. Possible causes I'll check: the garden grabbing the drag, the slider not updating, or the browser ignoring volume. I'll fix whichever it is.
- The bowl card gets two sliders:
  - **Music:** the songs. It also goes through the same sound system as the city ambience, so it works on phones too, including iPhone, which ignores normal volume settings.
  - **Xion's voice:** her ElevenLabs voice and the backup voice, including during meditation.
- Both settings are remembered the next time you visit.

## 3. Center planter
- The round planter becomes about 20% bigger and moves closer to the middle of the garden.
- Xion's watering spot and care spots move with it, so tapping and helping still work.
- The moonflower and meditation pad stay where they are. I'll check that nothing overlaps.
- The flowers around the plantlet become a full, round bush: about 8–10 roses and herbs packed in a ring, sitting lower in the soil, instead of 4 spaced-out plants.
- Pepper Peony and Lumibud stand slightly higher, so their feet sit just above the top of the bush instead of being hidden in it.

## 4. Moonflower story video with Orbis
- When the moonflower quest reaches its last step, "Bloom", Xion says a short story line and an Orbis video plays the moonflower's story.
- The story has three parts, in the same order as the growth story videos:
  - **The waiting:** a closed white bud on its trellis under the dark sky, with the city humming far below. Xion: "Moonflowers wait all day for one thing: the moon."
  - **The opening:** moonlight touches the vine and the white petals slowly unfurl, glowing. Xion: "It only opens for someone patient. That's you."
  - **The gift:** silver pollen drifts up toward the moon as the whole garden glows softly. Xion: "It'll bloom every night now, a little lamp for the garden."
- The video uses the same Orbis window, steering and 15-second timer as the plantlet growth videos. Each run plays only once.
- If a growth video is already playing, during meditation or in VR, the moonflower video waits its turn, like the growth videos do now.

## Unchanged
Art style, plants elsewhere, care rules, growth stages, Orbis, meditation script, VR controls.

## Technical details
- Volume: `radio.setVolume` plus a new `voice.setVolume` in `xion/voice.ts`. The ElevenLabs `Audio.volume` and the `SpeechSynthesisUtterance.volume` are kept in plain TS and saved to localStorage. Music goes through a GainNode (`MediaElementSource`) so phones respect it. Reproduce with Playwright first.
- Planter: `Seedling` group position z -1.4 to about -1.0, scale 1.2. Update the planter target and seat constants used by `interaction.ts`, the helper and `XionCamera`. Ring of `Plant`s generated around a radius. Add a companion y-offset (in `companion.ts`) to lift the feet above the bush.
- Hint: a `BowlHint` drei `Html` or sprite label above the bowl. The "seen" flag lives in plain TS.
- Moonflower: `MOONFLOWER_STORY` (narration and prompts) goes in `cinematic/prompts.ts`. The cinematic gate gets a "moonflower" entry that fires once when the quest step becomes `bloom`, and it reuses `cinematic.advance` with a story override.
- Tests: moonflower fires once on bloom and waits in VR/meditation; volume clamping and persistence; voice volume applied; planter target matches new position.
