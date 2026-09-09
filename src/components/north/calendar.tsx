"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  Zap,
} from "lucide-react";
import {
  dayKey,
  isAreaActive,
  shiftDay,
  weekKey,
  distributePlanTasksToCalendar,
  rolloverUnfinishedTasks,
  type NorthEvent,
  type NorthTask,
} from "@/lib/north";
import { useNorth } from "./shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const eventKindLabels: Record<
  NorthEvent["kind"],
  { label: string; icon: string; badgeClass: string }
> = {
  block: { label: "Odak Bloğu", icon: "⏱", badgeClass: "border-primary/30 bg-primary/10 text-primary" },
  class: { label: "Ders / Okul", icon: "🎓", badgeClass: "border-sky-500/30 bg-sky-500/10 text-sky-500" },
  shift: { label: "İş / Mesai", icon: "💼", badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-500" },
  personal: { label: "Kişisel Blok", icon: "👤", badgeClass: "border-purple-500/30 bg-purple-500/10 text-purple-400" },
  exam: { label: "Sınav", icon: "📝", badgeClass: "border-rose-500/30 bg-rose-500/10 text-rose-500" },
  deadline: { label: "Son Tarih", icon: "⚠️", badgeClass: "border-red-500/30 bg-red-500/10 text-red-500" },
};

export function NorthCalendar() {
  const { state, update } = useNorth();
  const [date, setDate] = useState(dayKey());
  const [view, setView] = useState<"day" | "week" | "month">("month");
  const [eventDraft, setEventDraft] = useState<NorthEvent | null>(null);
  const [taskDraft, setTaskDraft] = useState<NorthTask | null>(null);
  const [rolloverNotice, setRolloverNotice] = useState<string | null>(null);

  const activeAreas = state.areas.filter(isAreaActive);
  const start = view === "day" ? date : view === "week" ? weekKey(date) : date.slice(0, 7) + "-01";
  const count =
    view === "day"
      ? 1
      : view === "week"
      ? 7
      : new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)), 0).getDate();
  const days = Array.from({ length: count }, (_, index) => shiftDay(start, index));
  const leading = view === "month" ? (new Date(start + "T12:00:00").getDay() + 6) % 7 : 0;
  const trailing = view === "month" ? (7 - ((leading + count) % 7)) % 7 : 0;

  const monthDate = new Date(`${date.slice(0, 7)}-01T12:00:00`);
  const monthName = monthDate.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  const selectedDateFormatted = new Date(`${date}T12:00:00`).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  });

  const navigateMonth = (delta: -1 | 1) => {
    const currentYear = Number(date.slice(0, 4));
    const currentMonth = Number(date.slice(5, 7));
    const newDate = new Date(currentYear, currentMonth - 1 + delta, 1);
    const y = newDate.getFullYear();
    const m = String(newDate.getMonth() + 1).padStart(2, "0");
    setDate(`${y}-${m}-01`);
  };

  const dateTasks = state.tasks.filter((task) => task.date && task.status !== "cancelled");
  const optionalPool = state.tasks.filter(
    (task) => !task.mandatory && !task.date && !["done", "cancelled"].includes(task.status)
  );
  const selectedTasks = dateTasks.filter(
    (task) => task.date === date && !["done", "cancelled"].includes(task.status)
  );
  const selectedMinutes = selectedTasks.reduce((total, task) => total + task.minutes, 0);
  const selectedEvents = state.events.filter((event) => event.date === date);
  const selectedBlockingEvents = selectedEvents.filter((e) =>
    ["class", "shift", "personal", "block"].includes(e.kind)
  );

  useEffect(() => {
    const today = dayKey();
    const overdue = state.tasks.filter(
      (t) => t.date && t.date < today && !["done", "cancelled"].includes(t.status)
    );
    if (overdue.length > 0) {
      const result = rolloverUnfinishedTasks(state, today);
      if (result.rolledOverCount > 0) {
        update(() => result.state);
        const sample = result.details
          .slice(0, 2)
          .map((d) => `"${d.taskTitle}" (${d.fromDate} → ${d.toDate})`)
          .join(", ");
        setRolloverNotice(
          `Tamamlanamayan ${result.rolledOverCount} görev, suçluluk hissi olmadan bu haftaya aktarıldı: ${sample}`
        );
      }
    }
  }, [state, update]);

  const handleRebalance = () => {
    const today = dayKey();
    const distributed = distributePlanTasksToCalendar(state.tasks, {
      weeklyHours: state.weeklyHours,
      events: state.events,
      today,
    });
    const rolled = rolloverUnfinishedTasks({ ...state, tasks: distributed }, today);
    update(() => rolled.state);
    toast.success("Plan günlere ve haftaya dengeli şekilde dağıtıldı.");
  };

  const toggleTaskDone = (taskId: string) => {
    update((curr) => ({
      ...curr,
      tasks: curr.tasks.map((t) =>
        t.id === taskId ? { ...t, status: t.status === "done" ? "pending" : "done" } : t
      ),
    }));
  };

  const assignPoolTaskToDate = (taskId: string, targetDate: string) => {
    update((curr) => ({
      ...curr,
      tasks: curr.tasks.map((t) =>
        t.id === taskId ? { ...t, date: targetDate, week: weekKey(targetDate) } : t
      ),
    }));
    toast.success("Görev seçili güne taksim edildi.");
  };

  const openNewTaskModal = (plannedDate = date) => {
    const area = activeAreas[0];
    if (!area) return;
    setTaskDraft({
      id: crypto.randomUUID(),
      areaId: area.id,
      title: "",
      goal: "",
      minutes: area.preferredSessionMinutes ?? 35,
      intensity: "normal",
      mandatory: true,
      status: "pending",
      date: plannedDate,
      deadline: "",
      resource: "",
      why: "Takvimden eklenen odak adımı.",
      week: weekKey(plannedDate),
      taskType: "deep_work",
    });
  };

  const openNewEventModal = (targetDate = date) => {
    if (!activeAreas.length) return;
    setEventDraft({
      id: crypto.randomUUID(),
      areaId: activeAreas[0].id,
      title: "",
      date: targetDate,
      time: "09:00",
      kind: "block",
      minutes: 60,
    });
  };

  return (
    <div className="page-content space-y-5 pb-20 md:pb-10">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] font-bold tracking-wider uppercase text-primary">
              Aylık Takvim & Taksim
            </Badge>
            <span className="text-xs text-muted-foreground">· Haftalık Kapasite: {state.weeklyHours} saat</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Takvim & Zaman Blokları
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Derslerini, mesaini ve serbest zamanlarını gör; odak görevlerini günlere dengeli taksim et.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRebalance}
            className="rounded-xl text-xs"
            title="Dengeli Dağıt: Kaçan veya ötelenen görevleri boşluklara akıllıca paylaştırır"
          >
            <RefreshCw className="size-3.5 mr-1.5 text-primary" /> Dengeli Dağıt
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!activeAreas.length}
            onClick={() => openNewEventModal(date)}
            className="rounded-xl text-xs"
          >
            <CalendarPlus className="size-3.5 mr-1.5 text-sky-400" /> + Blok Ekle
          </Button>
          <Button
            size="sm"
            disabled={!activeAreas.length}
            onClick={() => openNewTaskModal(date)}
            className="rounded-xl text-xs shadow-xs"
          >
            <Plus className="size-3.5 mr-1.5" /> + Görev Planla
          </Button>
        </div>
      </header>

      {/* CONTROLS & NAVIGATION HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card/60 p-3 shadow-xs">
        {/* Month Navigator */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => navigateMonth(-1)}
            className="size-8 rounded-lg"
            title="Önceki Ay"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="font-bold text-sm sm:text-base text-foreground capitalize px-2 min-w-[130px] text-center">
            {monthName}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => navigateMonth(1)}
            className="size-8 rounded-lg"
            title="Sonraki Ay"
          >
            <ChevronRight className="size-4" />
          </Button>

          {date !== dayKey() && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => setDate(dayKey())}
              className="rounded-xl text-[11px] ml-2 h-7"
            >
              Bugün
            </Button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border bg-muted/40 p-1 text-xs">
            {(["month", "week", "day"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={cn(
                  "rounded-lg px-3 py-1 font-medium transition-all cursor-pointer",
                  view === mode
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {mode === "month" ? "Aylık Taksim" : mode === "week" ? "Hafta" : "Gün"}
              </button>
            ))}
          </div>

          <Input
            type="date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="w-auto text-xs rounded-xl h-8 hidden sm:inline-flex"
          />
        </div>
      </div>

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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT PARTITION: 7-COLUMN CALENDAR (col-span-8) */}
        <div className="lg:col-span-8 space-y-2">
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
                      : "border-border/60 hover:bg-muted/30"
                  )}
                >
                  <div>
                    {/* Top Row: Day Number + Badge */}
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
                      {totalMins > 0 && (
                        <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                          {totalMins}m
                        </span>
                      )}
                    </div>

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

                  {/* Hover Quick Add */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end pt-1">
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
          </div>
        </div>

        {/* RIGHT PARTITION: SEÇİLİ GÜNÜN TAKSİMİ (col-span-4) */}
        <div className="lg:col-span-4 space-y-3.5 rounded-2xl border border-border bg-card p-4 shadow-xs">
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

            <div className="text-right">
              <span className="font-mono text-base font-extrabold text-primary block">
                {selectedMinutes} dk
              </span>
              <span className="text-[10px] text-muted-foreground block">
                {selectedTasks.length} görev
              </span>
            </div>
          </div>

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

      {/* EVENT MODAL */}
      <Dialog open={Boolean(eventDraft)} onOpenChange={(open) => !open && setEventDraft(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {eventDraft && state.events.some((e) => e.id === eventDraft.id) ? "Etkinliği Düzenle" : "Yeni Zaman Bloğu"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ders, mesai, sınav veya kişisel blok ekleyerek gününü koru.
            </DialogDescription>
          </DialogHeader>

          {eventDraft && (
            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <Label className="text-xs">Blok Türü</Label>
                <select
                  value={eventDraft.kind}
                  onChange={(e) => setEventDraft({ ...eventDraft, kind: e.target.value as NorthEvent["kind"] })}
                  className="w-full rounded-xl border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {Object.entries(eventKindLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.icon} {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Başlık</Label>
                <Input
                  value={eventDraft.title}
                  onChange={(e) => setEventDraft({ ...eventDraft, title: e.target.value })}
                  placeholder="Örn: Veri Yapıları Dersi veya Gece Vardiyası"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Tarih</Label>
                  <Input
                    type="date"
                    value={eventDraft.date}
                    onChange={(e) => setEventDraft({ ...eventDraft, date: e.target.value })}
                    className="rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Saat (İsteğe Bağlı)</Label>
                  <Input
                    type="time"
                    value={eventDraft.time || ""}
                    onChange={(e) => setEventDraft({ ...eventDraft, time: e.target.value })}
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between gap-2 pt-2">
            {eventDraft && state.events.some((e) => e.id === eventDraft.id) ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  update((curr) => ({ ...curr, events: curr.events.filter((e) => e.id !== eventDraft.id) }));
                  setEventDraft(null);
                }}
              >
                <Trash2 className="size-3.5 mr-1" /> Sil
              </Button>
            ) : <div />}

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEventDraft(null)} className="rounded-xl text-xs">
                Vazgeç
              </Button>
              <Button
                size="sm"
                disabled={!eventDraft?.title.trim()}
                onClick={() => {
                  if (!eventDraft) return;
                  update((curr) => ({
                    ...curr,
                    events: curr.events.some((e) => e.id === eventDraft.id)
                      ? curr.events.map((e) => (e.id === eventDraft.id ? eventDraft : e))
                      : [...curr.events, eventDraft],
                  }));
                  setEventDraft(null);
                }}
                className="rounded-xl text-xs"
              >
                Kaydet
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TASK MODAL */}
      <Dialog open={Boolean(taskDraft)} onOpenChange={(open) => !open && setTaskDraft(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {taskDraft && state.tasks.some((t) => t.id === taskDraft.id) ? "Görevi Düzenle" : "Yeni Görev Planla"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Günün odak akışına bir çalışma adımı yerleştir.
            </DialogDescription>
          </DialogHeader>

          {taskDraft && (
            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <Label className="text-xs">Hedef Alanı</Label>
                <select
                  value={taskDraft.areaId}
                  onChange={(e) => setTaskDraft({ ...taskDraft, areaId: e.target.value })}
                  className="w-full rounded-xl border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {activeAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Görev Başlığı</Label>
                <Input
                  value={taskDraft.title}
                  onChange={(e) => setTaskDraft({ ...taskDraft, title: e.target.value })}
                  placeholder="Örn: SQL Join Alıştırmaları"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Süre (Dk)</Label>
                  <Input
                    type="number"
                    min="5"
                    max="240"
                    value={taskDraft.minutes}
                    onChange={(e) => setTaskDraft({ ...taskDraft, minutes: Number(e.target.value) })}
                    className="rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tarih</Label>
                  <Input
                    type="date"
                    value={taskDraft.date}
                    onChange={(e) =>
                      setTaskDraft({
                        ...taskDraft,
                        date: e.target.value,
                        week: e.target.value ? weekKey(e.target.value) : taskDraft.week,
                      })
                    }
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setTaskDraft(null)} className="rounded-xl text-xs">
              Vazgeç
            </Button>
            <Button
              size="sm"
              disabled={!taskDraft?.title.trim()}
              onClick={() => {
                if (!taskDraft) return;
                update((curr) => ({
                  ...curr,
                  tasks: curr.tasks.some((t) => t.id === taskDraft.id)
                    ? curr.tasks.map((t) => (t.id === taskDraft.id ? taskDraft : t))
                    : [...curr.tasks, taskDraft],
                }));
                setTaskDraft(null);
              }}
              className="rounded-xl text-xs"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
