import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Planorth",
    short_name: "Planorth",
    lang: "tr",
    description: "Daha az karar. Daha iyi odak. Kişisel odak koçun.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait-primary",
    categories: ["education", "productivity"],
    shortcuts: [
      { name: "Bugün", short_name: "Bugün", url: "/", icons: [{ src: "/planorth-192.png?v=4", sizes: "192x192" }] },
      { name: "Planorth Koç", short_name: "Koç", url: "/coach", icons: [{ src: "/planorth-192.png?v=4", sizes: "192x192" }] },
      { name: "Haftalık plan", short_name: "Plan", url: "/week", icons: [{ src: "/planorth-192.png?v=4", sizes: "192x192" }] },
    ],
    background_color: "#121315",
    theme_color: "#121315",
    icons: [
      { src: "/planorth-192.png?v=4", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/planorth-512.png?v=4", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/planorth-maskable-512.png?v=4", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

