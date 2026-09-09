"use client";

import { NorthBook } from "./books";

export interface SavedPageRange {
  id: string;
  resourceTitle: string;
  resourceId?: string;
  sourceUrl?: string;
  startPage: number;
  endPage: number;
  topic: string;
  notes?: string;
  status: "reading" | "completed" | "important";
  createdAt: string;
}

export interface PinnedSourceDoc {
  id: string;
  title: string;
  type: "pdf" | "image" | "link";
  url: string; // Data URL (base64) or web URL
  pageNumber?: number;
  pageRange?: string;
  notes?: string;
  tags?: string[];
  pinnedAt: string;
}

export interface WebSearchResultItem {
  id: string;
  title: string;
  provider: string;
  url: string;
  category: string;
  type: "doc" | "book" | "paper" | "cheatsheet" | "lab" | "article";
  description: string;
  tags: string[];
  isFree: boolean;
  libgenQuery?: string;
  keyTakeaways?: string[];
}

export interface SourceSummaryOutput {
  title: string;
  summary: string;
  keyTakeaways: string[];
  actionSteps: string[];
  notebookLmPrompt: string;
}

const PAGE_RANGES_KEY = "north:saved_page_ranges";
const PINNED_DOCS_KEY = "north:pinned_source_docs";
const NOTEBOOKLM_URL_KEY = "north:notebooklm_workspace_url";

// ============================================================================
// 1. PAGE RANGES STORAGE
// ============================================================================

export const STARTER_PAGE_RANGES: SavedPageRange[] = [
  {
    id: "range-1",
    resourceTitle: "The Web Application Hacker's Handbook",
    startPage: 115,
    endPage: 148,
    topic: "Bölüm 5: Oturum Yönetimi & Token Güvenliği",
    notes: "Oturum sabitleme (session fixation) ve entropi analizlerini kapsıyor. Mutlaka Burp Suite ile dene.",
    status: "important",
    createdAt: new Date().toISOString().slice(0, 10),
  },
  {
    id: "range-2",
    resourceTitle: "Deep Work (Pürdikkat)",
    startPage: 45,
    endPage: 78,
    topic: "Dikkat Kalıntısı & Sığ İşlerin Zararları",
    notes: "Her sekme değişiminde prefrontal kortekste kalan dikkat tortusu üzerine bilimsel açıklamalar.",
    status: "completed",
    createdAt: new Date().toISOString().slice(0, 10),
  },
];

export function loadSavedPageRanges(): SavedPageRange[] {
  if (typeof window === "undefined") return STARTER_PAGE_RANGES;
  try {
    const raw = localStorage.getItem(PAGE_RANGES_KEY);
    if (!raw) {
      saveSavedPageRanges(STARTER_PAGE_RANGES);
      return STARTER_PAGE_RANGES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : STARTER_PAGE_RANGES;
  } catch {
    return STARTER_PAGE_RANGES;
  }
}

export function saveSavedPageRanges(ranges: SavedPageRange[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PAGE_RANGES_KEY, JSON.stringify(ranges));
  } catch {}
}

