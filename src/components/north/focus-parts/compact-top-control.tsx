"use client";

import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Heart,
  Maximize2,
  Pause,
  Play,
  Shield,
  ShieldAlert,
  Square,
} from "lucide-react";
import {
  Button,
} from "@/components/ui/button";
import {
  Companion,
} from "../shared";
import {
  SanalKutuphaneBadge,
} from "../sanal-kutuphane";
import {
  toast,
} from "sonner";
import {
  cn,
} from "@/lib/utils";
import {
} from "./module-level";
import type { FocusSessionCtx } from "./use-focus-session";

export function CompactTopControl({ ctx }: { ctx: FocusSessionCtx }) {
  const {
    state,
    router,
    isReadingMode,
    isFreeMode,
    readingPageInput,
    freeTitle,
    freeGoal,
    activeRange,
    setResourcesModalOpen,
    setResourcesModalTab,
    task,
    effectiveArea,
    activeBook,
    timer,
    ironWill,
    tabSwitches,
    pipActive,
    setBreathworkOpen,
    currentMinutes,
    remainingSeconds,
    adjustMinutes,
    handlePause,
    handleStart,
    handleResume,
    handleTriggerFinish,
    toggleIronWill,
    minutesStr,
    secondsStr,
    handleTogglePip,
  } = ctx;
  return (
    <>
      {/* 1. COMPACT TOP CONTROL BAR (Unified Navigation, Area, Task, Centered Digital Timer, Controls) */}
      <header className="shrink-0 rounded-2xl border bg-card/90 backdrop-blur-md px-3 py-2 shadow-xs flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 sm:gap-3 min-h-[58px]">
        {/* Left: Back, Area, Task Title & Goal */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 max-w-xs sm:max-w-sm lg:max-w-md">
          <button
            type="button"
            onClick={() => {
              if (timer?.running) {
                handleTriggerFinish();
                toast.warning("Odak oturumu devam ediyor. Çıkmak için oturumu sonlandırın.");
              } else {
                router.push("/");
              }
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground shrink-0"
            title="Bugüne dön"
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Bugün</span>
          </button>
    
          <span className="inline-flex items-center gap-1.5 rounded-xl border bg-muted/60 px-2.5 py-1 text-xs font-semibold text-foreground shrink-0">
            <span>{effectiveArea.icon}</span>
            <span className="hidden md:inline">{effectiveArea.name}</span>
          </span>
    
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.2 text-[10px] font-semibold shrink-0",
                  isReadingMode
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : isFreeMode
                    ? "bg-primary/10 text-primary"
                    : "bg-primary/10 text-primary"
                )}
              >
                {isReadingMode ? "Kitap Okuma" : isFreeMode ? "Serbest Odak" : "Odak Görevi"}
              </span>
              <h1
                className="text-xs sm:text-sm font-bold tracking-tight text-foreground truncate"
                title={isReadingMode ? (activeBook?.title || "Kitap Okuma") : isFreeMode ? (freeTitle || "Serbest Odak Seansı") : task?.title}
              >
                {isReadingMode ? (activeBook?.title || "Kitap Okuma") : isFreeMode ? (freeTitle || "Serbest Odak Seansı") : task?.title}
              </h1>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {isReadingMode ? (
                activeBook ? (
                  <span>
                    <strong className="text-foreground">{activeBook.author}</strong> · Sayfa <strong className="text-primary font-mono">{readingPageInput}</strong> / {activeBook.totalPages}
                  </span>
                ) : (
                  "Kitap seçilmedi"
                )
              ) : isFreeMode ? (
                freeGoal ? (
                  <span>
                    <span className="text-primary font-medium">Hedef: </span>{freeGoal}
                  </span>
                ) : (
                  <span className="italic">Zihnini serbest bırak, sadece akışta kal.</span>
                )
              ) : task?.goal ? (
                <span>
                  <span className="text-primary font-medium">Somut Çıktı: </span>{task.goal}
                </span>
              ) : null}
            </p>
          </div>
        </div>
    
        {/* Center: Digital Timer (40:00) with -+5 and 10 dk buttons (Süreyi ortaya al, çember yerine 40:00) */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 shrink-0 py-0.5 mx-auto">
          {/* -10 and -5 minute buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => adjustMinutes(-10)}
              disabled={currentMinutes <= 10}
              className="rounded-lg border border-border/70 bg-muted/50 hover:bg-muted active:scale-95 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-xs disabled:opacity-30 disabled:pointer-events-none"
              title="10 dakika azalt"
              aria-label="10 dakika azalt"
            >
              -10
            </button>
            <button
              type="button"
              onClick={() => adjustMinutes(-5)}
              disabled={currentMinutes <= 5}
              className="rounded-lg border border-border/70 bg-muted/50 hover:bg-muted active:scale-95 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-xs disabled:opacity-30 disabled:pointer-events-none"
              title="5 dakika azalt"
              aria-label="5 dakika azalt"
            >
              -5
            </button>
          </div>
    
          {/* Digital Timer Display (Çember yerine 40:00) */}
          <div className="flex flex-col items-center justify-center px-1.5 sm:px-3 text-center min-w-[90px]">
            <span className="font-mono text-2xl sm:text-3xl font-black tracking-tight text-foreground tabular-nums select-none leading-tight">
              {minutesStr}:{secondsStr}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">
                {!timer ? "Hazır" : timer.running ? (ironWill ? "Demir İrade" : "Derin Odak") : "Duraklatıldı"}
              </span>
              <span>•</span>
              <span className="font-mono">
                {timer ? `Kalan: ${Math.ceil(remainingSeconds / 60)} dk` : `Plan: ${currentMinutes} dk`}
              </span>
              {ironWill && <ShieldAlert className="size-3 text-red-500 inline ml-0.5" />}
            </div>
          </div>
    
          {/* +5 and +10 minute buttons */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => adjustMinutes(5)}
              disabled={currentMinutes >= 180}
              className="rounded-lg border border-border/70 bg-muted/50 hover:bg-muted active:scale-95 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-xs disabled:opacity-30 disabled:pointer-events-none"
              title="5 dakika ekle"
              aria-label="5 dakika ekle"
            >
              +5
            </button>
            <button
              type="button"
              onClick={() => adjustMinutes(10)}
              disabled={currentMinutes >= 180}
              className="rounded-lg border border-border/70 bg-muted/50 hover:bg-muted active:scale-95 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-xs disabled:opacity-30 disabled:pointer-events-none"
              title="10 dakika ekle"
              aria-label="10 dakika ekle"
            >
              +10
            </button>
          </div>
    
          {timer?.running && tabSwitches > 0 && (
            <span className="hidden xl:inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-medium ml-1">
              <AlertTriangle className="size-2.5" />
              {tabSwitches} sekme
            </span>
          )}
        </div>
    
        {/* Right: Controls & Tools */}
        <div className="flex items-center justify-end gap-1.5 shrink-0">
          {!timer ? (
            <Button size="sm" className="rounded-xl px-3 sm:px-4 text-xs font-semibold shadow-xs h-8" onClick={handleStart}>
              <Play className="mr-1.5 size-3.5" />
              Odaklanmayı Başlat
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant={timer.running ? "outline" : "default"}
                className="rounded-xl px-2.5 text-xs h-8"
                onClick={() => (timer.running ? handlePause() : handleResume())}
              >
                {timer.running ? <Pause className="mr-1 size-3" /> : <Play className="mr-1 size-3" />}
                {timer.running ? "Duraklat" : "Devam"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="rounded-xl px-2.5 text-xs h-8"
                onClick={handleTriggerFinish}
              >
                <Square className="mr-1 size-3" />
                Bitir
              </Button>
            </>
          )}
    
          <Button
            variant={pipActive ? "secondary" : "outline"}
            size="sm"
            className="hidden xl:inline-flex rounded-xl text-xs px-2 h-8"
            onClick={handleTogglePip}
            title="Yüzen Mini Sayaç"
          >
            <Maximize2 className="size-3.5" />
            <span className="hidden 2xl:inline ml-1">Sayaç</span>
          </Button>
    
          <Button
            variant="outline"
            size="sm"
            className="hidden xl:inline-flex rounded-xl text-xs px-2 h-8"
            onClick={() => setBreathworkOpen(true)}
            title="2 Dakikalık Nefes ve Göz Molası"
          >
            <Heart className="size-3.5 text-teal-500" />
            <span className="hidden 2xl:inline ml-1">Nefes</span>
          </Button>
    
          <button
            type="button"
            onClick={toggleIronWill}
            disabled={timer?.running}
            className={cn(
              "hidden 2xl:inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs font-semibold transition-all h-8",
              ironWill
                ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 shadow-xs"
                : "border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground"
            )}
            title="Demir İrade Modu"
          >
            {ironWill ? <ShieldAlert className="size-3.5 text-red-500" /> : <Shield className="size-3.5" />}
            <span className="hidden 2xl:inline">{ironWill ? "Demir İrade" : "Standart"}</span>
          </button>
    
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-xs px-2.5 h-8 font-medium gap-1 text-foreground shrink-0"
            onClick={() => {
              setResourcesModalTab("pinned");
              setResourcesModalOpen(true);
            }}
            title="Odak Kaynak & Belge Masası"
          >
            <BookOpen className="size-3.5 text-indigo-500" />
            <span className="hidden 2xl:inline">Kaynaklar</span>
            {activeRange && (
              <span className="size-1.5 rounded-full bg-indigo-500 animate-pulse" />
            )}
          </Button>
    
          <SanalKutuphaneBadge className="hidden 2xl:inline-flex h-8 shrink-0" />
          <Companion state={state} compact />
        </div>
      </header>
    
    </>
  );
}
