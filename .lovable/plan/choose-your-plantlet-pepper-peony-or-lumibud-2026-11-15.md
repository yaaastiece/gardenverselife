# Choose your plantlet: Pepper Peony or Lumibud

## What you'll get
- **Choice screen at the start**: before the garden opens, a small card shows Pepper Peony and Lumibud side by side, each with a picture and a name. Tap one to begin, and Xion welcomes you by that plantlet's name.
- Your choice is remembered next time. A small "Change plantlet" link in the Care panel lets you switch, and switching starts your plantlet back at Seedling.
- **Lumibud grows the same way** Pepper Peony does: same care bars, growth chart, glow, sway and growth burst. Lumibud's 3D art stays as you made it, cut out from the grey background:
  - Seedling: tiny sprout
  - Sprout: leafy
  - Young: flower crown
  - Queen: flower crown, a little bigger with a stronger glow (until you send a 4th image)
- Everywhere the name appears (Care panel, journal, Xion's tips, chat and story captions), it uses the plantlet you picked.
- Growth cinematics use a Lumibud version of the story when Lumibud is chosen. I'll write it and you can edit it later.
- VR shows the same choice on a floating panel if you enter before choosing.

## Not changing
Garden, Xion, sound bowl, meditation, care rules, timer, steering and session logic.

## Technical
- New plain TS `plants/plantlets.ts`: id, name, stage art, heights/frame bounds per plantlet, story prompts/narration; the current choice lives in localStorage with try/catch.
- `companion.ts` layout reads the chosen plantlet's frames; `PlantCompanion` takes the plantlet's textures.
- Name strings (`PLANT_LABELS.companion`, helper label, care tips, stage notes, hint, `askXion` context) come from the chosen plantlet.
- `cinematic/prompts.ts` keyed by plantlet; `/api/world` gets the plantlet id for the seed prompt.
- Lumibud images cut out with transparent backgrounds and uploaded as assets; tests cover choice persistence, name substitution and stage mapping.
