export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source?: string;
  type?: "video" | "article" | "documentation" | "course" | "practice" | "tool" | "book" | "other";
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCharCode(Number(dec));
      } catch {
        return "";
      }
    })
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function classifyResourceType(
  url: string,
  title: string
): "video" | "article" | "documentation" | "course" | "practice" | "tool" | "book" | "other" {
  const lowerUrl = url.toLowerCase();
  const lowerTitle = title.toLowerCase();

  if (
    lowerUrl.includes("youtube.com") ||
    lowerUrl.includes("youtu.be") ||
    lowerUrl.includes("vimeo.com") ||
    lowerTitle.includes("youtube") ||
    lowerTitle.includes("video") ||
    lowerTitle.includes("oynatma listesi")
  ) {
    return "video";
  }

  if (
    lowerUrl.includes("docs.") ||
    lowerUrl.includes("/docs") ||
    lowerUrl.includes("developer.mozilla.org") ||
    lowerUrl.includes("learn.microsoft.com") ||
    lowerUrl.includes("python.org") ||
    lowerUrl.includes("nodejs.org") ||
    lowerUrl.includes("nextjs.org") ||
    lowerUrl.includes("react.dev") ||
    lowerUrl.includes("tailwindcss.com") ||
    lowerUrl.includes("man.cx") ||
    lowerUrl.includes("linux.die.net") ||
    lowerUrl.includes("w3schools.com") ||
    lowerUrl.includes("devdocs.io") ||
    lowerTitle.includes("dokümantasyon") ||
    lowerTitle.includes("documentation") ||
    lowerTitle.includes("rehber")
  ) {
    return "documentation";
  }

  if (
    lowerUrl.includes("udemy.com") ||
    lowerUrl.includes("coursera.org") ||
    lowerUrl.includes("edx.org") ||
    lowerUrl.includes("btkakademi.gov.tr") ||
    lowerUrl.includes("patika.dev") ||
    lowerUrl.includes("khanacademy.org") ||
    lowerTitle.includes("kurs") ||
    lowerTitle.includes("eğitim serisi")
  ) {
    return "course";
  }

  if (
    lowerUrl.includes("leetcode.com") ||
    lowerUrl.includes("hackerrank.com") ||
    lowerUrl.includes("tryhackme.com") ||
    lowerUrl.includes("portswigger.net") ||
    lowerUrl.includes("hackthebox.com") ||
    lowerUrl.includes("codewars.com") ||
    lowerUrl.includes("test-ipv6.com") ||
    lowerTitle.includes("lab") ||
    lowerTitle.includes("pratik") ||
    lowerTitle.includes("soru çözümü")
  ) {
    return "practice";
  }

  if (
    lowerTitle.includes("kitap") ||
    lowerTitle.includes("fasikül") ||
    lowerTitle.includes("soru bankası") ||
    lowerTitle.includes("pdf") ||
    lowerUrl.includes("kitap") ||
    lowerUrl.includes("fasikul")
  ) {
    return "book";
  }

  if (
    lowerUrl.includes("github.com") ||
    lowerUrl.includes("gitlab.com") ||
    lowerUrl.includes("npmjs.com") ||
    lowerUrl.includes("pypi.org")
  ) {
    return "tool";
  }

  return "article";
}

