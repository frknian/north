"use client";

import {
} from "@/lib/north";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { WeekPlan } from "./use-week-plan";

export function WeekStats({ ctx }: { ctx: WeekPlan }) {
  const {
    currentWeekTasks,
    completedTasks,
    plannedMinutes,
    completedMinutes,
    weeklyCapMinutes,
    completionPct,
    capacityLoadPct,
    areaBreakdown,
  } = ctx;
  return (
    <>
    {/* BEGIN: StatsSplitRow */}
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Weekly Completion Card (Left 60%) */}
      <div className="lg:col-span-8 bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs relative overflow-hidden">
        <div className="space-y-3 text-center sm:text-left flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              HAFTALIK TAMAMLANMA &amp; İLERLEME
            </span>
          </div>
          <h3 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight flex items-baseline justify-center sm:justify-start gap-2">
            {completedTasks.length}{" "}
            <span className="text-xl font-medium text-muted-foreground/80">
              / {currentWeekTasks.length} Görev Bitti
            </span>
          </h3>

          {/* 3 Metric Chips */}
          <div className="grid grid-cols-3 gap-2.5 pt-1 max-w-md">
            <div className="rounded-xl bg-muted/50 border border-border p-2 text-center">
              <div className="text-[10px] uppercase font-semibold text-muted-foreground">Planlanan</div>
              <div className="text-sm font-bold text-foreground font-mono">{plannedMinutes} dk</div>
            </div>
            <div className="rounded-xl bg-muted/50 border border-border p-2 text-center">
              <div className="text-[10px] uppercase font-semibold text-muted-foreground">Tamamlanan</div>
              <div className="text-sm font-bold text-blue-400 font-mono">{completedMinutes} dk</div>
            </div>
            <div className="rounded-xl bg-muted/50 border border-border p-2 text-center">
              <div className="text-[10px] uppercase font-semibold text-muted-foreground">Kalan</div>
              <div className="text-sm font-bold text-foreground/90 font-mono">{Math.max(0, plannedMinutes - completedMinutes)} dk</div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground font-normal pt-1">
            {completedTasks.length === 0 ? (
              <>✨ Haftanın ilk görevini tamamlayarak ivme kazan!</>
            ) : completedTasks.length === currentWeekTasks.length ? (
              <>🎉 Muhteşem! Haftalık hedeflerinin tamamına ulaştın.</>
            ) : (
              <>
                Planlanan <span className="text-foreground font-semibold">{plannedMinutes} dakikanın</span>{" "}
                <span className="text-blue-400 font-semibold">{completedMinutes} dakikası</span> başarıyla tamamlandı.
              </>
            )}
          </p>
        </div>

        {/* Radial Progress Circle */}
        <div className="relative flex items-center justify-center shrink-0 p-3 bg-muted/40 rounded-2xl border border-border shadow-xs">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle cx="48" cy="48" fill="transparent" r="38" stroke="currentColor" className="text-muted/40 dark:text-slate-800" strokeWidth="6" />
            <circle
              cx="48"
              cy="48"
              fill="transparent"
              r="38"
              stroke="#3B82F6"
              strokeDasharray="238.76"
              strokeDashoffset={238.76 - (completionPct / 100) * 238.76}
              strokeLinecap="round"
              strokeWidth="6"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-black text-foreground font-mono">{completionPct}%</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Hedef</span>
          </div>
        </div>
      </div>

      {/* Capacity & Focus Card (Right 40%) */}
      <div className="lg:col-span-4 bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">KAPASİTE &amp; ODAK</span>
            <span
              className={cn(
                "px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border",
                capacityLoadPct > 100
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              )}
            >
              ● Optimal Seviye (%{capacityLoadPct} Yük)
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight font-mono">
              {plannedMinutes}
            </span>
            <span className="text-muted-foreground text-sm font-medium">/ {weeklyCapMinutes} dk planlandı</span>
          </div>

          {/* Multi-area Stacked Bar */}
          <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden mt-3.5 p-0.5 border border-border flex gap-0.5">
            {areaBreakdown.length === 0 ? (
              <div className="bg-slate-700 h-full w-full rounded-full" />
            ) : (
              areaBreakdown.map((item) => (
                <div
                  key={item.area.id}
                  className="h-full rounded-sm transition-all duration-500"
                  style={{
                    width: `${item.pct}%`,
                    backgroundColor: item.styling.color,
                  }}
                  title={`${item.area.name}: ${item.minutes} dk`}
                />
              ))
            )}
          </div>

          {/* Area Breakdown Legend */}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-foreground/90">
            {areaBreakdown.map((item) => (
              <span key={item.area.id} className="inline-flex items-center gap-1.5 font-medium">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.styling.color }}
                />
                <span className="text-foreground/90">{item.area.name}</span>
                <span className="text-muted-foreground/80 font-mono">({item.minutes} dk)</span>
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 pt-3.5 border-t border-border flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Mod: <strong className="text-foreground">Normal Mod</strong>
          </span>
          <Link
            href="/profile"
            className="text-blue-400 hover:text-blue-700 dark:text-blue-300 font-semibold inline-flex items-center gap-1 transition group"
          >
            Kapasite Ayarları <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </section>
    {/* END: StatsSplitRow */}
    </>
  );
}
