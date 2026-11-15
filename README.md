# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Quest VR — part 1

Publish the garden, open its HTTPS link in Meta Quest's browser, and tap **Enter VR**. The button is absent on browsers without immersive VR support. Allow tracking, stand in your safe play area, and face the center planter. Your real standing height is used; there is no joystick walking. Controller trigger or hand pinch taps plants and panel buttons. Hold a pinch and move Xion, or reach her with the controller and hold grip to drag. Rays and green hover highlights indicate targets.

The Care panel includes optional **30° snap turn** (off initially) and **Exit VR**. Flick the right thumbstick, returning it to center between turns; one controller also works. Leave VR with Exit VR or the Quest system menu. Desktop/phone controls return. Growth in VR opens a chest-height **Steer the cinematic** panel with four large choices, two rotating Xion suggestions and hold-to-talk. Release the mic to review the heard words, then send them; unsupported microphones leave all chips usable. **Exit VR & play** keeps the existing handoff and carries the validated request into the Orbis stream. Chat, Journal and immersive Orbis video remain normal-view presentation.

For desktop testing, install the **Immersive Web Emulator** browser extension, open the garden in its own tab, enable a Quest device in the extension's developer-tools panel, then reload and tap Enter VR. Move the simulated headset and controllers; test trigger, grip, hand pinch, plant watering, bed selection, the four panels, snap turn, and exit restoration. The app deliberately does not auto-enable its own emulator on unsupported browsers.

VR requests 72 Hz when supported, pixel ratio/framebuffer scale 1 and device foveation 1. Extra point lights and bed-care particle effects are off in VR; Xion sparkles drop 14→4, growth sparkles 40→8, compost 30→6 and moonflower 24→6. Shadows/full-screen passes are not enabled. Neon materials, outlines, plant geometry and skyline stay unchanged. Drawing-buffer preservation is off in both modes; Orbis renders and copies a fresh normal-view garden frame synchronously after VR exit. Actual 72 fps, headset comfort, tracking and audio must be tested on Quest hardware; an emulator does not establish performance.
