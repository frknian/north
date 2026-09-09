"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  Bookmark,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Layers,
  Maximize2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { authenticatedAiFetch } from "@/lib/ai/client";
import {
  loadSavedPageRanges,
  updateSavedPageRange,
  addSavedPageRange,
  deleteSavedPageRange,
  loadStarterPageRanges,
  loadPinnedDocs,
  addPinnedDoc,
  deletePinnedDoc,
  loadStarterPinnedDocs,
  getNotebookLMSavedUrl,
  setNotebookLMSavedUrl,
  generateSessionNotebookLMSnippet,
  generateNotebookLMBundle,
  type SavedPageRange,
  type PinnedSourceDoc,
  type WebSearchResultItem,
} from "@/lib/resources-hub";
import { loadBooks, type NorthBook } from "@/lib/books";
import { type NorthTask, type Area } from "@/lib/north";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ============================================================================
// 1. IN-COCKPIT RESOURCES DOCK (For Column 3 Lower Half)
// ============================================================================

interface FocusResourcesDockProps {
  task?: NorthTask;
  area?: Area | any;
  guidance?: {
    summary: string;
    resources: Array<{ title: string; url: string; badge: string }>;
  } | null;
  isReadingMode?: boolean;
  activeBook?: NorthBook;
  activeRange?: SavedPageRange | null;
  onSelectRange?: (range: SavedPageRange) => void;
  onOpenModal?: (initialTab?: "pinned" | "ranges" | "search" | "notebooklm") => void;
  onViewDoc?: (doc: PinnedSourceDoc) => void;
  scratchpadText?: string;
  readingQuotes?: string[];
}

