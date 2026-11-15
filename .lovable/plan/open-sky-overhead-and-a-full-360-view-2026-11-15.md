# Open sky overhead and a full 360 view

## Why it looks like a black circle
The painted skyline is wrapped on an open curved wall. Nothing sits above it, so looking up shows the plain dark background through the open top.

## 1. A real sky dome overhead
- Add a sky dome over the whole scene. It blends from the dusky pink at the skyline's top edge up to a deep plum-navy overhead.
- Scatter small twinkling stars across the dome and add soft drifting pink-gray clouds near the horizon. The painted moon stays where it is.
- Make the top of the painted skyline fade into the dome's color so you can't see a seam.
- Let the player tilt the camera up a bit further so the open sky is part of the view.

## 2. Full 360 turning
Yes, the garden can be 360. The painted skyline only covers about 150 degrees today, which is why turning is limited. To go all the way around:
- Make a wraparound version of the skyline in the same comic style: gray buildings, pink neon and the 214 sign facing front. Its left and right edges will join seamlessly, and it wraps a full circle around the deck.
- Remove the left and right turning limits.
- Fill the side of the rooftop behind the starting view so it isn't empty: the apartment wall and door with the glowing 214 number, a string of warm lights, a couple of potted plants, and the railing continuing all the way around.
- Keep the flying cars crossing all the way around the skyline.
- Nothing else changes: the beds, Xion's tap, drag and care tips, the care panel, watering, the sound button, the phone layout and the starting view of the seedling.

## Checks
- Screenshots looking up, then facing front, left, right and behind. No black gaps and no visible seam.
- Rerun the existing tests and the seedling watering check.

## Technical details
- New `scene/SkyDome.tsx`: a back-sided sphere (radius slightly larger than the backdrop) with a gradient shader and hashed star twinkle. Rendered before the backdrop with `depthWrite` off. `BACKDROP.fill` becomes the dome's horizon color.
- `Backdrop.tsx`: the arc goes from 2.6 to 2π, with the cylinder height recomputed from the new image's aspect ratio. The top fade uses the dome color.
- The new panorama comes from editing the current skyline image into a 2:1 seamless wrap and is uploaded as a new asset. The old asset is deleted.
- `config.ts` LOOK: remove the yaw limits and lower `polarMin` to about 0.9. `XionCamera` drops `min/maxAzimuthAngle` when yaw is unlimited.
- `Deck.tsx`: extend the planks and railing a full 360. Add the rear wall and door group (procedural and outlined, matching the art style).
- `FlyingCars` lanes: switch to circular arcs around the full ring.
