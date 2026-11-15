# Plant companion in the heart planter (4 stages)

## What you'll see
- The 3D sprout in the heart planter is replaced by your character, in four drawings: Seedling, Sprout, Young, Queen.
- She always faces you, stands centered with her feet slightly in the soil, and Queen stands visibly taller than Seedling (about 0.35 tall at stage 1, about 0.9 at stage 4).
- Clicking anywhere on her still waters her, with the same water splash as now.
- When she reaches a new stage, the old drawing fades into the new one, she grows a little, and a soft pink burst plays.
- A soft pink glow behind her is bright when she's Thriving, dimmer when Okay, and almost off when Struggling. When Struggling she also sways more slowly and sits about 3% lower.
- The stage badge, care panel, Xion's tips, the moonflower and every other interaction stay the same.

## Step 1: cut-outs
- Remove the cream background and the floor shadow from all four images. Each keeps its full frame (1920x1048) and isn't cropped, so all four stay at the same scale.
- Extra care for the fuzzy hair (3, 4) and for the gold band, earrings and thin neon veins (2, 3, 4).
- I'll check each one on a dark background and on a pink one, and clean up any light halo around the hair and petals before using them.

## Technical details
- Cut-outs: run imagegen edit_image with a transparent background for each image, then fix it up in PIL: remove the shadow, defringe the cream edges (decontaminate color and choke the alpha), and pad or resize back to the exact original canvas if needed. Make preview composites on #0b0a0d and #ff5fb8 and inspect them. Upload with lovable-assets as `companion_1_seedling.png` … `companion_4_queen.png` (.asset.json), with no binaries left in src.
- Scale: one shared world scale for all frames, chosen so Queen's visible figure is about 0.9. Measure each frame's alpha bbox once; if Seedling's art doesn't come out near 0.35 at that scale, add a small per-stage multiplier (so the "same scale" rule bends slightly). Each plane is offset so the feet line (the bottom of that frame's alpha bbox) sits about 0.02 below the soil top (y≈0.5).
- New `scene/PlantCompanion.tsx`: drei Billboard (lockX/lockZ), two textured planes for the cross-fade (previous and current stage, about 0.8 s), scale-up tween, pink Sparkles burst on stage change, an additive pink glow sprite behind her with opacity lerped by `status(care.state)`, sway speed and a 0.97 height factor when Struggling. A transparent hit plane covering the sprite carries onClick (water), hover and stopPropagation.
- Seedling.tsx: remove the procedural stem and leaves and the old invisible cylinder hit target. Keep the planter, small companion plants, water drops, ring, sun cone, compost sparkle and onStageChange. Stage art paths and heights go in plain TS (`plants/companion.ts`), with a small test for the heights and the status-to-glow mapping.
- Verify with vitest and Playwright screenshots of stages 1 and 4 (advance through `care.act`).
