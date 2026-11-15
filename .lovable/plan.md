# Sound bowl radio and guided meditation

I'll use your 3 songs (Neon Botanica, Night Garden, Planting) and your seated Xion art. I'll cut out the front-facing pose with no background or halo, keeping her wings, and use the back view when you're looking at her from behind the pad.

## What you'll get
- **Sound bowl radio** beside the meditation pad: a glowing bowl whose LED light slowly shifts pink, green and violet. It has a small screen with play/pause, next and the song name. Tap it on web, or point and pinch in VR.
- **Your 3 songs** play in order and loop. The garden's background sound fades down while music plays.
- **Guided meditation** starts from a "Meditate with Xion" button on the bowl:
  1. Xion flies to the pad and switches to her seated image.
  2. Music starts, and the bowl light breathes slowly in time with an inhale/exhale guide.
  3. Xion speaks a short guided meditation (about 2 minutes) in her ElevenLabs voice, with captions.
  4. At the end she stands and flies back. Tap anywhere to stop early.
- **Optional Orbis visuals**: a "Show visuals" toggle on the meditation starts a calm, separate Orbis video behind the captions. It uses the same one-at-a-time session rules and never interrupts growth cinematics. If it's off or unavailable, the meditation still works.

## Collapsible status panel
- On desktop, the left Condition/Growth panel and the Moonflower card get a collapse button. When collapsed, they shrink to a small "Care" tab you can tap to open again. They start open, and your choice is remembered.
- Phones keep the existing collapsible Care button.

## Not changing
Garden art, plants, care, Pepper Peony, growth cinematics, steering, timer, VR controls.

## Technical
- New plain TS `src/game/audio/radio.ts` (playlist, play/pause/next, ambience ducking, light color state) and `src/game/meditation/` (script steps, timing, breath phase, Xion seat/return through `interaction.move`, stop rules), with tests.
- Scene: `SoundBowl.tsx` near the Lounge at [1.8,0,-2.2]; seated Xion texture swap; VR reuses WorldPanel buttons.
- Songs uploaded from the files you sent; seated Xion cut out from your image (front and back halves, transparent), as CDN assets; generated seated Xion sprite saved as an asset.
- Meditation Orbis uses its own prompt set through the existing cinematic controller, gated so a growth cinematic waits until meditation ends.
