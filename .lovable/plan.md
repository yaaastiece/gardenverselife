# Sound bowl radio and guided meditation

You have 3 songs. Yes, Xion needs a new seated image to sit on the pad. I'll make one that matches her current look: cross-legged, wings relaxed, inked comic style, no background. You can swap in your own art anytime.

## What you'll get
- **Sound bowl radio** beside the meditation pad: a glowing bowl whose LED light slowly shifts pink, green and violet. It has a small screen with play/pause, next and the song name. Tap it on web, or point and pinch in VR.
- **Your 3 songs** play in order and loop. The garden's background sound fades down while music plays.
- **Guided meditation** starts from a "Meditate with Xion" button on the bowl:
  1. Xion flies to the pad and switches to her seated image.
  2. Music starts, and the bowl light breathes slowly in time with an inhale/exhale guide.
  3. Xion speaks a short guided meditation (about 2 minutes) in her ElevenLabs voice, with captions.
  4. At the end she stands and flies back. Tap anywhere to stop early.
- **Optional Orbis visuals**: a "Show visuals" toggle on the meditation starts a calm, separate Orbis video behind the captions. It uses the same one-at-a-time session rules and never interrupts growth cinematics. If it's off or unavailable, the meditation still works.

## What I need from you
Upload your 3 songs (MP3 works best) with their titles. I'll show placeholder titles until then.

## Not changing
Garden art, plants, care, Pepper Peony, growth cinematics, steering, timer, VR controls.

## Technical
- New plain TS `src/game/audio/radio.ts` (playlist, play/pause/next, ambience ducking, light color state) and `src/game/meditation/` (script steps, timing, breath phase, Xion seat/return through `interaction.move`, stop rules), with tests.
- Scene: `SoundBowl.tsx` near the Lounge at [1.8,0,-2.2]; seated Xion texture swap; VR reuses WorldPanel buttons.
- Songs uploaded as CDN assets; generated seated Xion sprite saved as an asset.
- Meditation Orbis uses its own prompt set through the existing cinematic controller, gated so a growth cinematic waits until meditation ends.
