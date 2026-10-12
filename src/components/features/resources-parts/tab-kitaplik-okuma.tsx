"use client";

import Link from "next/link";
import {
  BookOpen,
  Search,
  ExternalLink,
  Sparkles,
  Bookmark,
  Check,
  Plus,
  Trash2,
  Edit3,
} from "lucide-react";
import {
  toast,
} from "sonner";
import {
  Button,
} from "@/components/ui/button";
import {
  Badge,
} from "@/components/ui/badge";
import {
  loadBooks,
  addBook,
  deleteBook,
  clearAllBooks,
  loadStarterBooks,
  BOOK_CATEGORIES,
  BOOK_GOAL_MOODS,
} from "@/lib/books";
import {
  cn,
} from "@/lib/utils";
import type { ResourcesHubCtx } from "./use-resources-hub";

export function TabKitaplikOkuma({ ctx }: { ctx: ResourcesHubCtx }) {
  const {
    activeTab,
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
    shelfPdfQuery,
    setShelfPdfQuery,
    shelfPdfResults,
    setShelfPdfResults,
    shelfPdfLoading,
    activePdfSearchTitle,
    setActivePdfSearchTitle,
    setAddBookModalOpen,
    setAddRangeModalOpen,
    setRangeBookTitle,
    setRangeStart,
    setRangeEnd,
    setRangeTopic,
    filteredRecs,
    handleGooglePdfSearch,
    handleGenerateSummary,
    handleOpenPageUpdate,
  } = ctx;
  return (
    <>
      {/* ===================================================================== */}
      {/* TAB 1: KİTAPLIK & OKUMA (INTEGRATED BOOKS SYSTEM)                     */}
      {/* ===================================================================== */}
      {activeTab === "books" && (
        <div className="space-y-6">
          {/* Books Shelf Section */}
          <div className="rounded-3xl border bg-card/60 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">Okuma Rafım</h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                    {books.length} {books.length === 1 ? "kitap" : "kitap"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Aktif okuma seansları, sayfa ilerlemeleri ve alıntılar.</p>
              </div>
    
              <div className="flex flex-wrap items-center gap-2">
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
    
                <div className="flex items-center gap-1.5 sm:border-l sm:border-border/60 sm:pl-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAddBookModalOpen(true)}
                    className="rounded-xl text-xs h-7 px-2.5"
                  >
                    <Plus className="mr-1 size-3" />
                    Yeni Kitap
                  </Button>
                  {books.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm("Kitaplığınızdaki tüm kitapları kaldırmak istediğinizden emin misiniz?")) {
                          clearAllBooks();
                          setBooks(loadBooks());
                          toast.info("Kitaplığınız temizlendi.");
                        }
                      }}
                      className="rounded-xl text-xs h-7 px-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                      title="Kitaplığı Temizle"
                    >
                      <Trash2 className="mr-1 size-3" />
                      Tümünü Temizle
                    </Button>
                  )}
                </div>
              </div>
            </div>
    
            {/* Google PDF Search Bar in Bookshelf */}
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3 sm:p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={shelfPdfQuery}
                  onChange={(e) => setShelfPdfQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleGooglePdfSearch(shelfPdfQuery);
                    }
                  }}
                  placeholder="Google PDF ara: Kitap adı, yazar veya siber güvenlik konusu..."
                  className="w-full rounded-xl border border-border/70 bg-background/90 pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <Button
                type="button"
                disabled={shelfPdfLoading}
                onClick={() => handleGooglePdfSearch(shelfPdfQuery)}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 px-3.5 shrink-0 shadow-xs"
              >
                <Search className="mr-1.5 size-3.5" />
                {shelfPdfLoading ? "Aranıyor..." : "Google PDF Bul"}
              </Button>
            </div>
    
            {/* In-System Google PDF Search Results Panel */}
            {(shelfPdfLoading || shelfPdfResults.length > 0) && (
              <div id="shelf-pdf-results-panel" className="rounded-2xl border-2 border-indigo-500/30 bg-indigo-500/5 p-4 sm:p-5 space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-xl bg-indigo-500 text-white shadow-xs">
                      <BookOpen className="size-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">
                          Doğrulanmış Google PDF &amp; Kitap Kaynakları
                        </h3>
                        <Badge className="bg-indigo-600 text-white text-[10px] font-semibold">
                          Sistem İçi Doğrulanmış
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {activePdfSearchTitle
                          ? `"${activePdfSearchTitle}" için Google veritabanından bulunan açık kaynak PDF dokümanları.`
                          : "Google veritabanı üzerinden taranmış güvenilir kitap ve PDF kaynakları."}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShelfPdfResults([]);
                      setActivePdfSearchTitle("");
                    }}
                    className="rounded-xl text-xs h-7 text-muted-foreground hover:text-foreground"
                  >
                    ✕ Kapat
                  </Button>
                </div>
    
                {shelfPdfLoading ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="rounded-xl border bg-background/70 p-4 space-y-3 animate-pulse">
                        <div className="h-4 w-20 bg-muted rounded" />
                        <div className="h-4 w-3/4 bg-muted rounded" />
                        <div className="h-10 w-full bg-muted rounded" />
                        <div className="h-7 w-1/2 bg-muted rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {shelfPdfResults.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col justify-between rounded-xl border bg-background/95 p-4 space-y-3 hover:border-indigo-500/50 transition-all shadow-xs"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 uppercase">
                              {item.fileExt ? `${item.fileExt.toUpperCase()} BELGESİ` : "KİTAP"}
                            </span>
                            <span className="font-mono text-muted-foreground truncate max-w-[130px]" title={item.provider}>
                              {item.provider}
                            </span>
                          </div>
    
                          <div>
                            <h4 className="font-bold text-foreground text-xs leading-snug line-clamp-2">
                              {item.title}
                            </h4>
                            {item.author && (
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {item.author} {item.year ? `(${item.year})` : ""}
                              </p>
                            )}
                          </div>
    
                          <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">
                            {item.description}
                          </p>
    
                          {item.keyTakeaways && item.keyTakeaways.length > 0 && (
                            <div className="rounded-lg border bg-muted/30 p-2 text-[10px] text-muted-foreground">
                              <span className="font-semibold text-foreground">Önemli Nokta: </span>
                              {item.keyTakeaways[0]}
                            </div>
                          )}
                        </div>
    
                        <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <a
                              href={item.downloadUrl || item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 text-[11px] font-semibold transition-colors shadow-xs"
                              title="Doğrulanmış PDF'i yeni sekmede görüntüle"
                            >
                              <span>PDF Oku / Aç</span>
                              <ExternalLink className="size-2.5" />
                            </a>
    
                            <button
                              type="button"
                              onClick={() => {
                                addBook({
                                  title: item.title.split(/[-–—|:]/)[0].trim(),
                                  author: item.author || "Seçkin Yazar",
                                  category: "Teknik & Araştırma",
                                  totalPages: 300,
                                  currentPage: 0,
                                  status: "reading",
                                });
                                setBooks(loadBooks());
                                toast.success(`"${item.title.split(/[-–—|:]/)[0].trim()}" kitaplığına eklendi!`);
                              }}
                              className="rounded-lg border bg-muted/40 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                              title="Kitaplığıma Ekle"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
    
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
                              className="rounded-lg border bg-muted/40 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                              title="Sayfa aralığı kaydet"
                            >
                              <Bookmark className="size-3.5" />
                            </button>
    
                            <button
                              type="button"
                              onClick={() => handleGenerateSummary(item.title, `${item.description}\n\nKaynak: ${item.url}`)}
                              className="rounded-lg border bg-muted/40 p-1.5 text-muted-foreground hover:text-indigo-500 hover:bg-muted"
                              title="AI Özeti Çıkar"
                            >
                              <Sparkles className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
    
            {/* Book Shelf State */}
            {books.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed rounded-2xl bg-card/40 space-y-3">
                <div className="size-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mx-auto grid place-items-center">
                  <BookOpen className="size-6 opacity-80" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-sm font-bold text-foreground">Kişisel Kitaplığınız Boş</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Burası sizin kişisel okuma alanınızdır. Dilediğiniz kitabı ekleyebilir veya aşağıdaki önerilen kitap kataloğundan beğendiklerinizi tek tıkla kitaplığınıza dahil edebilirsiniz.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => setAddBookModalOpen(true)}
                    className="rounded-xl text-xs h-8"
                  >
                    <Plus className="mr-1 size-3.5" />
                    Yeni Kitap Ekle
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      loadStarterBooks();
                      setBooks(loadBooks());
                      toast.success("Örnek kitaplar kitaplığınıza eklendi.");
                    }}
                    className="rounded-xl text-xs h-8 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10"
                  >
                    <Sparkles className="mr-1 size-3.5" />
                    Örnek Kitapları Yükle
                  </Button>
                </div>
              </div>
            ) : books.filter((b) => (bookFilter === "all" ? true : b.status === bookFilter)).length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed rounded-2xl bg-card/30 space-y-2">
                <p className="text-xs text-muted-foreground">Bu filtre durumunda kitap bulunmuyor.</p>
                <Button size="sm" variant="ghost" onClick={() => setBookFilter("all")} className="text-xs h-7">
                  Tüm Kitapları Göster
                </Button>
              </div>
            ) : (
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {books
                  .filter((b) => (bookFilter === "all" ? true : b.status === bookFilter))
                  .map((book) => {
                    const percent = Math.min(100, Math.round((book.currentPage / book.totalPages) * 100));
                    return (
                      <div
                        key={book.id}
                        className="group flex flex-col justify-between rounded-2xl border bg-background/80 p-4 transition-all hover:border-indigo-500/40 hover:shadow-xs overflow-hidden"
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
    
                            {/* Kitap İsminin Yanında Google PDF Arama Çubuğu & Butonu */}
                            <div className="mt-2 flex items-center gap-1.5">
                              <div className="relative flex-1">
                                <input
                                  type="text"
                                  defaultValue={`${book.title} ${book.author}`}
                                  id={`search-input-book-${book.id}`}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleGooglePdfSearch((e.target as HTMLInputElement).value, book.title);
                                    }
                                  }}
                                  placeholder="Google PDF ara..."
                                  className="w-full rounded-lg border border-border/70 bg-background/90 px-2.5 py-1 text-[11px] text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden"
                                />
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  const input = document.getElementById(`search-input-book-${book.id}`) as HTMLInputElement;
                                  handleGooglePdfSearch(input?.value || `${book.title} ${book.author}`, book.title);
                                }}
                                disabled={shelfPdfLoading && activePdfSearchTitle === book.title}
                                className="h-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold px-2 shrink-0 shadow-xs"
                                title="Google'da doğrulanmış PDF ara"
                              >
                                <Search className="size-2.5 mr-1" />
                                {shelfPdfLoading && activePdfSearchTitle === book.title ? "..." : "PDF Bul"}
                              </Button>
                            </div>
                          </div>
    
                          {/* Progress Bar */}
                          <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                              <span className="flex items-center gap-1.5">
                                Sayfa <strong>{book.currentPage}</strong> / {book.totalPages}
                                <button
                                  type="button"
                                  onClick={() => handleOpenPageUpdate(book)}
                                  className="rounded px-1.5 py-0.5 text-[9px] font-sans font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors inline-flex items-center gap-0.5"
                                  title="Kaldığın sayfayı veya toplam sayfa sayısını güncelle"
                                >
                                  <Edit3 className="size-2.5" />
                                  Güncelle
                                </button>
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
                        <div className="mt-4 pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Button asChild size="sm" className="rounded-xl text-xs h-7 px-2.5 shadow-xs">
                              <Link href={`/focus/reading?bookId=${book.id}&minutes=30`}>
                                <BookOpen className="mr-1 size-3" />
                                Oku
                              </Link>
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenPageUpdate(book)}
                              className="rounded-xl text-xs h-7 px-2 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10 font-medium"
                              title="Sayfa sayısını veya kaldığın sayfayı güncelle"
                            >
                              <Edit3 className="mr-1 size-3" />
                              Sayfa
                            </Button>
                          </div>
    
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setRangeBookTitle(book.title);
                                setRangeStart(String(book.currentPage || 1));
                                setRangeEnd(String(Math.min(book.totalPages, (book.currentPage || 1) + 30)));
                                setAddRangeModalOpen(true);
                              }}
                              className="size-7 rounded-lg border bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              title="Sayfa aralığı kaydet"
                            >
                              <Bookmark className="size-3.5" />
                            </button>
    
                            <button
                              type="button"
                              onClick={() => handleGooglePdfSearch(`${book.title} ${book.author}`, book.title)}
                              className="size-7 rounded-lg border bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-indigo-500 hover:bg-muted transition-colors"
                              title="Sistemde Google PDF Ara"
                            >
                              <Search className="size-3.5" />
                            </button>
    
                            <button
                              type="button"
                              onClick={() => handleGenerateSummary(book.title, `Yazar: ${book.author}\nKategori: ${book.category}\nAlıntılar: ${(book.favoriteQuotes || []).join(" · ")}`)}
                              className="size-7 rounded-lg border bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-indigo-500 hover:bg-muted transition-colors"
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
                              className="size-7 rounded-lg border bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-muted transition-colors"
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
            )}
          </div>
    
          {/* Curated Recommendations Section */}
          <div className="rounded-3xl border bg-card/60 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
              <div>
                <h2 className="text-base font-bold text-foreground">Tavsiye Kitaplık &amp; Keşfet (Öneriler)</h2>
                <p className="text-xs text-muted-foreground">
                  Siber güvenlik, yazılım mimarisi ve derin odak alanında küratör onaylı başyapıtlar. Yalnızca beğendiklerinizi kişisel rafınıza ekleyebilirsiniz.
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
    
                        {/* Kitap İsminin Yanında Google PDF Arama Çubuğu & Butonu */}
                        <div className="mt-2 flex items-center gap-1.5">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              defaultValue={`${rec.title} ${rec.author}`}
                              id={`search-input-rec-${rec.id}`}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleGooglePdfSearch((e.target as HTMLInputElement).value, rec.title);
                                }
                              }}
                              placeholder="Google PDF ara..."
                              className="w-full rounded-lg border border-border/70 bg-background/90 px-2.5 py-1 text-[11px] text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden"
                            />
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              const input = document.getElementById(`search-input-rec-${rec.id}`) as HTMLInputElement;
                              handleGooglePdfSearch(input?.value || `${rec.title} ${rec.author}`, rec.title);
                            }}
                            disabled={shelfPdfLoading && activePdfSearchTitle === rec.title}
                            className="h-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold px-2 shrink-0 shadow-xs"
                            title="Google'da doğrulanmış PDF ara"
                          >
                            <Search className="size-2.5 mr-1" />
                            {shelfPdfLoading && activePdfSearchTitle === rec.title ? "..." : "PDF Bul"}
                          </Button>
                        </div>
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
                        <button
                          type="button"
                          onClick={() => handleGooglePdfSearch(`${rec.title} ${rec.author}`, rec.title)}
                          className="rounded-lg border bg-muted/30 p-1.5 text-muted-foreground hover:text-indigo-500 hover:bg-muted"
                          title="Sistemde Google PDF Ara"
                        >
                          <Search className="size-3.5" />
                        </button>
    
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
    
    </>
  );
}
