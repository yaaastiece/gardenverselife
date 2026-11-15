<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Gardenverse structure
- 3D scene lives in `src/game/`: rules/data in plain TS (`plants/`, `config.ts`), scene pieces in `scene/`, audio in `audio/`; the `/` route renders it with `ssr: false` because WebGL is browser-only.

## Gardenverse structure
- 3D scene lives in `src/game/`: rules/data in plain TS (`plants/`, `config.ts`), scene pieces in `scene/`, audio in `audio/`; the `/` route uses `ssr: false` because WebGL is browser-only.

## Xion interaction boundaries
- Keep world-space Xion state, care targets, gesture thresholds, and speech timing in plain TypeScript `src/game/interaction.ts`; pointer and future Quest hand adapters share its begin/move/release/dismiss commands.
- Pointer dragging raycasts onto a horizontal plane at Xion's current hover height; this lets screen dragging reach the garden's plants while preserving altitude, and tracked hands may supply 3D positions directly.
- `XionCamera` owns camera glides and projects the speech anchor, while `XionSpeech` subscribes to speech events at fixed screen dimensions; future XR panels replace presentation without changing rules.
- Dev-only `window.__game` exposes live `state`, `move({x,y,z})`, `tap()`, `release()`, and `dismiss()` for repeatable garden interaction checks; `[data-scene-ready]` marks rendered frames.

## Skyline and view boundaries
- Keep one seamless, aspect-preserving 360 skyline ring (painted panels joined edge to edge) under `SkyDome`, sharing `skyShader.ts` for the top fade; this avoids stretching and repeats.
- Turning is unlimited because the city wraps fully; skip OrbitControls and camera glides while XR is presenting so head tracking remains unrestricted.
- Generate dome stars in two-dimensional cube-face coordinates with derivative antialiasing, not a three-dimensional voxel grid, so stars remain visible at zenith and different screen sizes.

## Plant companion
- The heart-planter plant is a 4-frame billboard sprite (`scene/PlantCompanion.tsx`); per-stage heights and frame bounds live in `plants/companion.ts` so feet anchoring and sizes stay data-driven.
- Garden-bed health and plant hover/selection live in plain TS `plants/beds.ts`; `PlantCard` (screen) and `PlantCardAnchor`/`PlantFxLayer` (scene) only present it, so WebXR panels can reuse the state.
- Xion chat and journal state live in plain TS `src/game/xion/` (chat, journal, voice with a single `speak(text)`); `ui/XionPanel.tsx` only presents it. AI replies come from the `askXion` server function in `src/lib/xion.functions.ts`, so no key reaches the browser.
- "Xion helps" lives in plain TS `src/game/xion/helper.ts` (report, neediest-first queue, cooldown); it flies Xion only through `interaction.move` and fixes through `care.assist`/`beds.assist`, which never award growth points.

## Cinematic boundaries
- Reactor session lifecycle and stage prompts live in `src/game/cinematic/`, separate from `CinematicOverlay`; one serialized controller and a browser lock prevent concurrent player sessions and let XR reuse the stream.
- `/api/world` mints scoped Reactor tokens with a server-only key and disabled sensitive logging; never pass the provider key to the browser.
- Capture the preserved garden drawing buffer once per run as a center-cropped 16:9 JPEG; later stages steer only the prompt so the running stream is not reset.
