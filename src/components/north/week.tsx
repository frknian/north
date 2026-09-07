"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Compass,
  Layers,
  MoreHorizontal,
  MoveRight,
  Pencil,
  Play,
  Plus,
  Scissors,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import {
  capacity,
  dayKey,
  dropTask,
  isAreaActive,
  poolTask,
  postponeTask,
  rolloverUnfinishedTasks,
  shiftDay,
  shrinkTask,
  weekKey,
  type NorthTask,
} from "@/lib/north";
import { recommendedSessionMinutes } from "@/lib/north-intelligence";
import { useNorth } from "./shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";

const phaseLabels: Record<string, { label: string; step: number; desc: string }> = {
  starter: { label: "Başlangıç & Harita", step: 1, desc: "Temel ön koşullar ve güvenilir kaynaklar" },
  mid_check: { label: "Ara Kontrol & Rutin", step: 2, desc: "İlk pratik ve ritim doğrulama" },
  application: { label: "Yoğun Uygulama", step: 3, desc: "Bağımsız problem çözme ve derin odak" },
  review: { label: "Tekrar & Pekiştirme", step: 4, desc: "Aralıklı tekrar ve zayıf konular" },
  final_proof: { label: "Final Kanıt & Zirve", step: 5, desc: "Portföy ve nihai hedef kanıtı" },
};

