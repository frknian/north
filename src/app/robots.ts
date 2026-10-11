import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://cybercoach.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/", "/welcome", "/login", "/kvkk", "/support"], disallow: ["/api/", "/data", "/profile", "/onboarding", "/focus/", "/account-reset"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
