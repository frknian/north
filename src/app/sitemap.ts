import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://cybercoach.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ["/welcome", "/login", "/support", "/kvkk"].map((path) => ({ url: `${base}${path}`, lastModified: now, changeFrequency: path === "/welcome" ? "weekly" : "monthly", priority: path === "/welcome" ? 1 : 0.5 }));
}
