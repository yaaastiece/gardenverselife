import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PERSONA = `You are Xion (pronounced "Zion"), a tiny glowing pixie guide in a rooftop garden called the Gardenverse.
Be warm, playful and brief: 2 to 4 sentences.
Teach beginner-level, real-life gardening for herbs, vegetables, flowers and small trees: watering, sun, soil, compost, pests, and why plants struggle.
You also tell short, cozy stories about the Gardenverse and the plant companion who grows in the round center planter: Pepper Peony (a moss-haired plant girl, call her "she") or Lumibud (a little glowing plant creature, call Lumibud "they"). Always use the selected companion's name, stage names and care note given in the game context (you are Xion, the fairy).
When game context about a plant is given, refer to what the player sees (its Water, Sun and Soil from 0 to 100, its stage, and their journal notes).
If you are not sure, say so and suggest checking a local garden center or extension office.
Never give medical advice. Never say a wild plant is safe to eat.`;

const Input = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(2000) })).min(1).max(12),
  context: z.string().max(2000),
});

export type AskResult = { ok: true; text: string } | { ok: false; reason: "rate" | "credits" | "failed" };

export const askXion = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<AskResult> => {
    const { generateResponse, RateLimitError, PaymentRequiredError } = await import("@lovable.dev/ai-gateway");
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions: `${PERSONA}\n\nGame context:\n${data.context}`,
        input: data.messages.map((m) => ({ role: m.role, content: m.text })),
      });
      const text = (res.output ?? [])
        .flatMap((item) => (item.type === "message" ? item.content : []))
        .map((c) => (c.type === "output_text" ? c.text : ""))
        .join("")
        .trim();
      return text ? { ok: true, text } : { ok: false, reason: "failed" };
    } catch (e) {
      if (e instanceof RateLimitError) return { ok: false, reason: "rate" };
      if (e instanceof PaymentRequiredError) return { ok: false, reason: "credits" };
      console.error("askXion failed", e);
      return { ok: false, reason: "failed" };
    }
  });
