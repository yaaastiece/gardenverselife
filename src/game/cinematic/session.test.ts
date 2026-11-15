import { describe, expect, it, vi } from "vitest";
import { createCinematicSession, type WorldSession } from "./session";
import { CINEMATIC_PROMPTS } from "./prompts";

function setup() {
  const events = new Map<string, (...args: any[]) => void>();
  const client = {
    connect: vi.fn(async () => undefined), disconnect: vi.fn(async () => undefined),
    sendCommand: vi.fn(async (_name: string, _data?: object) => undefined),
    uploadFile: vi.fn(async () => ({ uploadId: "fixture-upload" })),
    on: vi.fn((name: string, fn: (...args: any[]) => void) => { events.set(name, fn); }),
    off: vi.fn(),
  };
  const world: WorldSession = { token: "noncredential-test-fixture", model: "reactor/visko-orbis-stable", prompt: CINEMATIC_PROMPTS[0] };
  const mint = vi.fn(async () => world);
  const capture = vi.fn(async () => new File(["frame"], "garden-frame.jpg", { type: "image/jpeg" }));
  const create = vi.fn(async () => client as unknown as Parameters<typeof createCinematicSession>[0]["create"] extends (...args: any[]) => Promise<infer T> ? T : never);
  return { session: createCinematicSession({ mint, capture, create }), client, mint, capture, events };
}

describe("cinematic lifecycle", () => {
  it("starts muted presentation loading, with resolution, one seed image, start prompt, then the second-stage prompt", async () => {
    const { session, client, capture } = setup();
    await session.advance(1);
    expect(client.sendCommand.mock.calls.map(([name]) => name)).toEqual(["set_resolution", "set_image", "set_prompt", "start", "set_prompt"]);
    expect(client.sendCommand).toHaveBeenNthCalledWith(1, "set_resolution", { resolution: "1080p" });
    expect(client.sendCommand).toHaveBeenNthCalledWith(3, "set_prompt", { prompt: CINEMATIC_PROMPTS[0] });
    expect(client.sendCommand).toHaveBeenLastCalledWith("set_prompt", { prompt: CINEMATIC_PROMPTS[1] });
    expect(capture).toHaveBeenCalledTimes(1);
    expect(session.getSnapshot().phase).toBe("loading");
    session.framesArrived(); expect(session.getSnapshot().phase).toBe("playing");
    await session.close();
  });
  it("serializes later stages into the same session without uploading another image", async () => {
    const { session, client, mint, capture } = setup();
    await Promise.all([session.advance(1), session.advance(2), session.advance(3)]);
    expect(mint).toHaveBeenCalledTimes(1);
    expect(client.connect).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledTimes(1);
    expect(client.uploadFile).toHaveBeenCalledTimes(1);
    expect(client.sendCommand.mock.calls.slice(-2)).toEqual([
      ["set_prompt", { prompt: CINEMATIC_PROMPTS[2] }],
      ["set_prompt", { prompt: CINEMATIC_PROMPTS[3] }],
    ]);
    await session.close();
  });
  it("closing sends stop and disconnect before a later stage can create another stream", async () => {
    const { session, client, mint } = setup();
    await session.advance(1);
    const closing = session.close();
    await session.advance(2); await closing;
    expect(mint).toHaveBeenCalledTimes(1);
    expect(client.sendCommand).toHaveBeenLastCalledWith("stop", {});
    expect(client.disconnect).toHaveBeenCalledTimes(1);
    expect(session.getSnapshot().open).toBe(false);
    await session.advance(3);
    expect(mint).toHaveBeenCalledTimes(2);
    await session.close();
  });
  it("command_error produces a recoverable error and skip can shut down the session", async () => {
    const { session, events, client } = setup();
    await session.advance(1);
    events.get("message")?.({ type: "command_error", data: {} });
    expect(session.getSnapshot().phase).toBe("error");
    await session.close();
    expect(client.disconnect).toHaveBeenCalledTimes(1);
    expect(session.getSnapshot().stream).toBeNull();
  });
  it("close during token minting never connects an orphan stream", async () => {
    const { session, mint, client } = setup();
    let finish: ((world: WorldSession) => void) | undefined;
    mint.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const opening = session.advance(1);
    await vi.waitFor(() => expect(mint).toHaveBeenCalledTimes(1));
    const closing = session.close();
    finish?.({ token: "noncredential-test-fixture", model: "reactor/visko-orbis-stable", prompt: CINEMATIC_PROMPTS[0] });
    await opening; await closing;
    expect(client.connect).not.toHaveBeenCalled();
    expect(session.getSnapshot().open).toBe(false);
  });
});