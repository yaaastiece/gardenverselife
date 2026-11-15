# Phone layout and interactive Xion

## Changes
- Stack the title and stage badge at top left, with a smaller sound button at top right on phones.
- Frame the whole center planter on phones without changing the backdrop or garden interactions.
- Make Xion hand-sized, softly glowing, and hovering just above the front of the center planter.
- Tap Xion to glide closer and show her readable bubble; tap again or empty space to return.
- Drag Xion with mouse or touch; leave her floating at the release position.
- Show the supplied plant-care tip near tomatoes, herbs, roses, or the seedling for six seconds before fading. Keep the initial welcome for six seconds.

## Assumptions
- Dragging moves Xion across a camera-facing plane, keeping her within the garden and above the deck.
- “Hand-sized” means slightly larger than her current size, with a generous invisible touch target.
- A close-up tap shows the nearest care tip, or the welcome when no plant is nearby.

## Technical details
- Keep position, proximity, gesture decisions, and speech timing in framework-independent TypeScript so future Quest inputs and 3D panels can reuse them.
- Separate pointer input, camera gliding, sprite rendering, and fixed-size screen speech presentation.
- Add tests for release position, tap/drag distinction, plant proximity, and six-second speech duration.
- Verify the phone/desktop layout, watering, tap-in/tap-out, drag-and-release, and timed tips with browser checks.