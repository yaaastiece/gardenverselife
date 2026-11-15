# Name the plant person "Pepper Peony"

Xion stays the fairy. The center plant person gets her name everywhere players see her.

## Changes
- Remember the name (and that Xion is the fairy) in project memory.
- Care panel title (web and VR): "Pepper Peony · Thriving" etc.
- Xion panel plant filter and journal entries: "Pepper Peony" instead of "Plant companion".
- "Xion helps" report: "Pepper Peony needs water" instead of "plant companion".
- Growth notes: "Pepper Peony is a sprout now", "...thriving", "...a Queen now!"; care tips say "Pepper Peony is thirsty" when about her.
- Screen hint: "Tap Pepper Peony or the moonflower".
- Xion's AI chat is told the plant's name, so she calls her Pepper Peony.
- Cinematic story lines/captions mention Pepper Peony where they currently say "the seedling/she".

## Not changing
Art, plants, care rules, VR, timer, steering, session logic. The pepper garden bed stays "Pepper".

## Technical
Update `PLANT_LABELS.companion`, helper patient label, `STAGE_NOTES`/care tips, hint text, GardenPanels care title, `askXion` system prompt, and lore text in `cinematic/prompts.ts`; update tests asserting old strings. Journal keys stay `companion` so saved entries still load.