export function addSavedPageRange(item: Omit<SavedPageRange, "id" | "createdAt">): SavedPageRange {
  const current = loadSavedPageRanges();
  const newItem: SavedPageRange = {
    ...item,
    id: `range-${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  const updated = [newItem, ...current];
  saveSavedPageRanges(updated);
  return newItem;
}

export function deleteSavedPageRange(id: string): void {
  const current = loadSavedPageRanges();
  saveSavedPageRanges(current.filter((r) => r.id !== id));
}

// ============================================================================
// 2. PINNED DOCUMENTS & SCREENSHOTS
// ============================================================================

export const STARTER_PINNED_DOCS: PinnedSourceDoc[] = [
  {
    id: "pin-ad-cheatsheet",
    title: "Active Directory Saldırı Yolları & Kerberos Akış Şeması",
    type: "image",
    url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60",
    pageNumber: 1,
    pageRange: "1-2",
    notes: "TGT istemi, TGS üretimi ve PAC yetkilendirme basamaklarını gösteren referans mimari şeması.",
    tags: ["Active Directory", "Kerberos", "Mimari"],
    pinnedAt: new Date().toISOString().slice(0, 10),
  },
  {
    id: "pin-owasp-top10",
    title: "OWASP Top 10 API Security Risk Matrisi (PDF Özeti)",
    type: "link",
    url: "https://owasp.org/www-project-api-security/",
    pageNumber: 4,
    pageRange: "BOLA & BFLA",
    notes: "Broken Object Level Authorization zafiyetlerinin kod seviyesinde tespiti ve önleme mekanizmaları.",
    tags: ["OWASP", "API", "Web"],
    pinnedAt: new Date().toISOString().slice(0, 10),
  },
];

export function loadPinnedDocs(): PinnedSourceDoc[] {
  if (typeof window === "undefined") return STARTER_PINNED_DOCS;
  try {
    const raw = localStorage.getItem(PINNED_DOCS_KEY);
    if (!raw) {
      savePinnedDocs(STARTER_PINNED_DOCS);
      return STARTER_PINNED_DOCS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : STARTER_PINNED_DOCS;
  } catch {
    return STARTER_PINNED_DOCS;
  }
}

export function savePinnedDocs(docs: PinnedSourceDoc[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PINNED_DOCS_KEY, JSON.stringify(docs));
  } catch {}
}

export function addPinnedDoc(doc: Omit<PinnedSourceDoc, "id" | "pinnedAt">): PinnedSourceDoc {
  const current = loadPinnedDocs();
  const newItem: PinnedSourceDoc = {
    ...doc,
    id: `pin-${Date.now()}`,
    pinnedAt: new Date().toISOString().slice(0, 10),
  };
  const updated = [newItem, ...current];
  savePinnedDocs(updated);
  return newItem;
}

export function deletePinnedDoc(id: string): void {
  const current = loadPinnedDocs();
  savePinnedDocs(current.filter((d) => d.id !== id));
}

// ============================================================================
// 3. LIBGEN BRIDGE
// ============================================================================

export function getLibgenSearchUrl(query: string, mirror: "is" | "li" | "rs" = "is"): string {
  const clean = encodeURIComponent(query.trim());
  if (mirror === "li") {
    return `https://libgen.li/index.php?req=${clean}&columns%5B%5D=t&columns%5B%5D=a&columns%5B%5D=s&columns%5B%5D=y&columns%5B%5D=p&columns%5B%5D=i&objects%5B%5D=f&objects%5B%5D=e&objects%5B%5D=s&objects%5B%5D=a&objects%5B%5D=p&objects%5B%5D=w&topics%5B%5D=l&topics%5B%5D=c&topics%5B%5D=f&topics%5B%5D=a&topics%5B%5D=m&topics%5B%5D=r&topics%5B%5D=s&res=25`;
  }
  return `https://libgen.is/search.php?req=${clean}&lg_topic=libgen&open=0&view=simple&res=25&phrase=1&column=def`;
}

// ============================================================================
// 4. NOTEBOOKLM INTEGRATION
// ============================================================================

export function getNotebookLMSavedUrl(): string {
  if (typeof window === "undefined") return "https://notebooklm.google.com";
  try {
    return localStorage.getItem(NOTEBOOKLM_URL_KEY) || "https://notebooklm.google.com";
  } catch {
    return "https://notebooklm.google.com";
  }
}

export function setNotebookLMSavedUrl(url: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NOTEBOOKLM_URL_KEY, url.trim() || "https://notebooklm.google.com");
  } catch {}
}