export function FocusResourcesDock({
  task,
  area,
  guidance,
  isReadingMode,
  activeBook,
  activeRange,
  onSelectRange,
  onOpenModal,
  onViewDoc,
  scratchpadText = "",
  readingQuotes = [],
}: FocusResourcesDockProps) {
  const [dockTab, setDockTab] = useState<"pinned" | "ranges" | "guidance">(() =>
    isReadingMode ? "ranges" : "pinned"
  );
  const [pinnedDocs, setPinnedDocs] = useState<PinnedSourceDoc[]>([]);
  const [pageRanges, setPageRanges] = useState<SavedPageRange[]>([]);

  useEffect(() => {
    setPinnedDocs(loadPinnedDocs());
    setPageRanges(loadSavedPageRanges());
  }, []);

  const refreshData = () => {
    setPinnedDocs(loadPinnedDocs());
    setPageRanges(loadSavedPageRanges());
  };

  const handleCopyNotebookSnippet = () => {
    const snippet = generateSessionNotebookLMSnippet({
      sessionTitle: task?.title || activeBook?.title || activeRange?.topic || "Odak Seansı",
      scratchpadText,
      quotes: readingQuotes,
      activeBook: activeBook || undefined,
      activeRange: activeRange || undefined,
      pinnedDoc: pinnedDocs[0] || undefined,
    });
    navigator.clipboard.writeText(snippet);
    toast.success("Seans notları NotebookLM formatında panoya kopyalandı!");
  };

  return (
    <div className="flex-1 rounded-2xl border bg-card p-3 shadow-xs flex flex-col min-h-0">
      {/* Header with mini tab pills */}
      <div className="flex items-center justify-between border-b pb-2 shrink-0 gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="grid size-6 place-items-center rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0">
            <BookOpen className="size-3.5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-foreground truncate">Kaynak &amp; Belge Masası</h2>
            <p className="text-[10px] text-muted-foreground truncate">
              {dockTab === "pinned"
                ? `${pinnedDocs.length} pinli şema & döküman`
                : dockTab === "ranges"
                ? `${pageRanges.length} sayfa aralığı`
                : "Önerilen dökümanlar"}
            </p>
          </div>
        </div>

        {/* Mini Pill Switcher */}
        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-xl text-[10px] shrink-0 font-medium">
          <button
            type="button"
            onClick={() => setDockTab("pinned")}
            className={cn(
              "px-1.5 py-0.5 rounded-lg transition-all",
              dockTab === "pinned"
                ? "bg-background text-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Pinlenmiş Şemalar ve Görseller"
          >
            📌 Pin ({pinnedDocs.length})
          </button>
          <button
            type="button"
            onClick={() => setDockTab("ranges")}
            className={cn(
              "px-1.5 py-0.5 rounded-lg transition-all",
              dockTab === "ranges"
                ? "bg-background text-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Kayıtlı Sayfa Aralıkları"
          >
            📖 Sayfa ({pageRanges.length})
          </button>
          <button
            type="button"
            onClick={() => setDockTab("guidance")}
            className={cn(
              "px-1.5 py-0.5 rounded-lg transition-all",
              dockTab === "guidance"
                ? "bg-background text-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Rehber & Görev Kaynakları"
          >
            🔗 Rehber
          </button>
        </div>
      </div>

      {/* Active Range Banner (If selected) */}
      {activeRange && (
        <div className="mt-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2 text-xs flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
              Aktif Çalışma Aralığı
            </span>
            <p className="font-semibold text-foreground truncate text-[11px]">{activeRange.topic}</p>
            <p className="text-[10px] text-muted-foreground font-mono">
              {activeRange.resourceTitle} · Sf. {activeRange.startPage}–{activeRange.endPage}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const nextStatus = activeRange.status === "completed" ? "reading" : "completed";
              updateSavedPageRange(activeRange.id, { status: nextStatus });
              refreshData();
              toast.success(
                nextStatus === "completed"
                  ? "Sayfa aralığı tamamlandı olarak işaretlendi! 🎉"
                  : "Sayfa aralığı okunuyor olarak güncellendi."
              );
            }}
            className={cn(
              "rounded-lg px-2 py-1 text-[10px] font-semibold shrink-0 transition-all border",
              activeRange.status === "completed"
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "bg-background border-border text-foreground hover:bg-muted"
            )}
          >
            {activeRange.status === "completed" ? "✓ Bitti" : "Bitir"}
          </button>
        </div>
      )}

      {/* TAB CONTENT */}
      <div className="mt-2 flex-1 overflow-y-auto space-y-2 pr-1 min-h-0 focus-scrollbar">
        {/* TAB 1: PINNED DOCS & SCHEMAS */}
        {dockTab === "pinned" && (
          <div className="space-y-2">
            {pinnedDocs.length === 0 ? (
              <div className="py-4 text-center space-y-2">
                <p className="text-xs text-muted-foreground italic">Henüz pinlenmiş bir belge yok.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenModal?.("pinned")}
                  className="rounded-xl text-xs h-7"
                >
                  <Plus className="mr-1 size-3" />
                  Şema / Belge Pinle
                </Button>
              </div>
            ) : (
              pinnedDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onViewDoc?.(doc)}
                  className="group flex items-center gap-2.5 rounded-xl border bg-background/80 p-2 cursor-pointer transition-all hover:border-indigo-500/50 hover:bg-muted/30"
                >
                  {/* Thumbnail */}
                  <div className="size-11 rounded-lg overflow-hidden bg-muted/60 shrink-0 border border-border/50 flex items-center justify-center relative">
                    {doc.type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={doc.url} alt={doc.title} className="size-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <FileText className="size-5 text-sky-500" />
                    )}
                    <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Maximize2 className="size-3.5" />
                    </span>
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold px-1.5 py-0.2 text-[9px]">
                        {doc.type.toUpperCase()}
                      </span>
                      {doc.pageRange && (
                        <span className="text-[10px] text-muted-foreground font-mono truncate">
                          {doc.pageRange}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {doc.title}
                    </p>
                    {doc.notes && (
                      <p className="text-[10px] text-muted-foreground line-clamp-1 italic">
                        {doc.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: SAVED PAGE RANGES */}
        {dockTab === "ranges" && (
          <div className="space-y-2">
            {pageRanges.length === 0 ? (
              <div className="py-4 text-center space-y-2">
                <p className="text-xs text-muted-foreground italic">Kayıtlı sayfa aralığı bulunmuyor.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenModal?.("ranges")}
                  className="rounded-xl text-xs h-7"
                >
                  <Plus className="mr-1 size-3" />
                  Sayfa Aralığı Ekle
                </Button>
              </div>
            ) : (
              pageRanges.map((range) => {
                const isCurrent = activeRange?.id === range.id;
                return (
                  <div
                    key={range.id}
                    onClick={() => onSelectRange?.(range)}
                    className={cn(
                      "group flex flex-col rounded-xl border p-2.5 cursor-pointer transition-all space-y-1.5",
                      isCurrent
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "bg-background/80 border-border/70 hover:border-indigo-500/40 hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 rounded-md px-1.5 py-0.5">
                        Sayfa {range.startPage}–{range.endPage}
                      </span>
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[9px] font-semibold",
                          range.status === "important"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : range.status === "completed"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {range.status === "important" ? "Önemli" : range.status === "completed" ? "Bitti" : "Okunuyor"}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-foreground leading-tight truncate">
                        {range.topic}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{range.resourceTitle}</p>
                    </div>

                    {range.notes && (
                      <p className="text-[10px] text-muted-foreground line-clamp-1 italic bg-muted/20 px-1.5 py-0.5 rounded">
                        &ldquo;{range.notes}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: GUIDANCE RESOURCES & OFFICIAL DOCS */}
        {dockTab === "guidance" && (
          <div className="space-y-1.5">
            {guidance && guidance.resources.length > 0 ? (
              guidance.resources.map((res, idx) => (
                <a
                  key={idx}
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between rounded-xl border bg-background/80 p-2 transition-all hover:border-primary/50 hover:bg-muted/30"
                >
                  <div className="min-w-0 pr-1.5">
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                      {res.badge}
                    </span>
                    <p className="mt-0.5 text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {res.title}
                    </p>
                  </div>
                  <ExternalLink className="size-3 shrink-0 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                </a>
              ))
            ) : task?.resource ? (
              <a
                href={task.resource}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between rounded-xl border bg-background/80 p-2 hover:border-primary/50"
              >
                <div className="min-w-0 pr-1.5">
                  <span className="text-[9px] font-semibold text-primary">Resmî Görev Kaynağı</span>
                  <p className="text-xs font-semibold truncate text-foreground">{task.resource}</p>
                </div>
                <ExternalLink className="size-3 shrink-0 text-muted-foreground group-hover:text-primary" />
              </a>
            ) : (
              <p className="py-3 text-center text-xs text-muted-foreground italic">
                Bu görev için harici bir bağlantı tanımlanmamış.
              </p>
            )}

            {/* Quick search shortcut for task */}
            <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenModal?.("search")}
                className="rounded-xl text-[11px] h-7 px-2 flex-1"
              >
                <Search className="mr-1 size-3 text-indigo-500" />
                Web &amp; Google PDF Ara
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dock Bottom Bar: Quick Drawer & NotebookLM Bridges */}
      <div className="pt-2 mt-1 border-t border-border/40 flex items-center justify-between gap-1.5 shrink-0">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onOpenModal?.()}
          className="rounded-xl text-[11px] h-7 px-2.5 flex-1 font-medium"
        >
          <Layers className="mr-1.5 size-3.5 text-indigo-500" />
          Kaynak Masası
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleCopyNotebookSnippet}
          className="rounded-xl text-[11px] h-7 px-2 shrink-0"
          title="Bu Seansın Canlı Notlarını NotebookLM Paketine Kopyala"
        >
          <Sparkles className="mr-1 size-3 text-amber-500" />
          NotebookLM
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// 2. FOCUS RESOURCES MODAL & LIGHTBOX
// ============================================================================

interface FocusResourcesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "pinned" | "ranges" | "search" | "notebooklm";
  task?: NorthTask;
  activeBook?: NorthBook;
  activeRange?: SavedPageRange | null;
  onSelectRange?: (range: SavedPageRange) => void;
  scratchpadText?: string;
  readingQuotes?: string[];
}

export function FocusResourcesModal({
  open,
  onOpenChange,
  initialTab = "pinned",
  task,
  activeBook,
  activeRange,
  onSelectRange,
  scratchpadText = "",
  readingQuotes = [],
}: FocusResourcesModalProps) {
  const [tab, setTab] = useState<"pinned" | "ranges" | "search" | "notebooklm">(initialTab);
  const [pinnedDocs, setPinnedDocs] = useState<PinnedSourceDoc[]>([]);
  const [pageRanges, setPageRanges] = useState<SavedPageRange[]>([]);
  const [lightboxDoc, setLightboxDoc] = useState<PinnedSourceDoc | null>(null);

  // New Pin form
  const [newPinTitle, setNewPinTitle] = useState("");
  const [newPinType, setNewPinType] = useState<"image" | "pdf" | "link">("image");
  const [newPinUrl, setNewPinUrl] = useState("");
  const [newPinPageRange, setNewPinPageRange] = useState("");
  const [newPinNotes, setNewPinNotes] = useState("");
  const [pinFormOpen, setPinFormOpen] = useState(false);

  // New Page Range form
  const [newRangeTitle, setNewRangeTitle] = useState("");
  const [newRangeTopic, setNewRangeTopic] = useState("");
  const [newRangeStart, setNewRangeStart] = useState<number>(1);
  const [newRangeEnd, setNewRangeEnd] = useState<number>(15);
  const [newRangeNotes, setNewRangeNotes] = useState("");
  const [rangeFormOpen, setRangeFormOpen] = useState(false);

  // Live Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<WebSearchResultItem[]>([]);
  const [searchError, setSearchError] = useState("");

  // NotebookLM state
  const [notebookUrl, setNotebookUrl] = useState("");

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setPinnedDocs(loadPinnedDocs());
      setPageRanges(loadSavedPageRanges());
      setNotebookUrl(getNotebookLMSavedUrl());
      if (task?.title && !searchQuery) {
        setSearchQuery(task.title);
      }
    }
  }, [open, initialTab, task?.title]);

  const refreshAll = () => {
    setPinnedDocs(loadPinnedDocs());
    setPageRanges(loadSavedPageRanges());
  };

  // Add Pin
  const handleCreatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPinTitle.trim() || !newPinUrl.trim()) {
      toast.error("Başlık ve görsel/döküman URL'i zorunludur.");
      return;
    }
    addPinnedDoc({
      title: newPinTitle.trim(),
      type: newPinType,
      url: newPinUrl.trim(),
      pageRange: newPinPageRange.trim() || undefined,
      notes: newPinNotes.trim() || undefined,
    });
    refreshAll();
    setPinFormOpen(false);
    setNewPinTitle("");
    setNewPinUrl("");
    setNewPinPageRange("");
    setNewPinNotes("");
    toast.success("Belge odak masasına pinlendi!");
  };

  // Add Page Range
  const handleCreateRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRangeTitle.trim() || !newRangeTopic.trim()) {
      toast.error("Kaynak başlığı ve konu zorunludur.");
      return;
    }
    const created = addSavedPageRange({
      resourceTitle: newRangeTitle.trim(),
      topic: newRangeTopic.trim(),
      startPage: Number(newRangeStart),
      endPage: Number(newRangeEnd),
      notes: newRangeNotes.trim() || undefined,
      status: "reading",
    });
    refreshAll();
    onSelectRange?.(created);
    setRangeFormOpen(false);
    setNewRangeTitle("");
    setNewRangeTopic("");
    setNewRangeNotes("");
    toast.success("Sayfa aralığı eklendi ve seansa bağlandı!");
  };

  // Execute Live Search
  const handleExecuteSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError("");
    try {
      let res: Response;
      try {
        res = await authenticatedAiFetch("/api/ai/source-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchQuery.trim(), limit: 8 }),
        });
      } catch {
        res = await fetch("/api/ai/source-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchQuery.trim(), limit: 8 }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Arama hatası");
      setSearchResults(Array.isArray(data.results) ? data.results : []);
    } catch (err: any) {
      setSearchError(err.message || "Arama başarısız oldu.");
    } finally {
      setIsSearching(false);
    }
  };

  // Copy Session Snippet
  const handleCopySessionSnippet = () => {
    const snippet = generateSessionNotebookLMSnippet({
      sessionTitle: task?.title || activeBook?.title || activeRange?.topic || "Odak Seansı",
      scratchpadText,
      quotes: readingQuotes,
      activeBook: activeBook || undefined,
      activeRange: activeRange || undefined,
    });
    navigator.clipboard.writeText(snippet);
    toast.success("Seans notları panoya kopyalandı!");
  };

  // Copy Full Bundle
  const handleCopyFullBundle = () => {
    const books = loadBooks();
    const bundle = generateNotebookLMBundle({
      books,
      pageRanges: loadSavedPageRanges(),
      pinnedDocs: loadPinnedDocs(),
      customNotes: scratchpadText ? `## Aktif Seans Notu\n${scratchpadText}` : undefined,
    });
    navigator.clipboard.writeText(bundle);
    toast.success("Tüm kaynak paketi panoya kopyalandı!");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl sm:max-w-4xl max-h-[90vh] flex flex-col p-5 sm:p-6 overflow-hidden">
          <DialogHeader className="shrink-0 border-b border-border/40 pb-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <BookOpen className="size-5 text-indigo-500" />
                  Odak Çalışma Masası &amp; Kaynaklar
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Odak seansını bölmeden şemaları incele, sayfa aralıklarını takip et, web/PDF aramasını doğrudan yap veya NotebookLM&apos;e aktar.
                </DialogDescription>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5 bg-muted/60 p-1 rounded-2xl text-xs font-medium">
              <button
                type="button"
                onClick={() => setTab("pinned")}
                className={cn(
                  "px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5",
                  tab === "pinned"
                    ? "bg-background text-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>📌 Pinli Belgeler &amp; Şemalar</span>
                <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px]">
                  {pinnedDocs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTab("ranges")}
                className={cn(
                  "px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5",
                  tab === "ranges"
                    ? "bg-background text-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>📖 Sayfa Aralıkları</span>
                <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px]">
                  {pageRanges.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTab("search")}
                className={cn(
                  "px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5",
                  tab === "search"
                    ? "bg-background text-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Search className="size-3.5" />
                <span>Web &amp; Google PDF Arama</span>
              </button>

              <button
                type="button"
                onClick={() => setTab("notebooklm")}
                className={cn(
                  "px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5",
                  tab === "notebooklm"
                    ? "bg-background text-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles className="size-3.5 text-amber-500" />
                <span>NotebookLM Köprüsü</span>
              </button>
            </div>
          </DialogHeader>

          {/* TAB 1: PINNED DOCS & SCHEMAS */}
          {tab === "pinned" && (
            <div className="flex-1 overflow-y-auto space-y-4 py-3 min-h-0 focus-scrollbar pr-1">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Mimari şemalar, cheat sheetler ve referans sayfaları tam ekran inceleyebilir veya yenisini pinleyebilirsin.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPinFormOpen(!pinFormOpen)}
                  className="rounded-xl text-xs h-8"
                >
                  <Plus className="mr-1 size-3.5" />
                  {pinFormOpen ? "Formu Kapat" : "Yeni Görsel Pinle"}
                </Button>
              </div>

              {/* Pin Form Drawer */}
              {pinFormOpen && (
                <form
                  onSubmit={handleCreatePin}
                  className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-3.5 space-y-3"
                >
                  <h4 className="text-xs font-bold text-foreground">Yeni Belge / Şema Pinle</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">Belge Başlığı</label>
                      <input
                        type="text"
                        required
                        value={newPinTitle}
                        onChange={(e) => setNewPinTitle(e.target.value)}
                        placeholder="Örn: Active Directory Mimari Şeması"
                        className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">Görsel / Döküman URL</label>
                      <input
                        type="text"
                        required
                        value={newPinUrl}
                        onChange={(e) => setNewPinUrl(e.target.value)}
                        placeholder="https://... veya data URL"
                        className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">Sayfa Aralığı / Bölüm (Opsiyonel)</label>
                      <input
                        type="text"
                        value={newPinPageRange}
                        onChange={(e) => setNewPinPageRange(e.target.value)}
                        placeholder="Örn: Bölüm 4 / Sf. 45"
                        className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">Tür</label>
                      <select
                        value={newPinType}
                        onChange={(e) => setNewPinType(e.target.value as any)}
                        className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-indigo-500 focus:outline-hidden"
                      >
                        <option value="image">Görsel (Şema, Ekran Görüntüsü)</option>
                        <option value="pdf">PDF Dökümanı</option>
                        <option value="link">Web Bağlantısı / Makale</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">İpuçları ve Notlar</label>
                    <textarea
                      rows={2}
                      value={newPinNotes}
                      onChange={(e) => setNewPinNotes(e.target.value)}
                      placeholder="Bu görselle ilgili önemli ipuçları..."
                      className="w-full rounded-xl border border-border bg-background p-2 text-xs text-foreground focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setPinFormOpen(false)} className="rounded-xl text-xs h-7">
                      Vazgeç
                    </Button>
                    <Button type="submit" size="sm" className="rounded-xl text-xs h-7">
                      Masaya Pinle
                    </Button>
                  </div>
                </form>
              )}

              {/* Grid of Pinned Docs */}
              {pinnedDocs.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed rounded-2xl bg-card/40 space-y-2.5">
                  <div className="size-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 mx-auto grid place-items-center">
                    <FileText className="size-5 opacity-80" />
                  </div>
                  <div className="max-w-sm mx-auto space-y-0.5">
                    <h4 className="text-xs font-bold text-foreground">Pinli Belge Bulunmuyor</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Bu seans sırasında incelemek istediğin mimari şemaları veya notları pinleyebilirsin.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => setPinFormOpen(true)}
                      className="rounded-xl text-xs h-7"
                    >
                      <Plus className="mr-1 size-3" />
                      Yeni Görsel Pinle
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        loadStarterPinnedDocs();
                        refreshAll();
                        toast.success("Örnek belgeler yüklendi.");
                      }}
                      className="rounded-xl text-xs h-7 text-sky-600 dark:text-sky-400 border-sky-500/30"
                    >
                      <Sparkles className="mr-1 size-3" />
                      Örnek Şema Yükle
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {pinnedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="group rounded-2xl border bg-background/80 overflow-hidden flex flex-col justify-between transition-all hover:border-indigo-500/50 hover:shadow-xs"
                    >
                      <div
                        onClick={() => setLightboxDoc(doc)}
                        className="h-32 w-full cursor-pointer bg-muted/40 border-b flex items-center justify-center relative overflow-hidden"
                      >
                        {doc.type === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={doc.url} alt={doc.title} className="size-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="p-3 text-center space-y-1">
                            <FileText className="size-8 mx-auto text-sky-500" />
                            <p className="text-[11px] font-semibold truncate text-foreground">{doc.title}</p>
                          </div>
                        )}
                        <span className="absolute top-2 right-2 rounded-lg bg-black/60 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold text-white flex items-center gap-1">
                          <Maximize2 className="size-2.5" />
                          Büyüt
                        </span>
                      </div>

                      <div className="p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold px-1.5 py-0.2">
                            {doc.type.toUpperCase()}
                          </span>
                          {doc.pageRange && (
                            <span className="font-mono text-muted-foreground">{doc.pageRange}</span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-foreground truncate">{doc.title}</h4>
                        {doc.notes && (
                          <p className="text-[10px] text-muted-foreground line-clamp-2 italic bg-muted/20 p-1 rounded">
                            {doc.notes}
                          </p>
                        )}
                      </div>

                      <div className="px-2.5 pb-2.5 pt-1 border-t border-border/30 flex items-center justify-between gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setLightboxDoc(doc)}
                          className="rounded-xl text-[10px] h-6 px-2 flex-1"
                        >
                          <Maximize2 className="mr-1 size-2.5" />
                          İncele
                        </Button>
                        <button
                          type="button"
                          onClick={() => {
                            deletePinnedDoc(doc.id);
                            refreshAll();
                            toast.info("Belge pinlerden kaldırıldı.");
                          }}
                          className="p-1 rounded-lg text-muted-foreground hover:text-red-500 transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SAVED PAGE RANGES */}
          {tab === "ranges" && (
            <div className="flex-1 overflow-y-auto space-y-4 py-3 min-h-0 focus-scrollbar pr-1">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Okuduğun kitap veya dökümanlardan sayfa aralıklarını seçerek bu seansa aktif hedef olarak bağlayabilirsin.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRangeFormOpen(!rangeFormOpen)}
                  className="rounded-xl text-xs h-8"
                >
                  <Plus className="mr-1 size-3.5" />
                  {rangeFormOpen ? "Formu Kapat" : "Sayfa Aralığı Ekle"}
                </Button>
              </div>

              {/* Range Form Drawer */}
              {rangeFormOpen && (
                <form
                  onSubmit={handleCreateRange}
                  className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-3.5 space-y-3"
                >
                  <h4 className="text-xs font-bold text-foreground">Yeni Sayfa Aralığı Tanımla</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">Kitap / Kaynak Adı</label>
                      <input
                        type="text"
                        required
                        value={newRangeTitle}
                        onChange={(e) => setNewRangeTitle(e.target.value)}
                        placeholder="Örn: Deep Work (Pürdikkat)"
                        className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">Konu / Bölüm Başlığı</label>
                      <input
                        type="text"
                        required
                        value={newRangeTopic}
                        onChange={(e) => setNewRangeTopic(e.target.value)}
                        placeholder="Örn: Bölüm 2: Dikkat Kalıntısı"
                        className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">Başlangıç Sayfası</label>
                      <input
                        type="number"
                        min={1}
                        value={newRangeStart}
                        onChange={(e) => setNewRangeStart(Number(e.target.value))}
                        className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">Bitiş Sayfası</label>
                      <input
                        type="number"
                        min={newRangeStart}
                        value={newRangeEnd}
                        onChange={(e) => setNewRangeEnd(Number(e.target.value))}
                        className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Notlar (Opsiyonel)</label>
                    <input
                      type="text"
                      value={newRangeNotes}
                      onChange={(e) => setNewRangeNotes(e.target.value)}
                      placeholder="Önemli noktalar, dikkat edilmesi gereken kısımlar..."
                      className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setRangeFormOpen(false)} className="rounded-xl text-xs h-7">
                      Vazgeç
                    </Button>
                    <Button type="submit" size="sm" className="rounded-xl text-xs h-7">
                      Kaydet &amp; Odaklan
                    </Button>
                  </div>
                </form>
              )}

              {/* Grid of Page Ranges */}
              {pageRanges.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed rounded-2xl bg-card/40 space-y-2.5">
                  <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto grid place-items-center">
                    <Bookmark className="size-5 opacity-80" />
                  </div>
                  <div className="max-w-sm mx-auto space-y-0.5">
                    <h4 className="text-xs font-bold text-foreground">Kayıtlı Sayfa Aralığı Bulunmuyor</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Bu odak seansında hedeflemek istediğin kitap veya döküman sayfalarını kaydedebilirsin.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => setRangeFormOpen(true)}
                      className="rounded-xl text-xs h-7"
                    >
                      <Plus className="mr-1 size-3" />
                      Sayfa Aralığı Ekle
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        loadStarterPageRanges();
                        refreshAll();
                        toast.success("Örnek sayfa aralıkları yüklendi.");
                      }}
                      className="rounded-xl text-xs h-7 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    >
                      <Sparkles className="mr-1 size-3" />
                      Örnek Aralık Yükle
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pageRanges.map((range) => {
                    const isSelected = activeRange?.id === range.id;
                    return (
                      <div
                        key={range.id}
                        className={cn(
                          "rounded-2xl border p-3.5 space-y-2.5 flex flex-col justify-between transition-all",
                          isSelected
                            ? "border-indigo-500 bg-indigo-500/10 shadow-xs"
                            : "bg-background/80 border-border/70 hover:border-indigo-500/40"
                        )}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/15 rounded-lg px-2 py-0.5">
                              Sayfa {range.startPage}–{range.endPage}
                            </span>
                            <span
                              className={cn(
                                "rounded-md px-2 py-0.5 text-[10px] font-semibold",
                                range.status === "important"
                                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                  : range.status === "completed"
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {range.status === "important" ? "Kritik" : range.status === "completed" ? "Bitti" : "Okunuyor"}
                            </span>
                          </div>

                          <h4 className="font-bold text-xs sm:text-sm text-foreground">{range.topic}</h4>
                          <p className="text-xs text-muted-foreground">{range.resourceTitle}</p>

                          {range.notes && (
                            <p className="text-[11px] text-muted-foreground italic bg-muted/30 p-2 rounded-xl">
                              &ldquo;{range.notes}&rdquo;
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                          <Button
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => {
                              onSelectRange?.(range);
                              toast.success(`"${range.topic}" bu seansın aktif hedefi yapıldı.`);
                            }}
                            className="rounded-xl text-xs h-7 px-3 flex-1"
                          >
                            {isSelected ? "✓ Aktif Hedef" : "Bu Aralıkla Odaklan"}
                          </Button>

                          <button
                            type="button"
                            onClick={() => {
                              const next = range.status === "completed" ? "reading" : "completed";
                              updateSavedPageRange(range.id, { status: next });
                              refreshAll();
                              toast.info(`Durum "${next === "completed" ? "Tamamlandı" : "Okunuyor"}" olarak güncellendi.`);
                            }}
                            className="p-1.5 rounded-lg border bg-muted/30 hover:bg-muted text-muted-foreground"
                            title="Tamamlandı olarak işaretle"
                          >
                            <Check className="size-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              deleteSavedPageRange(range.id);
                              refreshAll();
                              toast.info("Sayfa aralığı silindi.");
                            }}
                            className="p-1.5 rounded-lg border bg-muted/30 hover:bg-muted text-muted-foreground hover:text-red-500"
                            title="Sil"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LIVE WEB & GOOGLE PDF SEARCH */}
          {tab === "search" && (
            <div className="flex-1 overflow-y-auto space-y-4 py-3 min-h-0 focus-scrollbar pr-1">
              <form onSubmit={handleExecuteSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Siber güvenlik konusu, mimari doküman, CVE veya kitap adı yaz..."
                    className="w-full rounded-2xl border border-border bg-background pl-9 pr-4 py-2 text-xs text-foreground focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <Button type="submit" disabled={isSearching} className="rounded-2xl text-xs h-9 px-4">
                  {isSearching ? "Aranıyor..." : "Canlı Ara"}
                </Button>
              </form>

              {/* Query Indicator */}
              {searchQuery.trim() && (
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0 text-xs">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      Doğrulanmış Sonuçlar:
                    </span>{" "}
                    <span className="text-muted-foreground truncate">&ldquo;{searchQuery}&rdquo;</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                    Sistem İçi Arama
                  </Badge>
                </div>
              )}

              {searchError && (
                <p className="text-xs text-red-500 bg-red-500/10 p-2 rounded-xl">{searchError}</p>
              )}

              {/* Search Results */}
              <div className="space-y-2">
                {searchResults.map((item) => {
                  const isBook = item.type === "book" || Boolean(item.downloadUrl || item.author);
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border bg-background/80 p-3 space-y-2 transition-all hover:border-indigo-500/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={cn(
                            "rounded font-bold px-2 py-0.5 text-[10px]",
                            isBook
                              ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          )}>
                            {isBook ? "KİTAP" : item.type.toUpperCase()}
                          </span>
                          {item.fileExt && (
                            <span className="rounded bg-muted px-1.5 py-0.5 font-bold uppercase text-[9px] text-muted-foreground">
                              {item.fileExt}
                            </span>
                          )}
                          {item.fileSize && (
                            <span className="text-[10px] text-muted-foreground">
                              {item.fileSize}
                            </span>
                          )}
                          <span className="text-[11px] text-muted-foreground truncate">{item.provider}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={item.downloadUrl || item.url}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(
                              "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg transition-colors",
                              isBook
                                ? "bg-indigo-600 text-white hover:bg-indigo-500"
                                : "text-indigo-600 dark:text-indigo-400 hover:underline"
                            )}
                          >
                            <span>{isBook ? "PDF Oku / Aç" : "Kaynağa Git"}</span>
                            {isBook ? <ExternalLink className="size-2.5" /> : <ExternalLink className="size-3" />}
                          </a>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-foreground">{item.title}</h4>
                      {item.author && (
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                          {item.author} {item.year ? `(${item.year})` : ""}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{item.description}</p>

                      {item.keyTakeaways && item.keyTakeaways.length > 0 && (
                        <div className="rounded-xl bg-muted/30 p-2 space-y-1">
                          {item.keyTakeaways.map((takeaway, i) => (
                            <div key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                              <span className="text-indigo-500 font-bold">•</span>
                              <span>{takeaway}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: NOTEBOOKLM INTEGRATION */}
          {tab === "notebooklm" && (
            <div className="flex-1 overflow-y-auto space-y-4 py-3 min-h-0 focus-scrollbar pr-1">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <Sparkles className="size-4" />
                  Google NotebookLM Köprüsü
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Odak seansı boyunca aldığın canlı notlar, okuma alıntıları ve çalıştığın sayfa aralıkları doğrudan NotebookLM&apos;e kaynak olarak aktarılabilir.
                </p>
              </div>

              {/* Workspace URL Saver */}
              <div className="rounded-2xl border bg-background/80 p-3.5 space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  NotebookLM Çalışma Alanı URL&apos;in
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={notebookUrl}
                    onChange={(e) => setNotebookUrl(e.target.value)}
                    placeholder="https://notebooklm.google.com/notebook/..."
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-amber-500 focus:outline-hidden"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setNotebookLMSavedUrl(notebookUrl);
                      toast.success("NotebookLM linkin kaydedildi.");
                    }}
                    className="rounded-xl text-xs h-8"
                  >
                    Kaydet
                  </Button>
                </div>
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border bg-card p-3.5 space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <FileText className="size-3.5 text-amber-500" />
                      Aktif Seans Notlarını Kopyala
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Sadece bu seans boyunca tuttuğun canlı notları, alıntıları ve aktif hedefi Markdown formatında panoya aktarır.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleCopySessionSnippet}
                    className="w-full rounded-xl text-xs h-8"
                  >
                    <Copy className="mr-1.5 size-3" />
                    Seans Notunu Panoya Kopyala
                  </Button>
                </div>

                <div className="rounded-2xl border bg-card p-3.5 space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <BookOpen className="size-3.5 text-indigo-500" />
                      Tüm Kaynak &amp; Kitap Paketini Kopyala
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Kütüphanendeki tüm kitapları, alıntıları, sayfa aralıklarını ve pinli belgeleri tek bir kaynak paketi yapar.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyFullBundle}
                    className="w-full rounded-xl text-xs h-8"
                  >
                    <Copy className="mr-1.5 size-3" />
                    Tam Paketi Kopyala
                  </Button>
                </div>
              </div>

              <div className="pt-2 text-center">
                <a
                  href={notebookUrl || "https://notebooklm.google.com"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 px-4 py-2 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition-all"
                >
                  <ExternalLink className="size-3.5" />
                  NotebookLM Çalışma Alanını Yeni Sekmede Aç
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* LIGHTBOX FOR PINNED DOC */}
      {lightboxDoc && (
        <Dialog open={!!lightboxDoc} onOpenChange={() => setLightboxDoc(null)}>
          <DialogContent className="max-w-4xl p-2 bg-black/90 text-white border-zinc-800">
            <div className="relative flex flex-col items-center justify-center p-2">
              <div className="flex items-center justify-between w-full pb-2 px-2 border-b border-zinc-800 text-xs">
                <span className="font-bold truncate">{lightboxDoc.title}</span>
                {lightboxDoc.pageRange && (
                  <span className="font-mono text-zinc-400">{lightboxDoc.pageRange}</span>
                )}
              </div>
              <div className="my-4 max-h-[75vh] max-w-full overflow-auto flex items-center justify-center">
                {lightboxDoc.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={lightboxDoc.url}
                    alt={lightboxDoc.title}
                    className="max-h-[70vh] max-w-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="p-8 text-center space-y-3">
                    <FileText className="size-16 mx-auto text-sky-400" />
                    <p className="text-sm font-semibold">{lightboxDoc.title}</p>
                    <a
                      href={lightboxDoc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-sky-400 underline"
                    >
                      Harici Sekmede Aç
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
              </div>
              {lightboxDoc.notes && (
                <p className="text-xs text-zinc-400 italic px-3 text-center">{lightboxDoc.notes}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
