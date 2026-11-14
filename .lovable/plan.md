# Add Xion, the welcoming fairy

## What you'll see
- Xion stands on the deck just left of the center seedling planter, between it and the long tomato planter, so she's in view as the scene opens.
- She's a flat cut-out of your drawing (front view only) that always turns to face you as you look around.
- She floats a few centimeters above the deck and bobs up and down slowly, with a soft pink glow on the deck under her.
- When the scene loads, a comic-style speech bubble appears above her: "Welcome to the Gardenverse. Here's your first seedling. Water it and watch it grow."
- After about 6 seconds the bubble fades out.
- Her size: about 1.3 m tall, a bit shorter than eye level, so she doesn't block the seedling.

## Preparing the picture
- Your sheet shows her front and back. I'll use only the front view (the left figure).
- I'll cut her out of the white background so only Xion shows, keeping her see-through wings soft. The wings are pale, so I'll check the cut-out closely to make sure no wing parts get erased.

## Technical details
- Crop the left figure with PIL, then remove the background (imagegen edit_image with a transparent background, or a careful white-key alpha with soft edges for the wings). Upload it with lovable-assets as `xion_front.png.asset.json`.
- New `src/game/scene/Xion.tsx`: drei `<Billboard lockX lockZ>` (turns around the vertical axis only) with a textured plane. Use alphaTest plus transparency and toneMapped={false} so her colors match the art. Bob with a sine wave in useFrame, and add a glow disc under her.
- Speech bubble: a drei `<Html>` anchored above her head, styled in `styles.css` (comic outline, pink accent). The welcome text is a named constant. A timed fade: show for 6 s, then a 1 s opacity transition, then unmount.
- Mount her inside Suspense in `GardenScene.tsx`. Position, height and timing go in `config.ts` (XION).
- Verify with a screenshot that she and the bubble appear and that the bubble is gone after the timeout.
