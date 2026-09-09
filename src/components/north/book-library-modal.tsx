"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Plus,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  Quote,
  Trash2,
  Bookmark,
  ExternalLink,
  SlidersHorizontal,
  ChevronRight,
  Star,
  Flame,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  loadBooks,
  addBook,
  updateBook,
  deleteBook,
  filterRecommendations,
  BOOK_CATEGORIES,
  BOOK_GOAL_MOODS,
  type NorthBook,
  type BookRecommendation,
} from "@/lib/books";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BookLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartReadingFocus?: (book: NorthBook) => void;
  defaultTab?: "shelf" | "recommendations" | "add";
}

export function BookLibraryModal({
  open,
  onOpenChange,
  onStartReadingFocus,
  defaultTab = "shelf",
}: BookLibraryModalProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"shelf" | "recommendations" | "add">(defaultTab);
  const [books, setBooks] = useState<NorthBook[]>([]);
  const [shelfFilter, setShelfFilter] = useState<"all" | "reading" | "want_to_read" | "completed">("all");

  // Recommendation Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");
  const [selectedMood, setSelectedMood] = useState<string>("Tümü");
  const [selectedLength, setSelectedLength] = useState<"all" | "short" | "medium" | "long">("all");
  const [selectedRecForDetail, setSelectedRecForDetail] = useState<BookRecommendation | null>(null);

  // New Book Draft
  const [draftTitle, setDraftTitle] = useState("");
  const [draftAuthor, setDraftAuthor] = useState("");
  const [draftCategory, setDraftCategory] = useState("Alışkanlık & Zihin");
  const [draftTotalPages, setDraftTotalPages] = useState<number>(300);
  const [draftCurrentPage, setDraftCurrentPage] = useState<number>(0);
  const [draftStatus, setDraftStatus] = useState<"reading" | "want_to_read">("reading");

  useEffect(() => {
    if (open) {
      setBooks(loadBooks());
      setTab(defaultTab);
    }
  }, [open, defaultTab]);

  const refreshShelf = () => {
    setBooks(loadBooks());
  };

  const handleCreateBook = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!draftTitle.trim() || !draftAuthor.trim()) {
      toast.error("Lütfen kitap adı ve yazarını belirtin.");
      return;
    }
    const newBook = addBook({
      title: draftTitle.trim(),
      author: draftAuthor.trim(),
      category: draftCategory,
      totalPages: Math.max(1, draftTotalPages || 100),
      currentPage: Math.max(0, draftCurrentPage || 0),
      status: draftStatus,
      startedAt: draftStatus === "reading" ? new Date().toISOString().slice(0, 10) : undefined,
    });
    refreshShelf();
    toast.success(`"${newBook.title}" kitaplığına eklendi.`);
    setDraftTitle("");
    setDraftAuthor("");
    setDraftCurrentPage(0);
    setTab("shelf");
  };

  const handleAddFromRecommendation = (rec: BookRecommendation, startImmediate = false) => {
    const existing = books.find((b) => b.title.toLowerCase() === rec.title.toLowerCase());
    let targetBook: NorthBook;
    if (existing) {
      targetBook = existing;
      toast.info(`"${rec.title}" zaten kitaplığında mevcut.`);
    } else {
      targetBook = addBook({
        title: rec.title,
        author: rec.author,
        category: rec.category,
        totalPages: rec.totalPages,
        currentPage: 0,
        status: startImmediate ? "reading" : "want_to_read",
        startedAt: startImmediate ? new Date().toISOString().slice(0, 10) : undefined,
        notes: rec.summary,
        coverColor: rec.coverColor,
      });
      refreshShelf();
      toast.success(`"${rec.title}" kitaplığına eklendi!`);
    }

    if (startImmediate) {
      onOpenChange(false);
      if (onStartReadingFocus) {
        onStartReadingFocus(targetBook);
      } else {
        router.push(`/focus/reading?bookId=${targetBook.id}`);
      }
    }
  };

  const handleStartFocus = (book: NorthBook) => {
    onOpenChange(false);
    if (onStartReadingFocus) {
      onStartReadingFocus(book);
    } else {
      router.push(`/focus/reading?bookId=${book.id}`);
    }
  };

  const handleDelete = (id: string, title: string) => {
    deleteBook(id);
    refreshShelf();
    toast.success(`"${title}" silindi.`);
  };

  const filteredShelfBooks = books.filter((b) => {
    if (shelfFilter === "all") return true;
    return b.status === shelfFilter;
  });

  const recommendations = filterRecommendations({
    category: selectedCategory,
    goalMood: selectedMood,
    length: selectedLength,
    query: searchQuery,
  });

  const getCoverGradient = (color?: string) => {
    switch (color) {
      case "indigo":
        return "from-indigo-600/90 to-blue-700/90 border-indigo-500/40 text-white";
      case "emerald":
        return "from-emerald-600/90 to-teal-700/90 border-emerald-500/40 text-white";
      case "amber":
        return "from-amber-600/90 to-orange-700/90 border-amber-500/40 text-white";
      case "rose":
        return "from-rose-600/90 to-pink-700/90 border-rose-500/40 text-white";
      case "sky":
        return "from-sky-600/90 to-cyan-700/90 border-sky-500/40 text-white";
      case "purple":
        return "from-purple-600/90 to-violet-700/90 border-purple-500/40 text-white";
      default:
        return "from-primary/90 to-primary/70 border-primary/40 text-primary-foreground";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border-border/70 shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <BookOpen className="size-4" />
              </span>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                  Kitaplığım & Tavsiye Merkezi
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Okuduğun kitapları takip et, akıllı tavsiyeler keşfet veya hemen okuma odağı başlat.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Segmented Tab Controls */}
          <div className="flex items-center gap-1.5 mt-3 pt-1 border-t border-border/40">
            <button
              type="button"
              onClick={() => setTab("shelf")}
              className={cn(
                "flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all text-center flex items-center justify-center gap-1.5",
                tab === "shelf"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              <BookOpen className="size-3.5" />
              <span>Kitaplarım ({books.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("recommendations")}
              className={cn(
                "flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all text-center flex items-center justify-center gap-1.5",
                tab === "recommendations"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              <Sparkles className="size-3.5 text-amber-300" />
              <span>Tavsiyeler & Keşfet</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("add")}
              className={cn(
                "py-1.5 px-3 text-xs font-semibold rounded-lg transition-all text-center flex items-center justify-center gap-1.5 shrink-0",
                tab === "add"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              <Plus className="size-3.5" />
              <span>Yeni Kitap Ekle</span>
            </button>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: SHELF (KİTAPLARIM) */}
          {tab === "shelf" && (
            <div className="space-y-4">
              {/* Filter Pills */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
                <div className="flex items-center gap-1.5">
                  {[
                    { id: "all", label: "Tümü" },
                    { id: "reading", label: "Şu An Okuduklarım" },
                    { id: "want_to_read", label: "Okunacaklar" },
                    { id: "completed", label: "Tamamlananlar" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setShelfFilter(f.id as any)}
                      className={cn(
                        "px-2.5 py-1 text-xs rounded-lg border transition-all shrink-0",
                        shelfFilter === f.id
                          ? "bg-primary/10 border-primary/30 text-primary font-semibold"
                          : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setTab("recommendations")}
                  className="text-xs h-7 rounded-lg text-primary border-primary/30 shrink-0 hidden sm:inline-flex"
                >
                  <Sparkles className="size-3 mr-1 text-amber-500" /> Kitap Öner
                </Button>
              </div>

              {/* Books List */}
              {filteredShelfBooks.length === 0 ? (
                <div className="text-center py-10 px-4 border border-dashed rounded-2xl bg-card/40 space-y-3">
                  <div className="size-12 rounded-2xl bg-primary/10 text-primary mx-auto grid place-items-center">
                    <BookOpen className="size-6 opacity-80" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Bu filtrede kitap bulunmuyor</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Kitaplığa yeni bir kitap ekleyebilir veya tavsiye kataloğundan tek tıkla seçebilirsin.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <Button size="sm" onClick={() => setTab("add")} className="rounded-xl text-xs">
                      <Plus className="size-3.5 mr-1" /> Kitap Ekle
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTab("recommendations")}
                      className="rounded-xl text-xs"
                    >
                      <Sparkles className="size-3.5 mr-1 text-amber-500" /> Tavsiyelere Bak
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredShelfBooks.map((book) => {
                    const percent = Math.min(100, Math.round((book.currentPage / book.totalPages) * 100));
                    return (
                      <div
                        key={book.id}
                        className="rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs flex flex-col justify-between gap-3 hover:border-primary/40 transition-colors group relative"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div
                                className={cn(
                                  "size-10 rounded-xl bg-gradient-to-br flex items-center justify-center font-bold text-xs shadow-2xs shrink-0 border",
                                  getCoverGradient(book.coverColor)
                                )}
                              >
                                📖
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs sm:text-sm font-bold text-foreground truncate" title={book.title}>
                                  {book.title}
                                </h4>
                                <p className="text-[11px] text-muted-foreground truncate">{book.author}</p>
                              </div>
                            </div>

                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9.5px] px-1.5 py-0.5 shrink-0 font-medium",
                                book.status === "reading"
                                  ? "bg-primary/10 border-primary/30 text-primary"
                                  : book.status === "completed"
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                  : "bg-muted/60 text-muted-foreground"
                              )}
                            >
                              {book.status === "reading"
                                ? "Okunuyor"
                                : book.status === "completed"
                                ? "Tamamlandı"
                                : "Okunacak"}
                            </Badge>
                          </div>

                          {/* Progress Bar & Pages */}
                          <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-mono text-muted-foreground">
                                Sayfa <strong className="text-foreground font-semibold">{book.currentPage}</strong> / {book.totalPages}
                              </span>
                              <span className="font-bold text-primary text-[10.5px]">%{percent}</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-300 rounded-full"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>

                          {/* Quotes or session count */}
                          {book.favoriteQuotes && book.favoriteQuotes.length > 0 && (
                            <p className="text-[10px] text-muted-foreground italic line-clamp-1 border-l-2 border-primary/30 pl-1.5">
                              &ldquo;{book.favoriteQuotes[book.favoriteQuotes.length - 1]}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-border/50">
                          <button
                            type="button"
                            onClick={() => handleDelete(book.id, book.title)}
                            className="text-muted-foreground/60 hover:text-destructive text-[11px] p-1 rounded-md transition-colors"
                            title="Kitabı sil"
                          >
                            <Trash2 className="size-3" />
                          </button>

                          <div className="flex items-center gap-1.5">
                            {book.status !== "completed" && (
                              <Button
                                size="xs"
                                onClick={() => handleStartFocus(book)}
                                className="rounded-xl text-[11px] font-semibold h-7 shadow-xs"
                              >
                                <BookOpen className="size-3 mr-1" /> Okuma Odağı Başlat
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RECOMMENDATIONS & FILTERING (TAVSİYELER & FİLTRELEME) */}
          {tab === "recommendations" && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="space-y-2.5 rounded-2xl border border-border/70 bg-card/60 p-3 shadow-2xs">
                <div className="relative">
                  <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Kitap adı, yazar veya konu ara (örn. Cal Newport, web hacking, alışkanlık)..."
                    className="pl-8.5 rounded-xl text-xs h-8.5"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {/* Category Filter */}
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground font-semibold">Kategori / Tür</Label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full rounded-xl border bg-background px-2.5 py-1 text-xs"
                    >
                      {BOOK_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Goal / Mood Filter */}
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground font-semibold">Okuma Amacı / Mod</Label>
                    <select
                      value={selectedMood}
                      onChange={(e) => setSelectedMood(e.target.value)}
                      className="w-full rounded-xl border bg-background px-2.5 py-1 text-xs"
                    >
                      {BOOK_GOAL_MOODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Length Filter */}
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground font-semibold">Sayfa Uzunluğu</Label>
                    <select
                      value={selectedLength}
                      onChange={(e) => setSelectedLength(e.target.value as any)}
                      className="w-full rounded-xl border bg-background px-2.5 py-1 text-xs"
                    >
                      <option value="all">Farketmez (Tümü)</option>
                      <option value="short">Kısa (&lt; 200 sayfa)</option>
                      <option value="medium">Orta (200 - 400 sayfa)</option>
                      <option value="long">Kapsamlı (400+ sayfa)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Recommendation Results Count */}
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>
                  <strong>{recommendations.length}</strong> tavsiye edilen kitap bulundu
                </span>
                {(selectedCategory !== "Tümü" || selectedMood !== "Tümü" || selectedLength !== "all" || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("Tümü");
                      setSelectedMood("Tümü");
                      setSelectedLength("all");
                      setSearchQuery("");
                    }}
                    className="text-primary hover:underline text-[11px]"
                  >
                    Filtreleri Temizle
                  </button>
                )}
              </div>

              {/* Recommendation Cards */}
              <div className="space-y-3">
                {recommendations.map((rec) => {
                  const isAlreadyInShelf = books.some(
                    (b) => b.title.toLowerCase() === rec.title.toLowerCase()
                  );
                  return (
                    <div
                      key={rec.id}
                      className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs space-y-3 hover:border-primary/40 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={cn(
                              "size-11 rounded-xl bg-gradient-to-br flex items-center justify-center font-bold text-sm shadow-2xs shrink-0 border",
                              getCoverGradient(rec.coverColor)
                            )}
                          >
                            📖
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-foreground">{rec.title}</h4>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0.2">
                                {rec.category}
                              </Badge>
                              <span className="text-[10.5px] text-amber-500 font-bold flex items-center gap-0.5">
                                <Star className="size-3 fill-current" /> {rec.rating}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {rec.author} · <span className="font-mono">{rec.totalPages} sayfa</span> · Zorluk:{" "}
                              <span className="font-medium text-foreground">{rec.difficulty}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isAlreadyInShelf ? (
                            <Badge variant="secondary" className="text-[10.5px] gap-1 px-2 py-1">
                              <CheckCircle2 className="size-3 text-emerald-500" /> Kitaplığında
                            </Badge>
                          ) : (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleAddFromRecommendation(rec, false)}
                              className="text-xs rounded-xl h-7"
                            >
                              <Bookmark className="size-3 mr-1" /> Listeme Ekle
                            </Button>
                          )}
                          <Button
                            size="xs"
                            onClick={() => handleAddFromRecommendation(rec, true)}
                            className="text-xs rounded-xl h-7 font-semibold"
                          >
                            <BookOpen className="size-3 mr-1" /> Bu Kitapla Oku
                          </Button>
                        </div>
                      </div>

                      {/* Summary & Why Read */}
                      <p className="text-xs text-foreground/90 leading-relaxed bg-muted/20 p-2.5 rounded-xl border border-border/40">
                        {rec.summary}
                      </p>

                      <div className="space-y-1.5 text-xs">
                        <span className="font-semibold text-primary block text-[11px]">💡 Neden Okumalısın?</span>
                        <p className="text-xs text-muted-foreground">{rec.whyRead}</p>
                      </div>

                      {/* Key Takeaways */}
                      <div className="space-y-1 pt-1 border-t border-border/40">
                        <span className="text-[10.5px] font-semibold text-muted-foreground block">
                          Öne Çıkan Çıkarımlar:
                        </span>
                        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                          {rec.keyTakeaways.map((item, idx) => (
                            <li
                              key={idx}
                              className="text-[10.5px] text-muted-foreground bg-muted/40 px-2 py-1 rounded-lg flex items-center gap-1.5"
                            >
                              <span className="size-1 rounded-full bg-primary shrink-0" />
                              <span className="truncate">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ADD NEW BOOK (YENİ KİTAP EKLE) */}
          {tab === "add" && (
            <form onSubmit={handleCreateBook} className="space-y-4 max-w-md mx-auto py-2">
              <div className="text-center space-y-1 pb-2">
                <h3 className="text-sm font-bold text-foreground">Yeni Kitap Ekle</h3>
                <p className="text-xs text-muted-foreground">
                  Okuduğun veya okumayı planladığın bir kitabı kitaplığına kaydet.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Kitap Adı *</Label>
                  <Input
                    required
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="Örn: Savaş Sanatı, Dijital Minimalizm, 1984..."
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Yazar *</Label>
                  <Input
                    required
                    value={draftAuthor}
                    onChange={(e) => setDraftAuthor(e.target.value)}
                    placeholder="Örn: Sun Tzu, Cal Newport, George Orwell..."
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Kategori</Label>
                    <select
                      value={draftCategory}
                      onChange={(e) => setDraftCategory(e.target.value)}
                      className="w-full rounded-xl border bg-background px-3 py-2 text-xs"
                    >
                      {BOOK_CATEGORIES.filter((c) => c !== "Tümü").map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Durum</Label>
                    <select
                      value={draftStatus}
                      onChange={(e) => setDraftStatus(e.target.value as any)}
                      className="w-full rounded-xl border bg-background px-3 py-2 text-xs"
                    >
                      <option value="reading">Şu an okuyorum</option>
                      <option value="want_to_read">Daha sonra okuyacağım</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Toplam Sayfa</Label>
                    <Input
                      type="number"
                      min={1}
                      value={draftTotalPages}
                      onChange={(e) => setDraftTotalPages(Number(e.target.value))}
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Kaldığın Sayfa</Label>
                    <Input
                      type="number"
                      min={0}
                      max={draftTotalPages}
                      value={draftCurrentPage}
                      onChange={(e) => setDraftCurrentPage(Number(e.target.value))}
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setTab("shelf")}
                  className="rounded-xl text-xs"
                >
                  Vazgeç
                </Button>
                <Button type="submit" size="sm" className="rounded-xl text-xs font-semibold shadow-xs">
                  <Plus className="size-3.5 mr-1" /> Kitaplığıma Ekle
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
