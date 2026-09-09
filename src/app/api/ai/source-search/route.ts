import { NextResponse } from "next/server";
import { searchLiveWeb, searchGooglePdfBooks, type GooglePdfBookResult, type WebSearchResult } from "@/lib/server/web-search";
import { CURATED_WEB_SOURCES, WebSearchResultItem, getGoogleBookSearchUrl } from "@/lib/resources-hub";
import { BOOK_RECOMMENDATIONS } from "@/lib/books";
import { readLimitedJson, secureApiRequest } from "@/lib/server/api-security";

export async function POST(request: Request) {
  const access = await secureApiRequest(request, "ai:source-search", { optionalAuth: true, perMinute: 60, perDay: 1000 });
  if (!access.ok) return access.response;

  // 2. Safely read and validate body
  const body = await readLimitedJson(request);
  if (!body.ok) return body.response;

  const raw = (body.data || {}) as { query?: string; category?: string };
  const query = (raw.query || "").trim();
  const category = (raw.category || "Tümü").trim();

  if (!query) {
    const filteredCurated =
      category === "Tümü"
        ? CURATED_WEB_SOURCES
        : CURATED_WEB_SOURCES.filter((c) => c.category === category);
    return NextResponse.json({ results: filteredCurated, total: filteredCurated.length });
  }

  const lowerQuery = query.toLowerCase();
  const isBookCategory = category.toLowerCase().includes("kitap") || category.toLowerCase().includes("book") || category.toLowerCase().includes("pdf");

  // 3. Concurrently search Live Web and Google PDF Books
  const [liveSettled, pdfSettled] = await Promise.allSettled([
    searchLiveWeb(query, 6),
    searchGooglePdfBooks(query, 8),
  ]);

  const liveResults: WebSearchResult[] = liveSettled.status === "fulfilled" ? liveSettled.value : [];
  const googlePdfBooks: GooglePdfBookResult[] = pdfSettled.status === "fulfilled" ? pdfSettled.value : [];

  // 4. Map Google PDF results to WebSearchResultItem format
  const mappedPdfBooks: WebSearchResultItem[] = googlePdfBooks.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    provider: b.source ? `Google PDF · ${b.source}` : "Google Kitap & PDF",
    url: b.downloadUrl,
    downloadUrl: b.downloadUrl,
    mirrorUrl: b.mirrorUrl,
    annasUrl: b.annasUrl,
    fileSize: b.size,
    fileExt: "pdf",
    year: b.year,
    category: "Kitap / PDF",
    type: "book" as const,
    description: b.snippet,
    tags: ["kitap", "pdf", b.source].filter(Boolean),
    isFree: true,
    pdfQuery: `${b.title} ${b.author}`.trim(),
    keyTakeaways: [
      "Doğrudan incelenebilir ve okunabilir açık PDF belgesi.",
      "İçeriği tek tıkla açabilir, sayfa aralığı ekleyebilir veya kitaplığına dahil edebilirsin.",
    ],
  }));

  // 5. Search local curated books
  const matchingBooks: WebSearchResultItem[] = BOOK_RECOMMENDATIONS.filter(
    (b) =>
      b.title.toLowerCase().includes(lowerQuery) ||
      b.author.toLowerCase().includes(lowerQuery) ||
      b.summary.toLowerCase().includes(lowerQuery) ||
      b.tags.some((t) => t.toLowerCase().includes(lowerQuery))
  ).map((b) => ({
    id: b.id,
    title: `${b.title} - ${b.author}`,
    author: b.author,
    provider: "Seçkin Kitap",
    url: getGoogleBookSearchUrl(`${b.title} ${b.author}`),
    downloadUrl: getGoogleBookSearchUrl(`${b.title} ${b.author}`),
    mirrorUrl: getGoogleBookSearchUrl(`${b.title} ${b.author}`),
    annasUrl: getGoogleBookSearchUrl(`${b.title} ${b.author}`),
    category: b.category,
    type: "book" as const,
    description: b.summary,
    tags: b.tags,
    isFree: false,
    pdfQuery: `${b.title} ${b.author}`,
    keyTakeaways: b.keyTakeaways,
  }));

  // 6. Search local curated web sources
  const matchingCurated = CURATED_WEB_SOURCES.filter(
    (c) =>
      c.title.toLowerCase().includes(lowerQuery) ||
      c.description.toLowerCase().includes(lowerQuery) ||
      c.tags.some((t) => t.toLowerCase().includes(lowerQuery)) ||
      c.category.toLowerCase().includes(lowerQuery)
  );

  // 7. Map live web results
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
    pdfQuery: lr.title.split(/[-–—|:]/)[0].trim(),
    annasUrl: getGoogleBookSearchUrl(lr.title.split(/[-–—|:]/)[0].trim()),
    mirrorUrl: getGoogleBookSearchUrl(lr.title.split(/[-–—|:]/)[0].trim()),
    keyTakeaways: [
      "Canlı web taramasından elde edilmiş doğrulanmış bağlantı.",
      "İçeriği inceleyip sayfa aralığı ekleyebilir veya NotebookLM'e aktarabilirsin.",
    ],
  }));

  // 8. Combine results prioritizing books if book category/search
  let combined: WebSearchResultItem[];
  if (isBookCategory) {
    combined = [...mappedPdfBooks, ...matchingBooks, ...mappedLive, ...matchingCurated];
  } else {
    combined = [...mappedLive, ...mappedPdfBooks, ...matchingCurated, ...matchingBooks];
  }

  // 9. If everything returned empty, provide relevant fuzzy fallbacks
  if (combined.length === 0) {
    const words = lowerQuery.split(/\s+/).filter((w) => w.length > 2);
    const fuzzyCurated = CURATED_WEB_SOURCES.filter((c) =>
      words.some(
        (w) =>
          c.title.toLowerCase().includes(w) ||
          c.description.toLowerCase().includes(w) ||
          c.tags.some((t) => t.toLowerCase().includes(w))
      )
    );
    const fuzzyBooks = BOOK_RECOMMENDATIONS.filter((b) =>
      words.some(
        (w) =>
          b.title.toLowerCase().includes(w) ||
          b.author.toLowerCase().includes(w) ||
          b.tags.some((t) => t.toLowerCase().includes(w))
      )
    ).map((b) => ({
      id: b.id,
      title: `${b.title} - ${b.author}`,
      author: b.author,
      provider: "Seçkin Kitap",
      url: getGoogleBookSearchUrl(`${b.title} ${b.author}`),
      downloadUrl: getGoogleBookSearchUrl(`${b.title} ${b.author}`),
      mirrorUrl: getGoogleBookSearchUrl(`${b.title} ${b.author}`),
      annasUrl: getGoogleBookSearchUrl(`${b.title} ${b.author}`),
      category: b.category,
      type: "book" as const,
      description: b.summary,
      tags: b.tags,
      isFree: false,
      pdfQuery: `${b.title} ${b.author}`,
      keyTakeaways: b.keyTakeaways,
    }));
    combined = [...fuzzyCurated, ...fuzzyBooks];
  }

  // 10. Deduplicate by URL and Title
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const uniqueResults: WebSearchResultItem[] = [];

  for (const item of combined) {
    const urlKey = (item.url || "").trim().toLowerCase();
    const titleKey = (item.title || "").trim().toLowerCase();
    if (urlKey && seenUrls.has(urlKey)) continue;
    if (titleKey && seenTitles.has(titleKey)) continue;

    if (urlKey) seenUrls.add(urlKey);
    if (titleKey) seenTitles.add(titleKey);
    uniqueResults.push(item);
  }

  return NextResponse.json({
    results: uniqueResults,
    total: uniqueResults.length,
    query,
    category,
  });
}
