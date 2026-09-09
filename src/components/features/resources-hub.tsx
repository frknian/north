"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  ExternalLink,
  Sparkles,
  Bookmark,
  Pin,
  FileText,
  Copy,
  Download,
  Check,
  Plus,
  Trash2,
  Maximize2,
  BookMarked,
  Layers,
  ArrowRight,
  Filter,
  Eye,
  FileCode,
  Compass,
  FileQuestion,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  NorthBook,
  loadBooks,
  saveBooks,
  addBook,
  updateBook,
  deleteBook,
  BOOK_RECOMMENDATIONS,
  BOOK_CATEGORIES,
  BOOK_GOAL_MOODS,
  filterRecommendations,
  type BookRecommendation,
} from "@/lib/books";
import {
  SavedPageRange,
  PinnedSourceDoc,
  WebSearchResultItem,
  SourceSummaryOutput,
  loadSavedPageRanges,
  addSavedPageRange,
  deleteSavedPageRange,
  loadPinnedDocs,
  addPinnedDoc,
  deletePinnedDoc,
  getNotebookLMSavedUrl,
  setNotebookLMSavedUrl,
  generateNotebookLMBundle,
  getLibgenSearchUrl,
  CURATED_WEB_SOURCES,
} from "@/lib/resources-hub";
import { cn } from "@/lib/utils";

