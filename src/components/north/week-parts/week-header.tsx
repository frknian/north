"use client";

import {
  Plus,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import type { WeekPlan } from "./use-week-plan";

export function WeekHeader({ ctx }: { ctx: WeekPlan }) {
  const {
    activePlanDays,
    setReplanModalOpen,
    setTempPlanDays,
    setTempExcludedAreas,
    currentWeekKey,
    searchInputRef,
    openCreateTaskModal,
    state,
  } = ctx;
  return (
    <>
    {/* BEGIN: TopHeader */}
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-b border-border pb-6">
      {/* Title and Subtitle Block */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.3)]">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            CANLI SPRİNT / 1. HAFTA
          </span>
          <button
            onClick={() => searchInputRef.current?.focus()}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-muted-foreground hover:text-foreground bg-muted border border-border transition"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Hızlı Komut &amp; Arama</span>
          </button>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
          Haftalık Plan &amp; Dönem Çizgisi
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-normal">
          Nereye gittiğini, haftalık kapasiteni ve her gün atacağın somut adımı gör.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
        {/* Haftayı Planla & Günler Button */}
        <button
          onClick={() => {
            setTempPlanDays(activePlanDays);
            setTempExcludedAreas(state.weeklyAreaExclusions?.[currentWeekKey] ?? []);
            setReplanModalOpen(true);
          }}
          type="button"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-card hover:bg-muted/80 border border-border text-foreground text-xs sm:text-sm font-medium transition-all shadow-xs active:scale-[0.98] group"
          title="Görevlerin hangi günlere yerleştirileceğini seç ve haftayı yeniden planla"
        >
          <span className="p-1 rounded-md bg-primary/10 text-primary border border-primary/20">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </span>
          <span>Haftayı Planla</span>
        </button>

        {/* + Görev Ekle Button */}
        <button
          onClick={() => openCreateTaskModal()}
          type="button"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-xs sm:text-sm font-semibold shadow-[0_0_20px_-3px_rgba(37,99,235,0.3)] border border-blue-400/30 transition-all active:scale-[0.98] group"
        >
          <Plus className="w-4 h-4 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
          <span>Görev Ekle</span>
        </button>
      </div>
    </header>
    {/* END: TopHeader */}
    </>
  );
}
