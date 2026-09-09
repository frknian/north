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
    background_color: "#121315",
    theme_color: "#121315",
    icons: [
      { src: "/planorth-192.png?v=4", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/planorth-512.png?v=4", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/planorth-maskable-512.png?v=4", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

