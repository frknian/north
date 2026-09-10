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
  Sliders,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import {
  dayKey,
  isAreaActive,
  shiftDay,
  weekKey,
  distributePlanTasksToCalendar,
  distributeTasksAcrossMonth,
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

export interface CalendarDaySetting {
  date: string;
  mode: "normal" | "rest" | "deep_work" | "light" | "busy";
  maxMinutes?: number;
  themeNote?: string;
}

const DAY_SETTINGS_KEY = "north:calendar_day_settings";

function loadDaySettings(): Record<string, CalendarDaySetting> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DAY_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDaySettings(settings: Record<string, CalendarDaySetting>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DAY_SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

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

export const CALENDAR_DAYS_OF_WEEK = [
  { id: 1, label: "Pzt", full: "Pazartesi", isWeekend: false },
  { id: 2, label: "Sal", full: "Salı", isWeekend: false },
  { id: 3, label: "Çar", full: "Çarşamba", isWeekend: false },
  { id: 4, label: "Per", full: "Perşembe", isWeekend: false },
  { id: 5, label: "Cum", full: "Cuma", isWeekend: false },
  { id: 6, label: "Cmt", full: "Cumartesi", isWeekend: true },
  { id: 0, label: "Paz", full: "Pazar", isWeekend: true },
];

export function NorthCalendar() {
  const { state, update, workspace } = useNorth();
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

  // Day Settings & Monthly Distribution state
  const [daySettings, setDaySettings] = useState<Record<string, CalendarDaySetting>>({});
  const [daySettingsOpen, setDaySettingsOpen] = useState(false);
  const [daySettingDraft, setDaySettingDraft] = useState<CalendarDaySetting>({ date, mode: "normal", maxMinutes: 90 });
  const [distributeModalOpen, setDistributeModalOpen] = useState(false);

  // Distribution options
  const [distributeStrategy, setDistributeStrategy] = useState<"all_pool" | "rebalance_month" | "area_specific">("all_pool");
  const [distributeAreaId, setDistributeAreaId] = useState<string>("");
  // 1=Pzt, 2=Sal, 3=Çar, 4=Per, 5=Cum, 6=Cmt, 0=Paz. Default: all 7 days
  const [distAllowedDays, setDistAllowedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);
  const [distRespectRest, setDistRespectRest] = useState<boolean>(true);
  const [distRespectBlocks, setDistRespectBlocks] = useState<boolean>(true);
  const [distMaxDailyTasks, setDistMaxDailyTasks] = useState<number>(2);
  const [distMaxDailyMinutes, setDistMaxDailyMinutes] = useState<number>(90);

  // Sync with profile workingDays if configured
  useEffect(() => {
    if (workspace?.profile?.workingDays && workspace.profile.workingDays.length > 0) {
      const mapped = workspace.profile.workingDays.map((d) => (d === 6 ? 0 : d + 1));
      setDistAllowedDays(mapped);
    }
  }, [workspace?.profile?.workingDays]);

  const isAllDays = distAllowedDays.length === 7;
  const isWeekdaysOnly = distAllowedDays.length === 5 && [1, 2, 3, 4, 5].every((d) => distAllowedDays.includes(d));
  const isWeekendsOnly = distAllowedDays.length === 2 && distAllowedDays.includes(6) && distAllowedDays.includes(0);

  const toggleAllowedDay = (dayId: number) => {
    setDistAllowedDays((prev) => {
      if (prev.includes(dayId)) {
        if (prev.length <= 1) {
          toast.error("En az bir dağıtım günü seçili kalmalıdır.");
          return prev;
        }
        return prev.filter((d) => d !== dayId);
      } else {
        return [...prev, dayId];
      }
    });
  };

  useEffect(() => {
    setDaySettings(loadDaySettings());
  }, []);

  const openDaySettingsModal = (targetDate: string = date) => {
    const existing = daySettings[targetDate] || { date: targetDate, mode: "normal", maxMinutes: 90, themeNote: "" };
    setDaySettingDraft({ ...existing, date: targetDate });
    setDaySettingsOpen(true);
  };

  const saveCurrentDaySetting = () => {
    const targetDate = daySettingDraft.date;
    const nextSettings = { ...daySettings, [targetDate]: daySettingDraft };
    saveDaySettings(nextSettings);
    setDaySettings(nextSettings);

    if (daySettingDraft.mode === "rest") {
      update((curr) => {
        const filtered = curr.protection.filter((p) => p.date !== targetDate || p.kind !== "rest");
        return {
          ...curr,
          protection: [...filtered, { areaId: "*", date: targetDate, kind: "rest" }],
        };
      });
      toast.success(`${targetDate} günü Dinlenme Günü olarak ayarlandı.`);
    } else {
      update((curr) => ({
        ...curr,
        protection: curr.protection.filter((p) => p.date !== targetDate || p.kind !== "rest"),
      }));
      toast.success(`${targetDate} günü ayarları kaydedildi.`);
    }
    setDaySettingsOpen(false);
  };

  const applySettingToAllWeekendsInMonth = () => {
    const monthKey = daySettingDraft.date.slice(0, 7);
    const [yearStr, monthStr] = monthKey.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const daysInMonthCount = new Date(year, month, 0).getDate();

    const nextSettings = { ...daySettings };
    let newProtections = [...state.protection];

    for (let d = 1; d <= daysInMonthCount; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayOfWeek = new Date(`${dateStr}T12:00:00`).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        nextSettings[dateStr] = {
          ...daySettingDraft,
          date: dateStr,
        };
        if (daySettingDraft.mode === "rest") {
          if (!newProtections.some((p) => p.date === dateStr && p.kind === "rest")) {
            newProtections.push({ areaId: "*", date: dateStr, kind: "rest" });
          }
        } else {
          newProtections = newProtections.filter((p) => p.date !== dateStr || p.kind !== "rest");
        }
      }
    }

    saveDaySettings(nextSettings);
    setDaySettings(nextSettings);
    update((curr) => ({ ...curr, protection: newProtections }));
    toast.success(`${monthKey} ayındaki tüm Cumartesi ve Pazar günleri (${daySettingDraft.mode === "rest" ? "Tatil" : daySettingDraft.mode === "deep_work" ? "Derin Odak" : "Seçili Mod"}) olarak ayarlandı.`);
    setDaySettingsOpen(false);
  };

  const resetCurrentDaySetting = () => {
    const targetDate = daySettingDraft.date;
    const nextSettings = { ...daySettings };
    delete nextSettings[targetDate];
    saveDaySettings(nextSettings);
    setDaySettings(nextSettings);

    update((curr) => ({
      ...curr,
      protection: curr.protection.filter((p) => p.date !== targetDate || p.kind !== "rest"),
    }));
    toast.success(`${targetDate} günü ayarları sıfırlandı.`);
    setDaySettingsOpen(false);
  };

  const shiftTasksToTomorrow = () => {
    const targetDate = daySettingDraft.date;
    const tomorrow = shiftDay(targetDate, 1);
    const affectedTasks = state.tasks.filter(
      (t) => t.date === targetDate && t.status !== "done" && t.status !== "cancelled"
    );
    if (affectedTasks.length === 0) {
      toast.info("Bu günde taşınacak bekleyen görev bulunmuyor.");
      return;
    }
    update((curr) => ({
      ...curr,
      tasks: curr.tasks.map((t) =>
        t.date === targetDate && t.status !== "done" && t.status !== "cancelled"
          ? { ...t, date: tomorrow, week: weekKey(tomorrow) }
          : t
      ),
    }));
    toast.success(`${affectedTasks.length} görev ${tomorrow} tarihine aktarıldı.`);
  };

  const moveTasksToPool = () => {
    const targetDate = daySettingDraft.date;
    const affectedTasks = state.tasks.filter(
      (t) => t.date === targetDate && t.status !== "done" && t.status !== "cancelled"
    );
    if (affectedTasks.length === 0) {
      toast.info("Bu günde havuza alınacak bekleyen görev bulunmuyor.");
      return;
    }
    update((curr) => ({
      ...curr,
      tasks: curr.tasks.map((t) =>
        t.date === targetDate && t.status !== "done" && t.status !== "cancelled"
          ? { ...t, date: "" }
          : t
      ),
    }));
    toast.success(`${affectedTasks.length} görev tarihsiz havuza aktarıldı.`);
  };

  const handleMonthlyDistribution = () => {
    const monthKey = date.slice(0, 7);
    const restDates = Object.entries(daySettings)
      .filter(([_, s]) => s.mode === "rest")
      .map(([d]) => d);
    const customLimits = Object.fromEntries(
      Object.entries(daySettings)
        .filter(([_, s]) => s.maxMinutes !== undefined)
        .map(([d, s]) => [d, s.maxMinutes!])
    );

    const result = distributeTasksAcrossMonth(state.tasks, {
      monthKey,
      strategy: distributeStrategy,
      areaId: distributeAreaId || undefined,
      allowedDaysOfWeek: distAllowedDays,
      skipWeekends: false,
      respectRestDays: distRespectRest,
      respectBlockingEvents: distRespectBlocks,
      maxDailyTasks: distMaxDailyTasks,
      maxDailyMinutes: distMaxDailyMinutes,
      startFromToday: true,
      today: dayKey(),
      restDates,
      customDayLimits: customLimits,
      events: state.events,
      protection: state.protection,
    });

    if (result.distributedCount === 0) {
      toast.info(result.summary || "Dağıtılacak uygun gün veya bekleyen görev bulunamadı.");
    } else {
      update((curr) => ({ ...curr, tasks: result.tasks }));
      toast.success(result.summary);
    }
    setDistributeModalOpen(false);
  };

  const selectedDaySetting = daySettings[date];

  useEffect(() => {
    const timer = window.setTimeout(() => {
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
    }, 0);
    return () => window.clearTimeout(timer);
  }, [state, update]);

  const handleRebalance = () => {
    const today = dayKey();
    const activeIndices = workspace?.profile?.workingDays && workspace.profile.workingDays.length > 0
      ? workspace.profile.workingDays
      : [0, 1, 2, 3, 4, 5, 6];
    const distributed = distributePlanTasksToCalendar(state.tasks, {
      weeklyHours: state.weeklyHours,
      events: state.events,
      today,
      activeDayIndices: activeIndices,
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
    <div className="page-content space-y-5 pb-32 md:pb-10">
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

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            size="sm"
            onClick={() => setDistributeModalOpen(true)}
            className="rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
            title="Aylık Görev Dağıt: Havuzdaki ve plandaki görevleri ayın günlerine dengeli şekilde dağıtır"
          >
            <Sparkles className="size-3.5 mr-1.5" /> Aylık Görev Dağıt
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRebalance}
            className="rounded-xl text-xs hidden sm:inline-flex"
            title="Dengeli Dağıt: Kaçan veya ötelenen görevleri haftaya akıllıca paylaştırır"
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
            variant="outline"
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

      {/* GÜN AYARLA (DAY SETTINGS) MODAL */}
      <Dialog open={daySettingsOpen} onOpenChange={setDaySettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Sliders className="size-4 text-primary" />
              <span>Günü Ayarla</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              <strong className="text-foreground">{selectedDateFormatted}</strong> için kapasite, dinlenme ve odak temasını belirle.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* GÜN TİPİ / MODU */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Gün Modu / Tipi</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { mode: "normal", label: "🌿 Normal Gün", desc: "Standart tempo (60-90 dk)" },
                  { mode: "rest", label: "🌴 Dinlenme Günü", desc: "Görev atanmaz, mola" },
                  { mode: "deep_work", label: "⚡ Yoğun Odak", desc: "Derin iş (120-180 dk)" },
                  { mode: "light", label: "🕯️ Hafif Gün", desc: "Tek küçük adım (30 dk)" },
                ].map((item) => (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => {
                      const maxM = item.mode === "rest" ? 0 : item.mode === "light" ? 30 : item.mode === "deep_work" ? 150 : 90;
                      setDaySettingDraft((prev) => ({ ...prev, mode: item.mode as any, maxMinutes: maxM }));
                    }}
                    className={cn(
                      "rounded-xl border p-2 text-left transition-all cursor-pointer flex flex-col gap-0.5",
                      daySettingDraft.mode === item.mode
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                        : "border-border/70 hover:bg-muted/40 text-foreground"
                    )}
                  >
                    <span className="text-xs">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* GÜNLÜK MAKSİMUM KAPASİTE */}
            {daySettingDraft.mode !== "rest" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Günlük Maksimum Odak Süresi</Label>
                  <span className="font-mono text-xs font-bold text-primary">
                    {daySettingDraft.maxMinutes ?? 90} dakika
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[30, 45, 60, 90, 120, 180].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDaySettingDraft((prev) => ({ ...prev, maxMinutes: m }))}
                      className={cn(
                        "px-2.5 py-1 rounded-lg border text-xs font-mono transition-all cursor-pointer",
                        (daySettingDraft.maxMinutes ?? 90) === m
                          ? "bg-primary text-primary-foreground border-primary font-bold"
                          : "border-border/70 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {m} dk
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* GÜNÜN NOTU / ODAK TEMASI */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Günün Notu veya Teması (İsteğe Bağlı)</Label>
              <Input
                value={daySettingDraft.themeNote || ""}
                onChange={(e) => setDaySettingDraft((prev) => ({ ...prev, themeNote: e.target.value }))}
                placeholder="Örn: Sadece Türev Soru Çözümü, Sınav Günü, Şehir Dışı vb."
                className="rounded-xl text-xs"
              />
            </div>

            {/* HAFTA SONU TOPLU UYGULAMA KISAYOLU */}
            {(new Date(`${daySettingDraft.date}T12:00:00`).getDay() === 0 || new Date(`${daySettingDraft.date}T12:00:00`).getDay() === 6) && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-2.5 flex items-center justify-between gap-2">
                <div className="text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground block">🌴 Hafta Sonu Kısayolu</span>
                  <span>Bu günün ayarlarını ({daySettingDraft.mode === "rest" ? "Tatil" : daySettingDraft.mode === "deep_work" ? "Derin Odak" : "Bu Mod"}) bu ayın tüm Cumartesi ve Pazar günlerine uygula.</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={applySettingToAllWeekendsInMonth}
                  className="text-[11px] h-7 rounded-lg border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 shrink-0 font-medium"
                >
                  Tüm Hafta Sonlarına Uygula
                </Button>
              </div>
            )}

            {/* HIZLI GÜN AKSİYONLARI */}
            {selectedTasks.length > 0 && (
              <div className="rounded-xl border border-border/80 bg-muted/20 p-2.5 space-y-2">
                <span className="text-[11px] font-semibold text-foreground block">
                  Bu Günün Görevleri ({selectedTasks.length} görev · {selectedMinutes} dk)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={shiftTasksToTomorrow}
                    className="text-[11px] h-7 rounded-lg"
                  >
                    ⏩ Yarına Kaydır
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={moveTasksToPool}
                    className="text-[11px] h-7 rounded-lg"
                  >
                    📥 Havuza Gönder
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
            {daySettings[daySettingDraft.date] ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetCurrentDaySetting}
                className="text-muted-foreground hover:text-destructive text-xs"
              >
                Ayarları Sıfırla
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDaySettingsOpen(false)}
                className="rounded-xl text-xs"
              >
                Vazgeç
              </Button>
              <Button
                size="sm"
                onClick={saveCurrentDaySetting}
                className="rounded-xl text-xs font-semibold"
              >
                Ayarları Kaydet
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AYLIK GÖREV DAĞIT MODAL */}
      <Dialog open={distributeModalOpen} onOpenChange={setDistributeModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span>Aylık Görev Dağıtımı & Akıllı Planlama</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Havuzdaki ve plandaki görevleri <strong className="text-foreground capitalize">{monthName}</strong> ayının günlerine kapasite ve gün tercihlerine göre dengeli dağıt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* BİLGİ ÖZET KARTI */}
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground block">
                  {distributeStrategy === "all_pool"
                    ? `${optionalPool.length} Havuz Görevi Dağıtılacak`
                    : distributeStrategy === "rebalance_month"
                    ? `${state.tasks.filter((t) => t.status !== "done" && t.status !== "cancelled").length} Görev Baştan Dengelenecek`
                    : `${state.tasks.filter((t) => t.areaId === distributeAreaId && t.status !== "done").length} Alan Görevi Dağıtılacak`}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {monthName} ayı için dinlenme ve blok kurallarına göre dağıtım yapılır.
                </span>
              </div>
              <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
                {distributeStrategy === "all_pool" ? `${optionalPool.length} Görev` : "Akıllı Dağıtım"}
              </Badge>
            </div>

            {/* DAĞITIM STRATEJİSİ */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Dağıtım Kapsamı</Label>
              <div className="space-y-1.5">
                {[
                  {
                    id: "all_pool",
                    title: "Sadece Havuzdaki Görevleri Dağıt (Tavsiye Edilen)",
                    desc: "Tarihsiz ve bekleyen görevleri ayın boş günlerine yerleştirir; mevcut planlı günlere dokunmaz.",
                  },
                  {
                    id: "rebalance_month",
                    title: "Tüm Ayı Baştan Sıfırla & Dengeli Dağıt",
                    desc: "Bu aydaki tüm bekleyen görevleri ve havuzu sıfırdan tüm aya eşit paylaştırır.",
                  },
                  {
                    id: "area_specific",
                    title: "Belirli Bir Alanın Görevlerini Dağıt",
                    desc: "Sadece seçeceğin hedefin görevlerini ay günlerine dağıtır.",
                  },
                ].map((s) => (
                  <label
                    key={s.id}
                    className={cn(
                      "flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors",
                      distributeStrategy === s.id
                        ? "border-primary bg-primary/5"
                        : "border-border/60 hover:bg-muted/30"
                    )}
                  >
                    <input
                      type="radio"
                      name="distribute_strategy"
                      checked={distributeStrategy === s.id}
                      onChange={() => setDistributeStrategy(s.id as any)}
                      className="mt-0.5 accent-primary"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-semibold text-foreground block">{s.title}</span>
                      <span className="text-[11px] text-muted-foreground block">{s.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* ALAN SEÇİMİ (EĞER AREA_SPECIFIC İSE) */}
            {distributeStrategy === "area_specific" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Hedef Alan</Label>
                <select
                  value={distributeAreaId}
                  onChange={(e) => setDistributeAreaId(e.target.value)}
                  className="w-full rounded-xl border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Tüm Alanlar</option>
                  {activeAreas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({state.tasks.filter((t) => t.areaId === a.id && t.status !== "done").length} bekleyen görev)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* GÖREV DAĞITILACAK GÜNLER (HAFTA İÇİ / HAFTA SONU / SEÇİM) */}
            <div className="space-y-2 border-t border-border/60 pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <span>📅 Dağıtılacak Günler</span>
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setDistAllowedDays([1, 2, 3, 4, 5, 6, 0])}
                    className={cn(
                      "text-[10.5px] h-6 px-2 rounded-md font-medium",
                      isAllDays
                        ? "bg-primary/15 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Tüm Günler
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setDistAllowedDays([1, 2, 3, 4, 5])}
                    className={cn(
                      "text-[10.5px] h-6 px-2 rounded-md font-medium",
                      isWeekdaysOnly
                        ? "bg-primary/15 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Hafta İçi
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setDistAllowedDays([6, 0])}
                    className={cn(
                      "text-[10.5px] h-6 px-2 rounded-md font-medium",
                      isWeekendsOnly
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    🌴 Hafta Sonu
                  </Button>
                </div>
              </div>

              {/* Gün Seçim Butonları (Pzt, Sal, Çar, Per, Cum, Cmt, Paz) */}
              <div className="grid grid-cols-7 gap-1 pt-0.5">
                {CALENDAR_DAYS_OF_WEEK.map((d) => {
                  const isSelected = distAllowedDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleAllowedDay(d.id)}
                      className={cn(
                        "py-1.5 text-xs font-semibold rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-0.5",
                        isSelected
                          ? d.isWeekend
                            ? "bg-amber-500/20 border-amber-500/60 text-amber-600 dark:text-amber-400 font-bold shadow-2xs"
                            : "bg-primary border-primary text-primary-foreground font-bold shadow-2xs"
                          : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                      title={d.full}
                    >
                      <span>{d.label}</span>
                      <span className="text-[9px] opacity-75 leading-none">
                        {d.isWeekend ? "H.Sonu" : "H.İçi"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Dinamik Durum Bilgisi */}
              <p className="text-[11px] text-muted-foreground">
                {isWeekendsOnly ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    🌴 Görevler yalnızca <strong>Cumartesi ve Pazar</strong> günlerine planlanacak. Hafta içi boş bırakılacak.
                  </span>
                ) : isWeekdaysOnly ? (
                  <span>
                    💼 Görevler yalnızca <strong>Pazartesi - Cuma</strong> günlerine planlanacak. Hafta sonu boş kalacak.
                  </span>
                ) : isAllDays ? (
                  <span>
                    🗓️ Görevler haftanın <strong>7 gününe</strong> dengeli şekilde paylaştırılacak.
                  </span>
                ) : (
                  <span>
                    🎯 Görevler seçtiğiniz <strong>{distAllowedDays.length} güne</strong> dağıtılacak.
                  </span>
                )}
              </p>
            </div>

            {/* DAĞITIM KURALLARI & KISITLAR */}
            <div className="space-y-2 border-t border-border/60 pt-3">
              <Label className="text-xs font-semibold">Koruma ve Limitler</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2 rounded-lg border border-border/60 cursor-pointer hover:bg-muted/30">
                  <input
                    type="checkbox"
                    checked={distRespectRest}
                    onChange={(e) => setDistRespectRest(e.target.checked)}
                    className="accent-primary rounded"
                  />
                  <span className="text-xs text-foreground">🌴 Dinlenme günlerini koru</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-border/60 cursor-pointer hover:bg-muted/30">
                  <input
                    type="checkbox"
                    checked={distRespectBlocks}
                    onChange={(e) => setDistRespectBlocks(e.target.checked)}
                    className="accent-primary rounded"
                  />
                  <span className="text-xs text-foreground">💼 Sabit bloklara saygı göster</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Maksimum Günlük Görev</Label>
                  <select
                    value={distMaxDailyTasks}
                    onChange={(e) => setDistMaxDailyTasks(Number(e.target.value))}
                    className="w-full rounded-xl border bg-background px-2.5 py-1 text-xs"
                  >
                    <option value={1}>Günde en fazla 1 görev</option>
                    <option value={2}>Günde en fazla 2 görev</option>
                    <option value={3}>Günde en fazla 3 görev</option>
                    <option value={4}>Günde en fazla 4 görev</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Maksimum Günlük Süre</Label>
                  <select
                    value={distMaxDailyMinutes}
                    onChange={(e) => setDistMaxDailyMinutes(Number(e.target.value))}
                    className="w-full rounded-xl border bg-background px-2.5 py-1 text-xs"
                  >
                    <option value={45}>Maksimum 45 dakika</option>
                    <option value={60}>Maksimum 60 dakika</option>
                    <option value={90}>Maksimum 90 dakika</option>
                    <option value={120}>Maksimum 120 dakika</option>
                    <option value={180}>Maksimum 180 dakika</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDistributeModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Vazgeç
            </Button>
            <Button
              size="sm"
              disabled={distAllowedDays.length === 0}
              onClick={handleMonthlyDistribution}
              className="rounded-xl text-xs font-semibold shadow-xs"
            >
              <Sparkles className="size-3.5 mr-1.5" /> Dağıtımı Başlat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
