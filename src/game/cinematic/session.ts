import type { Reactor, ReactorMessage } from "@reactor-team/js-sdk";
import { stagePrompt } from "./prompts";
import { createCinematicTimer } from "./timer";

export type CinematicState = { open: boolean; stage: number; phase: "idle" | "loading" | "playing" | "error"; error: string | null; stream: MediaStream | null };
type Client = Pick<Reactor, "connect" | "disconnect" | "sendCommand" | "uploadFile" | "on" | "off">;
export type WorldSession = { token: string; model: string; prompt: string };
type Dependencies = {
  mint: (signal: AbortSignal) => Promise<WorldSession>;
  create: (model: string) => Promise<Client>;
  capture: () => Promise<File>;
};

/** One controller owns one stream; screen and future XR displays only subscribe. */
export function createCinematicSession(deps: Dependencies) {
  let state: CinematicState = { open: false, stage: 0, phase: "idle", error: null, stream: null };
  const listeners = new Set<() => void>();
  let client: Client | null = null;
  let lifecycle: Promise<void> = Promise.resolve();
  let abort: AbortController | null = null;
  let generation = 0;
  let active = false;
  let releaseLock: (() => void) | null = null;
  let lockTask: Promise<unknown> | null = null;
  let trackCleanup: (() => void) | null = null;
  const update = (patch: Partial<CinematicState>) => { state = { ...state, ...patch }; listeners.forEach((f) => f()); };
  const timer = createCinematicTimer(() => { void controller.close(); });
  const fail = () => { timer.stop(); update({ phase: "error", error: "This cinematic couldn’t play. You can skip it and return to your garden." }); };
  const command = async (c: Client, name: string, data: object) => {
    const reply = await c.sendCommand(name, data);
    if (reply?.type === "command_error") throw new Error("Cinematic command refused");
  };
  const acquireLock = async () => {
    if (typeof navigator === "undefined" || !navigator.locks) return;
    await new Promise<void>((resolve, reject) => {
      lockTask = navigator.locks.request("gardenverse-orbis", { ifAvailable: true }, async (lock) => {
        if (!lock) { reject(new Error("Another cinematic is active")); return; }
        await new Promise<void>((release) => { releaseLock = release; resolve(); });
      });
      void lockTask.catch(reject);
    });
  };
  const cleanup = async () => {
    trackCleanup?.(); trackCleanup = null;
    const old = client; client = null;
    try {
      if (old) {
        try { await command(old, "stop", {}); } catch { /* Disconnect still ends the server session. */ }
        await old.disconnect();
      }
    } finally {
      releaseLock?.(); releaseLock = null;
      await lockTask?.catch(() => undefined); lockTask = null;
      active = false;
    }
  };
  const controller = {
    timer,
    resetCountdown() { if (state.open && state.phase === "playing") timer.reset(); },
    getSnapshot: () => state,
    subscribe(f: () => void) { listeners.add(f); return () => { listeners.delete(f); }; },
    framesArrived() { if (state.open && state.phase === "loading") { timer.start(); update({ phase: "playing" }); } },
    playbackFailed: fail,
    advance(stage: number) {
      stagePrompt(stage);
      if (active && !state.open) return lifecycle; // Closing: never race a second session into existence.
      const id = generation;
      const first = !active;
      if (first) { active = true; abort = new AbortController(); update({ open: true, stage, phase: "loading", error: null, stream: null }); }
      else { if (stage !== state.stage) timer.reset(); update({ stage }); }
      lifecycle = lifecycle.then(async () => {
        if (id !== generation || !state.open || state.phase === "error") return;
        const check = () => { if (id !== generation || !state.open) throw new Error("Cinematic cancelled"); };
        if (!first) { if (client) await command(client, "set_prompt", { prompt: stagePrompt(stage) }); return; }
        await acquireLock(); check();
        const signal = abort?.signal;
        if (!signal) return;
        const world = await deps.mint(signal); check();
        client = await deps.create(world.model); check();
        const c = client;
        const onMessage = (message: ReactorMessage) => { if (message.type === "command_error") fail(); };
        const onError = () => { if (id === generation && state.open) fail(); };
        const onTrack = (name: string, track: MediaStreamTrack, stream: MediaStream) => {
          if (name !== "main_video" || id !== generation || !state.open) return;
          const attach = () => { if (id === generation && state.open) update({ stream: new MediaStream(stream.getTracks()) }); };
          attach(); track.addEventListener("unmute", attach);
          unmuteCleanups.push(() => track.removeEventListener("unmute", attach));
        };
        const unmuteCleanups: Array<() => void> = [];
        c.on("message", onMessage); c.on("error", onError); c.on("trackReceived", onTrack);
        trackCleanup = () => { c.off("message", onMessage); c.off("error", onError); c.off("trackReceived", onTrack); unmuteCleanups.forEach((f) => f()); };
        await c.connect(world.token); check();
        await command(c, "set_resolution", { resolution: "1080p" }); check();
        const file = await deps.capture(); check();
        const image = await c.uploadFile(file); check();
        await command(c, "set_image", { image }); check();
        await command(c, "set_prompt", { prompt: world.prompt }); check();
        await command(c, "start", {}); check();
        if (stage > 0) await command(c, "set_prompt", { prompt: stagePrompt(stage) });
      }).catch(async () => {
        if (id === generation && state.open) fail();
        await cleanup().catch(() => undefined);
      });
      return lifecycle;
    },
    steer(prompt: string) {
      controller.resetCountdown();
      const id = generation;
      const request = lifecycle.then(async () => {
        if (id !== generation || !state.open || state.phase === "error" || !client) throw new Error("Cinematic stream is not ready");
        await command(client, "set_prompt", { prompt });
      });
      // A rejected steering command must not poison later stage or close commands.
      lifecycle = request.catch(() => undefined);
      return request;
    },
    close() {
      timer.stop();
      generation++; abort?.abort(); abort = null;
      update({ open: false, stage: 0, phase: "idle", error: null, stream: null });
      lifecycle = lifecycle.then(cleanup).catch(() => undefined);
      return lifecycle;
    },
  };
  return controller;
}
export type CinematicSession = ReturnType<typeof createCinematicSession>;

export function createGardenCinematic(capture: () => Promise<File>) {
  return createCinematicSession({
    capture,
    create: async (modelName) => { const { Reactor } = await import("@reactor-team/js-sdk"); return new Reactor({ modelName }); },
    mint: async (signal) => {
      const response = await fetch("/api/world", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", signal });
      if (!response.ok) throw new Error("Cinematic unavailable");
      const data: unknown = await response.json();
      if (!data || typeof data !== "object" || !("token" in data) || typeof data.token !== "string" || !("model" in data) || typeof data.model !== "string" || !("prompt" in data) || typeof data.prompt !== "string") throw new Error("Incomplete cinematic session");
      return { token: data.token, model: data.model, prompt: data.prompt };
    },
  });
}