export function NorthWeek() {
  const { state, update, workspace } = useNorth();
  const [activeView, setActiveView] = useState<"board" | "roadmap">("board");
  const [week, setWeek] = useState(weekKey());
  const [draft, setDraft] = useState<NorthTask | null>(null);
  const [showPool, setShowPool] = useState(false);

  const activeAreas = state.areas.filter(isAreaActive);
  const currentWeekTasks = state.tasks.filter((task) => task.week === week);
  const scheduledTasks = currentWeekTasks.filter((t) => t.date && !["cancelled"].includes(t.status));
  const poolTasks = currentWeekTasks.filter((t) => !t.date && !["done", "cancelled"].includes(t.status));
  const completedTasks = currentWeekTasks.filter((t) => t.status === "done");

  const plannedMinutes = currentWeekTasks
    .filter((t) => !["done", "cancelled"].includes(t.status))
    .reduce((sum, t) => sum + t.minutes, 0);
  const completedMinutes = completedTasks.reduce((sum, t) => sum + t.minutes, 0);
  const weeklyCap = capacity(state);

  const isCurrentWeek = week === weekKey();
  const periodMilestones = workspace.coaching.milestones.filter((m) => m.phase);
  const overdueTasks = state.tasks.filter(
    (t) => t.date && t.date < dayKey() && !["done", "cancelled"].includes(t.status)
  );

  // 7 Days of the selected week (Mon -> Sun)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = shiftDay(week, i);
    const dateObj = new Date(`${d}T12:00:00`);
    const dayName = dateObj.toLocaleDateString("tr-TR", { weekday: "short" });
    const dayNum = dateObj.getDate();
    const monthName = dateObj.toLocaleDateString("tr-TR", { month: "short" });
    const isToday = d === dayKey();
    const tasksForDay = state.tasks.filter((t) => t.date === d && !["cancelled"].includes(t.status));
    const eventsForDay = state.events.filter((e) => e.date === d);
    const dayMinutes = tasksForDay.reduce((acc, t) => acc + t.minutes, 0);
    return { date: d, dayName, dayNum, monthName, isToday, tasks: tasksForDay, events: eventsForDay, dayMinutes };
  });

  const weekStartDate = new Date(`${week}T12:00:00`);
  const weekEndDate = new Date(`${shiftDay(week, 6)}T12:00:00`);
  const weekLabel = `${weekStartDate.getDate()} ${weekStartDate.toLocaleDateString("tr-TR", { month: "short" })} – ${weekEndDate.getDate()} ${weekEndDate.toLocaleDateString("tr-TR", { month: "short" })}`;

  const openNewTaskModal = (targetDate?: string) => {
    if (!activeAreas.length) return;
    const area = activeAreas[0];
    setDraft({
      id: crypto.randomUUID(),
      areaId: area.id,
      title: "",
      goal: "",
      minutes: area.preferredSessionMinutes ?? recommendedSessionMinutes(state, area.id),
      intensity: "normal",
      mandatory: true,
      status: "pending",
      date: targetDate || "",
      deadline: "",
      resource: "",
      why: "Kendi hedefin için eklediğin adım.",
      week,
    });
  };

  const toggleTaskDone = (task: NorthTask) => {
    const nextStatus = task.status === "done" ? "pending" : "done";
    update((curr) => ({
      ...curr,
      tasks: curr.tasks.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)),
    }));
  };

  return (
    <div className="page-content space-y-6 pb-20">
      {/* VIEW SWITCHER & TITLE */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Haftalık Planlayıcı</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daha az karar, daha iyi odak. Haftanı sakin, dengeli ve aşamalı yönet.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-border/70 bg-muted/40 p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveView("board")}
              className={cn(
                "rounded-lg px-3 py-1.5 font-medium transition-all",
                activeView === "board"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              🗓️ Haftalık Pano
            </button>
            <button
              type="button"
              onClick={() => setActiveView("roadmap")}
              className={cn(
                "rounded-lg px-3 py-1.5 font-medium transition-all",
                activeView === "roadmap"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              🗺️ Dönem Yol Haritası
            </button>
          </div>

          <Button asChild variant="outline" size="sm" className="rounded-xl text-xs">
            <Link href="/north-ai">
              <Sparkles className="mr-1.5 size-3.5 text-primary" />
              North&apos;a Planlat
            </Link>
          </Button>
          <Button size="sm" onClick={() => openNewTaskModal()} className="rounded-xl text-xs shadow-xs">
            <Plus className="mr-1.5 size-3.5" />
            Görev Ekle
          </Button>
        </div>
      </header>

      {/* OVERDUE SMART ROLLOVER BANNER (NO GUILT / NO DEBT) */}
      {overdueTasks.length > 0 && (
        <aside aria-label="Sarkan görevler" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="grid size-6 place-items-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <AlertCircle className="size-3.5" />
            </div>
            <div>
              <span className="font-semibold text-foreground">Önceki günlerden kalan {overdueTasks.length} görev var.</span>
              <span className="text-muted-foreground ml-1 hidden sm:inline">
                North&apos;ta borç birikmez; görevleri haftanın uygun günlerine aktarabilirsin.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs text-[11px]"
              onClick={() => {
                const result = rolloverUnfinishedTasks(state);
                update(() => result.state);
              }}
            >
              <Zap className="mr-1 size-3" />
              Haftaya Otomatik Yay
            </Button>
            <Button
              size="xs"
              variant="outline"
              className="rounded-lg text-[11px]"
              onClick={() =>
                update((curr) => ({
                  ...curr,
                  tasks: curr.tasks.map((t) => (overdueTasks.some((o) => o.id === t.id) ? poolTask(t) : t)),
                }))
              }
            >
              Havuza Al
            </Button>
          </div>
        </aside>
      )}

      {activeView === "board" ? (
        <main className="space-y-4">
          {/* WEEK CONTROLS & CAPACITY HUD */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card/60 px-4 py-3 shadow-xs">
            {/* Week navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-xs"
                className="rounded-lg"
                onClick={() => setWeek(shiftDay(week, -7))}
                title="Önceki Hafta"
                aria-label="Önceki Hafta"
              >
                <ArrowLeft className="size-3.5" />
              </Button>
              <span className="font-semibold text-xs sm:text-sm text-foreground">{weekLabel}</span>
              <Button
                variant="ghost"
                size="icon-xs"
                className="rounded-lg"
                onClick={() => setWeek(shiftDay(week, 7))}
                title="Sonraki Hafta"
                aria-label="Sonraki Hafta"
              >
                <ArrowRight className="size-3.5" />
              </Button>
              {!isCurrentWeek && (
                <Button
                  variant="outline"
                  size="xs"
                  className="rounded-lg text-[10px] ml-1"
                  onClick={() => setWeek(weekKey())}
                >
                  Bugüne Dön
                </Button>
              )}
            </div>

            {/* Capacity status */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-3.5" />
                <span>
                  Planlanan: <strong className="text-foreground">{Math.round(plannedMinutes / 60)} sa</strong> / Hedef {Math.round(weeklyCap / 60)} sa
                </span>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border",
                  plannedMinutes > weeklyCap
                    ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                )}
              >
                <span className={cn("size-1.5 rounded-full", plannedMinutes > weeklyCap ? "bg-amber-500" : "bg-emerald-500")} />
                {plannedMinutes > weeklyCap ? "Kapasite Yoğun" : "Kapasite Dengeli"}
              </span>

              {/* Pool toggle */}
              <Button
                variant={showPool ? "secondary" : "outline"}
                size="xs"
                className="rounded-lg text-[11px]"
                onClick={() => setShowPool(!showPool)}
              >
                <Layers className="mr-1 size-3" />
                Esnek Havuz ({poolTasks.length})
              </Button>
            </div>
          </div>

          {/* ESNEK HAVUZ DRAWER (COLLAPSIBLE) */}
          {showPool && (
            <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/[0.02] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-semibold text-foreground">Güne Atanmamış Esnek Görev Havuzu</h2>
                  <p className="text-[11px] text-muted-foreground">
                    Bu hafta tamamlanması gereken ancak henüz spesifik bir güne kilitlenmemiş işler.
                  </p>
                </div>
                <Button size="xs" variant="ghost" onClick={() => openNewTaskModal()} className="text-[11px]">
                  + Havuza Ekle
                </Button>
              </div>

              {poolTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 italic text-center">
                  Havuzda atanmamış görev yok. Tüm görevlerin günleri belirlendi.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {poolTasks.map((task) => {
                    const area = state.areas.find((a) => a.id === task.areaId);
                    return (
                      <div
                        key={task.id}
                        className="rounded-xl border bg-card p-3 text-xs flex flex-col justify-between gap-2 shadow-xs"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {area?.name}
                            </Badge>
                            <span className="text-[10px] font-mono text-muted-foreground">{task.minutes} dk</span>
                          </div>
                          <p className="font-medium text-foreground mt-1.5">{task.title}</p>
                        </div>
                        <div className="flex items-center justify-between border-t pt-2 mt-1">
                          <span className="text-[10px] text-muted-foreground">Güne ata:</span>
                          <div className="flex gap-1">
                            {weekDays.slice(0, 5).map((d) => (
                              <button
                                key={d.date}
                                type="button"
                                className="rounded px-1.5 py-0.5 text-[10px] bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                                onClick={() =>
                                  update((curr) => ({
                                    ...curr,
                                    tasks: curr.tasks.map((t) => (t.id === task.id ? { ...t, date: d.date } : t)),
                                  }))
                                }
                                title={`${d.dayName} gününe ata`}
                              >
                                {d.dayName}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 7-DAY VISUAL FOCUS BOARD GRID */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map((day) => (
              <div
                key={day.date}
                className={cn(
                  "flex flex-col justify-between rounded-2xl border p-3 min-h-[360px] transition-all bg-card/40",
                  day.isToday
                    ? "border-primary/50 bg-primary/[0.03] ring-1 ring-primary/20 shadow-xs"
                    : "border-border/60 hover:border-border"
                )}
              >
                <div>
                  {/* Day Column Header */}
                  <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-2.5">
                    <div>
                      <span className={cn("font-bold text-xs uppercase tracking-wider", day.isToday ? "text-primary" : "text-foreground")}>
                        {day.dayName}
                      </span>
                      <span className="text-[11px] text-muted-foreground ml-1.5 font-sans">
                        {day.dayNum} {day.monthName}
                      </span>
                    </div>
                    {day.dayMinutes > 0 && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {day.dayMinutes} dk
                      </span>
                    )}
                  </div>

                  {/* Events (if any) */}
                  {day.events.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {day.events.map((evt) => (
                        <div
                          key={evt.id}
                          className="rounded-lg bg-muted/60 px-2 py-1 text-[10px] font-medium text-muted-foreground truncate"
                          title={evt.title}
                        >
                          📅 {evt.title}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tasks List */}
                  <div className="space-y-2">
                    {day.tasks.map((task) => {
                      const area = state.areas.find((a) => a.id === task.areaId);
                      const isDone = task.status === "done";
                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "group relative rounded-xl border p-2.5 text-xs transition-all flex flex-col gap-1.5 shadow-xs",
                            isDone
                              ? "border-emerald-500/30 bg-emerald-500/[0.04] opacity-70"
                              : "border-border bg-card hover:border-primary/50"
                          )}
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-muted-foreground/30">
                              {area?.name}
                            </Badge>
                            <span className="text-[10px] font-mono text-muted-foreground">{task.minutes} dk</span>
                          </div>

                          <div className="flex items-start gap-2">
                            <button
                              type="button"
                              onClick={() => toggleTaskDone(task)}
                              className={cn(
                                "size-4 mt-0.5 shrink-0 rounded border grid place-items-center transition-colors",
                                isDone
                                  ? "border-emerald-500 bg-emerald-500 text-white"
                                  : "border-muted-foreground/40 hover:border-primary"
                              )}
                              title={isDone ? "Görevi bekleyene al" : "Görevi tamamlandı olarak işaretle"}
                            >
                              {isDone && <Check className="size-3 stroke-[3]" />}
                            </button>
                            <p className={cn("font-medium text-foreground leading-snug line-clamp-2", isDone && "line-through text-muted-foreground")}>
                              {task.title}
                            </p>
                          </div>

                          {/* Action Bar (Quick dropdown) */}
                          <div className="flex items-center justify-between border-t border-border/30 pt-1.5 mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/focus/${task.id}`}
                              className="text-[10px] font-medium text-primary hover:underline inline-flex items-center gap-0.5"
                            >
                              <Play className="size-2.5 fill-current" /> Odaklan
                            </Link>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-xs" className="size-5 rounded text-muted-foreground hover:text-foreground">
                                  <MoreHorizontal className="size-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="text-xs">
                                <DropdownMenuItem onClick={() => setDraft({ ...task })}>
                                  <Pencil className="size-3.5 mr-2" /> Düzenle
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    update((curr) => ({
                                      ...curr,
                                      tasks: curr.tasks.map((t) =>
                                        t.id === task.id ? postponeTask(t, shiftDay(t.date || dayKey(), 1)) : t
                                      ),
                                    }))
                                  }
                                >
                                  <MoveRight className="size-3.5 mr-2 text-amber-500" /> Yarına Kaydır (+1 Gün)
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    update((curr) => ({
                                      ...curr,
                                      tasks: curr.tasks.map((t) => (t.id === task.id ? poolTask(t) : t)),
                                    }))
                                  }
                                >
                                  <Layers className="size-3.5 mr-2 text-indigo-400" /> Havuza Al
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    update((curr) => ({
                                      ...curr,
                                      tasks: curr.tasks.map((t) => (t.id === task.id ? shrinkTask(t) : t)),
                                    }))
                                  }
                                >
                                  <Scissors className="size-3.5 mr-2 text-sky-500" /> Süreyi Yarıya İndir
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() =>
                                    update((curr) => ({
                                      ...curr,
                                      tasks: curr.tasks.map((t) => (t.id === task.id ? dropTask(t) : t)),
                                    }))
                                  }
                                >
                                  <Trash2 className="size-3.5 mr-2" /> Borçsuz Bırak
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })}

                    {day.tasks.length === 0 && (
                      <div className="py-8 text-center text-[10px] text-muted-foreground/60 border border-dashed border-border/40 rounded-xl">
                        Plan yok
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Add Button per Day */}
                <button
                  type="button"
                  onClick={() => openNewTaskModal(day.date)}
                  className="mt-3 w-full py-1.5 rounded-xl border border-dashed border-border/50 text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="size-3" /> Görev Ekle
                </button>
              </div>
            ))}
          </div>
        </main>
      ) : (
        /* 5-PHASE STRATEGIC ROADMAP VIEW */
        <section className="space-y-4">
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="size-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Dönem Yol Haritası (5 Aşama)</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hedefine ulaşmanı sağlayan 5 stratejik aşama ve kilometre taşları.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-5">
              {periodMilestones.map((m, idx) => {
                const isCompleted = m.status === "completed";
                const isActive = m.status === "active";
                const phaseMeta = m.phase ? phaseLabels[m.phase] : { label: `Aşama ${idx + 1}`, step: idx + 1, desc: "" };

                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex flex-col justify-between rounded-xl border p-4 text-xs transition-all",
                      isCompleted
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : isActive
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs"
                        : "border-border/60 bg-muted/20 opacity-80"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            isCompleted ? "text-emerald-600" : isActive ? "text-primary" : "text-muted-foreground"
                          )}
                        >
                          {phaseMeta.step}. Aşama
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {m.targetWeek ?? Math.round(m.horizonDays / 7)}. Hafta
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground mt-2">{phaseMeta.label}</h3>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{m.title || phaseMeta.desc}</p>
                    </div>

                    <div className="mt-4 border-t border-border/40 pt-2 flex items-center justify-between">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-semibold",
                          isCompleted ? "text-emerald-600" : isActive ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {isCompleted && <Check className="size-3" />}
                        {isCompleted ? "Tamamlandı" : isActive ? "Aktif Aşama" : "Planlandı"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* TASK EDIT / CREATE DIALOG */}
      <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {draft && state.tasks.some((t) => t.id === draft.id) ? "Görevi Düzenle" : "Yeni Görev Planla"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Somut, ölçülebilir ve belirli bir süreye sahip bir odak adımı belirle.
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <Label className="text-xs">Hedef Alanı</Label>
                <select
                  value={draft.areaId}
                  onChange={(e) => {
                    const area = activeAreas.find((a) => a.id === e.target.value);
                    setDraft({
                      ...draft,
                      areaId: e.target.value,
                      minutes: area?.preferredSessionMinutes ?? recommendedSessionMinutes(state, e.target.value),
                    });
                  }}
                  className="w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Örn: Limit ve Süreklilik Soru Çözümü"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Somut Çıktı / Hedef</Label>
                <Input
                  value={draft.goal}
                  onChange={(e) => setDraft({ ...draft, goal: e.target.value })}
                  placeholder="Örn: 20 soru çöz, takıldığın formülleri not et"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Süre (Dakika)</Label>
                  <Input
                    type="number"
                    min="5"
                    max="240"
                    value={draft.minutes}
                    onChange={(e) => setDraft({ ...draft, minutes: Number(e.target.value) })}
                    className="rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Planlanan Gün</Label>
                  <Input
                    type="date"
                    value={draft.date}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        date: e.target.value,
                        week: e.target.value ? weekKey(e.target.value) : week,
                      })
                    }
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.mandatory}
                  onChange={(e) => setDraft({ ...draft, mandatory: e.target.checked })}
                  className="rounded"
                />
                <span className="text-[11px] text-foreground font-medium">Bu hafta için yüksek öncelikli</span>
              </label>
            </div>
          )}

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setDraft(null)} className="rounded-xl text-xs">
              Vazgeç
            </Button>
            <Button
              size="sm"
              disabled={!draft?.title.trim()}
              onClick={() => {
                if (!draft) return;
                update((current) => ({
                  ...current,
                  tasks: current.tasks.some((task) => task.id === draft.id)
                    ? current.tasks.map((task) => (task.id === draft.id ? draft : task))
                    : [...current.tasks, draft],
                }));
                setDraft(null);
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
