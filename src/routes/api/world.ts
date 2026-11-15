import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/world")({
  server: { handlers: {
    POST: async ({ request }) => {
      const headers = { "Cache-Control": "no-store" };
      const origin = request.headers.get("origin");
      if (!origin || origin !== new URL(request.url).origin) return Response.json({ error: "Request not allowed" }, { status: 403, headers });
      const apiKey = process.env["REACTOR_API_KEY"];
      if (!apiKey) return Response.json({ error: "Cinematics are not available yet" }, { status: 503, headers });
      try {
        const { generateWorld } = await import("@tanstack/ai");
        const { reactorWorld } = await import("@tanstack/ai-reactor");
        const { CINEMATIC_PROMPTS } = await import("@/game/cinematic/prompts");
        const world = await generateWorld({
          adapter: reactorWorld("visko-orbis-stable", { apiKey }),
          prompt: CINEMATIC_PROMPTS[0],
          threadId: crypto.randomUUID(), debug: false,
          timeout: 20000, abortSignal: request.signal,
        });
        return Response.json({ token: world.token, model: world.model, prompt: world.prompt }, { headers });
      } catch {
        return Response.json({ error: "This cinematic couldn’t start. Please skip it for now." }, { status: 502, headers });
      }
    },
  } },
});