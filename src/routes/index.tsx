import { createFileRoute } from "@tanstack/react-router";
import { GardenScene } from "@/game/GardenScene";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Gardenverse — Rooftop Garden at Dusk" },
      { name: "description", content: "Tend a glowing seedling on a futuristic rooftop garden above a neon-pink city at dusk." },
      { property: "og:title", content: "Gardenverse — Rooftop Garden at Dusk" },
      { property: "og:description", content: "Tend a glowing seedling on a futuristic rooftop garden above a neon-pink city." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GardenScene,
});
