# Gardenverse — Scene One (Rooftop Garden at Dusk)

Building Prompt 1 only. Later prompts (day-night, Xion, meditation, journal) come after this works.

## What you'll see
- First-person view on a futuristic rooftop deck at dusk; look around by dragging or with the mouse.
- **Sky:** ombre from black-violet to dusty pink to a soft skyline glow, a large moon, faint stars and a few constellation lines.
- **City:** skyscrapers in flat pink/gray/black/white "ligne claire" style (outlines, flat shading, pink only as glowing windows/light).
- **Flying cars:** small gray cars with soft pink light trails drifting along lanes between towers.
- **Garden (only full-color area):** glowing planter boxes with herbs, vegetables, fruit; LED strips, little lights and tiny electronics with a cute pink touch.
- **Center seedling:** click to water it, a water/glow burst plays, and it grows: seedling, then sprout, then young plant (then stays).
- Plants sway in a light breeze.
- Play/mute button for a soft city hum and wind (generated in the browser, starts muted until you press play).

## Technical details
- React Three Fiber v9 + drei on `/` with `ssr: false`; replace placeholder page and set page titles.
- Structure for growth: `src/game/` with `scene/` (Sky, City, FlyingCars, Deck, Garden, Seedling), `plants/` (stage data in plain TS so new plants are easy to add), `audio/` (Web Audio synth ambience), `config.ts` (palette, wind, speeds as named constants).
- City look: toon/flat materials + drei `Edges` outlines, limited palette; garden uses standard materials with emissive glow + light bloom post-processing.
- Sky: custom gradient shader dome + stars points + constellation lines; moon as emissive sphere.
- Plants are procedural stylized shapes (leaves, tomatoes, strawberries, herbs); sway via shared wind time in one frame loop.
- Camera: OrbitControls-style look-in-place (drag) — VR mode slots in later via `@react-three/xr`.
- Verify with screenshot harness; note that sound and smoothness can't be checked in the sandbox.