export function generateNotebookLMBundle(options: {
  books?: NorthBook[];
  pageRanges?: SavedPageRange[];
  pinnedDocs?: PinnedSourceDoc[];
  customNotes?: string;
}): string {
  const { books = [], pageRanges = [], pinnedDocs = [], customNotes = "" } = options;
  const dateStr = new Date().toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const lines: string[] = [];
  lines.push(`# 📚 Planorth Çalışma & Kaynak Paketi (NotebookLM Formatı)`);
  lines.push(`*Oluşturulma Tarihi: ${dateStr}*`);
  lines.push(`*Bu dosya Google NotebookLM'e doğrudan kaynak dokümanı olarak eklenmek üzere optimize edilmiştir.*\n`);

  // Section 1: Books & Quotes
  if (books.length > 0) {
    lines.push(`## 1. Okunan Kitaplar ve Alıntılar`);
    books.forEach((book) => {
      lines.push(`### ${book.title} (${book.author})`);
      lines.push(`- **Kategori:** ${book.category}`);
      lines.push(`- **İlerleme:** Sayfa ${book.currentPage} / ${book.totalPages} (%${Math.round((book.currentPage / book.totalPages) * 100)})`);
      lines.push(`- **Durum:** ${book.status === "completed" ? "Tamamlandı" : "Okunuyor"}`);
      if (book.favoriteQuotes && book.favoriteQuotes.length > 0) {
        lines.push(`\n**Öne Çıkan Alıntılar:**`);
        book.favoriteQuotes.forEach((q) => lines.push(`> "${q}"`));
      }
      if (book.notes) {
        lines.push(`\n**Kişisel Notlar:** ${book.notes}`);
      }
      lines.push(``);
    });
  }

  // Section 2: Saved Page Ranges
  if (pageRanges.length > 0) {
    lines.push(`## 2. Odaklanılan Sayfa Aralıkları & Konu Başlıkları`);
    pageRanges.forEach((range) => {
      lines.push(`### ${range.resourceTitle} · Sayfa ${range.startPage}–${range.endPage}`);
      lines.push(`- **Konu:** ${range.topic}`);
      lines.push(`- **Öncelik:** ${range.status === "important" ? "Kritik / Önemli" : range.status === "completed" ? "Tamamlandı" : "İnceleniyor"}`);
      if (range.notes) {
        lines.push(`- **Çıkarım Notu:** ${range.notes}`);
      }
      lines.push(``);
    });
  }

  // Section 3: Pinned Documents
  if (pinnedDocs.length > 0) {
    lines.push(`## 3. Pinlenmiş Kaynaklar & Şemalar`);
    pinnedDocs.forEach((doc) => {
      lines.push(`### ${doc.title}`);
      lines.push(`- **Tür:** ${doc.type.toUpperCase()}`);
      if (doc.pageRange) lines.push(`- **Sayfa Aralığı / Bölüm:** ${doc.pageRange}`);
      if (doc.tags && doc.tags.length > 0) lines.push(`- **Etiketler:** ${doc.tags.join(", ")}`);
      if (doc.notes) lines.push(`- **Açıklama / Analiz:** ${doc.notes}`);
      lines.push(``);
    });
  }

  // Section 4: Custom Notes
  if (customNotes.trim()) {
    lines.push(`## 4. Ek Araştırma ve Çözüm Notları`);
    lines.push(customNotes.trim());
    lines.push(``);
  }

  lines.push(`---`);
  lines.push(`*Planorth Sanal Araştırma & Kaynak Merkezi tarafından üretilmiştir.*`);

  return lines.join("\n");
}

// ============================================================================
// 5. CURATED & SEARCHABLE WEB/ACADEMIC SOURCES
// ============================================================================

