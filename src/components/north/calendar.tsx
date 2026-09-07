"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  Check,
  Clock,
  Pencil,
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
  const [view, setView] = useState<"day" | "week" | "month">("week");
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
    <div className="page-content space-y-6 pb-20">
      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Zaman Bloklama &amp; Takvim</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dersler, mesailer, sınavlar ve odak blokları tek çatı altında. Çakışmalar otomatik hesaplanır.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRebalance} className="rounded-xl text-xs">
            <Zap className="size-3.5 mr-1.5 text-amber-500" /> Planı Günlere Dengele
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!activeAreas.length}
            onClick={() => openNewEventModal()}
            className="rounded-xl text-xs"
          >
            <CalendarPlus className="size-3.5 mr-1.5 text-sky-400" /> + Blok Ekle
          </Button>
          <Button
            size="sm"
            disabled={!activeAreas.length}
            onClick={() => openNewTaskModal()}
            className="rounded-xl text-xs shadow-xs"
          >
            <Plus className="size-3.5 mr-1.5" /> + Görev Planla
          </Button>
        </div>
      </header>

      {/* CONTROLS HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card/60 p-3 shadow-xs">
        <div className="flex items-center gap-1 rounded-xl border bg-muted/40 p-1 text-xs">
          {(["day", "week", "month"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              className={cn(
                "rounded-lg px-3 py-1 font-medium transition-all",
                view === mode
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {mode === "day" ? "Gün" : mode === "week" ? "Hafta" : "Ay"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="w-auto text-xs rounded-xl h-8"
          />
          {date !== dayKey() && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => setDate(dayKey())}
              className="rounded-xl text-[11px]"
            >
              Bugün
            </Button>
          )}
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

      {/* SELECTED DAY SUMMARY HUD */}
      <div className="rounded-2xl border bg-card/60 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Seçili Gün</span>
            <p className="font-semibold text-foreground text-sm font-mono mt-0.5">{date}</p>
          </div>
          <div className="h-7 w-px bg-border/60" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Planlanan Süre</span>
            <p className="font-semibold text-foreground text-sm font-mono mt-0.5">
              {selectedMinutes} dk <span className="text-xs font-normal text-muted-foreground">({selectedTasks.length} görev)</span>
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 border-primary/20 bg-primary/10 text-primary">
            ⏱ Odak
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 border-sky-500/20 bg-sky-500/10 text-sky-500">
            🎓 Ders
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 border-amber-500/20 bg-amber-500/10 text-amber-500">
            💼 İş
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 border-rose-500/20 bg-rose-500/10 text-rose-500">
            📝 Sınav
          </span>
        </div>
      </div>

      {/* CONFLICT WARNING */}
      {selectedBlockingEvents.length > 0 && selectedTasks.length > 0 && (
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 px-4 py-2.5 text-xs text-muted-foreground flex items-center gap-2">
          <span className="size-2 rounded-full bg-sky-500 shrink-0" />
          <span>
            <strong className="text-foreground">Akıllı Çakışma Koruması:</strong> Bu günde{" "}
            {selectedBlockingEvents.map((e) => e.title || eventKindLabels[e.kind].label).join(", ")} bulunuyor.
            North seansları bu saatlerin dışındaki boşluklara yerleştirir.
          </span>
        </div>
      )}

      {/* CALENDAR GRID */}
      <div
        className={cn(
          "grid gap-3",
          view === "day"
            ? "grid-cols-1"
            : view === "week"
            ? "grid-cols-1 md:grid-cols-7"
            : "grid-cols-2 sm:grid-cols-7"
        )}
      >
        {days.map((d) => {
          const isToday = d === dayKey();
          const isSelected = d === date;
          const dayDate = new Date(`${d}T12:00:00`);
          const dayName = dayDate.toLocaleDateString("tr-TR", { weekday: "short" });
          const dayNum = dayDate.getDate();
          const dayTasks = state.tasks.filter((t) => t.date === d && t.status !== "cancelled");
          const dayEvents = state.events.filter((e) => e.date === d);

          return (
            <div
              key={d}
              onClick={() => setDate(d)}
              className={cn(
                "rounded-2xl border p-3 flex flex-col justify-between gap-3 min-h-[220px] transition-all cursor-pointer bg-card/40",
                isSelected
                  ? "border-primary ring-1 ring-primary/30 shadow-xs bg-primary/[0.02]"
                  : isToday
                  ? "border-primary/40 bg-primary/[0.01]"
                  : "border-border/60 hover:border-border"
              )}
            >
              <div>
                <div className="flex items-center justify-between border-b border-border/40 pb-1.5 mb-2">
                  <span className={cn("text-xs font-bold uppercase", isToday ? "text-primary" : "text-foreground")}>
                    {dayName} {dayNum}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {dayTasks.reduce((acc, t) => acc + t.minutes, 0)} dk
                    </span>
                  )}
                </div>

                {/* Events list */}
                <div className="space-y-1 mb-2">
                  {dayEvents.map((evt) => {
                    const meta = eventKindLabels[evt.kind] || eventKindLabels.block;
                    return (
                      <div
                        key={evt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEventDraft({ ...evt });
                        }}
                        className={cn("rounded-lg border px-2 py-1 text-[10px] font-medium truncate flex items-center justify-between", meta.badgeClass)}
                        title={`${evt.title} (${meta.label})`}
                      >
                        <span className="truncate">
                          {meta.icon} {evt.title || meta.label}
                        </span>
                        {evt.time && <span className="font-mono text-[9px] ml-1">{evt.time}</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Tasks list */}
                <div className="space-y-1">
                  {dayTasks.map((t) => {
                    const isDone = t.status === "done";
                    return (
                      <div
                        key={t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTaskDraft({ ...t });
                        }}
                        className={cn(
                          "rounded-lg border p-1.5 text-[11px] flex items-center justify-between gap-1 transition-all",
                          isDone
                            ? "border-emerald-500/20 bg-emerald-500/5 line-through opacity-60 text-muted-foreground"
                            : "border-border/70 bg-card hover:border-primary/40 text-foreground"
                        )}
                      >
                        <span className="truncate font-medium">{t.title}</span>
                        <span className="font-mono text-[9px] text-muted-foreground shrink-0">{t.minutes}m</span>
                      </div>
                    );
                  })}

                  {dayEvents.length === 0 && dayTasks.length === 0 && (
                    <p className="text-[10px] text-muted-foreground/40 text-center py-6">Boş gün</p>
                  )}
                </div>
              </div>

              {/* Quick Add Buttons */}
              <div className="flex items-center gap-1 border-t border-border/30 pt-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openNewTaskModal(d);
                  }}
                  className="flex-1 rounded-lg border border-dashed border-border/60 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  + Görev
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openNewEventModal(d);
                  }}
                  className="rounded-lg border border-dashed border-border/60 p-1 text-[10px] text-muted-foreground hover:text-sky-400 hover:border-sky-400/40 transition-colors"
                  title="Blok ekle"
                >
                  <CalendarPlus className="size-3" />
                </button>
              </div>
            </div>
          );
        })}
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
