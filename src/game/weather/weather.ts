// Garden weather: plain rules shared by the screen button, the VR panel and the 3D scene.
// Weather is visual + sound only; it never changes care, growth or quest state.
export const WEATHER_MODES = ["clear", "rain", "fog", "fireflies"] as const;
export type WeatherMode = (typeof WEATHER_MODES)[number];
export const WEATHER_LABEL: Record<WeatherMode, string> = { clear: "Clear", rain: "Rain", fog: "Fog", fireflies: "Fireflies" };
export const WEATHER_ICON: Record<WeatherMode, string> = { clear: "🌙", rain: "🌧", fog: "🌫", fireflies: "✨" };
export const WEATHER_KEY = "gv-weather";
/** Seconds to fade between weathers. */
export const WEATHER_FADE = 2.5;

export const nextWeather = (m: WeatherMode): WeatherMode => WEATHER_MODES[(WEATHER_MODES.indexOf(m) + 1) % WEATHER_MODES.length]!;
const isMode = (v: unknown): v is WeatherMode => typeof v === "string" && (WEATHER_MODES as readonly string[]).includes(v);

export function createWeather(storage: Pick<Storage, "getItem" | "setItem"> | null = typeof localStorage === "undefined" ? null : localStorage) {
  let mode: WeatherMode = "clear";
  try { const saved = storage?.getItem(WEATHER_KEY); if (isMode(saved)) mode = saved; } catch { /* private mode */ }
  const subs = new Set<() => void>();
  const w = {
    getSnapshot: () => mode,
    subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f); }; },
    set(next: WeatherMode) {
      if (!isMode(next) || next === mode) return;
      mode = next; try { storage?.setItem(WEATHER_KEY, mode); } catch { /* private mode */ }
      subs.forEach((f) => f());
    },
    cycle() { w.set(nextWeather(mode)); },
  };
  return w;
}
export type Weather = ReturnType<typeof createWeather>;
export const weather = createWeather();
