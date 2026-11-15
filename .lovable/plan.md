# Quest VR, part 1

Add an optional **Enter VR** button only on supported devices. Keep the existing garden, care rules, Xion, desktop and phone views unchanged.

## Experience
- Start ambient sound on entry; use floor-level standing tracking facing the center planter. Restore the normal view on exit.
- Support controller rays and tracked-hand pinch, shared taps and Xion dragging. No walking or camera glides; optional 30-degree thumbstick snap turn.
- Hide flat controls in VR. Add readable, world-anchored Care, Xion speech, selected-plant and moonflower panels using existing state and actions.
- Defer growth cinematics in VR to a floating **Cinematic ready** button that exits VR before playback. Chat and Journal stay in the normal view for part 2.

## Technical details
- Use `@react-three/xr` with the current React Three Fiber scene and reusable VR presentation/adapters under `src/game/xr/`.
- Use `local-floor`, optional hand tracking, pixel ratio 1 and no preserved drawing buffer. Explicitly render a normal-view frame immediately before Orbis capture rather than preserving every frame.
- Reduce decorative particles and extra point lights only in VR; retain the existing art and geometry. Target 72 fps, with actual frame rate requiring Quest hardware verification.
- Add focused tests for session settings, snap-turn thresholds and cinematic deferral; verify normal desktop/phone rendering and test available XR wiring.
- Add Quest and Immersive Web Emulator testing instructions to README.

Assumption: the player starts on the front of the deck, with real tracked eye height; snap turning is off until enabled on the Care panel.