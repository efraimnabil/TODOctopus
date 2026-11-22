import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TODOctopus",
    short_name: "TODOctopus",
    description: "Every task is a tentacle. Finish it, slash it. Slash them all and defeat the octopus.",
    start_url: "/play",
    display: "standalone",
    background_color: "#031322",
    theme_color: "#031322",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
