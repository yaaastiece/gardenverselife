# Plantlet sounds, more volume controls, start-screen mute fix, two new songs

## 1. Cute plantlet noises
- Tap or poke the plantlet and it makes a short, cute sound. Press and hold (a squeeze) and it makes a longer squeaky sound. It still gets watered the same way it does now.
- Each plantlet has its own voice. Pepper Peony gets a bright, bubbly chirp, a little higher when she's excited. Lumibud gets a soft, glassy "bloop" with a twinkle.
- The sounds are made on the device, so no files are needed. They follow a new "Garden" volume slider, and repeat taps are spaced out so they can't get noisy.
- This works with a mouse, on phones and with VR hands, using the touch handling the garden already has.

## 2. Volume controls everywhere
- **Main garden:** the "Sound on" button at the top gets a small pop-out panel with three sliders: Garden (city hum, wind and plantlet noises), Music and Xion's voice. Your settings are saved on each device.
- **Meditation:** the meditation screen gets its own Music and Voice sliders, so you can change them without leaving. They share settings with the sound bowl sliders.

## 3. "Xion speaks" button on the start screen
- I haven't confirmed why it doesn't work yet. First I'll test it in a browser: whether the tap registers, whether the icon changes, and whether Xion goes quiet or speaks again. Then I'll fix the cause so turning it off actually silences her right away (including a line that is already playing) and turning it back on lets her speak again. The fix will come with a test.

## 4. Sound bowl songs
- Add "Take Me to the Moon", "Divine Algorithm", "Master Coder" and "G Minor Lo-Fi". "Take Me to the Moon" plays first, then the original three and the other new songs follow.
- The sound bowl card gets a "Songs" list. Tap any song to play it, and the one playing is highlighted. Next and Play/Pause stay the same. The VR bowl panel gets the same list.
- The music memory will be updated with the new song order.

## Technical details
- `audio/plantVoice.ts` (plain TS): Web Audio synthesis with a separate preset for each plantlet in `plants/plantlets.ts` (`voice` field), plus a cooldown. A tap under 250 ms plays a "poke" and a longer hold plays a "squeeze". It's wired into `PlantCompanion` pointer down/up and goes through the "gv-garden-volume" gain in `mixer.ts`. The ambience master gain also follows the garden volume.
- `radio.ts`: upload the songs with lovable-assets, put Take Me to the Moon first in `TRACKS`, and add `select(index)`. Update the radio tests for order and selection, and add a test for the plantVoice cooldown.
- Shared `VolumeSliders` component used by the header popover, SoundBowlCard and MeditationOverlay.
- Reproduce the start-screen mute bug with Playwright before changing `PlantletPicker`/`voice.ts`.
