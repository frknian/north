"use client";

import {
  useState,
  useEffect,
  useMemo,
} from "react";
import {
} from "lucide-react";
import {
  toast,
} from "sonner";
import {
  authenticatedAiFetch,
} from "@/lib/ai/client";
import {
  NorthBook,
  loadBooks,
  addBook,
  updateBook,
  BOOK_RECOMMENDATIONS,
  filterRecommendations,
} from "@/lib/books";
import {
  SavedPageRange,
  PinnedSourceDoc,
  WebSearchResultItem,
  SourceSummaryOutput,
  loadSavedPageRanges,
  addSavedPageRange,
  loadPinnedDocs,
  addPinnedDoc,
  getNotebookLMSavedUrl,
  generateNotebookLMBundle,
  getGoogleBookSearchUrl,
  CURATED_WEB_SOURCES,
} from "@/lib/resources-hub";

export function useResourcesHub() {
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
  const [googleBookInput, setGoogleBookInput] = useState<string>("");

  // In-System Google PDF Search State
  const [shelfPdfQuery, setShelfPdfQuery] = useState<string>("");
  const [shelfPdfResults, setShelfPdfResults] = useState<WebSearchResultItem[]>([]);
  const [shelfPdfLoading, setShelfPdfLoading] = useState<boolean>(false);
  const [activePdfSearchTitle, setActivePdfSearchTitle] = useState<string>("");

  // Page Ranges & Pinned Docs State
  const [pageRanges, setPageRanges] = useState<SavedPageRange[]>([]);
  const [pinnedDocs, setPinnedDocs] = useState<PinnedSourceDoc[]>([]);

  // Modals & Dialogs
  const [addBookModalOpen, setAddBookModalOpen] = useState(false);
  const [updatePageModalOpen, setUpdatePageModalOpen] = useState(false);
  const [targetBookToUpdate, setTargetBookToUpdate] = useState<NorthBook | null>(null);
  const [updateCurrentPage, setUpdateCurrentPage] = useState<number>(0);
  const [updateTotalPages, setUpdateTotalPages] = useState<number>(100);
  const [updateBookStatus, setUpdateBookStatus] = useState<"reading" | "completed" | "want_to_read">("reading");
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

  // Safe API POST helper that sends Firebase token if logged in, otherwise falls back to standard fetch
  async function apiPost(path: string, body: unknown) {
    try {
      return await authenticatedAiFetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      return await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
  }

  // Handle Web & Resource Search
  async function handleSearch(e?: React.FormEvent, overrideQuery?: string, overrideCategory?: string) {
    if (e) e.preventDefault();
    const queryToSearch = (overrideQuery !== undefined ? overrideQuery : searchQuery).trim();
    const catToSearch = (overrideCategory !== undefined ? overrideCategory : searchCategory).trim();
    if (!queryToSearch) {
      toast.info("Lütfen aramak istediğin konuyu veya anahtar kelimeyi yaz.");
      return;
    }

    setSearchLoading(true);
    try {
      const res = await apiPost("/api/ai/source-search", {
        query: queryToSearch,
        category: catToSearch,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.results)) {
        setSearchResults(data.results);
      } else {
        const lowerQ = queryToSearch.toLowerCase();
        const localBooks = BOOK_RECOMMENDATIONS.filter(
          (b) =>
            b.title.toLowerCase().includes(lowerQ) ||
            b.author.toLowerCase().includes(lowerQ) ||
            b.summary.toLowerCase().includes(lowerQ)
        ).map((b) => ({
          id: b.id,
          title: `${b.title} - ${b.author}`,
          author: b.author,
          provider: "Google Books",
          url: getGoogleBookSearchUrl(`${b.title} ${b.author}`),
          downloadUrl: getGoogleBookSearchUrl(`${b.title} ${b.author}`),
          category: b.category,
          type: "book" as const,
          fileExt: "pdf",
          description: b.summary,
          tags: b.tags,
          isFree: true,
          pdfQuery: `${b.title} ${b.author}`,
          keyTakeaways: b.keyTakeaways,
        }));
        const localCurated = CURATED_WEB_SOURCES.filter(
          (c) =>
            c.title.toLowerCase().includes(lowerQ) ||
            c.description.toLowerCase().includes(lowerQ)
        );
        const fallbacks = [...localBooks, ...localCurated];
        setSearchResults(fallbacks);
        if (!res.ok && fallbacks.length === 0) {
          toast.error(data.error || "Arama tamamlanamadı. Lütfen tekrar deneyin.");
        }
      }
    } catch {
      toast.error("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
    } finally {
      setSearchLoading(false);
    }
  }

  // Handle Dedicated Google Book / PDF Search
  async function handleGoogleBookSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const q = (googleBookInput || "").trim();
    if (!q) {
      toast.info("Lütfen aramak istediğiniz kitap, yazar adı veya konuyu yazın.");
      return;
    }
    setSearchQuery(q);
    setSearchCategory("Kitap");
    await handleSearch(undefined, q, "Kitap");
  }

  // Handle In-System Google PDF Search for Specific Book or Query
  async function handleGooglePdfSearch(targetQuery: string, sourceTitle?: string) {
    const q = targetQuery.trim();
    if (!q) {
      toast.info("Lütfen aramak istediğiniz kitap adını veya konuyu yazın.");
      return;
    }
    setShelfPdfLoading(true);
    setActivePdfSearchTitle(sourceTitle || q);
    setShelfPdfQuery(q);
    try {
      const res = await apiPost("/api/ai/source-search", {
        query: q,
        category: "Kitap",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.results) && data.results.length > 0) {
        setShelfPdfResults(data.results);
        toast.success(`"${sourceTitle || q}" için ${data.results.length} doğrulanmış kaynak bulundu.`);
      } else {
        const lowerQ = q.toLowerCase();
        const localBooks = BOOK_RECOMMENDATIONS.filter(
          (b) =>
            b.title.toLowerCase().includes(lowerQ) ||
            b.author.toLowerCase().includes(lowerQ) ||
            b.summary.toLowerCase().includes(lowerQ)
        ).map((b) => ({
          id: `shelf-rec-${b.id}`,
          title: `${b.title} - ${b.author}`,
          author: b.author,
          provider: "Google Books",
          url: getGoogleBookSearchUrl(`${b.title} ${b.author}`),
          downloadUrl: getGoogleBookSearchUrl(`${b.title} ${b.author}`),
          category: b.category,
          type: "book" as const,
          fileExt: "pdf",
          description: b.summary,
          tags: b.tags,
          isFree: true,
          pdfQuery: `${b.title} ${b.author}`,
          keyTakeaways: b.keyTakeaways,
        }));
        if (localBooks.length > 0) {
          setShelfPdfResults(localBooks);
          toast.success(`"${sourceTitle || q}" için doğrulanmış kitap sonuçları listelendi.`);
        } else {
          setShelfPdfResults([]);
          toast.info(`"${q}" için doğrudan PDF bulunamadı.`);
        }
      }
    } catch {
      toast.error("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
    } finally {
      setShelfPdfLoading(false);
    }
  }

  // Handle AI Summary Generation
  async function handleGenerateSummary(targetTitle?: string, targetContent?: string) {
    const title = targetTitle || summaryInputTitle || "Kaynak";
    const content = targetContent || summaryInputContent || "";
    setSummaryLoading(true);
    setSummaryModalOpen(true);
    try {
      const res = await apiPost("/api/ai/source-summary", { title, content });
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

  // Handle Open & Save Page Count Update
  function handleOpenPageUpdate(book: NorthBook) {
    setTargetBookToUpdate(book);
    setUpdateCurrentPage(book.currentPage || 0);
    setUpdateTotalPages(book.totalPages || 100);
    setUpdateBookStatus(book.status);
    setUpdatePageModalOpen(true);
  }

  function handleSavePageUpdate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!targetBookToUpdate) return;
    const total = Math.max(1, updateTotalPages || 1);
    const current = Math.min(total, Math.max(0, updateCurrentPage || 0));
    const isCompleted = current >= total;
    const finalStatus = isCompleted ? "completed" : updateBookStatus;

    updateBook(targetBookToUpdate.id, {
      currentPage: current,
      totalPages: total,
      status: finalStatus,
      finishedAt: isCompleted ? (targetBookToUpdate.finishedAt || new Date().toISOString().slice(0, 10)) : undefined,
    });

    setBooks(loadBooks());
    setUpdatePageModalOpen(false);
    toast.success(`"${targetBookToUpdate.title}" sayfa sayısı güncellendi: Sayfa ${current} / ${total}`);
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


  return {
    activeTab,
    setActiveTab,
    books,
    setBooks,
    bookFilter,
    setBookFilter,
    recCategory,
    setRecCategory,
    recMood,
    setRecMood,
    recLength,
    setRecLength,
    recQuery,
    setRecQuery,
    searchQuery,
    setSearchQuery,
    searchCategory,
    setSearchCategory,
    searchResults,
    setSearchResults,
    searchLoading,
    setSearchLoading,
    googleBookInput,
    setGoogleBookInput,
    shelfPdfQuery,
    setShelfPdfQuery,
    shelfPdfResults,
    setShelfPdfResults,
    shelfPdfLoading,
    setShelfPdfLoading,
    activePdfSearchTitle,
    setActivePdfSearchTitle,
    pageRanges,
    setPageRanges,
    pinnedDocs,
    setPinnedDocs,
    addBookModalOpen,
    setAddBookModalOpen,
    updatePageModalOpen,
    setUpdatePageModalOpen,
    targetBookToUpdate,
    setTargetBookToUpdate,
    updateCurrentPage,
    setUpdateCurrentPage,
    updateTotalPages,
    setUpdateTotalPages,
    updateBookStatus,
    setUpdateBookStatus,
    addRangeModalOpen,
    setAddRangeModalOpen,
    addPinModalOpen,
    setAddPinModalOpen,
    summaryModalOpen,
    setSummaryModalOpen,
    lightboxDoc,
    setLightboxDoc,
    newBookTitle,
    setNewBookTitle,
    newBookAuthor,
    setNewBookAuthor,
    newBookCategory,
    setNewBookCategory,
    newBookPages,
    setNewBookPages,
    rangeBookTitle,
    setRangeBookTitle,
    rangeStart,
    setRangeStart,
    rangeEnd,
    setRangeEnd,
    rangeTopic,
    setRangeTopic,
    rangeNotes,
    setRangeNotes,
    rangeStatus,
    setRangeStatus,
    pinTitle,
    setPinTitle,
    pinType,
    setPinType,
    pinUrl,
    setPinUrl,
    pinPage,
    setPinPage,
    pinNotes,
    setPinNotes,
    pinTags,
    setPinTags,
    notebookLmUrl,
    setNotebookLmUrlState,
    summaryInputTitle,
    setSummaryInputTitle,
    summaryInputContent,
    setSummaryInputContent,
    summaryLoading,
    setSummaryLoading,
    summaryOutput,
    setSummaryOutput,
    copiedBundle,
    setCopiedBundle,
    filteredRecs,
    apiPost,
    handleSearch,
    handleGoogleBookSearch,
    handleGooglePdfSearch,
    handleGenerateSummary,
    handleAddBookSubmit,
    handleOpenPageUpdate,
    handleSavePageUpdate,
    handleAddRangeSubmit,
    handleAddPinSubmit,
    handleCopyNotebookBundle,
    handleDownloadNotebookBundle,
  };
}

export type ResourcesHubCtx = ReturnType<typeof useResourcesHub>;
