"use client";

import {
  BookOpen,
  Search,
  ExternalLink,
  Sparkles,
  Bookmark,
  Download,
  Plus,
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
} from "@/lib/books";
import {
  cn,
} from "@/lib/utils";
import type { ResourcesHubCtx } from "./use-resources-hub";

export function TabWebGoogle({ ctx }: { ctx: ResourcesHubCtx }) {
  const {
    activeTab,
    setBooks,
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    googleBookInput,
    setGoogleBookInput,
    setAddRangeModalOpen,
    setRangeBookTitle,
    setRangeStart,
    setRangeEnd,
    setRangeTopic,
    handleSearch,
    handleGoogleBookSearch,
    handleGenerateSummary,
  } = ctx;
  return (
    <>
      {/* ===================================================================== */}
      {/* TAB 2: WEB & GOOGLE PDF ARAMA (LIVE WEB SEARCH & GOOGLE BOOKS / PDF)  */}
      {/* ===================================================================== */}
      {activeTab === "web" && (
        <div className="space-y-6">
          {/* Web Search Bar & Google PDF Card */}
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
                    handleSearch(undefined, chip);
                  }}
                  className="rounded-lg border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
    
            {/* Google Kitap & Doğrulanmış PDF Arama Motoru */}
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 mt-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg bg-indigo-500/10 text-indigo-500">
                    <BookOpen className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Google Kitap &amp; Doğrulanmış PDF Arama Motoru</h3>
                    <p className="text-[11px] text-muted-foreground">Kitap, akademik makale ve açık erişimli PDF dokümanlarını sistem içinde doğrudan tara ve oku.</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] text-indigo-600 dark:text-indigo-400 border-indigo-500/30">
                    Sistem İçi Canlı Tarama
                  </Badge>
                </div>
              </div>
    
              <form onSubmit={handleGoogleBookSearch} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={googleBookInput}
                    onChange={(e) => setGoogleBookInput(e.target.value)}
                    placeholder="Kitap adı, yazar veya konu yaz (örn: Active Directory, Clean Code, Burp Suite)..."
                    className="w-full rounded-xl border border-border bg-background pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={searchLoading}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 h-9 shadow-xs"
                >
                  <Search className="mr-1.5 size-3.5" />
                  Google PDF Ara
                </Button>
              </form>
            </div>
          </div>
    
          {/* Loading Skeleton */}
          {searchLoading && (
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="rounded-2xl border bg-card/60 p-4 space-y-3 animate-pulse">
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-16 bg-muted rounded" />
                    <div className="h-3 w-20 bg-muted rounded" />
                  </div>
                  <div className="h-5 w-3/4 bg-muted rounded" />
                  <div className="h-12 w-full bg-muted rounded" />
                  <div className="h-8 w-1/3 bg-muted rounded" />
                </div>
              ))}
            </div>
          )}
    
          {/* Empty State / Search Results */}
          {!searchLoading && searchResults.length === 0 && (
            <div className="rounded-2xl border border-dashed bg-card/40 p-8 text-center space-y-3">
              <div className="mx-auto grid size-10 place-items-center rounded-2xl bg-muted text-muted-foreground">
                <Search className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  {searchQuery ? `"${searchQuery}" için doğrudan sonuç bulunamadı` : "Canlı Araştırma Yap veya Kitap Tara"}
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  {searchQuery
                    ? "Farklı anahtar kelimelerle arama yapabilir veya yukarıdaki kutucuğa kitap adı yazarak doğrudan Google PDF sonuçlarını görüntüleyebilirsiniz."
                    : "Yukarıdaki arama çubuğuna siber güvenlik konusu, araç veya kitap adı yazarak canlı web dokümanlarına ve doğrulanmış PDF kitaplara erişebilirsin."}
                </p>
              </div>
            </div>
          )}
    
          {/* Search Results Grid */}
          {!searchLoading && searchResults.length > 0 && (
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((item) => {
                const isBook = item.type === "book" || Boolean(item.downloadUrl || item.author);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between rounded-2xl border bg-card/70 p-4 space-y-3 hover:border-border/80 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "rounded-md font-semibold px-2 py-0.5 uppercase",
                            isBook
                              ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          )}>
                            {isBook ? "GOOGLE PDF · KİTAP" : item.type.toUpperCase()}
                          </span>
                          {item.fileExt && (
                            <span className="rounded-md bg-muted px-1.5 py-0.5 font-bold uppercase text-[9px] text-muted-foreground">
                              {item.fileExt}
                            </span>
                          )}
                          {item.fileSize && (
                            <span className="text-[10px] text-muted-foreground">
                              {item.fileSize}
                            </span>
                          )}
                        </div>
                        <span className="text-muted-foreground truncate max-w-[120px]" title={item.provider}>
                          {item.provider}
                        </span>
                      </div>
    
                      <h3 className="font-bold text-foreground text-sm leading-snug">
                        {item.title}
                      </h3>
    
                      {item.author && (
                        <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <BookOpen className="size-3 shrink-0" />
                          <span className="truncate">{item.author} {item.year ? `(${item.year})` : ""}</span>
                        </p>
                      )}
    
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
                      <div className="flex items-center gap-1.5">
                        <a
                          href={item.downloadUrl || item.url}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(
                            "inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-semibold transition-colors shadow-xs",
                            isBook
                              ? "bg-indigo-600 text-white hover:bg-indigo-500"
                              : "bg-primary/10 text-primary hover:bg-primary/20"
                          )}
                        >
                          <span>{isBook ? "PDF Oku / Aç" : "Aç"}</span>
                          {isBook ? <Download className="size-3" /> : <ExternalLink className="size-3" />}
                        </a>
    
                        {isBook && (
                          <button
                            type="button"
                            onClick={() => {
                              addBook({
                                title: item.title.split(/[-–—|:]/)[0].trim(),
                                author: item.author || "Seçkin Yazar",
                                category: "Teknik",
                                totalPages: 300,
                                currentPage: 0,
                                status: "reading",
                              });
                              setBooks(loadBooks());
                              toast.success(`"${item.title.split(/[-–—|:]/)[0].trim()}" kitaplığına eklendi!`);
                            }}
                            className="rounded-lg border bg-muted/30 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                            title="Kitaplığıma Ekle"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        )}
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
                          className="rounded-lg border bg-muted/30 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Sayfa aralığı kaydet"
                        >
                          <Bookmark className="size-3.5" />
                        </button>
    
                        <button
                          type="button"
                          onClick={() => handleGenerateSummary(item.title, `${item.description}\n\nKaynak: ${item.url}`)}
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
          )}
        </div>
      )}
    
    </>
  );
}
