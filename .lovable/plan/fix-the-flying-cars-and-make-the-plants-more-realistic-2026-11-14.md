# Fix the flying cars and make the plants more realistic

## Why the cars look wrong (likely cause)
- The cars that look "frozen" are the ones painted into your skyline image. They're part of the picture, so they can't move.
- The "black balls circling" are probably the new 3D cars. They're plain gray blobs and very little light reaches them up in the sky, so they look like dark spheres. They also move so slowly that it reads as circling, not flying.

## Fixes
1. **Remove the painted cars from the skyline image.** Use AI image editing to paint them out and fill the sky behind them. Your stars, moon, buildings and "214" sign stay as they are.
2. **Rebuild the 3D cars:** a sleek hover-car shape (body, cockpit and fins, like the ones in your image). Silver-gray with pink underglow and headlights, so they never look black. Bigger, with longer glowing pink trails that fade out.
3. **Better motion:** 3-4 cars cross the skyline in straight lanes at different heights. Each crossing takes about 15-25 seconds, then the car leaves and comes back in on a new lane, so it never looks like it's going in circles.

## Making the plants more realistic
I'd suggest swapping the hand-made leaf blobs for free, ready-made 3D plant models:
- **Models:** free plant packs (Quaternius, Kenney, Poly Pizza) with real-looking tomato vines, leafy herbs, rose bushes and lettuce. They're low-detail so the scene stays fast.
- **Details:** add a soft leaf texture and slight color differences between plants so they don't look like copies. Add tomatoes on the vines and pink and white blooms on the roses.
- **Swaying:** the plants keep swaying, and so does the seedling in its dome. The seedling's growth stages stay the same.
- **Look:** I'll keep the plants a little stylized so they match your comic-style skyline. Fully lifelike plants would clash with the drawing.

## Technical details
- Edit `skyline_backdrop.jpg` with imagegen edit_image (remove vehicles) and upload a new asset pointer.
- `FlyingCars.tsx`: change to a lane-based linear path along chords in front of the backdrop, add an emissive body and a fading trail ribbon, and give CARS new speed constants.
- Plants: fetch CC0 GLBs with fetch_model.py, then validate and optimize them. Use `useGLTF` with a Suspense fallback to the current procedural plants. The Sway wrapper stays the same.
- Verify with screenshots and sim checks of car positions over time.
