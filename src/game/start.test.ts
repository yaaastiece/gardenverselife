import { describe, expect, it, vi } from "vitest";
import { createStartScreen } from "./start";

function setup(enabled = true) {
  let clock = 0;
  const actions = { speak: vi.fn(), speechEnabled: () => enabled, enter: vi.fn(), finish: vi.fn() };
  return { flow: createStartScreen(actions, () => clock), actions, time: (n: number) => { clock = n; } };
}
describe("start screen rules", () => {
  it("requires a tap before speaking or selecting", () => {
    const { flow, actions } = setup();
    flow.select("pepper"); flow.enter();
    expect(flow.getSnapshot().selected).toBeNull(); expect(actions.speak).not.toHaveBeenCalled(); expect(actions.enter).not.toHaveBeenCalled();
    flow.begin(); expect(actions.speak).toHaveBeenCalledTimes(1);
  });
  it("cannot enter until a character is chosen", () => {
    const { flow, actions } = setup(); flow.begin(); flow.enter();
    expect(actions.enter).not.toHaveBeenCalled();
    flow.select("lumibud"); flow.enter(); expect(actions.enter).toHaveBeenCalledExactlyOnceWith("lumibud");
  });
  it("honors Xion speaks being off", () => {
    const { flow, actions } = setup(false); flow.begin(); flow.select("pepper");
    expect(actions.speak).not.toHaveBeenCalled();
  });
  it("ends the fade at one second, and only finishes once", () => {
    const { flow, actions, time } = setup(); flow.begin(); flow.select("pepper"); flow.enter();
    time(500); flow.tick(); expect(flow.getSnapshot().opacity).toBe(0.5); expect(actions.finish).not.toHaveBeenCalled();
    time(999); flow.tick(); expect(actions.finish).not.toHaveBeenCalled();
    time(1000); flow.tick(); flow.tick(); expect(actions.finish).toHaveBeenCalledTimes(1);
  });
  it("reset requires a fresh selection", () => {
    const { flow } = setup(); flow.begin(); flow.select("pepper"); flow.reset(); flow.begin(); flow.enter();
    expect(flow.getSnapshot().selected).toBeNull(); expect(flow.getSnapshot().phase).toBe("choosing");
  });
});