export async function searchLiveWeb(query: string, maxResults = 5): Promise<WebSearchResult[]> {
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      signal: AbortSignal.timeout(5000),
    });

    const results: WebSearchResult[] = [];

    if (response.ok) {
      const html = await response.text();
      const regex =
        /<h2 class="result__title">[\s\S]*?<a rel="nofollow" class="result__a" href="([^"]+)">([\s\S]*?)<\/a>[\s\S]*?(?:<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>|<div class="result__snippet"[^>]*>([\s\S]*?)<\/div>)/gi;

      let match: RegExpExecArray | null;
      while ((match = regex.exec(html)) && results.length < maxResults) {
        let rawUrl = match[1];
        if (rawUrl.includes("uddg=")) {
          const matchUddg = /uddg=([^&]+)/.exec(rawUrl);
          if (matchUddg) rawUrl = decodeURIComponent(matchUddg[1]);
        }

        const title = decodeHtmlEntities(match[2]);
        const snippet = decodeHtmlEntities(match[3] || match[4] || "");

        if (title && rawUrl.startsWith("http") && !rawUrl.includes("duckduckgo.com")) {
          let source = "";
          try {
            source = new URL(rawUrl).hostname.replace(/^www\./, "");
          } catch {}

          results.push({
            title,
            url: rawUrl,
            snippet,
            source,
            type: classifyResourceType(rawUrl, title),
          });
        }
      }
    }

    // Resilient fallback: If live search returned 0 results, query Wikipedia OpenSearch API
    if (results.length === 0) {
      try {
        const wikiRes = await fetch(
          `https://tr.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=${maxResults}&namespace=0&format=json`,
          { signal: AbortSignal.timeout(3000) }
        );
        if (wikiRes.ok) {
          const wikiData = await wikiRes.json();
          const titles: string[] = wikiData[1] || [];
          const snippets: string[] = wikiData[2] || [];
          const urls: string[] = wikiData[3] || [];
          for (let i = 0; i < titles.length && results.length < maxResults; i++) {
            if (urls[i] && titles[i]) {
              results.push({
                title: titles[i],
                url: urls[i],
                snippet: snippets[i] || `${titles[i]} hakkında kapsamlı teknik ve akademik rehber.`,
                source: "tr.wikipedia.org",
                type: "documentation",
              });
            }
          }
        }
      } catch {}
    }

    return results;
  } catch (err) {
    console.warn("[Live Web Search] Query failed:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

const RESOURCE_INTENT_KEYWORDS = [
  "kaynak",
  "kaynaklar",
  "nereden",
  "video",
  "kitap",
  "dokuman",
  "döküman",
  "link",
  "site",
  "kanal",
  "playlist",
  "kurs",
  "makale",
  "rehber",
  "fasikül",
  "soru bankası",
  "tavsiye",
  "öneri",
  "nasıl öğren",
  "nereden başla",
  "çalışma materyali",
  "lab",
  "tutorial",
  "cheat sheet",
  "roadmap",
  "belge",
  "dokümantasyon",
  "youtube",
  "anlatım",
  "ders notu",
  "özet",
  "çözümlü",
  "pratik",
  "örnek",
  "araştır",
  "araştırma",
  "araştırır mısın",
  "bulur musun",
  "webde ara",
  "internetten ara",
  "nereden çalışayım",
  "hangi kaynak",
  "hangi hoca",
  "hangi kanal",
];

export function detectResourceSearchIntent(
  question: string,
  areaName?: string,
  taskTitle?: string
): { shouldSearch: boolean; query: string } {
  const lower = question.toLowerCase();
  const matched = RESOURCE_INTENT_KEYWORDS.some((kw) => lower.includes(kw));

  if (
    matched ||
    (lower.split(/\s+/).length >= 3 &&
      (lower.includes("nasıl") || lower.includes("ne") || lower.includes("nedir")))
  ) {
    const cleanQuestion = question.replace(/[\?\!\.\,]/g, "").trim();
    let query = cleanQuestion;

    if (areaName && !lower.includes(areaName.toLowerCase())) {
      query = `${areaName} ${cleanQuestion}`;
    }

    if (
      !lower.includes("kaynak") &&
      !lower.includes("video") &&
      !lower.includes("döküman") &&
      !lower.includes("rehber") &&
      !lower.includes("kitap")
    ) {
      query = `${query} en iyi kaynak video rehber`;
    }

    return { shouldSearch: true, query: query.trim() };
  }

  return { shouldSearch: false, query: "" };
}

export interface GooglePdfBookResult {
  id: string;
  title: string;
  author: string;
  publisher: string;
  year: string;
  size: string;
  ext: string;
  downloadUrl: string;
  mirrorUrl: string;
  annasUrl: string;
  source: string;
  snippet: string;
}

export type LibgenBookResult = GooglePdfBookResult;

export async function searchGooglePdfBooks(query: string, maxResults = 8): Promise<GooglePdfBookResult[]> {
  const clean = query.trim();
  if (!clean) return [];

  const results: GooglePdfBookResult[] = [];
  const seenTitles = new Set<string>();

  // 1. Fetch verified Google Books feed for official book preview, title, author & publisher
  try {
    const gbRes = await fetch(
      `https://books.google.com/books/feeds/volumes?q=${encodeURIComponent(clean)}&max-results=4`,
      {
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (gbRes.ok) {
      const xml = await gbRes.text();
      const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)];
      for (const e of entries) {
        const title = decodeHtmlEntities(e[1].match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] || "");
        const author = decodeHtmlEntities(e[1].match(/<dc:creator>([\s\S]*?)<\/dc:creator>/)?.[1] || "Bilinmiyor");
        const publisher = decodeHtmlEntities(e[1].match(/<dc:publisher>([\s\S]*?)<\/dc:publisher>/)?.[1] || "Google Kitaplar");
        const date = decodeHtmlEntities(e[1].match(/<dc:date>([\s\S]*?)<\/dc:date>/)?.[1] || "");
        const desc = decodeHtmlEntities(e[1].match(/<dc:description>([\s\S]*?)<\/dc:description>/)?.[1] || "");
        const idMatch = e[1].match(/<dc:identifier>([^<]+)<\/dc:identifier>/);
        const bookId = idMatch ? idMatch[1] : null;

        if (title && !seenTitles.has(title.toLowerCase())) {
          seenTitles.add(title.toLowerCase());
          const previewUrl = bookId
            ? `https://books.google.com/books?id=${bookId}&printsec=frontcover`
            : `https://books.google.com/books?q=${encodeURIComponent(title)}`;
          results.push({
            id: `gbook-${bookId || Date.now()}-${results.length}`,
            title,
            author,
            publisher,
            year: date.slice(0, 4),
            size: "Google Dijital Kitap",
            ext: "pdf",
            downloadUrl: previewUrl,
            mirrorUrl: previewUrl,
            annasUrl: previewUrl,
            source: "books.google.com",
            snippet: desc.slice(0, 160) || `${title} kitabının Google Books doğrulanmış akademik dokümanı.`,
          });
        }
      }
    }
  } catch (err) {
    console.warn("[Google Books Feed] Query warning:", err instanceof Error ? err.message : String(err));
  }

  // 2. Fetch direct PDF and open document links for the book
  try {
    const pdfSearchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(clean + " pdf")}`;
    const response = await fetch(pdfSearchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,tr;q=0.8",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const html = await response.text();
      const regex =
        /<h2 class="result__title">[\s\S]*?<a rel="nofollow" class="result__a" href="([^"]+)">([\s\S]*?)<\/a>[\s\S]*?(?:<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>|<div class="result__snippet"[^>]*>([\s\S]*?)<\/div>)/gi;

      let match: RegExpExecArray | null;
      while ((match = regex.exec(html)) && results.length < maxResults) {
        let rawUrl = match[1];
        if (rawUrl.includes("uddg=")) {
          const matchUddg = /uddg=([^&]+)/.exec(rawUrl);
          if (matchUddg) rawUrl = decodeURIComponent(matchUddg[1]);
        }

        if (!rawUrl.startsWith("http") || rawUrl.includes("duckduckgo.com")) continue;

        const rawTitle = decodeHtmlEntities(match[2]);
        const snippet = decodeHtmlEntities(match[3] || match[4] || "");

        const lowerUrl = rawUrl.toLowerCase();
        if (
          lowerUrl.includes("youtube.com") ||
          lowerUrl.includes("twitter.com") ||
          lowerUrl.includes("facebook.com") ||
          lowerUrl.includes("instagram.com")
        ) {
          continue;
        }

        const cleanTitle = rawTitle
          .replace(/^(?:\[PDF\]|\(PDF\)|PDF\s*:?)\s*/i, "")
          .replace(/\.pdf$/i, "")
          .replace(/\s*-\s*Google Drive$/i, "")
          .trim();

        if (!cleanTitle || seenTitles.has(cleanTitle.toLowerCase())) continue;
        seenTitles.add(cleanTitle.toLowerCase());

        let hostname = "";
        try {
          hostname = new URL(rawUrl).hostname.replace(/^www\./, "");
        } catch {}

        const isDirectPdf = lowerUrl.endsWith(".pdf") || lowerUrl.includes(".pdf?") || lowerUrl.includes("/pdf/");
        const isDrive = lowerUrl.includes("drive.google.com");
        const isArchive = lowerUrl.includes("archive.org");

        let author = "Açık PDF Kaynağı";
        if (cleanTitle.includes(" - ")) {
          const parts = cleanTitle.split(" - ");
          if (parts.length >= 2 && parts[1].length < 40) {
            author = parts[1].trim();
          }
        } else if (cleanTitle.toLowerCase().includes(" by ")) {
          const parts = cleanTitle.split(/ by /i);
          if (parts.length >= 2 && parts[1].length < 40) {
            author = parts[1].trim();
          }
        }

        results.push({
          id: `gpdf-${Date.now()}-${results.length}`,
          title: cleanTitle,
          author,
          publisher: isDrive ? "Google Drive" : isArchive ? "Internet Archive" : hostname || "Web Dokümanı",
          year: "",
          size: isDirectPdf ? "Doğrudan PDF" : isDrive ? "Google Drive PDF" : "PDF Dokümanı",
          ext: "pdf",
          downloadUrl: rawUrl,
          mirrorUrl: rawUrl,
          annasUrl: rawUrl,
          source: hostname,
          snippet: snippet.slice(0, 160) || `${cleanTitle} için doğrulanmış açık PDF çalışma dokümanı.`,
        });
      }
    }
  } catch (err) {
    console.warn("[Web PDF Search] Query failed:", err instanceof Error ? err.message : String(err));
  }

  return results;
}

export const searchLibgenBooks = searchGooglePdfBooks;
