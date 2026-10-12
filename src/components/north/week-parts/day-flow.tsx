"use client";

import {
  Check,
  Clock,
  Plus,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { getAreaStyling } from "./area-styling";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { WeekPlan } from "./use-week-plan";

export function DayFlow({ ctx }: { ctx: WeekPlan }) {
  const {
    selectedDay,
    setSelectedDay,
    activePlanDays,
    updateActivePlanDays,
    setReplanModalOpen,
    setTempPlanDays,
    setTempExcludedAreas,
    currentWeekKey,
    setAssignDayTarget,
    weekDays,
    currentSelectedDayObj,
    handleAutoPlan,
    handleToggleDayRest,
    handleToggleTask,
    openCreateTaskModal,
    openEditTaskModal,
    state,
  } = ctx;
  return (
    <>
    {/* BEGIN: WeeklyDayFlowSection (7 Günlük Blok) */}
    <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            Haftalık Gün Akışı
            <span className="px-2 py-0.5 text-[11px] font-medium text-muted-foreground bg-muted rounded-md">
              7 Günlük Blok
            </span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Haftanın her gününde hangi alanlara ve görevlere odaklanacağını tek bakışta gör.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={() => {
              updateActivePlanDays([0, 1, 2, 3, 4, 5, 6]);
              handleAutoPlan(true, [0, 1, 2, 3, 4, 5, 6]);
            }}
            className="font-medium text-foreground transition flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-xs text-blue-700 dark:text-blue-300"
            title="Tüm görevleri hafta sonu dahil 7 güne dengeli yay"
          >
            <Sparkles className="w-3 h-3 text-blue-500" />
            7 Güne Otomatik Yay
          </button>
          <button
            onClick={() => {
              setTempPlanDays(activePlanDays);
              setTempExcludedAreas(state.weeklyAreaExclusions?.[currentWeekKey] ?? []);
              setReplanModalOpen(true);
            }}
            className="font-medium text-muted-foreground hover:text-foreground transition flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border text-xs"
            title="Haftalık planlama günlerini düzenle ve günlere yeniden dağıt"
          >
            <RotateCcw className="w-3 h-3 text-primary" />
            Haftayı Planla &amp; Günler
          </button>
          <Link
            href="/calendar"
            className="font-semibold text-blue-400 hover:text-blue-700 dark:text-blue-300 inline-flex items-center gap-1 transition group"
          >
            Tam Takvim <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </div>

      {/* HAFTALIK ODAK HARİTASI (Tüm Günler) */}
      <div className="flex flex-wrap items-center gap-2 py-2.5 px-3.5 rounded-xl bg-muted/40 border border-border text-xs">
        <span className="font-bold text-foreground/90 flex items-center gap-1.5 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          Haftalık Odak Haritası:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {weekDays.map((d) => {
            const isRest = !activePlanDays.includes(d.dayIndex);
            const areaNames = d.dayAreas.map((a) => a.name);
            return (
              <button
                key={d.date}
                onClick={() => setSelectedDay(d.date)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg transition text-[11px]",
                  selectedDay === d.date
                    ? "bg-blue-600/25 border border-blue-500/40 text-white font-bold"
                    : "hover:bg-muted text-foreground/90"
                )}
              >
                <span className="font-bold text-foreground">{d.dayName}:</span>
                {isRest ? (
                  <span className="text-amber-500 dark:text-amber-400 font-medium text-[10px]">Tatil</span>
                ) : areaNames.length > 0 ? (
                  <span className="text-blue-700 dark:text-blue-300 font-medium">{areaNames.join(", ")}</span>
                ) : (
                  <span className="text-muted-foreground/80 italic">Serbest</span>
                )}
                {d.dayIndex < 6 && <span className="text-slate-700 ml-1">•</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 7 Days Interactive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const hasTasks = day.tasks.length > 0;
          const isSelected = selectedDay === day.date;

          return (
            <div
              key={day.date}
              onClick={() => setSelectedDay(day.date)}
              className={cn(
                "relative rounded-xl p-3.5 flex flex-col justify-between min-h-[220px] transition-all duration-200 cursor-pointer group",
                day.isToday
                  ? "bg-gradient-to-b from-primary/15 to-primary/5 border-2 border-primary shadow-sm ring-1 ring-primary/20"
                  : isSelected
                  ? "bg-primary/10 border-2 border-primary/70 shadow-sm"
                  : "bg-card border border-border hover:border-primary/30 hover:bg-muted/40"
              )}
            >
              {/* Day Header */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-xs font-extrabold", day.isToday ? "text-blue-400" : "text-foreground")}>
                      {day.dayName}
                    </span>
                    {day.isToday && (
                      <span className="px-1.5 py-0.2 bg-blue-500/25 text-blue-700 dark:text-blue-300 rounded text-[9px] font-bold uppercase">
                        BUGÜN
                      </span>
                    )}
                    {isSelected && !day.isToday && (
                      <span className="px-1.5 py-0.2 bg-muted text-foreground/90 rounded text-[9px] font-semibold">
                        SEÇİLİ
                      </span>
                    )}
                    {!activePlanDays.includes(day.dayIndex) ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleDayRest(day.dayIndex);
                        }}
                        className="px-1.5 py-0.2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 rounded text-[9px] font-bold transition flex items-center gap-0.5"
                        title="Bu günü çalışma gününe çevir ve plana dahil et"
                      >
                        <span>TATİL</span>
                        <span className="text-[8px] underline">Aç</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleDayRest(day.dayIndex);
                        }}
                        className="px-1.5 py-0.2 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 rounded text-[9px] font-medium transition"
                        title="Bu günü tatil/dinlenme günü yap"
                      >
                        Tatil Yap
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground font-mono">
                    {day.dayNum} {day.monthName}
                  </span>
                </div>

                {/* Active Areas for this Day (x, y, z) */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {day.dayAreas.length > 0 ? (
                    day.dayAreas.map((area) => {
                      const styling = getAreaStyling(area.id, area.name);
                      return (
                        <span
                          key={area.id}
                          className={cn(
                            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border",
                            styling.bg,
                            styling.border,
                            styling.text
                          )}
                          title={area.name}
                        >
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: styling.color }} />
                          <span className="truncate max-w-[70px]">{area.name}</span>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-[10px] text-muted-foreground/80 italic">
                      {!activePlanDays.includes(day.dayIndex) ? "Tatil / Dinlenme Günü" : "Atanmış görev yok"}
                    </span>
                  )}
                </div>

                {/* Tasks List inside Day Card */}
                <div className="space-y-1.5 mt-2.5">
                  {hasTasks ? (
                    day.tasks.slice(0, 3).map((t) => {
                      const isDone = t.status === "done";
                      return (
                        <div
                          key={t.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditTaskModal(t);
                          }}
                          className="flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-muted/50 hover:bg-muted border border-border transition cursor-pointer group/task"
                          title={`${t.title} (${t.minutes} dk)`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleTask(t);
                              }}
                              className={cn(
                                "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition",
                                isDone ? "bg-blue-600 border-blue-500 text-white" : "border-slate-600 hover:border-slate-400"
                              )}
                            >
                              {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </button>
                            <span
                              className={cn(
                                "truncate text-[11px] font-medium text-foreground group-hover/task:text-blue-700 dark:text-blue-300 transition",
                                isDone && "line-through text-muted-foreground/80"
                              )}
                            >
                              {t.title}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono text-muted-foreground shrink-0">{t.minutes}m</span>
                        </div>
                      );
                    })
                  ) : !activePlanDays.includes(day.dayIndex) ? (
                    <div className="py-4 text-center text-muted-foreground/80">
                      <p className="text-xs font-medium text-amber-500/90">Tatil / Dinlenme</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">Plan Dışı Gün</p>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-muted-foreground/80">
                      <p className="text-xs">Görev yok</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">+ Görev Ata ile ekle</p>
                    </div>
                  )}

                  {day.tasks.length > 3 && (
                    <div className="text-[10px] text-muted-foreground text-center font-medium">
                      +{day.tasks.length - 3} görev daha
                    </div>
                  )}
                </div>
              </div>

              {/* Day Footer */}
              <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className={cn("font-bold", day.dayMinutes > 0 ? "text-foreground" : "text-muted-foreground/80")}>
                    {day.dayMinutes} dk
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAssignDayTarget(day.date);
                  }}
                  className="px-2 py-0.5 rounded bg-muted hover:bg-blue-600 text-foreground/90 hover:text-foreground text-[10px] font-semibold transition"
                >
                  + Görev
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DAY SPOTLIGHT DETAIL PANEL */}
      <div className="rounded-xl bg-muted/40 border border-border p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <h3 className="text-sm font-bold text-foreground">
              {currentSelectedDayObj.dayFullName} ({currentSelectedDayObj.dayNum} {currentSelectedDayObj.monthName}) Odak Planı
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-foreground/90">
              {currentSelectedDayObj.tasks.length} Görev • {currentSelectedDayObj.dayMinutes} dk
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {currentSelectedDayObj.dayAreas.length > 0 ? (
              <>
                Bu günün odak alanları:{" "}
                <strong className="text-blue-700 dark:text-blue-300">
                  {currentSelectedDayObj.dayAreas.map((a) => a.name).join(", ")}
                </strong>
              </>
            ) : (
              <>Bu gün için henüz spesifik bir odak alanı veya görev planlanmadı.</>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => openCreateTaskModal(currentSelectedDayObj.date)}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Bu Güne Görev Ekle
          </button>
          <button
            onClick={() => setAssignDayTarget(currentSelectedDayObj.date)}
            className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted text-foreground/90 text-xs font-medium border border-border transition"
          >
            Havuzdan Görev Ata
          </button>
        </div>
      </div>
    </section>
    {/* END: WeeklyDayFlowSection */}
    </>
  );
}
