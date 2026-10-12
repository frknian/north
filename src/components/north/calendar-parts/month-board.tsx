"use client";

import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus,
  Check,
  Pencil,
  Play,
  Plus,
  Sliders,
  Zap,
} from "lucide-react";
import {
  dayKey,
} from "@/lib/north";
import {
  Button,
} from "@/components/ui/button";
import {
} from "@/components/ui/badge";
import {
  cn,
} from "@/lib/utils";
import {
  eventKindLabels,
} from "./module-level";
import type { CalendarPlanCtx } from "./use-calendar-plan";

export function MonthBoard({ ctx }: { ctx: CalendarPlanCtx }) {
  const {
    state,
    date,
    setDate,
    view,
    setEventDraft,
    setTaskDraft,
    rolloverNotice,
    setRolloverNotice,
    days,
    leading,
    trailing,
    selectedDateFormatted,
    optionalPool,
    selectedTasks,
    selectedMinutes,
    selectedEvents,
    selectedBlockingEvents,
    daySettings,
    openDaySettingsModal,
    selectedDaySetting,
    toggleTaskDone,
    assignPoolTaskToDate,
    openNewTaskModal,
    openNewEventModal,
  } = ctx;
  return (
    <>
      {/* ROLLOVER BANNER */}
      {rolloverNotice && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-xs">
          <div className="flex items-center gap-2">
            <Zap className="size-3.5 text-amber-500 shrink-0" />
            <span className="text-foreground">{rolloverNotice}</span>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setRolloverNotice(null)}
            className="text-muted-foreground hover:text-foreground text-[11px]"
          >
            Kapat
          </Button>
        </div>
      )}
    
      {/* AYLIK TAKSİM: 2-COLUMN SPLIT PARTITION LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* LEFT PARTITION: 7-COLUMN CALENDAR (col-span-8) */}
        <div className="xl:col-span-8 space-y-2">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-muted-foreground py-1 px-1">
            <span>Pzt</span>
            <span>Sal</span>
            <span>Çar</span>
            <span>Per</span>
            <span>Cum</span>
            <span className="text-amber-500/90">Cmt</span>
            <span className="text-rose-500/90">Paz</span>
          </div>
    
          {/* Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Leading Empty Slots for Month Alignment */}
            {view === "month" &&
              Array.from({ length: leading }).map((_, i) => (
                <div
                  key={`leading-${i}`}
                  className="rounded-xl border border-dashed border-border/30 bg-muted/10 min-h-[90px] sm:min-h-[105px] opacity-30 pointer-events-none"
                />
              ))}
    
            {/* Days in Range */}
            {days.map((d) => {
              const isToday = d === dayKey();
              const isSelected = d === date;
              const dayDate = new Date(`${d}T12:00:00`);
              const dayNum = dayDate.getDate();
              const dayTasks = state.tasks.filter((t) => t.date === d && t.status !== "cancelled");
              const dayEvents = state.events.filter((e) => e.date === d);
              const totalMins = dayTasks.reduce((acc, t) => acc + t.minutes, 0);
              const daySetting = daySettings[d];
    
              return (
                <div
                  key={d}
                  onClick={() => setDate(d)}
                  className={cn(
                    "rounded-xl border p-2 sm:p-2.5 flex flex-col justify-between min-h-[95px] sm:min-h-[110px] transition-all cursor-pointer bg-card/60 relative group hover:border-primary/50",
                    isSelected
                      ? "border-primary ring-2 ring-primary/40 bg-primary/[0.04] shadow-xs"
                      : isToday
                      ? "border-primary/40 bg-primary/[0.02]"
                      : daySetting?.mode === "rest"
                      ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                      : daySetting?.mode === "deep_work"
                      ? "border-indigo-500/30 bg-indigo-500/[0.04]"
                      : daySetting?.mode === "light"
                      ? "border-amber-500/30 bg-amber-500/[0.04]"
                      : daySetting?.mode === "busy"
                      ? "border-sky-500/30 bg-sky-500/[0.04]"
                      : "border-border/60 hover:bg-muted/30"
                  )}
                >
                  <div>
                    {/* Top Row: Day Number + Setting Badge + Minutes */}
                    <div className="flex items-center justify-between gap-1 pb-1">
                      <span
                        className={cn(
                          "size-5 sm:size-6 rounded-full flex items-center justify-center text-xs font-bold font-mono",
                          isToday
                            ? "bg-primary text-primary-foreground"
                            : isSelected
                            ? "bg-primary/20 text-primary"
                            : "text-foreground"
                        )}
                      >
                        {dayNum}
                      </span>
                      <div className="flex items-center gap-1">
                        {daySetting && daySetting.mode !== "normal" && (
                          <span
                            className={cn(
                              "text-[8.5px] font-bold px-1 py-0.2 rounded leading-tight",
                              daySetting.mode === "rest"
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : daySetting.mode === "deep_work"
                                ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                                : daySetting.mode === "light"
                                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                : "bg-sky-500/20 text-sky-600 dark:text-sky-400"
                            )}
                          >
                            {daySetting.mode === "rest"
                              ? "🌴 Tatil"
                              : daySetting.mode === "deep_work"
                              ? "⚡ Yoğun"
                              : daySetting.mode === "light"
                              ? "🕯️ Hafif"
                              : "💼 Meşgul"}
                          </span>
                        )}
                        {totalMins > 0 && (
                          <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                            {totalMins}m
                          </span>
                        )}
                      </div>
                    </div>
    
                    {/* Theme Note if any */}
                    {daySetting?.themeNote && (
                      <p className="text-[9px] italic text-muted-foreground/80 truncate mb-1">
                        &ldquo;{daySetting.themeNote}&rdquo;
                      </p>
                    )}
    
                    {/* Events indicator chips */}
                    {dayEvents.length > 0 && (
                      <div className="space-y-0.5 my-1">
                        {dayEvents.slice(0, 2).map((evt) => {
                          const meta = eventKindLabels[evt.kind] || eventKindLabels.block;
                          return (
                            <div
                              key={evt.id}
                              className={cn(
                                "rounded px-1 py-0.5 text-[9px] font-medium truncate flex items-center gap-1 border",
                                meta.badgeClass
                              )}
                              title={`${evt.title} (${meta.label})`}
                            >
                              <span className="truncate">{evt.title || meta.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
    
                    {/* Tasks mini pills */}
                    {dayTasks.length > 0 && (
                      <div className="space-y-0.5 mt-1">
                        {dayTasks.slice(0, 2).map((t) => (
                          <div
                            key={t.id}
                            className={cn(
                              "text-[10px] truncate rounded px-1 py-0.2",
                              t.status === "done"
                                ? "line-through text-muted-foreground/60 bg-muted/40"
                                : "text-foreground font-medium bg-muted/70"
                            )}
                          >
                            {t.title}
                          </div>
                        ))}
                        {dayTasks.length > 2 && (
                          <span className="text-[9px] text-primary font-medium block">
                            +{dayTasks.length - 2} görev
                          </span>
                        )}
                      </div>
                    )}
                  </div>
    
                  {/* Hover Quick Action */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDaySettingsModal(d);
                      }}
                      className="text-[9px] font-semibold text-muted-foreground hover:text-primary flex items-center gap-0.5 cursor-pointer"
                      title="Günü Ayarla"
                    >
                      <Sliders className="size-2.5" /> Ayarla
                    </button>
                    <span className="text-[9px] font-semibold text-primary inline-flex items-center gap-0.5">
                      <Plus className="size-2.5" /> Seç
                    </span>
                  </div>
                </div>
              );
            })}
    
            {/* Trailing Empty Slots to Complete Row */}
            {view === "month" &&
              Array.from({ length: trailing }).map((_, i) => (
                <div
                  key={`trailing-${i}`}
                  className="rounded-xl border border-dashed border-border/30 bg-muted/10 min-h-[90px] sm:min-h-[105px] opacity-30 pointer-events-none"
                />
              ))}
          </div>
    
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 border-primary/20 bg-primary/10 text-primary">
              ⏱ Odak Bloğu
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 border-sky-500/20 bg-sky-500/10 text-sky-500">
              🎓 Ders / Okul
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 border-amber-500/20 bg-amber-500/10 text-amber-500">
              💼 İş / Mesai
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 border-rose-500/20 bg-rose-500/10 text-rose-500">
              📝 Sınav
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              🌴 Dinlenme Günü
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              ⚡ Yoğun Odak
            </span>
          </div>
        </div>
    
        {/* RIGHT PARTITION: SEÇİLİ GÜNÜN TAKSİMİ (col-span-4) */}
        <div className="xl:col-span-4 xl:sticky xl:top-20 space-y-3.5 rounded-2xl border border-border bg-card p-4 shadow-xs">
          {/* Partition Header */}
          <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-primary" />
                <span className="text-xs font-bold text-foreground">Günün Taksimi</span>
                {date === dayKey() && (
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                    Bugün
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-foreground mt-1 capitalize font-sans">
                {selectedDateFormatted}
              </h3>
            </div>
    
            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant="outline"
                onClick={() => openDaySettingsModal(date)}
                className="rounded-lg text-[11px] h-7 px-2 font-medium border-border/80 hover:border-primary/40 text-foreground shadow-2xs"
                title="Bu günü özelleştir (Dinlenme, Yoğun Çalışma, Kapasite, Not)"
              >
                <Sliders className="size-3 mr-1 text-primary" /> Gün Ayarla
              </Button>
              <div className="text-right">
                <span className="font-mono text-base font-extrabold text-primary block">
                  {selectedMinutes} dk
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {selectedTasks.length} görev
                </span>
              </div>
            </div>
          </div>
    
          {/* Day Setting Info Banner if configured */}
          {selectedDaySetting && (
            <div
              className={cn(
                "rounded-xl border p-2.5 text-xs flex items-center justify-between gap-2 shadow-2xs",
                selectedDaySetting.mode === "rest"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : selectedDaySetting.mode === "deep_work"
                  ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                  : selectedDaySetting.mode === "light"
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  : selectedDaySetting.mode === "busy"
                  ? "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                  : "border-border/60 bg-muted/30 text-foreground"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">
                  {selectedDaySetting.mode === "rest"
                    ? "🌴"
                    : selectedDaySetting.mode === "deep_work"
                    ? "⚡"
                    : selectedDaySetting.mode === "light"
                    ? "🕯️"
                    : selectedDaySetting.mode === "busy"
                    ? "💼"
                    : "🌿"}
                </span>
                <div className="min-w-0">
                  <span className="font-bold block truncate text-xs">
                    {selectedDaySetting.mode === "rest"
                      ? "Dinlenme & Mola Günü"
                      : selectedDaySetting.mode === "deep_work"
                      ? "Yoğun Odak Günü"
                      : selectedDaySetting.mode === "light"
                      ? "Hafif Gün"
                      : selectedDaySetting.mode === "busy"
                      ? "Ders / Mesai Günü"
                      : "Normal Gün"}
                    {selectedDaySetting.maxMinutes !== undefined &&
                      ` · Hedef: ${selectedDaySetting.maxMinutes} dk`}
                  </span>
                  {selectedDaySetting.themeNote && (
                    <span className="text-[11px] opacity-85 italic block truncate">
                      &ldquo;{selectedDaySetting.themeNote}&rdquo;
                    </span>
                  )}
                </div>
              </div>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => openDaySettingsModal(date)}
                className="h-6 px-2 text-[10px] shrink-0 hover:bg-background/40"
              >
                Düzenle
              </Button>
            </div>
          )}
    
          {/* Conflict Alert if any */}
          {selectedBlockingEvents.length > 0 && selectedTasks.length > 0 && (
            <div className="rounded-xl border border-sky-500/25 bg-sky-500/10 p-2 text-xs text-muted-foreground flex items-center gap-2">
              <span className="size-2 rounded-full bg-sky-500 shrink-0" />
              <span className="text-[11px] leading-snug">
                Bu günde <strong>{selectedBlockingEvents.map((e) => e.title || eventKindLabels[e.kind].label).join(", ")}</strong> var. Odaklar boş saatlere dağıtılır.
              </span>
            </div>
          )}
    
          {/* Scheduled Events of the Day */}
          {selectedEvents.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Sabit Bloklar & Etkinlikler
              </span>
              <div className="space-y-1">
                {selectedEvents.map((evt) => {
                  const meta = eventKindLabels[evt.kind] || eventKindLabels.block;
                  return (
                    <div
                      key={evt.id}
                      onClick={() => setEventDraft({ ...evt })}
                      className={cn(
                        "rounded-xl border p-2 text-xs flex items-center justify-between gap-2 cursor-pointer transition hover:opacity-90",
                        meta.badgeClass
                      )}
                    >
                      <div className="min-w-0 flex items-center gap-1.5">
                        <span>{meta.icon}</span>
                        <span className="font-semibold truncate">{evt.title}</span>
                      </div>
                      <div className="shrink-0 flex items-center gap-2 text-[10px] font-mono">
                        {evt.time && <span>{evt.time}</span>}
                        <span>{evt.minutes} dk</span>
                        <Pencil className="size-3 opacity-60" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
    
          {/* Scheduled Tasks of the Day */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Planlanan Odak Görevleri
              </span>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => openNewTaskModal(date)}
                className="text-[11px] h-6 px-1.5 text-primary hover:text-primary"
              >
                <Plus className="size-3 mr-0.5" /> Ekle
              </Button>
            </div>
    
            {selectedTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground space-y-2">
                <p>Bu güne atanmış bir görev bulunmuyor.</p>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => openNewTaskModal(date)}
                  className="rounded-lg text-xs"
                >
                  <Plus className="size-3 mr-1" /> Bu Güne Görev Ekle
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {selectedTasks.map((t) => {
                  const area = state.areas.find((a) => a.id === t.areaId);
                  const isDone = t.status === "done";
                  return (
                    <div
                      key={t.id}
                      className={cn(
                        "rounded-xl border p-2.5 text-xs flex items-start justify-between gap-2 transition-all group",
                        isDone
                          ? "border-emerald-500/25 bg-emerald-500/5 opacity-70"
                          : "border-border/80 bg-background/80 hover:border-primary/40"
                      )}
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleTaskDone(t.id)}
                          className={cn(
                            "size-4 rounded mt-0.5 flex items-center justify-center border transition-colors cursor-pointer shrink-0",
                            isDone
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-border hover:border-primary bg-card"
                          )}
                          title={isDone ? "Görevi aç" : "Tamamla"}
                        >
                          {isDone && <Check className="size-3 stroke-[3]" />}
                        </button>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "font-semibold text-foreground leading-snug",
                              isDone && "line-through text-muted-foreground"
                            )}
                          >
                            {t.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5 font-medium">
                            <span>{area?.name}</span>
                            <span>•</span>
                            <span className="font-mono">{t.minutes} dk</span>
                          </div>
                        </div>
                      </div>
    
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          asChild
                          size="icon-xs"
                          className="size-7 rounded-lg"
                          title="Odaklan"
                        >
                          <Link href={`/focus/${t.id}`}>
                            <Play className="size-3 fill-current" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setTaskDraft({ ...t })}
                          className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                          title="Düzenle"
                        >
                          <Pencil className="size-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
    
          {/* Quick Actions for Selected Day */}
          <div className="pt-2 border-t border-border/60 grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openNewTaskModal(date)}
              className="text-xs rounded-xl h-8 font-semibold"
            >
              <Plus className="size-3.5 mr-1" /> + Görev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openNewEventModal(date)}
              className="text-xs rounded-xl h-8 font-semibold text-sky-500 hover:text-sky-600"
            >
              <CalendarPlus className="size-3.5 mr-1" /> + Blok
            </Button>
          </div>
    
          {/* Optional Pool (Esnek Havuzdan Bu Güne Çek) */}
          {optionalPool.length > 0 && (
            <div className="pt-2 border-t border-border/60 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Esnek Havuz ({optionalPool.length} Görev)
              </span>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
                {optionalPool.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-2 py-1.5 text-xs gap-1"
                  >
                    <span className="truncate text-[11px] text-foreground font-medium">{p.title}</span>
                    <button
                      type="button"
                      onClick={() => assignPoolTaskToDate(p.id, date)}
                      className="shrink-0 text-[10px] font-semibold text-primary hover:underline px-1 py-0.5 rounded cursor-pointer"
                    >
                      Bu Güne Ata
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    
    </>
  );
}
