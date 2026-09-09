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

export interface LibgenBookResult {
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
}

export async function searchLibgenBooks(query: string, maxResults = 6): Promise<LibgenBookResult[]> {
  const clean = query.trim();
  if (!clean) return [];

  // Multi-mirror fallback: try libgen.li first, then libgen.bz if network error or timeout
  const mirrors = ["libgen.li", "libgen.bz"];
  let html = "";

  for (const mirrorHost of mirrors) {
    try {
      const searchUrl = `https://${mirrorHost}/index.php?req=${encodeURIComponent(clean)}&columns%5B%5D=t&columns%5B%5D=a&columns%5B%5D=s&res=${Math.max(maxResults * 2, 10)}`;
      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const text = await response.text();
        if (text.includes("edition.php?id=")) {
          html = text;
          break;
        }
      }
    } catch {
      // Mirror failed or timed out, gracefully continue to next
    }
  }

  if (!html) return [];

  try {
    const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
    const books: LibgenBookResult[] = [];

    for (const row of rows) {
      const rowHtml = row[1];
      if (rowHtml.includes("<th")) continue;

      const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1]);
      if (cells.length < 8) continue;

      const firstCell = cells[0];
      const titleMatch = /href="edition\.php\?id=([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(firstCell);
      if (!titleMatch) continue;

      const editionId = titleMatch[1];
      const rawTitle = titleMatch[2].replace(/<[^>]+>/g, "").trim();
      if (!rawTitle) continue;

      const author = cells[1].replace(/<[^>]+>/g, "").trim();
      const publisher = cells[2].replace(/<[^>]+>/g, "").trim();
      const year = cells[3].replace(/<[^>]+>/g, "").trim();
      const size = cells[6].replace(/<[^>]+>/g, "").trim();
      const ext = cells[7].replace(/<[^>]+>/g, "").trim().toLowerCase();

      const md5Match = /md5=([a-f0-9]{32})/i.exec(cells[8] || "");
      const md5 = md5Match ? md5Match[1] : null;

      // Use clean direct CDN endpoint (/get.php) to avoid adblocker ERR_BLOCKED_BY_CLIENT on ads.php
      const downloadUrl = md5
        ? `https://libgen.li/get.php?md5=${md5}`
        : `https://libgen.li/edition.php?id=${editionId}`;

      // Backup mirror using libgen.bz (unblocked by ISPs)
      const mirrorUrl = `https://libgen.bz/edition.php?id=${editionId}`;
      const annasUrl = `https://books.google.com/books?q=${encodeURIComponent(rawTitle)}`;

      books.push({
        id: `libgen-${editionId}`,
        title: rawTitle,
        author: author || "Bilinmiyor",
        publisher: publisher || "Akademik / Açık Kaynak",
        year: year || "",
        size: size || "",
        ext: ext || "pdf",
        downloadUrl,
        mirrorUrl,
        annasUrl,
      });

      if (books.length >= maxResults) break;
    }

    return books;
  } catch (err) {
    console.warn("[Libgen Search] Parser failed:", err instanceof Error ? err.message : String(err));
    return [];
  }
}
