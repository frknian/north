"use client";

import {
  BookOpen,
  Brain,
  Camera,
  Check,
  FileText,
  Heart,
  ListChecks,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Zap,
  Quote,
  Bookmark,
} from "lucide-react";
import {
  dayKey,
  suggestDailyAdaptation,
  type NorthActivity,
} from "@/lib/north";
import {
  loadBooks,
  updateBook,
  logReadingSession,
} from "@/lib/books";
import {
  inferTaskType,
  refreshIntelligence,
} from "@/lib/north-intelligence";
import {
  browserCompanion,
} from "@/lib/focus-companion";
import {
  fieldClass,
} from "../shared";
import {
  Button,
} from "@/components/ui/button";
import {
  NorthAI,
} from "../ai";
import {
  FocusSoundMixer,
} from "../focus-sound-mixer";
import {
  FocusResourcesDock,
} from "../focus-resources-dock";
import {
  updateSavedPageRange,
  generateSessionNotebookLMSnippet,
} from "@/lib/resources-hub";
import {
  clearFocusLock,
} from "@/lib/focus-lock";
import {
  toast,
} from "sonner";
import {
  BRAIN_DUMP_KEY,
} from "./module-level";
import type { FocusSessionCtx } from "./use-focus-session";

export function MainBentoCockpit({ ctx }: { ctx: FocusSessionCtx }) {
  const {
    state,
    update,
    workspace,
    router,
    isReadingMode,
    isFreeMode,
    setBooks,
    readingPageInput,
    setReadingPageInput,
    readingQuote,
    setReadingQuote,
    setBookLibraryOpen,
    freeTitle,
    setFreeTitle,
    activeRange,
    setActiveRange,
    setResourcesModalOpen,
    setResourcesModalTab,
    setLightboxDoc,
    task,
    area,
    effectiveArea,
    activeBook,
    guidance,
    completedSteps,
    copiedCmd,
    timer,
    finishing,
    outcome,
    setOutcome,
    difficulty,
    reflection,
    setReflection,
    saved,
    setSaved,
    supportSources,
    setSupportSources,
    ironWill,
    tabSwitches,
    scratchpadText,
    setScratchpadText,
    brainDumpItems,
    setBrainDumpItems,
    brainDumpInput,
    setBrainDumpInput,
    verifiedProof,
    setBreathworkOpen,
    activeSound,
    ambientVolume,
    photoProof,
    setPhotoProof,
    toggleDifficulty,
    toggleStep,
    handleCopy,
    currentMinutes,
    elapsed,
    remainingSeconds,
    handleAddBrainDump,
    handleDeleteBrainDump,
    handleToggleBrainDumpDone,
    handleSoundChange,
    handleVolumeChange,
    id,
  } = ctx;
  return (
    <>
      {/* 2. MAIN BENTO COCKPIT: ALL 4 PANELS SIDE-BY-SIDE (YANYANA) */}
      {!finishing ? (
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 [&>*]:min-h-[340px] xl:[&>*]:min-h-0">
          {/* COLUMN 1: NE YAPACAKSIN? (CHECKLIST & STEPS OR READING PROGRESS OR ZEN INTENT) */}
          {isReadingMode ? (
            <div className="h-full flex flex-col rounded-2xl border bg-card p-3 shadow-xs overflow-hidden min-h-0">
              <div className="flex items-center justify-between border-b pb-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="grid size-6 place-items-center rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0">
                    <BookOpen className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-xs font-bold text-foreground truncate">
                      {activeBook ? activeBook.title : "Kitap Seç"}
                    </h2>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {activeBook ? activeBook.author : "Kitaplık"}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setBookLibraryOpen(true)}
                  className="rounded-xl h-7 px-2 text-[10px] font-semibold shrink-0"
                >
                  Kitaplığı Aç
                </Button>
              </div>
    
              {activeBook ? (
                <div className="mt-2.5 flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 focus-scrollbar space-y-3">
                  {/* Active Page Range Banner if set */}
                  {activeRange && (
                    <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2 text-xs flex items-center justify-between gap-2 shrink-0">
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                          Aktif Hedef Aralığı
                        </span>
                        <p className="font-semibold text-foreground truncate text-[11px]">{activeRange.topic}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {activeRange.resourceTitle} · Sf. {activeRange.startPage}–{activeRange.endPage}
                        </p>
                      </div>
                      <span className="rounded-md bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold px-1.5 py-0.5 text-[9px] shrink-0">
                        {activeRange.status === "completed" ? "✓ Bitti" : "Hedef"}
                      </span>
                    </div>
                  )}
    
                  {/* Progress bar & stats */}
                  <div className="space-y-1.5 shrink-0">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-foreground">
                        Sayfa {readingPageInput} / {activeBook.totalPages}
                      </span>
                      <span className="text-muted-foreground font-mono">
                        %{Math.round((readingPageInput / activeBook.totalPages) * 100)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
                        style={{
                          width: `${Math.min(100, (readingPageInput / activeBook.totalPages) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                      <span>Kalan: {Math.max(0, activeBook.totalPages - readingPageInput)} sayfa</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                        Bu seans: +{Math.max(0, readingPageInput - activeBook.currentPage)} sf
                      </span>
                    </div>
                  </div>
    
                  {/* Page Stepper */}
                  <div className="rounded-xl border bg-background/60 p-2.5 space-y-2 shrink-0">
                    <label className="block text-[11px] font-semibold text-foreground">
                      Kaldığın Sayfayı Güncelle
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setReadingPageInput((p) => Math.max(0, p - 1))}
                        className="rounded-lg border bg-card px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground active:scale-95"
                      >
                        -1
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={activeBook.totalPages}
                        value={readingPageInput}
                        onChange={(e) => setReadingPageInput(Math.min(activeBook.totalPages, Math.max(0, Number(e.target.value))))}
                        className="flex-1 text-center rounded-lg border border-border bg-background px-2 py-1 text-xs font-bold font-mono text-foreground focus:border-indigo-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setReadingPageInput((p) => Math.min(activeBook.totalPages, p + 1))}
                        className="rounded-lg border bg-card px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground active:scale-95"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => setReadingPageInput((p) => Math.min(activeBook.totalPages, p + 5))}
                        className="rounded-lg border bg-card px-2 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 active:scale-95"
                      >
                        +5
                      </button>
                      <button
                        type="button"
                        onClick={() => setReadingPageInput((p) => Math.min(activeBook.totalPages, p + 10))}
                        className="rounded-lg border bg-card px-2 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 active:scale-95"
                      >
                        +10
                      </button>
                    </div>
                  </div>
    
                  {/* Book Badges / Info */}
                  <div className="rounded-xl border bg-muted/20 p-2.5 space-y-1.5 shrink-0 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Kategori</span>
                      <span className="font-semibold text-foreground">{activeBook.category}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Durum</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {activeBook.status === "completed" ? "Tamamlandı" : "Okunuyor"}
                      </span>
                    </div>
                    {activeBook.sessions && activeBook.sessions.length > 0 && (
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Önceki Seanslar</span>
                        <span className="font-mono">{activeBook.sessions.length} seans</span>
                      </div>
                    )}
                  </div>
    
                  {/* Quotes preview */}
                  {activeBook.favoriteQuotes && activeBook.favoriteQuotes.length > 0 && (
                    <div className="space-y-1.5 flex-1 min-h-0">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Kayıtlı Alıntılar ({activeBook.favoriteQuotes.length})
                      </span>
                      <div className="space-y-1.5 overflow-y-auto max-h-36 pr-1 focus-scrollbar">
                        {activeBook.favoriteQuotes.map((q, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg border bg-background/80 p-2 text-[11px] leading-relaxed italic text-foreground/90 border-l-2 border-l-indigo-500"
                          >
                            &ldquo;{q}&rdquo;
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-6 flex flex-col items-center justify-center text-center p-4 space-y-3">
                  <p className="text-xs text-muted-foreground">Henüz bir kitap seçilmedi.</p>
                  <Button size="sm" onClick={() => setBookLibraryOpen(true)} className="rounded-xl text-xs">
                    Kitap Seç veya Ekle
                  </Button>
                </div>
              )}
            </div>
          ) : isFreeMode ? (
            <div className="h-full flex flex-col rounded-2xl border bg-card p-3 shadow-xs overflow-hidden min-h-0">
              <div className="flex items-center justify-between border-b pb-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="grid size-6 place-items-center rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                    <Zap className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-xs font-bold text-foreground truncate">
                      {freeTitle || "Serbest Odak"}
                    </h2>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {freeTitle ? "Kullanıcı Niyeti" : "Görevsiz Zen Modu"}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                  Serbest Akış
                </span>
              </div>
    
              <div className="mt-2.5 flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 focus-scrollbar space-y-3">
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <Sparkles className="size-3.5" />
                    <span>Baskısız ve Özgür Akış</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {freeTitle
                      ? `Bu oturumda niyetin: "${freeTitle}". Sistem herhangi bir kural veya adım dayatmaz; tamamen kendi temponda çalış.`
                      : "Bu oturum sisteme bağlı bir görev içermez. Zihnini toparla, dilediğin konuya odaklan ve akışın tadını çıkar."}
                  </p>
                </div>
    
                {/* Active Page Range Banner if set */}
                {activeRange && (
                  <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                        <BookOpen className="size-3" />
                        İncelenen Sayfa Aralığı
                      </span>
                      <span className="font-mono text-muted-foreground">
                        Sf. {activeRange.startPage}–{activeRange.endPage}
                      </span>
                    </div>
                    <p className="font-semibold text-foreground text-xs">{activeRange.topic}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{activeRange.resourceTitle}</p>
                  </div>
                )}
    
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-foreground">
                    Oturum Başlığı / Niyeti Güncelle
                  </label>
                  <input
                    type="text"
                    value={freeTitle}
                    onChange={(e) => setFreeTitle(e.target.value)}
                    placeholder="İstersen odaklandığın şeyi yazabilirsin..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
    
                <div className="rounded-xl border bg-muted/20 p-2.5 space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Serbest Odak İlkeleri
                  </span>
                  <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Erken çıkışta sınav veya soru kilidi yoktur.</li>
                    <li>Süre bittiğinde veya dilediğinde doğrudan kaydedebilirsin.</li>
                    <li>Canlı notlar ve zihin dökümü serbestçe kullanılabilir.</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col rounded-2xl border bg-card p-3 shadow-xs overflow-hidden min-h-0">
              <div className="flex items-center justify-between border-b pb-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="grid size-6 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <ListChecks className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-xs font-bold text-foreground truncate">Ne Yapacaksın?</h2>
                    <p className="text-[10px] text-muted-foreground truncate">Bu oturum için somut adımlar</p>
                  </div>
                </div>
                {guidance && guidance.steps.length > 0 && (
                  <span className="rounded-full bg-muted/60 border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground shrink-0">
                    {guidance.steps.filter((s) => completedSteps[s.id]).length} / {guidance.steps.length}
                  </span>
                )}
              </div>
    
              {guidance && guidance.steps.length > 0 && (
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted/50 shrink-0">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{
                      width: `${(guidance.steps.filter((s) => completedSteps[s.id]).length / guidance.steps.length) * 100}%`,
                    }}
                  />
                </div>
              )}
    
              {guidance && (
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground shrink-0 line-clamp-2">
                  {guidance.summary}
                </p>
              )}
    
              <div className="mt-2 flex-1 overflow-y-auto space-y-2 pr-1 min-h-0 focus-scrollbar">
                {guidance && guidance.steps.length > 0 ? (
                  guidance.steps.map((step) => {
                    const isDone = !!completedSteps[step.id];
                    return (
                      <div
                        key={step.id}
                        onClick={() => toggleStep(step.id)}
                        className={`group flex cursor-pointer items-start gap-2 rounded-xl border p-2 transition-all ${
                          isDone
                            ? "border-primary/20 bg-primary/5 text-muted-foreground"
                            : "border-border/60 bg-background/60 hover:border-primary/40 hover:bg-muted/30"
                        }`}
                      >
                        <button
                          type="button"
                          aria-label="Adımı tamamla"
                          className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border transition-colors ${
                            isDone
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/40 bg-background"
                          }`}
                        >
                          {isDone && <Check className="size-3 stroke-[3]" />}
                        </button>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <p className={`text-xs font-semibold leading-tight transition-colors ${isDone ? "line-through opacity-75 text-foreground" : "text-foreground"}`}>
                            {step.title}
                          </p>
                          <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                            {step.detail}
                          </p>
                          {step.command && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(step.command!);
                              }}
                              className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-zinc-900 px-2 py-0.5 font-mono text-[10px] text-zinc-100 dark:bg-black/60 max-w-full overflow-hidden"
                            >
                              <code className="truncate">{step.command}</code>
                              <span className="text-primary font-sans font-semibold shrink-0">
                                {copiedCmd === step.command ? "✓" : "Kopyala"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="py-4 text-center text-xs text-muted-foreground italic">
                    Bu görev için rehber adımı bulunmuyor.
                  </p>
                )}
              </div>
            </div>
          )}
    
          {/* COLUMN 2: NOTLAR & ZİHİN DÖKÜMÜ OR OKUMA ALINTILARI */}
          {isReadingMode ? (
            <div className="h-full flex flex-col gap-2 min-h-0">
              {/* Kitaptan Alıntı Yakala */}
              <div className="flex-1 rounded-2xl border bg-card p-3 shadow-xs flex flex-col min-h-0">
                <div className="flex items-center justify-between border-b pb-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="grid size-6 place-items-center rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0">
                      <Quote className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-xs font-bold text-foreground truncate">Kitaptan Alıntı Yakala</h2>
                      <p className="text-[10px] text-muted-foreground truncate">Vurucu bir cümle veya tespit kaydet</p>
                    </div>
                  </div>
                </div>
    
                <textarea
                  value={readingQuote}
                  onChange={(e) => setReadingQuote(e.target.value)}
                  placeholder="Kitapta altını çizdiğin bir cümleyi veya seni etkileyen fikri buraya yaz..."
                  className="mt-2 flex-1 w-full resize-none rounded-xl border border-border bg-background/70 p-2.5 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden min-h-0"
                />
    
                <div className="mt-2 flex items-center justify-between gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {readingQuote.trim().length} krk
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!readingQuote.trim() || !activeBook}
                    onClick={() => {
                      if (!activeBook || !readingQuote.trim()) return;
                      const existing = activeBook.favoriteQuotes || [];
                      const updatedQuotes = [readingQuote.trim(), ...existing];
                      updateBook(activeBook.id, { favoriteQuotes: updatedQuotes });
                      setBooks(loadBooks());
                      setReadingQuote("");
                      toast.success("Alıntı kitaba kaydedildi!");
                    }}
                    className="rounded-xl px-3 text-xs h-7"
                  >
                    <Bookmark className="mr-1 size-3" />
                    Alıntıyı Kaydet
                  </Button>
                </div>
              </div>
    
              {/* Okuma Düşünceleri & Notlar */}
              <div className="flex-1 rounded-2xl border bg-card p-3 shadow-xs flex flex-col min-h-0">
                <div className="flex items-center justify-between border-b pb-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="grid size-6 place-items-center rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                      <FileText className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-xs font-bold text-foreground truncate">Kişisel Notlar &amp; Çıkarımlar</h2>
                      <p className="text-[10px] text-muted-foreground truncate">Bu bölüm sana ne düşündürdü?</p>
                    </div>
                  </div>
                </div>
    
                <textarea
                  value={scratchpadText}
                  onChange={(e) => setScratchpadText(e.target.value)}
                  placeholder="Okurken aklına gelen fikirler, bağlantılar, projene uyarlayabileceğin noktalar..."
                  className="mt-2 flex-1 w-full resize-none rounded-xl border border-border bg-background/70 p-2.5 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-hidden min-h-0"
                />
    
                <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground shrink-0">
                  <span>Otomatik kaydedilir</span>
                  <span className="font-mono">{scratchpadText.trim().length} krk</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col gap-2 min-h-0">
              {/* Canlı Notlar & Çıktı */}
              <div className="flex-1 rounded-2xl border bg-card p-3 shadow-xs flex flex-col min-h-0">
                <div className="flex items-center justify-between border-b pb-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="grid size-6 place-items-center rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                      <FileText className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-xs font-bold text-foreground truncate">Canlı Notlar &amp; Çıktı</h2>
                      <p className="text-[10px] text-muted-foreground truncate">Formül, kod veya çıkarımlar</p>
                    </div>
                  </div>
                  {scratchpadText.trim().length >= 20 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                      <Check className="size-2.5" />
                      Kanıt Hazır
                    </span>
                  )}
                </div>
    
                <textarea
                  value={scratchpadText}
                  onChange={(e) => setScratchpadText(e.target.value)}
                  placeholder="Çalışırken çözdüğün adımları veya notları buraya yaz. Burada aldığın notlar erken çıkışta doğrudan kanıt sayılır..."
                  className="mt-2 flex-1 w-full resize-none rounded-xl border border-border bg-background/70 p-2.5 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-hidden min-h-0"
                />
    
                <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground shrink-0">
                  <div className="flex items-center gap-2">
                    <span>Otomatik kaydedilir</span>
                    {scratchpadText.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const snippet = generateSessionNotebookLMSnippet({
                            sessionTitle: task?.title || activeBook?.title || activeRange?.topic || "Odak Seansı",
                            scratchpadText,
                            activeBook: activeBook || undefined,
                            activeRange: activeRange || undefined,
                          });
                          navigator.clipboard.writeText(snippet);
                          toast.success("Notlar NotebookLM formatında panoya kopyalandı!");
                        }}
                        className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium"
                        title="NotebookLM formatında panoya kopyala"
                      >
                        <Sparkles className="size-2.5" />
                        NotebookLM
                      </button>
                    )}
                  </div>
                  <span className="font-mono">{scratchpadText.trim().length} krk</span>
                </div>
              </div>
    
              {/* Aklındakini Dök */}
              <div className="flex-1 rounded-2xl border bg-card p-3 shadow-xs flex flex-col min-h-0">
                <div className="flex items-center justify-between border-b pb-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="grid size-6 place-items-center rounded-lg bg-sky-500/10 text-sky-500 shrink-0">
                      <Brain className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-xs font-bold text-foreground truncate">Aklındakini Dök</h2>
                      <p className="text-[10px] text-muted-foreground truncate">Aklına takılanları yaz, zihnini boşalt</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                    {brainDumpItems.length} madde
                  </span>
                </div>
    
                <form onSubmit={handleAddBrainDump} className="mt-2 flex gap-1.5 shrink-0">
                  <input
                    type="text"
                    value={brainDumpInput}
                    onChange={(e) => setBrainDumpInput(e.target.value)}
                    placeholder="Aklını dağıtan düşünceyi yaz..."
                    className="flex-1 rounded-xl border border-border bg-background/80 px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:border-sky-500 focus:outline-hidden"
                  />
                  <Button type="submit" size="sm" variant="secondary" className="rounded-xl px-2.5 text-xs h-7 shrink-0">
                    <Plus className="size-3" />
                    Ekle
                  </Button>
                </form>
    
                <div className="mt-2 flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0 focus-scrollbar">
                  {brainDumpItems.length === 0 ? (
                    <p className="py-3 text-center text-[11px] text-muted-foreground italic">
                      Zihnin berrak. Dağıtıcı bir fikir gelirse buraya yazabilirsin.
                    </p>
                  ) : (
                    brainDumpItems.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between gap-2 rounded-xl border px-2 py-1 text-xs transition-colors ${
                          item.done
                            ? "bg-muted/30 border-border/40 text-muted-foreground line-through"
                            : "bg-background/80 border-border"
                        }`}
                      >
                        <span
                          onClick={() => handleToggleBrainDumpDone(item.id)}
                          className="cursor-pointer truncate flex-1 text-[11px]"
                        >
                          {item.text}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteBrainDump(item.id)}
                          className="text-muted-foreground hover:text-red-500 shrink-0"
                          title="Sil"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
    
                {brainDumpItems.length > 0 && (
                  <div className="mt-1 text-right shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setBrainDumpItems([]);
                        try {
                          localStorage.setItem(BRAIN_DUMP_KEY, JSON.stringify([]));
                        } catch {}
                      }}
                      className="text-[10px] text-muted-foreground hover:text-foreground underline"
                    >
                      Hepsini Temizle
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
    
          {/* COLUMN 3: SES & MÜZİK MİKSERİ & KAYNAKLAR / KİTAP TAVSİYELERİ */}
          <div className="h-full flex flex-col gap-2 min-h-0">
            {/* Ses & Müzik Mikseri (Spotify, Apple Music, YT Music & Ortam Sesleri) */}
            <FocusSoundMixer
              activeSound={activeSound}
              onSoundChange={handleSoundChange}
              ambientVolume={ambientVolume}
              onVolumeChange={handleVolumeChange}
            />
    
            {/* Entegre Kaynak & Doküman Masası (Pinli Şemalar, Sayfa Aralıkları, Rehber & NotebookLM) */}
            <FocusResourcesDock
              task={task}
              area={effectiveArea}
              guidance={guidance}
              isReadingMode={isReadingMode}
              activeBook={activeBook}
              activeRange={activeRange}
              onSelectRange={(range) => {
                setActiveRange(range);
                toast.success(`"${range.topic}" aktif çalışma aralığı yapıldı.`);
              }}
              onOpenModal={(initialTab) => {
                if (initialTab) setResourcesModalTab(initialTab);
                setResourcesModalOpen(true);
              }}
              onViewDoc={(doc) => setLightboxDoc(doc)}
              scratchpadText={scratchpadText}
              readingQuotes={activeBook?.favoriteQuotes || []}
            />
          </div>
    
          {/* COLUMN 4: PLANORTH KOÇ (DOCKED COMPANION) */}
          <div className="h-full flex flex-col rounded-2xl border bg-card shadow-xs overflow-hidden min-h-0">
            <NorthAI embedded taskId={id} focusDocked />
          </div>
        </div>
      ) : (
        /* POST-SESSION FEEDBACK SCREEN */
        <section className="celebrate-pop mt-4 space-y-6 max-w-3xl mx-auto">
          <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="size-4" />
                Odak Oturumu Tamamlandı
              </div>
              {verifiedProof.type !== "none" && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-3.5" />
                  {verifiedProof.type === "output_text" && "Konu Doğrulama Sorusu Çözüldü"}
                  {verifiedProof.type === "photo" && "Fotoğraf Kanıtı Eklendi"}
                  {verifiedProof.type === "step" && "Görev Adımı Onaylandı"}
                  {verifiedProof.type === "ai_verified" && "Planorth Koç Tarafından Teyit Edildi"}
                  {verifiedProof.type === "scratchpad" && "Canlı Not Kanıtı Onaylandı"}
                </span>
              )}
            </div>
    
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
              {Math.floor(elapsed / 60000)} dakikalık oturum nasıl geçti?
            </h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Değerlendirmen, sonraki günlerdeki oturum sürelerini ve görev yoğunluğunu otomatik olarak optimize eder.
            </p>
    
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-lg border bg-muted/40 px-2.5 py-1 text-muted-foreground font-mono">
                Sekme Geçişi:{" "}
                <strong className={tabSwitches === 0 ? "text-emerald-500" : "text-amber-500"}>
                  {tabSwitches === 0 ? "0 (Kusursuz Odak)" : `${tabSwitches} kez`}
                </strong>
              </span>
              {ironWill && (
                <span className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-red-600 dark:text-red-400 font-semibold">
                  <ShieldAlert className="size-3.5" />
                  Demir İrade Başarısı
                </span>
              )}
            </div>
    
            {/* READING SESSION REVIEW CARD */}
            {isReadingMode && activeBook && (
              <div className="mt-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-xl bg-indigo-500/10 text-indigo-500">
                      <BookOpen className="size-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{activeBook.title}</h3>
                      <p className="text-xs text-muted-foreground">{activeBook.author}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    Toplam {activeBook.totalPages} Sayfa
                  </span>
                </div>
    
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Kaldığın Son Sayfayı Onayla
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={activeBook.currentPage}
                        max={activeBook.totalPages}
                        value={readingPageInput}
                        onChange={(e) => setReadingPageInput(Math.min(activeBook.totalPages, Math.max(0, Number(e.target.value))))}
                        className="w-24 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-mono font-bold text-foreground focus:border-indigo-500 focus:outline-hidden"
                      />
                      <div className="flex items-center gap-1">
                        {[1, 5, 10].map((inc) => (
                          <button
                            key={inc}
                            type="button"
                            onClick={() => setReadingPageInput((p) => Math.min(activeBook.totalPages, p + inc))}
                            className="rounded-lg border bg-background px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95"
                          >
                            +{inc}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
    
                  <div className="rounded-xl border border-indigo-500/20 bg-background/60 p-2.5 flex flex-col justify-center">
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">
                      Bu Seansın Verimi
                    </span>
                    <span className="text-sm font-bold text-foreground mt-0.5">
                      +{Math.max(0, readingPageInput - activeBook.currentPage)} sayfa okundu
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Kitap genelinde %{Math.round((readingPageInput / activeBook.totalPages) * 100)} ilerleme
                    </span>
                  </div>
                </div>
    
                {readingPageInput >= activeBook.totalPages && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    🎉 Tebrikler! Bu kitabı başarıyla tamamladın!
                  </div>
                )}
              </div>
            )}
    
            {/* FREE FOCUS REVIEW CARD */}
            {isFreeMode && !isReadingMode && (
              <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
                    <Zap className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {freeTitle || "Görevsiz Serbest Odak"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {Math.floor(elapsed / 60000)} dakika kesintisiz serbest akış tamamlandı
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Serbest Seans
                </span>
              </div>
            )}
    
            {/* ACTIVE PAGE RANGE COMPLETION CARD */}
            {activeRange && (
              <div className="mt-5 rounded-2xl border border-indigo-500/25 bg-indigo-500/5 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                    Çalışılan Sayfa Aralığı
                  </span>
                  <h4 className="text-sm font-bold text-foreground truncate">{activeRange.topic}</h4>
                  <p className="text-xs text-muted-foreground">
                    {activeRange.resourceTitle} (Sayfa {activeRange.startPage}–{activeRange.endPage})
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={activeRange.status === "completed" ? "secondary" : "outline"}
                  onClick={() => {
                    const next = activeRange.status === "completed" ? "reading" : "completed";
                    updateSavedPageRange(activeRange.id, { status: next });
                    setActiveRange({ ...activeRange, status: next });
                    toast.success(
                      next === "completed"
                        ? "Sayfa aralığı tamamlandı olarak kaydedildi! 🎉"
                        : "Okunuyor durumuna alındı."
                    );
                  }}
                  className="rounded-xl text-xs h-8 shrink-0"
                >
                  {activeRange.status === "completed" ? "✓ Tamamlandı" : "Aralığı Tamamla"}
                </Button>
              </div>
            )}
    
            {/* SESSION NOTES TO NOTEBOOKLM CARD */}
            {scratchpadText.trim().length > 0 && (
              <div className="mt-4 rounded-2xl border bg-card p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Seans Canlı Notları ({scratchpadText.trim().length} krk)
                  </span>
                  <p className="text-xs text-foreground">
                    Tuttuğun formüller ve notlar NotebookLM kaynak formatına hazır.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const snippet = generateSessionNotebookLMSnippet({
                      sessionTitle: task?.title || activeBook?.title || activeRange?.topic || "Odak Seansı",
                      durationMinutes: Math.floor(elapsed / 60000),
                      scratchpadText,
                      quotes: activeBook?.favoriteQuotes || [],
                      activeBook: activeBook || undefined,
                      activeRange: activeRange || undefined,
                    });
                    navigator.clipboard.writeText(snippet);
                    toast.success("Seans notları NotebookLM formatında panoya kopyalandı!");
                  }}
                  className="rounded-xl text-xs h-8 shrink-0"
                >
                  <Sparkles className="size-3.5 mr-1 text-amber-500" />
                  NotebookLM Paketini Kopyala
                </Button>
              </div>
            )}
    
            {/* OUTCOME SELECTION */}
            <div className="mt-6">
              <label className="block text-xs font-semibold text-foreground">Sonuç</label>
              <div className="mt-2 grid grid-cols-3 gap-2.5">
                {([
                  ["done", "Tamamladım", "Çıktıyı başardım"],
                  ["partial", "Kısmen", "İlerledim ama bitmedi"],
                  ["skipped", "Takıldım", "Tekrar deneyeceğim"],
                ] as const).map(([val, label, sub]) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setOutcome(val)}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all ${
                      outcome === val
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <span className="text-xs font-semibold">{label}</span>
                    <span className="mt-0.5 text-[10px] opacity-75">{sub}</span>
                  </button>
                ))}
              </div>
            </div>
    
            {/* DIFFICULTY SELECTION */}
            <div className="mt-5">
              <label className="block text-xs font-semibold text-foreground">Zorluk</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {["Kolay", "Tam kararında", "Zorlayıcı"].map((val) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => toggleDifficulty(val)}
                    className={`rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                      difficulty === val
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
    
            {/* SUPPORT SOURCES */}
            <div className="mt-5">
              <label className="block text-xs font-semibold text-foreground">
                Yardım veya kaynak kullandın mı?
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {([
                  ["none", "Yardım almadım"],
                  ["ai", "Planorth Koç"],
                  ["documentation", "Resmî Doküman"],
                  ["video", "Video / Ders"],
                  ["forum", "Topluluk / Çözüm"],
                ] as const).map(([val, label]) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() =>
                      setSupportSources((cur) =>
                        val === "none"
                          ? ["none"]
                          : cur.includes(val)
                          ? cur.filter((s) => s !== val)
                          : [...cur.filter((s) => s !== "none"), val]
                      )
                    }
                    className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                      supportSources.includes(val)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
    
            {/* REFLECTION NOTE */}
            <div className="mt-5">
              <label className="block text-xs font-semibold text-foreground">
                Kısa bir not eklemek ister misin? <span className="text-muted-foreground font-normal">(İsteğe bağlı)</span>
              </label>
              <input
                className={fieldClass + " mt-2 rounded-xl"}
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Nerede tıkandın veya ne iyi gitti?"
              />
            </div>
    
            {/* PHOTO PROOF UPLOAD */}
            <div className="mt-5">
              <label className="block text-xs font-semibold text-foreground">
                Fotoğraflı Çalışma Kanıtı <span className="text-muted-foreground font-normal">(Defter, masa, test veya ekran fotoğrafı)</span>
              </label>
              <div className="mt-2 flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-border px-3.5 py-2 text-xs text-muted-foreground hover:border-primary hover:text-foreground">
                  <Camera className="size-4" />
                  <span>{photoProof ? "Fotoğrafı Değiştir" : "Fotoğraf Seç"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 4 * 1024 * 1024) {
                        toast.error("Fotoğraf 4MB'dan küçük olmalıdır.");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => setPhotoProof(reader.result as string);
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                {photoProof && (
                  <div className="relative size-12 overflow-hidden rounded-lg border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoProof} alt="Kanıt önizleme" className="size-full object-cover" />
                  </div>
                )}
              </div>
            </div>
    
            {/* SUBMIT BUTTON */}
            <div className="mt-6 border-t pt-5">
              {!saved ? (
                <Button
                  size="lg"
                  className="w-full rounded-2xl sm:w-auto"
                  onClick={() => {
                    if (!timer) return;
                    setSaved(true);
                    clearFocusLock();
                    const actualMinutes = Math.max(1, Math.floor(elapsed / 60000));
    
                    let finalPagesRead = 0;
                    if (isReadingMode && activeBook) {
                      const res = logReadingSession(
                        activeBook.id,
                        readingPageInput,
                        actualMinutes,
                        readingQuote,
                        reflection
                      );
                      if (res) {
                        finalPagesRead = res.pagesRead;
                        setBooks(loadBooks());
                      }
                    }
    
                    const activity: NorthActivity = {
                      id: timer.id,
                      taskId: id,
                      areaId: effectiveArea.id,
                      date: dayKey(),
                      minutes: actualMinutes,
                      outcome,
                      difficulty,
                      reflection: isReadingMode
                        ? [activeBook?.title, readingQuote, verifiedProof.content, reflection].filter(Boolean).join(" · ")
                        : isFreeMode
                        ? [freeTitle, verifiedProof.content, reflection].filter(Boolean).join(" · ")
                        : [verifiedProof.content, reflection].filter(Boolean).join(" · "),
                      amount: isReadingMode ? finalPagesRead : isFreeMode ? actualMinutes : 0,
                      metric: effectiveArea.metric,
                      endedAt: new Date().toISOString(),
                      plannedMinutes: task?.minutes ?? currentMinutes,
                      actualStart: new Date(timer.beganAt ?? timer.started).toISOString(),
                      plannedStart: task?.plannedStart,
                      energy: state.energy.date === dayKey() ? state.energy.level : "normal",
                      pauseCount: Math.max(0, (timer.pauses ?? 0) - (timer.running ? 0 : 1)),
                      earlyExit: remainingSeconds > 0,
                      completionPercent:
                        outcome === "done" ? 100 : outcome === "skipped" ? 0 : Math.min(99, Math.round((actualMinutes / (task?.minutes ?? currentMinutes)) * 100)),
                      taskType: task ? inferTaskType(task, area?.kind) : isReadingMode ? "reading" : "deep_work",
                      supportSources,
                      proofType: verifiedProof.type !== "none" ? verifiedProof.type : photoProof ? "photo" : undefined,
                      proofContent: verifiedProof.content || undefined,
                      tabSwitches,
                      ironWill,
                    };
    
                    if ((photoProof || verifiedProof.type === "photo") && workspace.addDomainProof) {
                      const proofUrl = photoProof || verifiedProof.content;
                      workspace.addDomainProof({
                        id: crypto.randomUUID(),
                        areaId: effectiveArea.id,
                        title: `${isReadingMode ? activeBook?.title || "Kitap Okuma" : isFreeMode ? freeTitle || "Serbest Odak" : task?.title || "Odak"} (Fotoğraflı Kanıt)`,
                        kind: "other",
                        description: reflection || verifiedProof.content || `${task?.title || "Odak"} çalışması tamamlandı.`,
                        url: proofUrl,
                        createdAt: new Date().toISOString(),
                      });
                    }
    
                    update((s) => {
                      if (s.activities.some((a) => a.id === timer.id)) return s;
                      const next = {
                        ...s,
                        activities: [...s.activities, activity],
                        tasks: task ? s.tasks.map((t) => (t.id === id ? { ...t, status: outcome } : t)) : s.tasks,
                      };
                      return refreshIntelligence({ ...next, dailyAdaptation: suggestDailyAdaptation(s, activity) });
                    });
                    sessionStorage.removeItem(`north:focus:${id}`);
                    sessionStorage.removeItem(`north:focus:notes:${id}`);
                    sessionStorage.removeItem(`north:focus:steps:${id}`);
                    sessionStorage.removeItem(`north:focus:iron:${id}`);
                    void browserCompanion.stop();
                  }}
                >
                  <Check className="mr-2 size-4" />
                  Kaydet ve Sonucu İşle
                </Button>
              ) : (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs font-medium text-foreground">Oturum başarıyla kaydedildi. Şimdi ne yapmak istersin?</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" className="rounded-xl" onClick={() => router.push("/")}>
                      Günün Sıradaki Adımına Geç →
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setBreathworkOpen(true)}>
                      <Heart className="mr-1.5 size-3.5 text-teal-500" />
                      2 Dk Nefes Molası
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    
    </>
  );
}
