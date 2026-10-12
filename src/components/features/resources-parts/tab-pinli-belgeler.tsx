"use client";

import Link from "next/link";
import {
  BookOpen,
  Sparkles,
  Bookmark,
  FileText,
  Plus,
  Trash2,
  Maximize2,
} from "lucide-react";
import {
  toast,
} from "sonner";
import {
  Button,
} from "@/components/ui/button";
import {
  loadSavedPageRanges,
  deleteSavedPageRange,
  clearAllSavedPageRanges,
  loadStarterPageRanges,
  loadPinnedDocs,
  deletePinnedDoc,
  clearAllPinnedDocs,
  loadStarterPinnedDocs,
} from "@/lib/resources-hub";
import {
  cn,
} from "@/lib/utils";
import type { ResourcesHubCtx } from "./use-resources-hub";

export function TabPinliBelgeler({ ctx }: { ctx: ResourcesHubCtx }) {
  const {
    activeTab,
    pageRanges,
    setPageRanges,
    pinnedDocs,
    setPinnedDocs,
    setAddRangeModalOpen,
    setAddPinModalOpen,
    setLightboxDoc,
    handleGenerateSummary,
  } = ctx;
  return (
    <>
      {/* ===================================================================== */}
      {/* TAB 3: PİNLİ BELGELER & SAYFA ARALIKLARI                             */}
      {/* ===================================================================== */}
      {activeTab === "ranges_pins" && (
        <div className="space-y-6">
          {/* Section A: Saved Page Ranges */}
          <div className="rounded-3xl border bg-card/60 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">Kayıtlı Sayfa Aralıkları</h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                    {pageRanges.length} aralık
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Okuduğun kitap veya dokümanlardan odaklanmak istediğin özel sayfa aralıkları.
                </p>
              </div>
    
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setAddRangeModalOpen(true)}
                  className="rounded-xl text-xs h-8"
                >
                  <Plus className="mr-1 size-3.5" />
                  Sayfa Aralığı Kaydet
                </Button>
                {pageRanges.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (window.confirm("Tüm kayıtlı sayfa aralıklarını silmek istediğinizden emin misiniz?")) {
                        clearAllSavedPageRanges();
                        setPageRanges(loadSavedPageRanges());
                        toast.info("Tüm sayfa aralıkları temizlendi.");
                      }
                    }}
                    className="rounded-xl text-xs h-8 px-2.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                    title="Aralıkları Temizle"
                  >
                    <Trash2 className="mr-1 size-3.5" />
                    Tümünü Temizle
                  </Button>
                )}
              </div>
            </div>
    
            {pageRanges.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed rounded-2xl bg-card/40 space-y-3">
                <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto grid place-items-center">
                  <Bookmark className="size-6 opacity-80" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-sm font-bold text-foreground">Kayıtlı Sayfa Aralığı Yok</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Burası sizin kişisel alanınızdır. Okuduğunuz kitaplardan veya teknik dokümanlardan derinleşmek istediğiniz sayfa aralıklarını (ör: Sayfa 45–80) kaydedebilirsiniz.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => setAddRangeModalOpen(true)}
                    className="rounded-xl text-xs h-8"
                  >
                    <Plus className="mr-1 size-3.5" />
                    Sayfa Aralığı Kaydet
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      loadStarterPageRanges();
                      setPageRanges(loadSavedPageRanges());
                      toast.success("Örnek sayfa aralıkları yüklendi.");
                    }}
                    className="rounded-xl text-xs h-8 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                  >
                    <Sparkles className="mr-1 size-3.5" />
                    Örnek Aralıkları Yükle
                  </Button>
                </div>
              </div>
            ) : (
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
            )}
          </div>
    
          {/* Section B: Pinned Documents & Visual Pinboard */}
          <div className="rounded-3xl border bg-card/60 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">Pinli Belgeler, PDF &amp; Sayfa Ekran Görüntüleri</h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                    {pinnedDocs.length} belge
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mimari şemalar, cheat sheetler veya defter fotoğraflarını görsel panoda sakla.
                </p>
              </div>
    
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setAddPinModalOpen(true)}
                  className="rounded-xl text-xs h-8"
                >
                  <Plus className="mr-1 size-3.5" />
                  Görsel / PDF Pinle
                </Button>
                {pinnedDocs.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (window.confirm("Panodaki tüm pinli belgeleri silmek istediğinizden emin misiniz?")) {
                        clearAllPinnedDocs();
                        setPinnedDocs(loadPinnedDocs());
                        toast.info("Tüm pinli belgeler temizlendi.");
                      }
                    }}
                    className="rounded-xl text-xs h-8 px-2.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                    title="Panoyu Temizle"
                  >
                    <Trash2 className="mr-1 size-3.5" />
                    Tümünü Temizle
                  </Button>
                )}
              </div>
            </div>
    
            {pinnedDocs.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed rounded-2xl bg-card/40 space-y-3">
                <div className="size-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 mx-auto grid place-items-center">
                  <FileText className="size-6 opacity-80" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-sm font-bold text-foreground">Görsel Panonuz Boş</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Burası sizin kişisel çalışma panonuzdur. Mimari şemaları, cheat sheetleri veya defter fotoğraflarını odak seansında incelemek üzere pinleyebilirsiniz.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => setAddPinModalOpen(true)}
                    className="rounded-xl text-xs h-8"
                  >
                    <Plus className="mr-1 size-3.5" />
                    Görsel / PDF Pinle
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      loadStarterPinnedDocs();
                      setPinnedDocs(loadPinnedDocs());
                      toast.success("Örnek belgeler panoya yüklendi.");
                    }}
                    className="rounded-xl text-xs h-8 text-sky-600 dark:text-sky-400 border-sky-500/30 hover:bg-sky-500/10"
                  >
                    <Sparkles className="mr-1 size-3.5" />
                    Örnek Belgeleri Yükle
                  </Button>
                </div>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      )}
    
    </>
  );
}
