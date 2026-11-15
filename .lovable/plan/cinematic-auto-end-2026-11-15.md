# Cinematic auto-end

- Start a 15-second countdown only when the first video frames arrive; loading time does not count.
- Show a thin draining bar at the top. At zero, fade the cinematic out for one second, then use the existing close action to stop and disconnect.
- Reset the countdown on chip/text/voice submissions and new plant stages. Keep Close and Skip immediate.
- Leave the garden, VR, narration, steering rules and stream lifecycle unchanged.

## Technical details
- Add a display-independent TypeScript timer with one named duration constant, owned by the cinematic session so future WebXR panels share it.
- Test loading exclusion, exact duration, resets, fade timing, immediate cancellation and session cleanup. Check the overlay on desktop and phone.