export function ResourcesHub() {
  // Main Tab State
  const [activeTab, setActiveTab] = useState<"books" | "web" | "ranges_pins" | "notebooklm">("books");

  // Books State
  const [books, setBooks] = useState<NorthBook[]>([]);
  const [bookFilter, setBookFilter] = useState<"all" | "reading" | "completed" | "want_to_read">("all");
  const [recCategory, setRecCategory] = useState<string>("Tümü");
  const [recMood, setRecMood] = useState<string>("Tümü");
  const [recLength, setRecLength] = useState<"all" | "short" | "medium" | "long">("all");
  const [recQuery, setRecQuery] = useState<string>("");

  // Web & Academic Search State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchCategory, setSearchCategory] = useState<string>("Tümü");
  const [searchResults, setSearchResults] = useState<WebSearchResultItem[]>(CURATED_WEB_SOURCES);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [libgenInput, setLibgenInput] = useState<string>("");

  // Page Ranges & Pinned Docs State
  const [pageRanges, setPageRanges] = useState<SavedPageRange[]>([]);
  const [pinnedDocs, setPinnedDocs] = useState<PinnedSourceDoc[]>([]);

  // Modals & Dialogs
  const [addBookModalOpen, setAddBookModalOpen] = useState(false);
  const [addRangeModalOpen, setAddRangeModalOpen] = useState(false);
  const [addPinModalOpen, setAddPinModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [lightboxDoc, setLightboxDoc] = useState<PinnedSourceDoc | null>(null);

  // Forms
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [newBookCategory, setNewBookCategory] = useState("Siber Güvenlik");
  const [newBookPages, setNewBookPages] = useState("300");

  const [rangeBookTitle, setRangeBookTitle] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [rangeTopic, setRangeTopic] = useState("");
  const [rangeNotes, setRangeNotes] = useState("");
  const [rangeStatus, setRangeStatus] = useState<"reading" | "completed" | "important">("important");

  const [pinTitle, setPinTitle] = useState("");
  const [pinType, setPinType] = useState<"image" | "pdf" | "link">("image");
  const [pinUrl, setPinUrl] = useState("");
  const [pinPage, setPinPage] = useState("");
  const [pinNotes, setPinNotes] = useState("");
  const [pinTags, setPinTags] = useState("");

  // NotebookLM & AI Summarizer
  const [notebookLmUrl, setNotebookLmUrlState] = useState("https://notebooklm.google.com");
  const [summaryInputTitle, setSummaryInputTitle] = useState("");
  const [summaryInputContent, setSummaryInputContent] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryOutput, setSummaryOutput] = useState<SourceSummaryOutput | null>(null);
  const [copiedBundle, setCopiedBundle] = useState(false);

  // Load initial data
  useEffect(() => {
    setBooks(loadBooks());
    setPageRanges(loadSavedPageRanges());
    setPinnedDocs(loadPinnedDocs());
    setNotebookLmUrlState(getNotebookLMSavedUrl());
  }, []);

  // Filter recommendations
  const filteredRecs = useMemo(() => {
    return filterRecommendations({
      category: recCategory,
      goalMood: recMood,
      length: recLength,
      query: recQuery,
    });
  }, [recCategory, recMood, recLength, recQuery]);

  // Handle Web Search
  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSearchLoading(true);
    try {
      const res = await fetch("/api/ai/source-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, category: searchCategory }),
      });
      const data = await res.json();
      if (data.results) {
        setSearchResults(data.results);
      }
    } catch {
      toast.error("Arama servisi şu an meşgul. Yerel doğrulanmış kaynaklar listeleniyor.");
    } finally {
      setSearchLoading(false);
    }
  }

  // Handle AI Summary Generation
  async function handleGenerateSummary(targetTitle?: string, targetContent?: string) {
    const title = targetTitle || summaryInputTitle || "Kaynak";
    const content = targetContent || summaryInputContent || "";
    setSummaryLoading(true);
    setSummaryModalOpen(true);
    try {
      const res = await fetch("/api/ai/source-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      setSummaryOutput(data);
    } catch {
      toast.error("Özet oluşturulurken bir hata oluştu.");
    } finally {
      setSummaryLoading(false);
    }
  }

  // Handle Add Book
  function handleAddBookSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newBookTitle.trim() || !newBookAuthor.trim()) {
      toast.error("Lütfen kitap adı ve yazarını yazın.");
      return;
    }
    const created = addBook({
      title: newBookTitle.trim(),
      author: newBookAuthor.trim(),
      category: newBookCategory,
      totalPages: Math.max(1, Number(newBookPages) || 250),
      currentPage: 0,
      status: "reading",
    });
    setBooks(loadBooks());
    setAddBookModalOpen(false);
    setNewBookTitle("");
    setNewBookAuthor("");
    toast.success(`"${created.title}" kitaplığına eklendi.`);
  }

  // Handle Add Page Range
  function handleAddRangeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rangeBookTitle.trim() || !rangeTopic.trim()) {
      toast.error("Lütfen kaynak adı ve konu başlığı girin.");
      return;
    }
    const start = Math.max(1, Number(rangeStart) || 1);
    const end = Math.max(start, Number(rangeEnd) || start);

    const added = addSavedPageRange({
      resourceTitle: rangeBookTitle.trim(),
      startPage: start,
      endPage: end,
      topic: rangeTopic.trim(),
      notes: rangeNotes.trim() || undefined,
      status: rangeStatus,
    });
    setPageRanges(loadSavedPageRanges());
    setAddRangeModalOpen(false);
    setRangeBookTitle("");
    setRangeStart("");
    setRangeEnd("");
    setRangeTopic("");
    setRangeNotes("");
    toast.success(`Sayfa ${added.startPage}–${added.endPage} aralığı kaydedildi.`);
  }

  // Handle Add Pinned Doc
  function handleAddPinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pinTitle.trim() || !pinUrl.trim()) {
      toast.error("Lütfen başlık ve görsel/doküman URL'si veya dosyası seçin.");
      return;
    }
    const tags = pinTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const added = addPinnedDoc({
      title: pinTitle.trim(),
      type: pinType,
      url: pinUrl.trim(),
      pageNumber: pinPage ? Number(pinPage) : undefined,
      notes: pinNotes.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });
    setPinnedDocs(loadPinnedDocs());
    setAddPinModalOpen(false);
    setPinTitle("");
    setPinUrl("");
    setPinPage("");
    setPinNotes("");
    setPinTags("");
    toast.success(`"${added.title}" panoya pinlendi.`);
  }

  // Copy NotebookLM bundle
  function handleCopyNotebookBundle() {
    const bundle = generateNotebookLMBundle({
      books,
      pageRanges,
      pinnedDocs,
    });
    void navigator.clipboard.writeText(bundle);
    setCopiedBundle(true);
    setTimeout(() => setCopiedBundle(false), 2500);
    toast.success("NotebookLM çalışma paketi panoya kopyalandı! NotebookLM'de kaynak olarak ekleyebilirsin.");
  }

  // Download NotebookLM bundle file
  function handleDownloadNotebookBundle() {
    const bundle = generateNotebookLMBundle({
      books,
      pageRanges,
      pinnedDocs,
    });
    const blob = new Blob([bundle], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `planorth-notebooklm-bundle-${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("NotebookLM Markdown dosyası indirildi.");
  }

  return (
    <div className="page-content space-y-6 pb-20">
      {/* 1. TOP HEADER & QUICK ACTION BAR */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-indigo-500/10 text-indigo-500">
              <BookOpen className="size-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Kaynaklar &amp; Sanal Araştırma Merkezi
            </h1>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Kitaplar, canlı web araştırması, Libgen akademik köprüsü, sayfa aralıkları, pinli PDF/şemalar ve Google NotebookLM entegrasyonu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Direct NotebookLM launcher */}
          <a
            href={notebookLmUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-500/15 transition-colors"
          >
            <Sparkles className="size-3.5" />
            <span>NotebookLM Çalışma Alanı</span>
            <ExternalLink className="size-3" />
          </a>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyNotebookBundle}
            className="rounded-xl text-xs h-8"
            title="NotebookLM için tek tıkla kaynak paketi kopyala"
          >
            {copiedBundle ? <Check className="mr-1 size-3.5 text-emerald-500" /> : <Copy className="mr-1 size-3.5" />}
            {copiedBundle ? "Kopyalandı" : "NotebookLM Paketi"}
          </Button>

          <Button
            size="sm"
            onClick={() => setAddBookModalOpen(true)}
            className="rounded-xl text-xs h-8 shadow-xs"
          >
            <Plus className="mr-1 size-3.5" />
            Kitap Ekle
          </Button>
        </div>
      </header>

      {/* 2. NAVIGATION TABS (4 RICH TABS) */}
      <div className="flex rounded-2xl border border-border/70 bg-muted/30 p-1 text-xs gap-1 overflow-x-auto focus-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("books")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-all shrink-0",
            activeTab === "books"
              ? "bg-background text-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BookMarked className="size-3.5 text-indigo-500" />
          <span>Kitaplık &amp; Okuma</span>
          <span className="rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.2 text-[10px] font-mono">
            {books.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("web")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-all shrink-0",
            activeTab === "web"
              ? "bg-background text-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Compass className="size-3.5 text-emerald-500" />
          <span>Web &amp; Libgen Arama</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ranges_pins")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-all shrink-0",
            activeTab === "ranges_pins"
              ? "bg-background text-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Pin className="size-3.5 text-amber-500" />
          <span>Pinli Belgeler &amp; Sayfa Aralıkları</span>
          <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 text-[10px] font-mono">
            {pageRanges.length + pinnedDocs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("notebooklm")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-all shrink-0",
            activeTab === "notebooklm"
              ? "bg-background text-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="size-3.5 text-sky-500" />
          <span>NotebookLM &amp; AI Özetleyici</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: KİTAPLIK & OKUMA (INTEGRATED BOOKS SYSTEM)                     */}
      {/* ===================================================================== */}
      {activeTab === "books" && (
        <div className="space-y-6">
          {/* Books Shelf Section */}
          <div className="rounded-3xl border bg-card/60 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
              <div>
                <h2 className="text-base font-bold text-foreground">Okuma Rafım</h2>
                <p className="text-xs text-muted-foreground">Aktif okuma seansları, sayfa ilerlemeleri ve alıntılar.</p>
              </div>

              <div className="flex items-center gap-1.5">
                {(["all", "reading", "want_to_read", "completed"] as const).map((filterVal) => (
                  <button
                    key={filterVal}
                    type="button"
                    onClick={() => setBookFilter(filterVal)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                      bookFilter === filterVal
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {filterVal === "all"
                      ? "Tümü"
                      : filterVal === "reading"
                      ? "Okunuyor"
                      : filterVal === "want_to_read"
                      ? "Okunacak"
                      : "Tamamlandı"}
                  </button>
                ))}
              </div>
            </div>

            {/* Book Cards Grid */}
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {books
                .filter((b) => (bookFilter === "all" ? true : b.status === bookFilter))
                .map((book) => {
                  const percent = Math.min(100, Math.round((book.currentPage / book.totalPages) * 100));
                  return (
                    <div
                      key={book.id}
                      className="group flex flex-col justify-between rounded-2xl border bg-background/80 p-4 transition-all hover:border-indigo-500/40 hover:shadow-xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 text-[10px] font-semibold">
                            {book.category}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                              book.status === "completed"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : book.status === "reading"
                                ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                : "border-border bg-muted/40 text-muted-foreground"
                            )}
                          >
                            {book.status === "completed"
                              ? "Tamamlandı"
                              : book.status === "reading"
                              ? "Okunuyor"
                              : "Okunacak"}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-bold text-foreground text-sm leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {book.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{book.author}</p>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                            <span>
                              Sayfa <strong>{book.currentPage}</strong> / {book.totalPages}
                            </span>
                            <span>%{percent}</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                            <div
                              className="h-full bg-indigo-500 transition-all rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        {book.favoriteQuotes && book.favoriteQuotes.length > 0 && (
                          <p className="text-[11px] italic text-muted-foreground line-clamp-2 border-l-2 border-indigo-500/40 pl-2 mt-2">
                            &ldquo;{book.favoriteQuotes[0]}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-1.5">
                        <Button asChild size="sm" className="rounded-xl text-xs h-7 px-2.5">
                          <Link href={`/focus/reading?bookId=${book.id}&minutes=30`}>
                            <BookOpen className="mr-1 size-3" />
                            Oku
                          </Link>
                        </Button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setRangeBookTitle(book.title);
                              setRangeStart(String(book.currentPage || 1));
                              setRangeEnd(String(Math.min(book.totalPages, (book.currentPage || 1) + 30)));
                              setAddRangeModalOpen(true);
                            }}
                            className="rounded-lg border bg-muted/30 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                            title="Sayfa aralığı kaydet"
                          >
                            <Bookmark className="size-3.5" />
                          </button>

                          <a
                            href={getLibgenSearchUrl(`${book.title} ${book.author}`)}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border bg-muted/30 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                            title="Libgen'de Ara"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleGenerateSummary(book.title, `Yazar: ${book.author}\nKategori: ${book.category}\nAlıntılar: ${(book.favoriteQuotes || []).join(" · ")}`)}
                            className="rounded-lg border bg-muted/30 p-1.5 text-muted-foreground hover:text-indigo-500 hover:bg-muted"
                            title="AI Özeti Çıkar"
                          >
                            <Sparkles className="size-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              deleteBook(book.id);
                              setBooks(loadBooks());
                              toast.info(`"${book.title}" kitaplıktan kaldırıldı.`);
                            }}
                            className="rounded-lg border bg-muted/30 p-1.5 text-muted-foreground hover:text-red-500 hover:bg-muted"
                            title="Sil"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Curated Recommendations Section */}
          <div className="rounded-3xl border bg-card/60 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
              <div>
                <h2 className="text-base font-bold text-foreground">Tavsiye Kitaplık &amp; Filtreleme</h2>
                <p className="text-xs text-muted-foreground">
                  Siber güvenlik, yazılım mimarisi, derin odak, felsefe ve psikoloji alanında küratör onaylı 14 başyapıt.
                </p>
              </div>

              {/* Search Bar for Recs */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={recQuery}
                  onChange={(e) => setRecQuery(e.target.value)}
                  placeholder="Tavsiyelerde ara..."
                  className="w-full rounded-xl border border-border bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 focus-scrollbar">
                {BOOK_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setRecCategory(cat)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors shrink-0",
                      recCategory === cat
                        ? "bg-indigo-500 text-white font-semibold"
                        : "bg-muted/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <select
                  value={recMood}
                  onChange={(e) => setRecMood(e.target.value)}
                  className="h-7 rounded-lg border bg-background px-2 text-xs text-muted-foreground"
                >
                  {BOOK_GOAL_MOODS.map((m) => (
                    <option key={m} value={m}>
                      {m === "Tümü" ? "Tüm Hedef Modları" : m}
                    </option>
                  ))}
                </select>

                <select
                  value={recLength}
                  onChange={(e) => setRecLength(e.target.value as any)}
                  className="h-7 rounded-lg border bg-background px-2 text-xs text-muted-foreground"
                >
                  <option value="all">Tüm Sayfalar</option>
                  <option value="short">Kısa (&lt;200 sf)</option>
                  <option value="medium">Orta (200-400 sf)</option>
                  <option value="long">Kapsamlı (400+ sf)</option>
                </select>
              </div>
            </div>

            {/* Recommendation Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRecs.map((rec) => {
                const alreadyInBooks = books.some((b) => b.title.toLowerCase() === rec.title.toLowerCase());
                return (
                  <div
                    key={rec.id}
                    className="flex flex-col justify-between rounded-2xl border bg-background/80 p-4 space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-0.5">
                          {rec.category}
                        </span>
                        <span className="font-mono text-muted-foreground">{rec.totalPages} sayfa</span>
                      </div>

                      <div>
                        <h3 className="font-bold text-foreground text-sm">{rec.title}</h3>
                        <p className="text-xs text-muted-foreground">{rec.author}</p>
                      </div>

                      <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-3">
                        {rec.summary}
                      </p>

                      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-2 text-[10px] space-y-1">
                        <span className="font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          Neden Okumalısın?
                        </span>
                        <p className="text-muted-foreground leading-snug line-clamp-2">{rec.whyRead}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-1.5">
                      {alreadyInBooks ? (
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="size-3" />
                          Kitaplığında Var
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            addBook({
                              title: rec.title,
                              author: rec.author,
                              category: rec.category,
                              totalPages: rec.totalPages,
                              currentPage: 0,
                              status: "reading",
                            });
                            setBooks(loadBooks());
                            toast.success(`"${rec.title}" kitaplığına eklendi!`);
                          }}
                          className="rounded-xl text-xs h-7 px-2.5"
                        >
                          <Plus className="mr-1 size-3" />
                          Listeme Ekle
                        </Button>
                      )}

                      <div className="flex items-center gap-1">
                        <a
                          href={getLibgenSearchUrl(`${rec.title} ${rec.author}`)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border bg-muted/30 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Libgen'de Ara"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleGenerateSummary(rec.title, `${rec.summary}\n\nNeden Okunmalı: ${rec.whyRead}\n\nÇıkarımlar: ${rec.keyTakeaways.join(" · ")}`)}
                          className="rounded-lg border bg-muted/30 p-1.5 text-muted-foreground hover:text-indigo-500 hover:bg-muted"
                          title="AI Özeti Çıkar"
                        >
                          <Sparkles className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: WEB & LIBGEN ARAMA (LIVE WEB SEARCH & LIBGEN MIRROR CONNECTOR) */}
      {/* ===================================================================== */}
      {activeTab === "web" && (
        <div className="space-y-6">
          {/* Web Search Bar & Libgen Quick Bridge Card */}
          <div className="rounded-3xl border bg-card/60 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-foreground">Canlı Web &amp; Dokümantasyon Arama</h2>
              <p className="text-xs text-muted-foreground">
                Siber güvenlik, Linux, mimari, sistem tasarımı veya zihin modellerinde güvenilir kaynak ve makale ara.
              </p>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Örn: Active Directory Privilege Escalation, Rust Memory Safety, Deep Work..."
                  className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
              <Button type="submit" disabled={searchLoading} className="rounded-xl text-xs px-4 h-9">
                {searchLoading ? "Aranıyor..." : "Web'de Ara"}
              </Button>
            </form>

            {/* Quick Topic Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <span className="text-[11px] font-semibold text-muted-foreground">Önerilen Başlıklar:</span>
              {[
                "Active Directory Pentesting",
                "Rust Memory Safety",
                "OWASP Top 10 API",
                "System Design Primer",
                "Stoic Focus & Resiliency",
                "Burp Suite Web Academy",
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setSearchQuery(chip);
                    setSearchLoading(true);
                    fetch("/api/ai/source-search", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ query: chip }),
                    })
                      .then((r) => r.json())
                      .then((d) => setSearchResults(d.results || []))
                      .finally(() => setSearchLoading(false));
                  }}
                  className="rounded-lg border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Libgen Direct Search Bar */}
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 mt-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-lg bg-indigo-500/10 text-indigo-500">
                    <BookOpen className="size-3.5" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Libgen (Library Genesis) Akademik Köprüsü</h3>
                    <p className="text-[10px] text-muted-foreground">Kitap, makale ve bilimsel araştırmaları anında tara.</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px]">Ayna 1: libgen.is · Ayna 2: libgen.li</Badge>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={libgenInput}
                  onChange={(e) => setLibgenInput(e.target.value)}
                  placeholder="Kitap başlığı, yazar adı veya ISBN yaz..."
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden"
                />
                <a
                  href={getLibgenSearchUrl(libgenInput || "Cyber Security", "is")}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
                >
                  <span>Libgen.is</span>
                  <ExternalLink className="size-3" />
                </a>
                <a
                  href={getLibgenSearchUrl(libgenInput || "Cyber Security", "li")}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-xl border border-indigo-500/30 bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  <span>Libgen.li</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Search Results Grid */}
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {searchResults.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border bg-card/70 p-4 space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5">
                      {item.type.toUpperCase()}
                    </span>
                    <span className="text-muted-foreground truncate max-w-[120px]">{item.provider}</span>
                  </div>

                  <h3 className="font-bold text-foreground text-sm leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {item.description}
                  </p>

                  {item.keyTakeaways && item.keyTakeaways.length > 0 && (
                    <div className="rounded-xl border bg-muted/30 p-2 text-[10px] space-y-1">
                      <span className="font-semibold text-foreground">Önemli Noktalar:</span>
                      <ul className="text-muted-foreground list-disc list-inside space-y-0.5">
                        {item.keyTakeaways.slice(0, 2).map((takeaway, idx) => (
                          <li key={idx} className="line-clamp-1">{takeaway}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-1.5">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-xl bg-primary/10 text-primary px-3 py-1 text-xs font-semibold hover:bg-primary/20 transition-colors"
                  >
                    <span>Aç</span>
                    <ExternalLink className="size-3" />
                  </a>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setRangeBookTitle(item.title);
                        setRangeTopic("Önemli Bölüm");
                        setRangeStart("1");
                        setRangeEnd("30");
                        setAddRangeModalOpen(true);
                      }}
                      className="rounded-lg border bg-muted/30 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                      title="Sayfa aralığı kaydet"
                    >
                      <Bookmark className="size-3.5" />
                    </button>

                    <a
                      href={getLibgenSearchUrl(item.libgenQuery || item.title)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border bg-muted/30 p-1.5 text-muted-foreground hover:text-indigo-500 hover:bg-muted"
                      title="Libgen'de Ara"
                    >
                      <BookOpen className="size-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleGenerateSummary(item.title, `${item.description}\n\nKaynak: ${item.url}`)}
                      className="rounded-lg border bg-muted/30 p-1.5 text-muted-foreground hover:text-amber-500 hover:bg-muted"
                      title="AI Özeti Çıkar"
                    >
                      <Sparkles className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: PİNLİ BELGELER & SAYFA ARALIKLARI                             */}
      {/* ===================================================================== */}
      {activeTab === "ranges_pins" && (
        <div className="space-y-6">
          {/* Section A: Saved Page Ranges */}
          <div className="rounded-3xl border bg-card/60 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
              <div>
                <h2 className="text-base font-bold text-foreground">Kayıtlı Sayfa Aralıkları</h2>
                <p className="text-xs text-muted-foreground">
                  Okuduğun kitap veya dokümanlardan odaklanmak istediğin özel sayfa aralıkları.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => setAddRangeModalOpen(true)}
                className="rounded-xl text-xs h-8"
              >
                <Plus className="mr-1 size-3.5" />
                Sayfa Aralığı Kaydet
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pageRanges.map((range) => (
                <div
                  key={range.id}
                  className="flex flex-col justify-between rounded-2xl border bg-background/80 p-4 space-y-2.5"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 font-mono">
                        Sayfa {range.startPage} – {range.endPage} ({range.endPage - range.startPage + 1} sf)
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[9px] font-semibold border",
                          range.status === "important"
                            ? "border-red-500/30 bg-red-500/10 text-red-500"
                            : range.status === "completed"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                            : "border-border bg-muted/40 text-muted-foreground"
                        )}
                      >
                        {range.status === "important" ? "Önemli" : range.status === "completed" ? "Tamamlandı" : "İnceleniyor"}
                      </span>
                    </div>

                    <h3 className="font-bold text-foreground text-sm leading-snug">{range.topic}</h3>
                    <p className="text-xs text-muted-foreground font-medium">{range.resourceTitle}</p>

                    {range.notes && (
                      <p className="text-[11px] text-muted-foreground italic bg-muted/20 p-2 rounded-xl">
                        &ldquo;{range.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                    <Button asChild size="sm" variant="outline" className="rounded-xl text-xs h-7 px-2">
                      <Link href={`/focus/reading?title=${encodeURIComponent(range.resourceTitle)}&rangeId=${range.id}&goal=${encodeURIComponent(`Sayfa ${range.startPage}-${range.endPage}: ${range.topic}`)}&minutes=35`}>
                        <BookOpen className="mr-1 size-3" />
                        Bu Sayfalarla Odaklan
                      </Link>
                    </Button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleGenerateSummary(range.resourceTitle, `Konu: ${range.topic}\nSayfa Aralığı: ${range.startPage}-${range.endPage}\nNotlar: ${range.notes || ""}`)}
                        className="rounded-lg border bg-muted/30 p-1.5 text-muted-foreground hover:text-indigo-500 hover:bg-muted"
                        title="AI Özeti Çıkar"
                      >
                        <Sparkles className="size-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          deleteSavedPageRange(range.id);
                          setPageRanges(loadSavedPageRanges());
                          toast.info("Sayfa aralığı silindi.");
                        }}
                        className="rounded-lg border bg-muted/30 p-1.5 text-muted-foreground hover:text-red-500 hover:bg-muted"
                        title="Sil"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Pinned Documents & Visual Pinboard */}
          <div className="rounded-3xl border bg-card/60 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
              <div>
                <h2 className="text-base font-bold text-foreground">Pinli Belgeler, PDF &amp; Sayfa Ekran Görüntüleri</h2>
                <p className="text-xs text-muted-foreground">
                  Mimari şemalar, cheat sheetler veya defter fotoğraflarını görsel panoda sakla.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => setAddPinModalOpen(true)}
                className="rounded-xl text-xs h-8"
              >
                <Plus className="mr-1 size-3.5" />
                Görsel / PDF Pinle
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pinnedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="group flex flex-col justify-between rounded-2xl border bg-background/80 overflow-hidden transition-all hover:border-sky-500/40 hover:shadow-xs"
                >
                  {/* Thumbnail / Image preview */}
                  <div
                    onClick={() => setLightboxDoc(doc)}
                    className="relative h-44 w-full cursor-pointer overflow-hidden bg-muted/40 border-b flex items-center justify-center"
                  >
                    {doc.type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={doc.url}
                        alt={doc.title}
                        className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
                        <FileText className="size-10 text-sky-500" />
                        <span className="text-xs font-semibold text-foreground">{doc.title}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">PDF / Web Bağlantısı</span>
                      </div>
                    )}
                    <span className="absolute top-2 right-2 rounded-lg bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1">
                      <Maximize2 className="size-3" />
                      İncele
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold px-2 py-0.5">
                        {doc.type.toUpperCase()}
                      </span>
                      {doc.pageNumber && (
                        <span className="font-mono text-muted-foreground">Sayfa {doc.pageNumber}</span>
                      )}
                    </div>

                    <h3 className="font-bold text-foreground text-sm leading-snug">{doc.title}</h3>

                    {doc.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {doc.notes}
                      </p>
                    )}

                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {doc.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-muted/60 px-1.5 py-0.2 text-[9px] font-medium text-muted-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="p-3 pt-0 flex items-center justify-between border-t border-border/30 mt-auto gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleGenerateSummary(doc.title, `Notlar: ${doc.notes || ""}\nEtiketler: ${(doc.tags || []).join(", ")}`)}
                        className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="size-3" />
                        AI Özeti
                      </button>
                      <Link
                        href={`/focus/free?title=${encodeURIComponent(doc.title)}&pinnedDocId=${doc.id}&goal=${encodeURIComponent(`Belge İnceleme: ${doc.title}`)}&minutes=30`}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <BookOpen className="size-3" />
                        Odakta İncele
                      </Link>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        deletePinnedDoc(doc.id);
                        setPinnedDocs(loadPinnedDocs());
                        toast.info(`"${doc.title}" panodan kaldırıldı.`);
                      }}
                      className="text-muted-foreground hover:text-red-500 p-1"
                      title="Sil"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: NOTEBOOKLM & AI ÖZETLEYİCİ                                    */}
      {/* ===================================================================== */}
      {activeTab === "notebooklm" && (
        <div className="space-y-6">
          {/* NotebookLM Workspace Integration Card */}
          <div className="rounded-3xl border bg-card/60 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-xl bg-sky-500/10 text-sky-500">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-foreground">Google NotebookLM Bağlantısı</h2>
                  <p className="text-xs text-muted-foreground">
                    Tüm kitapların, alıntıların ve sayfa aralıkların için NotebookLM kaynak paketi üret.
                  </p>
                </div>
              </div>

              <a
                href={notebookLmUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 text-white px-3.5 py-1.5 text-xs font-semibold hover:bg-sky-500 transition-colors"
              >
                <span>NotebookLM&apos;i Aç</span>
                <ExternalLink className="size-3.5" />
              </a>
            </div>

            {/* Custom Workspace URL Input */}
            <div className="rounded-2xl border bg-background/80 p-4 space-y-2">
              <label className="block text-xs font-semibold text-foreground">
                Özel NotebookLM Not Defteri URL&apos;si
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={notebookLmUrl}
                  onChange={(e) => {
                    setNotebookLmUrlState(e.target.value);
                    setNotebookLMSavedUrl(e.target.value);
                  }}
                  placeholder="https://notebooklm.google.com/notebook/your-id"
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-sky-500 focus:outline-hidden"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => toast.success("NotebookLM URL'si kaydedildi.")}
                  className="rounded-xl text-xs"
                >
                  Kaydet
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Google NotebookLM&apos;de oluşturduğun not defterinin linkini buraya yapıştırarak tek tıkla doğrudan içine girebilirsin.
              </p>
            </div>

            {/* Bundle Actions */}
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-foreground">Hazır NotebookLM Çalışma Paketi</h3>
                  <p className="text-[11px] text-muted-foreground">
                    {books.length} kitap, {pageRanges.length} sayfa aralığı ve {pinnedDocs.length} pinli kaynak tek belgede birleştirildi.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyNotebookBundle}
                    className="rounded-xl text-xs h-8"
                  >
                    {copiedBundle ? <Check className="mr-1 size-3.5 text-emerald-500" /> : <Copy className="mr-1 size-3.5" />}
                    Panoya Kopyala
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDownloadNotebookBundle}
                    className="rounded-xl text-xs h-8 shadow-xs"
                  >
                    <Download className="mr-1 size-3.5" />
                    Markdown (.md) İndir
                  </Button>
                </div>
              </div>

              {/* Guided steps */}
              <div className="grid gap-2 sm:grid-cols-3 pt-2 text-xs">
                <div className="rounded-xl border bg-background/60 p-2.5 space-y-1">
                  <span className="font-bold text-sky-600 dark:text-sky-400 font-mono">1. Adım</span>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Yukarıdaki butona tıklayarak paketi kopyala veya .md dosyasını indir.
                  </p>
                </div>
                <div className="rounded-xl border bg-background/60 p-2.5 space-y-1">
                  <span className="font-bold text-sky-600 dark:text-sky-400 font-mono">2. Adım</span>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    NotebookLM&apos;e git ve &ldquo;Add Source (Kaynak Ekle)&rdquo; &gt; &ldquo;Copied Text / File&rdquo; seçeneğini seç.
                  </p>
                </div>
                <div className="rounded-xl border bg-background/60 p-2.5 space-y-1">
                  <span className="font-bold text-sky-600 dark:text-sky-400 font-mono">3. Adım</span>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    NotebookLM&apos;in Audio Overview (Sesli Podcast) ve soru-cevap gücünü kullan!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Instant AI Resource Summarizer Card */}
          <div className="rounded-3xl border bg-card/60 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="space-y-1 border-b border-border/40 pb-3">
              <h2 className="text-base font-bold text-foreground">Anlık AI Kaynak Özetleyici</h2>
              <p className="text-xs text-muted-foreground">
                Herhangi bir kaynak veya kitap içeriğini yapıştır; ana fikirleri, pratik adımları ve NotebookLM sorularını anında çıkar.
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={summaryInputTitle}
                onChange={(e) => setSummaryInputTitle(e.target.value)}
                placeholder="Kaynak Başlığı (Örn: Active Directory Kerberoasting Savunma Rehberi)"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden"
              />

              <textarea
                value={summaryInputContent}
                onChange={(e) => setSummaryInputContent(e.target.value)}
                placeholder="Özetlemek istediğin metin, notlar veya kaynak linkini buraya yapıştır..."
                className="w-full h-32 rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden resize-none"
              />

              <Button
                onClick={() => handleGenerateSummary()}
                disabled={summaryLoading}
                className="rounded-xl text-xs px-4"
              >
                <Sparkles className="mr-1.5 size-3.5" />
                {summaryLoading ? "Özet Çıkarılıyor..." : "AI ile Yönetici Özeti Çıkar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: YENİ KİTAP EKLE                                              */}
      {/* ===================================================================== */}
      <Dialog open={addBookModalOpen} onOpenChange={setAddBookModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Yeni Kitap Ekle</DialogTitle>
            <DialogDescription className="text-xs">
              Okuma hedeflerine yeni bir kitap ekle ve okuma seanslarını başlat.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddBookSubmit} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Kitap Adı</label>
              <input
                type="text"
                value={newBookTitle}
                onChange={(e) => setNewBookTitle(e.target.value)}
                placeholder="Örn: Designing Data-Intensive Applications"
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Yazar</label>
              <input
                type="text"
                value={newBookAuthor}
                onChange={(e) => setNewBookAuthor(e.target.value)}
                placeholder="Örn: Martin Kleppmann"
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Kategori</label>
                <select
                  value={newBookCategory}
                  onChange={(e) => setNewBookCategory(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden"
                >
                  <option value="Siber Güvenlik">Siber Güvenlik</option>
                  <option value="Teknoloji & Yazılım">Teknoloji &amp; Yazılım</option>
                  <option value="Alışkanlık & Zihin">Alışkanlık &amp; Zihin</option>
                  <option value="Bilim & Felsefe">Bilim &amp; Felsefe</option>
                  <option value="Psikoloji & Zihin">Psikoloji</option>
                  <option value="Edebiyat & Klasikler">Edebiyat</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Toplam Sayfa</label>
                <input
                  type="number"
                  value={newBookPages}
                  onChange={(e) => setNewBookPages(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setAddBookModalOpen(false)}>
                İptal
              </Button>
              <Button type="submit" size="sm" className="rounded-xl">
                Kitaplığıma Ekle
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* MODAL 2: SAYFA ARALIĞI KAYDET                                         */}
      {/* ===================================================================== */}
      <Dialog open={addRangeModalOpen} onOpenChange={setAddRangeModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Sayfa Aralığı Kaydet</DialogTitle>
            <DialogDescription className="text-xs">
              Kitap veya dokümandan odaklanmak istediğin özel sayfaları kaydet.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddRangeSubmit} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Kaynak / Kitap Adı</label>
              <input
                type="text"
                value={rangeBookTitle}
                onChange={(e) => setRangeBookTitle(e.target.value)}
                placeholder="Örn: The Web Application Hacker's Handbook"
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Başlangıç Sayfası</label>
                <input
                  type="number"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  placeholder="115"
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Bitiş Sayfası</label>
                <input
                  type="number"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  placeholder="148"
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Konu / Bölüm Başlığı</label>
              <input
                type="text"
                value={rangeTopic}
                onChange={(e) => setRangeTopic(e.target.value)}
                placeholder="Örn: Bölüm 5: Token Güvenliği ve Entropi Analizi"
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Önem / Durum</label>
              <select
                value={rangeStatus}
                onChange={(e) => setRangeStatus(e.target.value as any)}
                className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden"
              >
                <option value="important">Kritik / Öncelikli</option>
                <option value="reading">Okunuyor / İnceleniyor</option>
                <option value="completed">Tamamlandı</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Notlar / Neden Önemli?</label>
              <textarea
                value={rangeNotes}
                onChange={(e) => setRangeNotes(e.target.value)}
                placeholder="Bu sayfalardaki hangi kavramı projene uygulayacaksın?"
                className="w-full h-20 rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:outline-hidden resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setAddRangeModalOpen(false)}>
                İptal
              </Button>
              <Button type="submit" size="sm" className="rounded-xl">
                Aralığı Kaydet
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* MODAL 3: GÖRSEL / PDF PİNLE                                           */}
      {/* ===================================================================== */}
      <Dialog open={addPinModalOpen} onOpenChange={setAddPinModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Görsel / PDF Şeması Pinle</DialogTitle>
            <DialogDescription className="text-xs">
              Masaüstünden ekran alıntısı, mimari şema veya PDF bağlantısı ekle.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddPinSubmit} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Doküman Başlığı</label>
              <input
                type="text"
                value={pinTitle}
                onChange={(e) => setPinTitle(e.target.value)}
                placeholder="Örn: Active Directory Kerberos Akış Şeması"
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Tür</label>
                <select
                  value={pinType}
                  onChange={(e) => setPinType(e.target.value as any)}
                  className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden"
                >
                  <option value="image">Görsel / Ekran Alıntısı</option>
                  <option value="pdf">PDF Dokümanı</option>
                  <option value="link">Web Kaynağı</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Sayfa Numarası</label>
                <input
                  type="number"
                  value={pinPage}
                  onChange={(e) => setPinPage(e.target.value)}
                  placeholder="Örn: 14"
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Görsel Dosyası veya URL</label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error("Dosya boyutu 5MB'dan küçük olmalıdır.");
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => setPinUrl(reader.result as string);
                    reader.readAsDataURL(file);
                    if (!pinTitle) setPinTitle(file.name.replace(/\.[^/.]+$/, ""));
                  }}
                  className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground file:mr-2 file:rounded-lg file:border-0 file:bg-primary/10 file:px-2 file:py-0.5 file:text-xs file:font-semibold file:text-primary"
                />
                <input
                  type="text"
                  value={pinUrl}
                  onChange={(e) => setPinUrl(e.target.value)}
                  placeholder="Veya web görsel/PDF URL'si yapıştır..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Not / Çıkarım</label>
              <textarea
                value={pinNotes}
                onChange={(e) => setPinNotes(e.target.value)}
                placeholder="Bu şemadan veya sayfadan aldığın kilit çıkarım..."
                className="w-full h-16 rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:outline-hidden resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Etiketler (Virgülle ayır)</label>
              <input
                type="text"
                value={pinTags}
                onChange={(e) => setPinTags(e.target.value)}
                placeholder="Kerberos, Mimari, Windows"
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-hidden"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setAddPinModalOpen(false)}>
                İptal
              </Button>
              <Button type="submit" size="sm" className="rounded-xl">
                Panoya Pinle
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* MODAL 4: AI KAYNAK ÖZETİ LIGHTBOX / DETAY                             */}
      {/* ===================================================================== */}
      <Dialog open={summaryModalOpen} onOpenChange={setSummaryModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90dvh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-indigo-500/10 text-indigo-500">
                <Sparkles className="size-4" />
              </span>
              <DialogTitle className="text-base font-bold">
                {summaryOutput?.title || "AI Kaynak Özeti"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              North AI tarafından çıkarılmış yönetici özeti ve NotebookLM soruları.
            </DialogDescription>
          </DialogHeader>

          {summaryLoading ? (
            <div className="py-12 text-center space-y-2">
              <Sparkles className="size-8 text-indigo-500 animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground">Kaynak analiz ediliyor ve çıkarımlar derleniyor...</p>
            </div>
          ) : summaryOutput ? (
            <div className="space-y-4 pt-2">
              {/* Core summary */}
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Temel Fikir &amp; Bağlam
                </span>
                <p className="text-xs leading-relaxed text-foreground">{summaryOutput.summary}</p>
              </div>

              {/* Key Takeaways */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-foreground">Kritik Çıkarımlar</h4>
                <div className="space-y-1.5">
                  {summaryOutput.keyTakeaways.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 rounded-xl border bg-background p-2.5 text-xs text-muted-foreground">
                      <span className="grid size-4 place-items-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action steps */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-foreground">Eyleme Dönük Adımlar</h4>
                <div className="space-y-1.5">
                  {summaryOutput.actionSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 rounded-xl border bg-muted/20 p-2.5 text-xs text-foreground">
                      <Check className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* NotebookLM Question */}
              <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  NotebookLM İçin Önerilen Araştırma Sorusu
                </span>
                <p className="text-xs italic text-foreground">&ldquo;{summaryOutput.notebookLmPrompt}&rdquo;</p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const text = `# ${summaryOutput.title}\n\n## Özet\n${summaryOutput.summary}\n\n## Çıkarımlar\n${summaryOutput.keyTakeaways.map((k) => `- ${k}`).join("\n")}\n\n## Eylemler\n${summaryOutput.actionSteps.map((a) => `- ${a}`).join("\n")}`;
                    void navigator.clipboard.writeText(text);
                    toast.success("Özet panoya kopyalandı!");
                  }}
                  className="rounded-xl text-xs"
                >
                  <Copy className="mr-1 size-3" />
                  Özeti Kopyala
                </Button>
                <Button size="sm" onClick={() => setSummaryModalOpen(false)} className="rounded-xl text-xs">
                  Tamam
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* MODAL 5: GÖRSEL LIGHTBOX                                              */}
      {/* ===================================================================== */}
      {lightboxDoc && (
        <Dialog open={!!lightboxDoc} onOpenChange={() => setLightboxDoc(null)}>
          <DialogContent className="max-w-4xl max-h-[95dvh] overflow-y-auto rounded-3xl p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">{lightboxDoc.title}</DialogTitle>
              {lightboxDoc.notes && (
                <DialogDescription className="text-xs">{lightboxDoc.notes}</DialogDescription>
              )}
            </DialogHeader>

            <div className="mt-3 flex items-center justify-center rounded-2xl overflow-hidden bg-black/80 p-2">
              {lightboxDoc.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={lightboxDoc.url}
                  alt={lightboxDoc.title}
                  className="max-h-[70dvh] w-auto object-contain rounded-xl"
                />
              ) : (
                <div className="p-8 text-center text-white space-y-2">
                  <FileText className="size-16 text-sky-400 mx-auto" />
                  <p className="text-sm font-semibold">{lightboxDoc.title}</p>
                  <a
                    href={lightboxDoc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-sky-400 underline"
                  >
                    <span>Belgeyi Yeni Sekmede Aç</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
