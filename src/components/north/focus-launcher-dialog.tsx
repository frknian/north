"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Zap,
  BookOpen,
  Play,
  Clock,
  CheckCircle2,
  PenTool,
  Feather,
  Plus,
  BookMarked,
  Layers,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { loadBooks, type NorthBook } from "@/lib/books";
import { BookLibraryModal } from "./book-library-modal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FocusLauncherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: "free" | "reading";
}

export function FocusLauncherDialog({
  open,
  onOpenChange,
  defaultMode = "free",
}: FocusLauncherDialogProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"free" | "reading">(defaultMode);

  // Free Focus Configuration
  const [freeType, setFreeType] = useState<"taskless" | "custom_intent">("taskless");
  const [customTitle, setCustomTitle] = useState("");
  const [customGoal, setCustomGoal] = useState("");
  const [selectedMinutes, setSelectedMinutes] = useState<number>(45);

  // Book Reading Configuration
  const [books, setBooks] = useState<NorthBook[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [readingMinutes, setReadingMinutes] = useState<number>(30);

  useEffect(() => {
    if (open) {
      setActiveTab(defaultMode);
      const loaded = loadBooks();
      setBooks(loaded);
      const activeReading = loaded.find((b) => b.status === "reading");
      if (activeReading) {
        setSelectedBookId(activeReading.id);
      } else if (loaded.length > 0) {
        setSelectedBookId(loaded[0].id);
      }
    }
  }, [open, defaultMode]);

  const handleStartFreeFocus = () => {
    const titleParam = freeType === "custom_intent" && customTitle.trim() ? encodeURIComponent(customTitle.trim()) : "";
    const goalParam = freeType === "custom_intent" && customGoal.trim() ? encodeURIComponent(customGoal.trim()) : "";
    const minutesParam = selectedMinutes > 0 ? selectedMinutes : 0;

    let url = `/focus/free?minutes=${minutesParam}`;
    if (titleParam) url += `&title=${titleParam}`;
    if (goalParam) url += `&goal=${goalParam}`;

    onOpenChange(false);
    router.push(url);
  };

  const handleStartReadingFocus = () => {
    if (!selectedBookId) {
      toast.error("Lütfen okumak için bir kitap seçin veya yeni bir kitap ekleyin.");
      return;
    }
    onOpenChange(false);
    router.push(`/focus/reading?bookId=${selectedBookId}&minutes=${readingMinutes}`);
  };

  const selectedBook = books.find((b) => b.id === selectedBookId);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl border-border/70 shadow-2xl">
          <DialogHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/20 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="size-4" />
              </span>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                  İsteğe Bağlı Odak Oturumu
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Sistemin görevlerinden bağımsız; serbest çalış veya kitap okuma seansına başla.
                </DialogDescription>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-1.5 mt-3 pt-1 border-t border-border/40">
              <button
                type="button"
                onClick={() => setActiveTab("free")}
                className={cn(
                  "py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center flex items-center justify-center gap-2",
                  activeTab === "free"
                    ? "bg-primary text-primary-foreground border-primary shadow-2xs font-bold"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/60"
                )}
              >
                <Zap className="size-3.5" />
                <span>Serbest Odak</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("reading")}
                className={cn(
                  "py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center flex items-center justify-center gap-2",
                  activeTab === "reading"
                    ? "bg-primary text-primary-foreground border-primary shadow-2xs font-bold"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/60"
                )}
              >
                <BookOpen className="size-3.5" />
                <span>Kitap Okuma Odağı</span>
              </button>
            </div>
          </DialogHeader>

          {/* Mode 1: FREE FOCUS */}
          {activeTab === "free" && (
            <div className="p-4 sm:p-5 space-y-4 text-xs">
              {/* Intent Selection: Taskless vs Custom Intent */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Oturum Tipi</Label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={cn(
                      "flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition-all",
                      freeType === "taskless"
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border/60 hover:bg-muted/20 text-muted-foreground"
                    )}
                  >
                    <input
                      type="radio"
                      name="free_type"
                      checked={freeType === "taskless"}
                      onChange={() => setFreeType("taskless")}
                      className="mt-0.5 accent-primary"
                    />
                    <div className="min-w-0">
                      <span className="font-semibold block text-xs text-foreground">🌿 Görevsiz & Serbest</span>
                      <span className="text-[10.5px] text-muted-foreground block leading-tight">
                        Hiçbir şey yazmadan doğrudan akışa gir. Baskı ve kural yok.
                      </span>
                    </div>
                  </label>

                  <label
                    className={cn(
                      "flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition-all",
                      freeType === "custom_intent"
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border/60 hover:bg-muted/20 text-muted-foreground"
                    )}
                  >
                    <input
                      type="radio"
                      name="free_type"
                      checked={freeType === "custom_intent"}
                      onChange={() => setFreeType("custom_intent")}
                      className="mt-0.5 accent-primary"
                    />
                    <div className="min-w-0">
                      <span className="font-semibold block text-xs text-foreground">✍️ Niyetimi Yazacağım</span>
                      <span className="text-[10.5px] text-muted-foreground block leading-tight">
                        Kendi başlığını ve hedefini belirle.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Custom Intent Fields (Only if custom_intent selected) */}
              {freeType === "custom_intent" && (
                <div className="space-y-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 animate-in fade-in-50">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Bu seansta ne yapacaksın?</Label>
                    <Input
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Örn: Algoritma soru çözümü, Makale taslağı, Kod refactoring..."
                      className="rounded-xl text-xs bg-background"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      Hedeflenen çıktı / not (İsteğe bağlı)
                    </Label>
                    <Input
                      value={customGoal}
                      onChange={(e) => setCustomGoal(e.target.value)}
                      placeholder="Örn: En az 3 LeetCode sorusunu tamamla ve not çıkar"
                      className="rounded-xl text-xs bg-background"
                    />
                  </div>
                </div>
              )}

              {/* Duration Selector */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Hedef Süre</Label>
                  <span className="text-xs font-mono font-bold text-primary">
                    {selectedMinutes > 0 ? `${selectedMinutes} dakika` : "Açık Uçlu (Kronometre)"}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[15, 25, 45, 60, 90].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMinutes(m)}
                      className={cn(
                        "py-1.5 text-xs font-semibold rounded-lg border transition-all text-center",
                        selectedMinutes === m
                          ? "bg-primary border-primary text-primary-foreground font-bold shadow-2xs"
                          : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      {m} dk
                    </button>
                  ))}
                </div>
              </div>

              {/* Informational reassurance */}
              <div className="rounded-xl border border-border/50 bg-muted/20 p-2.5 flex items-center gap-2 text-muted-foreground">
                <Feather className="size-3.5 text-primary shrink-0" />
                <p className="text-[11px] leading-tight">
                  {freeType === "taskless"
                    ? "Görevsiz oturumda zihnini serbest bırakabilir; ortam sesleri, karalama defteri ve sayaçla odaklanabilirsin."
                    : "Belirlediğin hedefler oturum boyunca ekranda rehber olarak kalacak."}
                </p>
              </div>

              <DialogFooter className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl text-xs"
                >
                  Vazgeç
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleStartFreeFocus}
                  className="rounded-xl text-xs font-semibold shadow-xs"
                >
                  <Play className="size-3.5 mr-1.5 fill-current" />
                  {freeType === "taskless" ? "Serbest Odak Başlat" : "Hedefli Odak Başlat"}
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Mode 2: BOOK READING FOCUS */}
          {activeTab === "reading" && (
            <div className="p-4 sm:p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Okuyacağın Kitap</Label>
                <button
                  type="button"
                  onClick={() => setLibraryModalOpen(true)}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                >
                  <BookMarked className="size-3" /> Kitaplık & Tavsiyeler
                </button>
              </div>

              {/* Currently Available Books */}
              {books.length === 0 ? (
                <div className="rounded-xl border border-dashed p-4 text-center space-y-2 bg-muted/10">
                  <p className="text-xs text-muted-foreground">Kitaplığında henüz kitap bulunmuyor.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLibraryModalOpen(true)}
                    className="rounded-xl text-xs"
                  >
                    <Plus className="size-3.5 mr-1" /> Kitap Ekle veya Tavsiye Keşfet
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {books.map((b) => {
                    const isSelected = b.id === selectedBookId;
                    const percent = Math.min(100, Math.round((b.currentPage / b.totalPages) * 100));
                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBookId(b.id)}
                        className={cn(
                          "p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2.5",
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                            : "border-border/60 hover:bg-muted/20"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            📖
                          </span>
                          <div className="min-w-0">
                            <span className="font-semibold text-foreground block truncate text-xs">{b.title}</span>
                            <span className="text-[10.5px] text-muted-foreground block truncate">
                              {b.author} · Sayfa {b.currentPage} / {b.totalPages} (%{percent})
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <Badge variant="secondary" className="text-[10px] bg-primary/15 text-primary border-primary/30">
                            Seçili
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Reading Duration Selector */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Okuma Süresi</Label>
                  <span className="text-xs font-mono font-bold text-primary">{readingMinutes} dakika</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[20, 30, 45, 60].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setReadingMinutes(m)}
                      className={cn(
                        "py-1.5 text-xs font-semibold rounded-lg border transition-all text-center",
                        readingMinutes === m
                          ? "bg-primary border-primary text-primary-foreground font-bold shadow-2xs"
                          : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      {m} dk
                    </button>
                  ))}
                </div>
              </div>

              {selectedBook && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5 text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>
                    Kaldığın sayfa: <strong>{selectedBook.currentPage}</strong>. Seans sonunda kaçıncı sayfaya geldiğin kaydedilecek.
                  </span>
                </div>
              )}

              <DialogFooter className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl text-xs"
                >
                  Vazgeç
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!selectedBookId}
                  onClick={handleStartReadingFocus}
                  className="rounded-xl text-xs font-semibold shadow-xs"
                >
                  <BookOpen className="size-3.5 mr-1.5" />
                  Okuma Odağını Başlat
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Embedded Library & Recommendations Modal */}
      <BookLibraryModal
        open={libraryModalOpen}
        onOpenChange={setLibraryModalOpen}
        onStartReadingFocus={(book) => {
          setSelectedBookId(book.id);
          setBooks(loadBooks());
          setLibraryModalOpen(false);
        }}
      />
    </>
  );
}
