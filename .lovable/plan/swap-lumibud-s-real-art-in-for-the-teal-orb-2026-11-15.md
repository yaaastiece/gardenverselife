# Swap Lumibud's real art in for the teal orb

Three images arrived: a small sprout (image 3), a sprout with glowing leaves (image 2), and a flower-crowned bloom (image 1).

## Stage mapping
- Glow Seed: the teal orb stays, since no seed image exists yet. It now has a small sprout peeking out, so it leads into stage 2.
- Sprout: image 3, the small two-leaf sprout.
- Leafling: image 2, with glowing leaf veins and a pink belly.
- Bloom: image 1, with a flower crown and glowing teal patterns.
- The start-screen card shows the Sprout image, since that's the first time Lumibud has a face.

## Art prep
- Cut each character out of its gray background so the cutout floats in the planter like Pepper Peony.
- Add the same inked comic outline the rest of the garden uses, so the cutouts fit the style.
- Measure where the feet sit and how tall the character is, so Lumibud stands on the soil and grows smoothly across stages.

## Unchanged
- Lumibud's name, tagline, stage names, care profile, story beats, Orbis prompts and glow color stay the same.
- Pepper Peony, the garden, the start screen, Xion, the VR panels and the cinematics stay the same.

## Technical details
- Store the background-removed PNGs as CDN assets and point the Lumibud sprite URLs in the plant catalog to them. Set the per-stage frame bounds and heights in the catalog.
- Update the catalog test so it expects real sprites for stages 2–4 and the orb for stage 1.
- Check the result with screenshots on desktop and phone.
