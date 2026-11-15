import { describe, it, expect } from "vitest";
import { createWeather, nextWeather } from "./weather";
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } }; };
describe("weather", () => {
  it("cycles clear → rain → fog → fireflies → clear", () => {
    expect(nextWeather("clear")).toBe("rain"); expect(nextWeather("fog")).toBe("fireflies"); expect(nextWeather("fireflies")).toBe("clear");
  });
  it("remembers the choice on this device", () => {
    const s = mem(); createWeather(s).set("fog");
    expect(createWeather(s).getSnapshot()).toBe("fog");
  });
  it("ignores unknown modes", () => {
    const w = createWeather(mem()); w.set("snow" as never); expect(w.getSnapshot()).toBe("clear");
  });
});
