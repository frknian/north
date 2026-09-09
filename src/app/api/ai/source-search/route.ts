import { NextResponse } from "next/server";
import { searchLiveWeb, type WebSearchResult } from "@/lib/server/web-search";
import { CURATED_WEB_SOURCES, WebSearchResultItem } from "@/lib/resources-hub";
import { BOOK_RECOMMENDATIONS } from "@/lib/books";
import { readLimitedJson, secureApiRequest } from "@/lib/server/api-security";

export async function POST(request: Request) {
  const access = await secureApiRequest(request, "ai:source-search");
  if (!access.ok) return access.response;

  const body = await readLimitedJson(request);
  if (!body.ok) return body.response;

  const raw = (body.data || {}) as { query?: string; category?: string };
  const query = (raw.query || "").trim();
  const category = (raw.category || "Tümü").trim();

  if (!query) {
    const filteredCurated = category === "Tümü"
      ? CURATED_WEB_SOURCES
      : CURATED_WEB_SOURCES.filter((c) => c.category === category);
    return NextResponse.json({ results: filteredCurated, total: filteredCurated.length });
  }

  // 1. Search Live Web
  const liveResults = await searchLiveWeb(query, 6);

  // 2. Search local curated sources
  const lowerQuery = query.toLowerCase();
  const matchingCurated = CURATED_WEB_SOURCES.filter(
    (c) =>
      c.title.toLowerCase().includes(lowerQuery) ||
      c.description.toLowerCase().includes(lowerQuery) ||
      c.tags.some((t) => t.toLowerCase().includes(lowerQuery)) ||
      c.category.toLowerCase().includes(lowerQuery)
  );

  // 3. Search curated books
  const matchingBooks: WebSearchResultItem[] = BOOK_RECOMMENDATIONS.filter(
    (b) =>
      b.title.toLowerCase().includes(lowerQuery) ||
      b.author.toLowerCase().includes(lowerQuery) ||
      b.summary.toLowerCase().includes(lowerQuery) ||
      b.tags.some((t) => t.toLowerCase().includes(lowerQuery))
  ).map((b) => ({
    id: b.id,
    title: `${b.title} - ${b.author}`,
    provider: "Seçkin Kitap",
    url: `https://libgen.is/search.php?req=${encodeURIComponent(`${b.title} ${b.author}`)}`,
    category: b.category,
    type: "book" as const,
    description: b.summary,
    tags: b.tags,
    isFree: false,
    libgenQuery: `${b.title} ${b.author}`,
    keyTakeaways: b.keyTakeaways,
  }));

  // 4. Map live results to WebSearchResultItem format
  const mappedLive: WebSearchResultItem[] = liveResults.map((lr, idx) => ({
    id: `live-${Date.now()}-${idx}`,
    title: lr.title,
    provider: lr.source || "Web Kaynağı",
    url: lr.url,
    category: category !== "Tümü" ? category : "Web & Araştırma",
    type: (lr.type === "video" ? "video" : lr.type === "documentation" ? "doc" : lr.type === "book" ? "book" : "article") as any,
    description: lr.snippet || "İnternet üzerinden taranmış güvenilir araştırma ve geliştirme kaynağı.",
    tags: [lr.type || "kaynak", lr.source || "web"],
    isFree: true,
    libgenQuery: lr.title.split(/[-–—|:]/)[0].trim(),
    keyTakeaways: [
      "Canlı web taramasından elde edilmiş doğrulanmış bağlantı.",
      "İçeriği inceleyip sayfa aralığı ekleyebilir veya NotebookLM'e aktarabilirsin.",
    ],
  }));

  const combined = [...matchingBooks, ...matchingCurated, ...mappedLive];

  const seen = new Set<string>();
  const uniqueResults: WebSearchResultItem[] = [];
  for (const item of combined) {
    const key = item.url.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueResults.push(item);
    }
  }

  return NextResponse.json({ results: uniqueResults, total: uniqueResults.length });
}