export const CURATED_WEB_SOURCES: WebSearchResultItem[] = [
  {
    id: "cur-portswigger-academy",
    title: "PortSwigger Web Security Academy",
    provider: "PortSwigger",
    url: "https://portswigger.net/web-security",
    category: "Siber Güvenlik",
    type: "lab",
    description: "SQL Injection, SSRF, OAuth, JWT, XSS ve Web LLM zafiyetlerini ücretsiz interaktif lablarla öğreten endüstri standardı akademi.",
    tags: ["web security", "owasp", "burp suite", "laboratuvar"],
    isFree: true,
    libgenQuery: "The Web Application Hacker's Handbook Dafydd Stuttard",
    keyTakeaways: [
      "Teorik zafiyet bilgisini doğrudan interaktif Docker benzeri lab ortamında test etme imkanı.",
      "Güncel web açıkları (API güvenliği, GraphQL, HTTP Request Smuggling) detaylı analiz edilir.",
    ],
  },
  {
    id: "cur-pay-all-things",
    title: "PayloadsAllTheThings Pentest Cheat Sheet",
    provider: "GitHub / Swissky",
    url: "https://github.com/swisskyrepo/PayloadsAllTheThings",
    category: "Siber Güvenlik",
    type: "cheatsheet",
    description: "Sızma testlerinde kullanılan komutlar, bypass teknikleri, exploit şablonları ve metodolojilerin devasa açık kaynak deposu.",
    tags: ["pentest", "cheatsheet", "payload", "bypass"],
    isFree: true,
    libgenQuery: "Penetration Testing Georgia Weidman",
    keyTakeaways: [
      "Ezber yerine her zafiyet için adım adım pratik exploit metodolojisi.",
      "Linux/Windows Privilege Escalation için test edilmiş güncel komut dizileri.",
    ],
  },
  {
    id: "cur-the-rust-book",
    title: "The Rust Programming Language (The Rust Book)",
    provider: "Rust Foundation",
    url: "https://doc.rust-lang.org/book/",
    category: "Teknoloji & Yazılım",
    type: "book",
    description: "Bellek güvenliği, sahiplik (ownership), borçlanma (borrowing) ve eşzamanlılık kavramlarını sıfırdan anlatan resmî başyapıt.",
    tags: ["rust", "memory safety", "sistem programlama", "diller"],
    isFree: true,
    libgenQuery: "The Rust Programming Language Steve Klabnik",
    keyTakeaways: [
      "Garbage collector olmadan %100 bellek güvenliği sağlayan ownership mekanizması.",
      "Düşük seviyeli sistem kodlamasında segfault ve buffer overflow risklerini derleme aşamasında önleme.",
    ],
  },
  {
    id: "cur-system-design-primer",
    title: "System Design Primer",
    provider: "GitHub / Donne Martin",
    url: "https://github.com/donnemartin/system-design-primer",
    category: "Teknoloji & Yazılım",
    type: "doc",
    description: "Büyük ölçekli dağıtık sistemler, veritabanı sharding, caching, microservices ve CAP teoremini görsel diyagramlarla anlatan kaynak.",
    tags: ["system design", "mimari", "dağıtık sistemler", "ölçeklenebilirlik"],
    isFree: true,
    libgenQuery: "Designing Data-Intensive Applications Martin Kleppmann",
    keyTakeaways: [
      "Yüksek trafikli sistemlerde dar boğazları önceden hesaplama ve kapasite planlama.",
      "Load balancing, CDN, Cache ve Replication stratejilerinin mimari mukayesesi.",
    ],
  },
  {
    id: "cur-pwn-college",
    title: "pwn.college Binary Exploitation & Reverse Engineering",
    provider: "Arizona State University",
    url: "https://pwn.college/",
    category: "Siber Güvenlik",
    type: "lab",
    description: "Assembly, shellcode enjeksiyonu, ROP chain, format string ve kernel güvenliğini interaktif dojo ortamında öğreten üniversite platformu.",
    tags: ["reverse engineering", "binary exploitation", "assembly", "pwn"],
    isFree: true,
    libgenQuery: "Practical Binary Analysis Dennis Andriesse",
    keyTakeaways: [
      "x86-64 stack ve register düzenini pratik shellcode yazarak deneyimleme.",
      "ASLR, DEP, Stack Canary gibi modern exploit engellerini aşma mantığı.",
    ],
  },
  {
    id: "cur-stoic-daily",
    title: "Daily Stoic & Stanford Felsefe Ansiklopedisi (Stoacılık)",
    provider: "Stanford Encyclopedia of Philosophy",
    url: "https://plato.stanford.edu/entries/stoicism/",
    category: "Bilim & Felsefe",
    type: "article",
    description: "Kontrol çemberi (Dichotomy of Control), zihinsel dayanıklılık ve modern hayatta sarsılmaz bir dinginlik inşa etme rehberi.",
    tags: ["stoacılık", "felsefe", "zihinsel dayanıklılık", "odak"],
    isFree: true,
    libgenQuery: "Meditations Marcus Aurelius",
    keyTakeaways: [
      "Kontrol edemediğin dış faktörler için kaygılanmayı bırak; enerjini yalnızca tepkine odakla.",
      "Amor Fati: Karşına çıkan zorlukları bir engel değil, karakterini bileyen bir fırsat olarak kucakla.",
    ],
  },
  {
    id: "cur-anthropic-prompt-eng",
    title: "Anthropic & OpenAI Interactive Prompt Engineering Interactive Guide",
    provider: "Anthropic / OpenAI",
    url: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview",
    category: "Teknoloji & Yazılım",
    type: "doc",
    description: "LLM modellerinden deterministik, yüksek kaliteli ve halüsinasyonsuz çıktılar almak için chain-of-thought ve few-shot teknikleri.",
    tags: ["ai", "prompt engineering", "llm", "yapay zeka"],
    isFree: true,
    libgenQuery: "Prompt Engineering for Generative AI",
    keyTakeaways: [
      "Chain-of-thought (düşünce zinciri) prompting ile karmaşık mantıksal görevlerde başarıyı 3 katına çıkarma.",
      "XML etiketleri ve katı JSON şemalarıyla deterministik API entegrasyonu kurma.",
    ],
  },
];
