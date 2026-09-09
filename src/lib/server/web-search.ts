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

    if (!response.ok) return [];

    const html = await response.text();
    const results: WebSearchResult[] = [];
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
