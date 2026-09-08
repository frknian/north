"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  GripVertical,
  HelpCircle,
  Layers,
  LayoutGrid,
  List,
  MessageSquare,
  Minus,
  MoreHorizontal,
  MoveRight,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
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
  distributePlanTasksToCalendar,
  distributePoolTasksToWeek,
  type NorthTask,
  type Area,
} from "@/lib/north";
import { recommendedSessionMinutes } from "@/lib/north-intelligence";
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
import { cn } from "@/lib/utils";

// Area color mapping helpers
const areaColorMap: Record<string, { color: string; bg: string; border: string; dot: string; text: string }> = {
  cyber: { color: "#06B6D4", bg: "bg-cyan-500/10", border: "border-cyan-500/20", dot: "bg-cyan-400", text: "text-cyan-700 dark:text-cyan-300" },
  math: { color: "#A855F7", bg: "bg-purple-500/10", border: "border-purple-500/20", dot: "bg-purple-400", text: "text-purple-700 dark:text-purple-300" },
  chess: { color: "#F59E0B", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-400", text: "text-amber-700 dark:text-amber-300" },
  english: { color: "#3B82F6", bg: "bg-blue-500/10", border: "border-blue-500/20", dot: "bg-blue-400", text: "text-blue-700 dark:text-blue-300" },
  german: { color: "#10B981", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-400", text: "text-emerald-700 dark:text-emerald-300" },
  french: { color: "#EC4899", bg: "bg-pink-500/10", border: "border-pink-500/20", dot: "bg-pink-400", text: "text-pink-700 dark:text-pink-300" },
  japanese: { color: "#EF4444", bg: "bg-rose-500/10", border: "border-rose-500/20", dot: "bg-rose-400", text: "text-rose-700 dark:text-rose-300" },
  arabic: { color: "#14B8A6", bg: "bg-teal-500/10", border: "border-teal-500/20", dot: "bg-teal-400", text: "text-teal-700 dark:text-teal-300" },
};

function getAreaStyling(areaId?: string, areaName?: string) {
  const key = (areaId || "").toLowerCase();
  const nameKey = (areaName || "").toLowerCase();
  for (const [k, val] of Object.entries(areaColorMap)) {
    if (key.includes(k) || nameKey.includes(k)) {
      return val;
    }
  }
  if (nameKey.includes("siber") || nameKey.includes("güvenlik")) return areaColorMap.cyber;
  if (nameKey.includes("matematik") || nameKey.includes("ayt") || nameKey.includes("tyt")) return areaColorMap.math;
  if (nameKey.includes("satranç") || nameKey.includes("chess")) return areaColorMap.chess;
  return { color: "#3B82F6", bg: "bg-blue-500/10", border: "border-blue-500/20", dot: "bg-blue-400", text: "text-blue-700 dark:text-blue-300" };
}

export function NorthWeek() {
  const { state, update, workspace } = useNorth();
  const [week, setWeek] = useState(weekKey());
  const [activeAreaFilter, setActiveAreaFilter] = useState<string>("all");
  const [scopeFilter, setScopeFilter] = useState<"thisWeek" | "nextWeek" | "all">("thisWeek");
  const [statusFilter, setStatusFilter] = useState<"active" | "done" | "all">("active");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  // Selected Day state (default today if within week, else Monday)
  const defaultSelectedDay = useMemo(() => {
    const today = dayKey();
    const endOfWeek = shiftDay(week, 6);
    if (today >= week && today <= endOfWeek) {
      return today;
    }
    return week;
  }, [week]);

  const [selectedDay, setSelectedDay] = useState<string>(defaultSelectedDay);

  // Active Planning Days (default Monday to Friday [0, 1, 2, 3, 4] - weekend off by default)
  const [activePlanDays, setActivePlanDays] = useState<number[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("north_active_plan_days");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [0, 1, 2, 3, 4];
  });

  const [replanModalOpen, setReplanModalOpen] = useState(false);
  const [tempPlanDays, setTempPlanDays] = useState<number[]>(activePlanDays);
  const [replanForceAll, setReplanForceAll] = useState(true);

  // Dialog states
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<NorthTask | null>(null);
  const [assignDayTarget, setAssignDayTarget] = useState<string | null>(null);

  // Search input ref for ⌘K
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeAreas = useMemo(() => state.areas.filter(isAreaActive), [state.areas]);
  const isCurrentWeek = week === weekKey();

  // AUTOMATIC INITIAL DISTRIBUTION ON ENTER:
  // When user enters the plan page, if there are tasks for this week that don't have dates,
  // distribute them immediately across Monday to Friday with area interleaving!
  const hasAutoPlannedRef = useRef(false);
  useEffect(() => {
    const unassignedTasks = state.tasks.filter(
      (t) => (t.week === week || !t.week) && !t.date && t.status !== "cancelled" && t.status !== "done"
    );
    if (unassignedTasks.length > 0 && !hasAutoPlannedRef.current) {
      hasAutoPlannedRef.current = true;
      update((curr) => {
        const distributed = distributePlanTasksToCalendar(curr.tasks, {
          weeklyHours: curr.weeklyHours,
          events: curr.events,
          week,
          forceRedistribute: false,
          activeDayIndices: activePlanDays,
        });
        return {
          ...curr,
          tasks: distributed,
        };
      });
    }
  }, [week, state.tasks, update]);

  // 7 Days of the selected week (Mon -> Sun)
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = shiftDay(week, i);
      const dateObj = new Date(`${d}T12:00:00`);
      const dayName = dateObj.toLocaleDateString("tr-TR", { weekday: "short" });
      const dayFullName = dateObj.toLocaleDateString("tr-TR", { weekday: "long" });
      const dayNum = dateObj.getDate();
      const monthName = dateObj.toLocaleDateString("tr-TR", { month: "short" });
      const isToday = d === dayKey();
      const tasksForDay = state.tasks.filter((t) => t.date === d && t.status !== "cancelled");
      const dayMinutes = tasksForDay.reduce((acc, t) => acc + t.minutes, 0);

      // Distinct areas for this day
      const dayAreas = Array.from(new Set(tasksForDay.map((t) => t.areaId)))
        .map((aid) => state.areas.find((a) => a.id === aid))
        .filter(Boolean) as Area[];

      return {
        date: d,
        dayName,
        dayFullName,
        dayNum: String(dayNum).padStart(2, "0"),
        monthName,
        isToday,
        tasks: tasksForDay,
        dayMinutes,
        dayAreas,
        dayIndex: i, // 0 = Mon, 4 = Fri, 5 = Sat, 6 = Sun
      };
    });
  }, [week, state.tasks, state.areas]);

  const weekStartDate = new Date(`${week}T12:00:00`);
  const weekEndDate = new Date(`${shiftDay(week, 6)}T12:00:00`);
  const weekLabel = `${weekStartDate.getDate()} ${weekStartDate.toLocaleDateString("tr-TR", { month: "short" })} – ${weekEndDate.getDate()} ${weekEndDate.toLocaleDateString("tr-TR", { month: "short" })}`;

  // Selected Day Details Object
  const currentSelectedDayObj = useMemo(() => {
    return weekDays.find((d) => d.date === selectedDay) || weekDays[0];
  }, [weekDays, selectedDay]);

  // Tasks filtering
  const allTasksInScope = useMemo(() => {
    return state.tasks.filter((t) => {
      if (t.status === "cancelled") return false;
      if (scopeFilter === "thisWeek") {
        return t.week === week || (t.date && t.date >= week && t.date <= shiftDay(week, 6));
      }
      if (scopeFilter === "nextWeek") {
        const nextW = shiftDay(week, 7);
        return t.week === nextW || (t.date && t.date >= nextW && t.date <= shiftDay(nextW, 6));
      }
      return true;
    });
  }, [state.tasks, week, scopeFilter]);

  const filteredTasks = useMemo(() => {
    return allTasksInScope.filter((task) => {
      // Status
      if (statusFilter === "active" && task.status === "done") return false;
      if (statusFilter === "done" && task.status !== "done") return false;

      // Area filter
      if (activeAreaFilter !== "all" && task.areaId !== activeAreaFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const area = state.areas.find((a) => a.id === task.areaId);
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesArea = area?.name.toLowerCase().includes(q);
        const matchesWhy = (task.why || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesArea && !matchesWhy) return false;
      }

      return true;
    });
  }, [allTasksInScope, statusFilter, activeAreaFilter, searchQuery, state.areas]);

  // Statistics calculation for the current week
  const currentWeekTasks = useMemo(() => {
    return state.tasks.filter((t) => (t.week === week || (t.date && t.date >= week && t.date <= shiftDay(week, 6))) && t.status !== "cancelled");
  }, [state.tasks, week]);

  const completedTasks = useMemo(() => currentWeekTasks.filter((t) => t.status === "done"), [currentWeekTasks]);
  const plannedMinutes = useMemo(() => currentWeekTasks.reduce((sum, t) => sum + t.minutes, 0), [currentWeekTasks]);
  const completedMinutes = useMemo(() => completedTasks.reduce((sum, t) => sum + t.minutes, 0), [completedTasks]);
  const weeklyCapMinutes = capacity(state); // total minutes
  const dailyTargetCap = Math.max(60, Math.round(weeklyCapMinutes / 5));

  const completionPct = plannedMinutes > 0 ? Math.min(100, Math.round((completedMinutes / plannedMinutes) * 100)) : 0;
  const capacityLoadPct = weeklyCapMinutes > 0 ? Math.round((plannedMinutes / weeklyCapMinutes) * 100) : 0;

  // Breakdown by area for multi-color capacity bar
  const areaBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of currentWeekTasks) {
      map[t.areaId] = (map[t.areaId] || 0) + t.minutes;
    }
    return activeAreas
      .map((a) => ({
        area: a,
        minutes: map[a.id] || 0,
        pct: plannedMinutes > 0 ? ((map[a.id] || 0) / plannedMinutes) * 100 : 0,
        styling: getAreaStyling(a.id, a.name),
      }))
      .filter((item) => item.minutes > 0);
  }, [currentWeekTasks, activeAreas, plannedMinutes]);

  // Overdue tasks
  const overdueTasks = useMemo(() => {
    return state.tasks.filter((t) => t.date && t.date < dayKey() && !["done", "cancelled"].includes(t.status));
  }, [state.tasks]);

  // Keyboard shortcut listener (⌘K and N)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement?.tagName.toLowerCase();
      const isInputActive = activeEl === "input" || activeEl === "textarea" || activeEl === "select";

      // ⌘K or Ctrl+K -> focus search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // N -> New Task (when not typing in an input)
      if (e.key.toLowerCase() === "n" && !isInputActive && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        openCreateTaskModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Flash notification helper
  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4500);
  };

  // Actions
  const handleAutoPlan = (force = false, days = activePlanDays) => {
    update((curr) => {
      const updated = distributePlanTasksToCalendar(curr.tasks, {
        weeklyHours: curr.weeklyHours,
        events: curr.events,
        week,
        forceRedistribute: force,
        activeDayIndices: days,
      });
      return {
        ...curr,
        tasks: updated,
      };
    });
    const dayLabels = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
    const chosenLabels = days.map((i) => dayLabels[i]).join(", ");
    showToast(
      force
        ? `⚡ Hafta seçilen günlere (${chosenLabels}) dengeli şekilde sıfırdan dağıtıldı.`
        : `✨ Görevler seçilen günlere (${chosenLabels}) dengeli şekilde dağıtıldı.`
    );
  };

  const handleExecuteReplan = (days: number[], force: boolean) => {
    setActivePlanDays(days);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("north_active_plan_days", JSON.stringify(days));
      } catch {}
    }
    handleAutoPlan(force, days);
    setReplanModalOpen(false);
  };

  const handleToggleTask = (task: NorthTask) => {
    const nextStatus = task.status === "done" ? "pending" : "done";
    update((curr) => ({
      ...curr,
      tasks: curr.tasks.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)),
    }));
  };

  const handleShrinkTask = (task: NorthTask) => {
    update((curr) => ({
      ...curr,
      tasks: curr.tasks.map((t) => (t.id === task.id ? shrinkTask(t) : t)),
    }));
    showToast(`⏱ "${task.title}" süresi yarıya indirildi.`);
  };

  const handlePoolTask = (task: NorthTask) => {
    update((curr) => ({
      ...curr,
      tasks: curr.tasks.map((t) => (t.id === task.id ? poolTask(t) : t)),
    }));
    showToast(`📦 "${task.title}" esnek havuza alındı.`);
  };

  const handlePostponeTask = (task: NorthTask) => {
    const currentTarget = task.date || dayKey();
    const nextDay = shiftDay(currentTarget, 1);
    update((curr) => ({
      ...curr,
      tasks: curr.tasks.map((t) => (t.id === task.id ? postponeTask(t, nextDay) : t)),
    }));
    showToast(`➡️ "${task.title}" bir sonraki güne ertelendi.`);
  };

  const handleDropTask = (task: NorthTask) => {
    update((curr) => ({
      ...curr,
      tasks: curr.tasks.map((t) => (t.id === task.id ? dropTask(t) : t)),
    }));
    showToast(`🗑 Görev borçsuz şekilde plandan çıkarıldı.`);
  };

  const handleAssignTaskToDay = (taskId: string, targetDay: string) => {
    update((curr) => ({
      ...curr,
      tasks: curr.tasks.map((t) => (t.id === taskId ? { ...t, date: targetDay, week } : t)),
    }));
    setAssignDayTarget(null);
    showToast("📅 Görev seçilen güne atandı.");
  };

  const openCreateTaskModal = (targetDate?: string) => {
    const defaultArea = activeAreas[0] || state.areas[0];
    setEditingTask({
      id: crypto.randomUUID(),
      areaId: defaultArea?.id || "primary",
      title: "",
      goal: "",
      minutes: defaultArea?.preferredSessionMinutes ?? 40,
      intensity: "normal",
      mandatory: true,
      status: "pending",
      date: targetDate || selectedDay || "",
      deadline: "",
      resource: "",
      why: "Kendi hedefin için planlanan odak adımı.",
      week,
    });
    setTaskModalOpen(true);
  };

  const openEditTaskModal = (task: NorthTask) => {
    setEditingTask({ ...task });
    setTaskModalOpen(true);
  };

  const handleSaveTaskModal = () => {
    if (!editingTask || !editingTask.title.trim()) return;

    update((curr) => {
      const exists = curr.tasks.some((t) => t.id === editingTask.id);
      if (exists) {
        return {
          ...curr,
          tasks: curr.tasks.map((t) => (t.id === editingTask.id ? editingTask : t)),
        };
      }
      return {
        ...curr,
        tasks: [editingTask, ...curr.tasks],
      };
    });

    setTaskModalOpen(false);
    setEditingTask(null);
    showToast("💾 Görev başarıyla kaydedildi.");
  };

  // Milestone phases (5 distinct stages from period plan)
  const periodMilestones = useMemo(() => {
    return [
      {
        step: 1,
        phase: "1. AŞAMA",
        weekLabel: "1. Hafta",
        title: "Başlangıç & Harita",
        desc: "Başlangıç ve Temel Harita oluşturma dönemi.",
        badge: "Şu Anda",
        progressText: "%20",
        active: true,
      },
      {
        step: 2,
        phase: "2. AŞAMA",
        weekLabel: "2. Hafta",
        title: "Ara Kontrol & Rutin",
        desc: "Ara Kontrol ve İlk Çıktı validasyonu.",
        badge: null,
        progressText: "0%",
        active: false,
      },
      {
        step: 3,
        phase: "3. AŞAMA",
        weekLabel: "3. Hafta",
        title: "Yoğun Uygulama",
        desc: "Yoğun Uygulama ve Derin Odak periyodu.",
        badge: null,
        progressText: "0%",
        active: false,
      },
      {
        step: 4,
        phase: "4. AŞAMA",
        weekLabel: "4. Hafta",
        title: "Tekrar & Pekiştirme",
        desc: "Tekrar ve zayıf halkaları pekiştirme.",
        badge: null,
        progressText: "0%",
        active: false,
      },
      {
        step: 5,
        phase: "5. AŞAMA",
        weekLabel: "5. Hafta",
        title: "Final Kanıt & Zirve",
        desc: "Final Kanıt, Portföy ve Kapanış çıktısı.",
        badge: null,
        progressText: "0%",
        active: false,
      },
    ];
  }, []);

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#090d16] text-slate-900 dark:text-foreground font-sans selection:bg-primary/20 selection:text-primary pb-24">
      {/* Subtle Background Glows (dark mode only) */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl pointer-events-none -z-0 opacity-0 dark:opacity-100" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-0 opacity-0 dark:opacity-100" />

      {/* Main Container */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
        
        {/* TOAST / NOTIFICATION */}
        {notification && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-card/95 border border-primary/40 text-xs font-medium text-foreground shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{notification}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

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

        {/* SARKAN GÖREVLER (OVERDUE ROLLOVER BANNER) */}
        {overdueTasks.length > 0 && (
          <aside className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3.5 text-xs text-amber-200 backdrop-blur-md shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="grid size-6 place-items-center rounded-lg bg-amber-500/20 text-amber-400">
                <AlertCircle className="size-4" />
              </div>
              <div>
                <span className="font-bold text-foreground">Önceki günlerden sarkan {overdueTasks.length} görev var.</span>
                <span className="text-amber-200/80 ml-1.5 hidden sm:inline">
                  North&apos;ta borç veya suçluluk birikmez; görevleri haftanın uygun günlerine dağıtabilirsin.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const result = rolloverUnfinishedTasks(state);
                  update(() => result.state);
                  showToast("⚡ Sarkan görevler haftanın müsait günlerine dağıtıldı.");
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] shadow-sm transition flex items-center gap-1"
              >
                <Zap className="size-3" />
                Haftaya Otomatik Yay
              </button>
              <button
                onClick={() => {
                  update((curr) => ({
                    ...curr,
                    tasks: curr.tasks.map((t) => (overdueTasks.some((o) => o.id === t.id) ? poolTask(t) : t)),
                  }));
                  showToast("📦 Sarkan görevler esnek havuza alındı.");
                }}
                className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted text-foreground/90 font-medium text-[11px] border border-border transition"
              >
                Havuza Al
              </button>
            </div>
          </aside>
        )}

        {/* BEGIN: PeriodStagesSection */}
        <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">Dönem Planı &amp; Aşamalar</h2>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full">
                    DÖNEM 1
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">5 yapılandırılmış aşamadan oluşan uzun vadeli stratejik yol haritası</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-semibold text-foreground/90">
              <span className="px-3 py-1 bg-muted border border-border rounded-full shadow-inner">
                5 Aşama Toplamı
              </span>
              <span className="text-muted-foreground/60 hidden sm:inline">|</span>
              <span className="text-blue-400 font-mono">%12 genel ilerleme</span>
            </div>
          </div>

          {/* 5 Stages Progression Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {periodMilestones.map((m) => {
              if (m.active) {
                return (
                  <div
                    key={m.step}
                    className="relative bg-gradient-to-b from-primary/15 to-primary/5 border-2 border-primary/80 rounded-xl p-4 shadow-[0_0_20px_-3px_rgba(37,99,235,0.25)] flex flex-col justify-between min-h-[142px] group"
                  >
                    <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-blue-600 text-[10px] font-extrabold tracking-wider uppercase rounded-full text-white shadow-sm border border-blue-400/30">
                      Şu Anda
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-xs mb-2">
                        <span className="text-blue-400 font-bold tracking-wider uppercase text-[11px]">{m.phase}</span>
                        <span className="text-muted-foreground font-medium text-[11px]">{m.weekLabel}</span>
                      </div>
                      <h3 className="text-sm font-bold text-foreground mb-1 group-hover:text-blue-200 transition">{m.title}</h3>
                      <p className="text-xs text-foreground/90/80 line-clamp-2">{m.desc}</p>
                    </div>
                    <div className="mt-4 pt-2.5 border-t border-blue-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                        <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">Aktif Aşama</span>
                      </div>
                      <span className="text-[11px] font-mono text-blue-400/90 font-bold">{m.progressText}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={m.step}
                  className="bg-muted/30 border border-border rounded-xl p-4 flex flex-col justify-between min-h-[142px] hover:border-border hover:bg-muted/50 transition"
                >
                  <div>
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="text-muted-foreground font-semibold tracking-wider uppercase text-[11px]">{m.phase}</span>
                      <span className="text-muted-foreground/80 font-medium text-[11px]">{m.weekLabel}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{m.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{m.desc}</p>
                  </div>
                  <div className="mt-4 pt-2.5 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground/80">
                    <span className="flex items-center gap-1">
                      <span className="text-muted-foreground/60">🔒</span> Planlandı
                    </span>
                    <span className="text-muted-foreground/60 font-mono">0%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        {/* END: PeriodStagesSection */}

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
            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={() => {
                  setTempPlanDays(activePlanDays);
                  setReplanModalOpen(true);
                }}
                className="font-medium text-muted-foreground hover:text-foreground transition flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border text-xs"
                title="Haftalık planlama günlerini düzenle ve günlere yeniden dağıt"
              >
                <RotateCcw className="w-3 h-3 text-primary" />
                Haftayı Yeniden Planla &amp; Günler
              </button>
              <Link
                href="/calendar"
                className="font-semibold text-blue-400 hover:text-blue-700 dark:text-blue-300 inline-flex items-center gap-1 transition group"
              >
                Tam Takvim <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            </div>
          </div>

          {/* HAFTALIK ODAK HARİTASI (Pzt: x, y • Sal: y, z • Çar: x, z ...) */}
          <div className="flex flex-wrap items-center gap-2 py-2.5 px-3.5 rounded-xl bg-muted/40 border border-border text-xs">
            <span className="font-bold text-foreground/90 flex items-center gap-1.5 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Haftalık Odak Haritası:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {weekDays.slice(0, 5).map((d) => {
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
                    {areaNames.length > 0 ? (
                      <span className="text-blue-700 dark:text-blue-300 font-medium">{areaNames.join(", ")}</span>
                    ) : (
                      <span className="text-muted-foreground/80 italic">Serbest</span>
                    )}
                    {d.dayIndex < 4 && <span className="text-slate-700 ml-1">•</span>}
                  </button>
                );
              })}
              <span className="text-muted-foreground/60">|</span>
              <span className="text-[11px] text-muted-foreground">
                Cmt: <span className="text-muted-foreground/80">Dinlenme</span> • Paz: <span className="text-muted-foreground/80">Retrospektif</span>
              </span>
            </div>
          </div>

          {/* 7 Days Interactive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {weekDays.map((day) => {
              const hasTasks = day.tasks.length > 0;
              const isSelected = selectedDay === day.date;
              const isWeekend = day.dayIndex >= 5;
              const isSaturday = day.dayIndex === 5;
              const isSunday = day.dayIndex === 6;

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
                        {!activePlanDays.includes(day.dayIndex) && (
                          <span className="px-1.5 py-0.2 bg-muted text-muted-foreground rounded text-[9px] font-semibold tracking-wider" title="Bu gün planlama dışı">
                            DİNLENME
                          </span>
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
                          {!activePlanDays.includes(day.dayIndex) ? "Plan Dışı / Dinlenme" : isSaturday ? "Serbest Zaman" : isSunday ? "Haftalık Kapanış" : "Atanmış alan yok"}
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
                      ) : isSaturday ? (
                        <div className="py-4 text-center text-muted-foreground/80">
                          <p className="text-xs font-medium">Hafta Sonu Dinlenme</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">Yenilenme Günü</p>
                        </div>
                      ) : isSunday ? (
                        <div className="py-4 text-center text-muted-foreground/80">
                          <p className="text-xs font-medium">Haftalık İnceleme</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">17:00 Retrospektif</p>
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

        {/* BEGIN: TaskPoolSection (REDESIGNED SAAS / LINEAR STYLE) */}
        <section className="bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-xs relative">
          {/* Header Block */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-border">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                    Görev Havuzu &amp; Düzenleme
                    <span className="px-2 py-0.5 text-xs font-semibold text-blue-400 bg-blue-500/10 rounded-md border border-blue-500/20 font-mono">
                      {filteredTasks.length} Görev
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground">Bu haftanın planlanmış ve esnek görevleri • Sürükle, önceliklendir ve çalıştır</p>
                </div>
              </div>
            </div>

            {/* Controls & Quick Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search input (⌘K) */}
              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl py-2 pl-9 pr-8 text-xs text-foreground placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                  placeholder="Görev ara..."
                  type="text"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Time Scope Filter */}
              <div className="relative">
                <select
                  value={scopeFilter}
                  onChange={(e) => setScopeFilter(e.target.value as any)}
                  className="bg-background border border-input text-xs font-semibold text-foreground rounded-xl py-2 pl-3 pr-8 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer hover:bg-muted transition"
                >
                  <option value="thisWeek">Bu Hafta ({currentWeekTasks.length})</option>
                  <option value="nextWeek">Gelecek Hafta</option>
                  <option value="all">Tüm Dönem ({state.tasks.filter((t) => t.status !== "cancelled").length})</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                  <ChevronDown className="w-3 h-3" />
                </div>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-background border border-input text-xs font-semibold text-foreground rounded-xl py-2 pl-3 pr-8 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer hover:bg-muted transition"
                >
                  <option value="active">Aktif ({currentWeekTasks.filter((t) => t.status !== "done").length})</option>
                  <option value="done">Tamamlanan ({completedTasks.length})</option>
                  <option value="all">Tümü</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                  <ChevronDown className="w-3 h-3" />
                </div>
              </div>

              {/* View Switcher */}
              <div className="flex items-center bg-background border border-input rounded-xl p-0.5">
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-medium shadow-sm flex items-center gap-1.5 transition",
                    viewMode === "list" ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Detaylı Liste Görünümü"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Liste</span>
                </button>
                <button
                  onClick={() => setViewMode("kanban")}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5",
                    viewMode === "kanban" ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Kart Izgara Görünümü"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kartlar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Pills Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveAreaFilter("all")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition",
                  activeAreaFilter === "all"
                    ? "bg-blue-600/20 text-blue-700 dark:text-blue-300 border border-blue-500/40"
                    : "bg-card hover:bg-muted text-muted-foreground border border-border"
                )}
              >
                <span>Tümü</span>
                <span className="px-1.5 py-0.2 bg-blue-500/30 rounded-md text-[10px] font-mono">
                  {allTasksInScope.length}
                </span>
              </button>

              {activeAreas.map((area) => {
                const styling = getAreaStyling(area.id, area.name);
                const count = allTasksInScope.filter((t) => t.areaId === area.id).length;
                const isSelected = activeAreaFilter === area.id;

                return (
                  <button
                    key={area.id}
                    onClick={() => setActiveAreaFilter(isSelected ? "all" : area.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5",
                      isSelected
                        ? "bg-muted text-white border-blue-500/50 shadow-sm"
                        : "bg-card hover:bg-muted text-muted-foreground border-border"
                    )}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: styling.color }} />
                    <span>{area.name}</span>
                    <span className="px-1.5 py-0.2 bg-muted rounded-md text-[10px] font-mono text-muted-foreground">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Action: Inline Add Hint */}
            <button
              onClick={() => openCreateTaskModal()}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted transition border border-dashed border-border"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>Hızlı Görev Ekle</span>
            </button>
          </div>

          {/* Modern Task Cards List Container */}
          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center rounded-xl bg-muted/30 border border-border">
              <p className="text-sm text-muted-foreground">Bu filtreye uygun görev bulunamadı.</p>
              <button
                onClick={() => {
                  setActiveAreaFilter("all");
                  setStatusFilter("all");
                  setSearchQuery("");
                }}
                className="mt-2 text-xs font-semibold text-blue-400 hover:text-blue-700 dark:text-blue-300"
              >
                Filtreleri Sıfırla
              </button>
            </div>
          ) : viewMode === "list" ? (
            <div className="space-y-2.5 mt-2">
              {filteredTasks.map((task) => {
                const area = state.areas.find((a) => a.id === task.areaId);
                const styling = getAreaStyling(task.areaId, area?.name);
                const isDone = task.status === "done";

                const assignedDayObj = task.date
                  ? weekDays.find((d) => d.date === task.date)
                  : null;

                return (
                  <article
                    key={task.id}
                    className={cn(
                      "group relative bg-card hover:bg-muted/50 border rounded-xl p-3.5 sm:p-4 transition-all duration-150 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4",
                      isDone
                        ? "border-border opacity-75"
                        : "border-border hover:border-blue-500/40 hover:shadow-[0_0_20px_-3px_rgba(37,99,235,0.2)]"
                    )}
                  >
                    {/* Left: Drag Handle, Checkbox, Info */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Drag Handle */}
                      <button
                        className="text-muted-foreground/60 hover:text-muted-foreground cursor-grab active:cursor-grabbing p-1 rounded transition shrink-0"
                        title="Sıralamak için sürükle"
                      >
                        <GripVertical className="w-4 h-4" />
                      </button>

                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleTask(task)}
                        className={cn(
                          "w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0",
                          isDone
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-muted border-border hover:border-slate-500 text-transparent"
                        )}
                        title={isDone ? "Görevi geri al" : "Tamamlandı olarak işaretle"}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      {/* Title & Badges Row */}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3
                            onClick={() => openEditTaskModal(task)}
                            className={cn(
                              "text-sm font-bold text-foreground group-hover:text-blue-700 dark:text-blue-300 transition truncate cursor-pointer",
                              isDone && "line-through text-muted-foreground"
                            )}
                          >
                            {task.title}
                          </h3>

                          {/* Priority Badge */}
                          {task.mandatory ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              Öncelikli
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                              İsteğe Bağlı
                            </span>
                          )}
                        </div>

                        {/* Metadata Row */}
                        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                          {/* Category Badge */}
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border",
                              styling.bg,
                              styling.border,
                              styling.text
                            )}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: styling.color }}
                            />
                            {area?.name || "Genel"}
                          </span>

                          {/* Duration Badge */}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-foreground/90 border border-border font-mono">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {task.minutes} dk
                          </span>

                          {/* Pool / Day Location Badge */}
                          {assignedDayObj ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 font-medium">
                              <CalendarIcon className="w-3 h-3 text-blue-400" />
                              {assignedDayObj.dayName} {assignedDayObj.dayNum} {assignedDayObj.monthName}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-muted-foreground bg-muted border border-border">
                              <Layers className="w-3 h-3 text-muted-foreground/80" />
                              Esnek Havuz
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Modern Action Bar */}
                    <div className="flex items-center justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-border shrink-0">
                      {/* Düzenle */}
                      <button
                        onClick={() => openEditTaskModal(task)}
                        className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-muted hover:bg-blue-600/20 text-foreground/90 hover:text-blue-700 dark:text-blue-300 border border-border hover:border-blue-500/30 text-xs font-medium transition flex items-center gap-1.5"
                        title="Görevi Düzenle"
                      >
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground group-hover:text-blue-400" />
                        <span className="hidden sm:inline">Düzenle</span>
                      </button>

                      {/* Küçült */}
                      <button
                        onClick={() => handleShrinkTask(task)}
                        className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-muted hover:bg-muted text-foreground/90 hover:text-foreground border border-border text-xs font-medium transition flex items-center gap-1"
                        title="Süreyi yarıya indir"
                      >
                        <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="hidden sm:inline">Küçült</span>
                      </button>

                      {/* Havuza Gönder / Güne Ata */}
                      {task.date ? (
                        <button
                          onClick={() => handlePoolTask(task)}
                          className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-muted hover:bg-muted text-foreground/90 hover:text-foreground border border-border text-xs font-medium transition flex items-center gap-1"
                          title="Havuza Geri Gönder"
                        >
                          <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="hidden sm:inline">Havuza</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setAssignDayTarget(task.id)}
                          className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-700 dark:text-blue-300 hover:text-foreground border border-blue-500/30 text-xs font-medium transition flex items-center gap-1"
                          title="Haftanın bir gününe ata"
                        >
                          <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
                          <span className="hidden sm:inline">Güne Ata</span>
                        </button>
                      )}

                      {/* +1 Gün Ertele */}
                      <button
                        onClick={() => handlePostponeTask(task)}
                        className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-muted hover:bg-muted text-foreground/90 hover:text-foreground border border-border text-xs font-medium transition flex items-center gap-1"
                        title="Sonraki güne ertele"
                      >
                        <MoveRight className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="hidden sm:inline">+1 Gün</span>
                      </button>

                      {/* Bırak */}
                      <button
                        onClick={() => handleDropTask(task)}
                        className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-700 dark:text-rose-300 border border-rose-500/20 text-xs font-medium transition flex items-center gap-1"
                        title="Görevi İptal Et / Bırak"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Bırak</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* Kanban / Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-2">
              {filteredTasks.map((task) => {
                const area = state.areas.find((a) => a.id === task.areaId);
                const styling = getAreaStyling(task.areaId, area?.name);
                const isDone = task.status === "done";
                const assignedDayObj = task.date ? weekDays.find((d) => d.date === task.date) : null;

                return (
                  <div
                    key={task.id}
                    className="bg-card border border-border hover:border-primary/40 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-[0_1px_2px_0_rgba(0,0,0,0.35)]"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border",
                            styling.bg,
                            styling.border,
                            styling.text
                          )}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: styling.color }} />
                          {area?.name}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">{task.minutes} dk</span>
                      </div>
                      <h4
                        onClick={() => openEditTaskModal(task)}
                        className={cn(
                          "text-sm font-bold text-foreground hover:text-blue-700 dark:text-blue-300 cursor-pointer",
                          isDone && "line-through text-muted-foreground"
                        )}
                      >
                        {task.title}
                      </h4>
                      {task.why && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.why}</p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleTask(task)}
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-semibold transition",
                            isDone ? "bg-blue-600 text-white" : "bg-muted text-foreground/90 hover:bg-muted"
                          )}
                        >
                          {isDone ? "Bitti" : "Tamamla"}
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleShrinkTask(task)}
                          className="px-2 py-0.5 rounded text-[10px] bg-muted hover:bg-muted text-foreground/90"
                        >
                          Küçült
                        </button>
                        <button
                          onClick={() => handlePostponeTask(task)}
                          className="px-2 py-0.5 rounded text-[10px] bg-muted hover:bg-muted text-foreground/90"
                        >
                          +1G
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Quick Add Strip / Summary */}
          <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-4 flex-wrap">
              <span>
                Toplam: <strong className="text-foreground">{filteredTasks.length} Görev</strong> ({plannedMinutes} dk)
              </span>
              <span className="text-muted-foreground/60">•</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                {completedTasks.length} Tamamlandı
              </span>
              <span className="text-muted-foreground/60">•</span>
              <span className="text-emerald-400 font-semibold">Sprint Yükü Dengeli</span>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-muted-foreground/80">Klavye Kısayolu:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono text-foreground/90">
                N
              </kbd>
              <span>ile yeni ekle</span>
            </div>
          </div>
        </section>
        {/* END: TaskPoolSection */}

        {/* BEGIN: DeadlinesBannerSection */}
        <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Yaklaşan Kritik Kilometre Taşları &amp; Teslimler</h2>
                <p className="text-xs text-muted-foreground">Dönem hedeflerine giden yoldaki kritik kontrol noktaları ve ara teslimler</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => openCreateTaskModal()}
                className="text-xs font-semibold text-foreground/90 hover:text-foreground px-2.5 py-1 rounded-lg bg-muted hover:bg-muted border border-border transition"
              >
                + Tarih Ekle
              </button>
              <Link
                href="/calendar"
                className="text-xs font-semibold text-blue-400 hover:text-blue-700 dark:text-blue-300 inline-flex items-center gap-1 transition group"
              >
                Takvim Görünümü <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* Milestone 1 */}
            <div className="bg-muted/40 border border-border rounded-xl p-4 flex flex-col justify-between min-h-[105px] hover:border-border transition">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    1. Aşama Temel Harita Onayı
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground/80">1. Aşama</span>
                </div>
                <p className="text-xs text-muted-foreground">11 Eylül Cuma • North ile değerlendirme oturumu</p>
              </div>
              <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                <span className="text-amber-400/90 font-medium">⏳ 2 gün kaldı</span>
                <span className="text-muted-foreground/80 text-[10px]">Kritik Kontrol</span>
              </div>
            </div>

            {/* Milestone 2 */}
            <div className="bg-muted/40 border border-border rounded-xl p-4 flex flex-col justify-between min-h-[105px] hover:border-border transition">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    İlk Laboratuvar Raporu Çıktısı
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground/80">2. Aşama</span>
                </div>
                <p className="text-xs text-muted-foreground">14 Eylül Pazartesi • Siber güvenlik lab bulguları</p>
              </div>
              <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                <span className="text-blue-400/90 font-medium">⏳ 5 gün kaldı</span>
                <span className="text-muted-foreground/80 text-[10px]">İlk Kanıt</span>
              </div>
            </div>

            {/* Milestone 3 */}
            <div className="bg-muted/40 border border-border rounded-xl p-4 flex flex-col justify-between min-h-[105px] hover:border-border transition">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    Dönem 1 Ara Kontrol Validasyonu
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground/80">Sprint 1</span>
                </div>
                <p className="text-xs text-muted-foreground">18 Eylül Cuma • Tüm alanlarda ilk sprint çıktısı</p>
              </div>
              <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                <span className="text-indigo-400/90 font-medium">⏳ 10 gün kaldı</span>
                <span className="text-muted-foreground/80 text-[10px]">Sprint İnceleme</span>
              </div>
            </div>
          </div>
        </section>
        {/* END: DeadlinesBannerSection */}
      </div>

      

      {/* TASK EDIT / CREATE MODAL */}
      <Dialog open={taskModalOpen} onOpenChange={setTaskModalOpen}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              {editingTask?.id && state.tasks.some((t) => t.id === editingTask.id)
                ? "Görevi Düzenle"
                : "Yeni Görev Ekle"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Bu sprint için net, odaklı ve ölçülebilir bir çalışma adımı tanımla.
            </DialogDescription>
          </DialogHeader>

          {editingTask && (
            <div className="space-y-3.5 py-2">
              <div className="space-y-1">
                <Label className="text-xs text-foreground/90">Görev Başlığı</Label>
                <Input
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  placeholder="Örn: Temel ağ ve Linux ortamını doğrula"
                  className="bg-background border-input text-xs text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-foreground/90">Alan</Label>
                  <select
                    value={editingTask.areaId}
                    onChange={(e) => setEditingTask({ ...editingTask, areaId: e.target.value })}
                    className="w-full bg-background border border-input rounded-md py-2 px-2.5 text-xs text-foreground"
                  >
                    {activeAreas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-foreground/90">Süre (Dakika)</Label>
                  <Input
                    type="number"
                    min={10}
                    max={240}
                    step={5}
                    value={editingTask.minutes}
                    onChange={(e) => setEditingTask({ ...editingTask, minutes: Number(e.target.value) || 30 })}
                    className="bg-background border-input text-xs text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-foreground/90">Güne Ata (İsteğe Bağlı)</Label>
                <select
                  value={editingTask.date || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, date: e.target.value })}
                  className="w-full bg-background border border-input rounded-md py-2 px-2.5 text-xs text-foreground"
                >
                  <option value="">Esnek Havuz (Güne kilitlenmemiş)</option>
                  {weekDays.map((d) => (
                    <option key={d.date} value={d.date}>
                      {d.dayName} {d.dayNum} {d.monthName} {d.isToday ? "(Bugün)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="mandatoryCheck"
                  checked={editingTask.mandatory}
                  onChange={(e) => setEditingTask({ ...editingTask, mandatory: e.target.checked })}
                  className="w-4 h-4 rounded bg-muted border-border text-blue-600 focus:ring-0"
                />
                <label htmlFor="mandatoryCheck" className="text-xs text-foreground/90 cursor-pointer">
                  Bu görev sprint için <strong className="text-amber-700 dark:text-amber-300">Öncelikli</strong> sayılsın
                </label>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTaskModalOpen(false)}
              className="border-border text-xs text-foreground/90"
            >
              İptal
            </Button>
            <Button
              size="sm"
              onClick={handleSaveTaskModal}
              disabled={!editingTask?.title.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-xs text-white font-semibold"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QUICK DAY ASSIGN POPOVER / DIALOG */}
      <Dialog open={Boolean(assignDayTarget)} onOpenChange={(open) => !open && setAssignDayTarget(null)}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              {assignDayTarget && assignDayTarget.includes("-") && assignDayTarget.length === 10
                ? `${weekDays.find((d) => d.date === assignDayTarget)?.dayName || "Seçili Gün"} İçin Görev Ata`
                : "Görevi Güne Ata"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Esnek havuzdaki bir görevi bu güne taşıyabilir veya hızlıca yeni bir görev oluşturabilirsin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* If target is a day (YYYY-MM-DD), show pool tasks that can be assigned */}
            {assignDayTarget && assignDayTarget.includes("-") && assignDayTarget.length === 10 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Havuzdaki Atanmamış Görevler:</span>
                  <button
                    onClick={() => {
                      const day = assignDayTarget;
                      setAssignDayTarget(null);
                      openCreateTaskModal(day);
                    }}
                    className="text-blue-400 hover:text-blue-700 dark:text-blue-300 font-semibold"
                  >
                    + Bu Güne Yeni Görev
                  </button>
                </div>

                {state.tasks.filter((t) => !t.date && t.status !== "cancelled" && t.status !== "done").length === 0 ? (
                  <p className="text-xs text-muted-foreground/80 italic py-3 text-center bg-muted/60 rounded-lg">
                    Havuzda atanmamış görev yok. Yukarıdan yeni görev ekleyebilirsin.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {state.tasks
                      .filter((t) => !t.date && t.status !== "cancelled" && t.status !== "done")
                      .map((poolT) => {
                        const area = state.areas.find((a) => a.id === poolT.areaId);
                        const styling = getAreaStyling(poolT.areaId, area?.name);
                        return (
                          <button
                            key={poolT.id}
                            onClick={() => handleAssignTaskToDay(poolT.id, assignDayTarget)}
                            className="w-full text-left p-2.5 rounded-lg bg-muted/40 hover:bg-muted border border-border flex items-center justify-between transition group"
                          >
                            <div>
                              <div className="text-xs font-semibold text-foreground group-hover:text-blue-700 dark:text-blue-300 transition">
                                {poolT.title}
                              </div>
                              <div className="text-[10px] text-muted-foreground/80 mt-0.5">
                                {area?.name} • {poolT.minutes} dk
                              </div>
                            </div>
                            <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition">
                              Ata →
                            </span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            ) : (
              /* If target is a taskId, show days to assign to */
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">Hangi güne atamak istersin?</span>
                <div className="grid grid-cols-2 gap-2">
                  {weekDays.slice(0, 5).map((d) => (
                    <button
                      key={d.date}
                      onClick={() => handleAssignTaskToDay(assignDayTarget!, d.date)}
                      className="p-2.5 rounded-lg bg-muted/40 hover:bg-muted border border-border text-left transition"
                    >
                      <div className="text-xs font-bold text-foreground">{d.dayName}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {d.dayNum} {d.monthName} {d.isToday ? "• Bugün" : ""}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssignDayTarget(null)}
              className="border-border text-xs text-foreground/90"
            >
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REPLAN / DAY SELECTION MODAL */}
      <Dialog open={replanModalOpen} onOpenChange={setReplanModalOpen}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              Haftalık Planlama &amp; Gün Seçimi
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Görevlerin hangi günlere dağıtılacağını seç. Çalışmadığın günleri (örneğin hafta sonunu) devre dışı bırakabilirsin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Quick Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setTempPlanDays([0, 1, 2, 3, 4])}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold border transition",
                  JSON.stringify([...tempPlanDays].sort()) === JSON.stringify([0, 1, 2, 3, 4])
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground hover:text-foreground border-border"
                )}
              >
                Hafta İçi (Haftasonu Kapalı)
              </button>
              <button
                type="button"
                onClick={() => setTempPlanDays([0, 1, 2, 3, 4, 5, 6])}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold border transition",
                  tempPlanDays.length === 7
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground hover:text-foreground border-border"
                )}
              >
                Tüm Hafta (7 Gün)
              </button>
              <button
                type="button"
                onClick={() => setTempPlanDays([0, 2, 4])}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold border transition",
                  JSON.stringify([...tempPlanDays].sort()) === JSON.stringify([0, 2, 4])
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground hover:text-foreground border-border"
                )}
              >
                Pzt, Çar, Cum (3 Gün)
              </button>
            </div>

            {/* Day Toggle Buttons */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-semibold">Aktif Dağıtım Günleri</Label>
              <div className="grid grid-cols-7 gap-1.5">
                {[
                  { idx: 0, label: "Pzt", full: "Pazartesi" },
                  { idx: 1, label: "Sal", full: "Salı" },
                  { idx: 2, label: "Çar", full: "Çarşamba" },
                  { idx: 3, label: "Per", full: "Perşembe" },
                  { idx: 4, label: "Cum", full: "Cuma" },
                  { idx: 5, label: "Cmt", full: "Cumartesi", weekend: true },
                  { idx: 6, label: "Paz", full: "Pazar", weekend: true },
                ].map((d) => {
                  const isSelected = tempPlanDays.includes(d.idx);
                  return (
                    <button
                      key={d.idx}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          if (tempPlanDays.length > 1) {
                            setTempPlanDays(tempPlanDays.filter((x) => x !== d.idx));
                          }
                        } else {
                          setTempPlanDays([...tempPlanDays, d.idx].sort((a, b) => a - b));
                        }
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer",
                        isSelected
                          ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                          : "bg-muted/40 border-border text-muted-foreground hover:border-muted-foreground/30"
                      )}
                      title={d.full}
                    >
                      <span className="text-xs">{d.label}</span>
                      <span className="text-[9px] mt-0.5 font-medium">
                        {isSelected ? "Açık" : "Kapalı"}
                      </span>
                    </button>
                  );
                })}
              </div>
              {!tempPlanDays.includes(5) && !tempPlanDays.includes(6) ? (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                  <Check className="w-3 h-3" />
                  Hafta sonu (Cumartesi ve Pazar) kapalı — hiçbir görev hafta sonuna yerleştirilmeyecek.
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                  Seçilen gün sayısı: {tempPlanDays.length} gün
                </p>
              )}
            </div>

            {/* Distribution Mode Options */}
            <div className="space-y-2 pt-2 border-t border-border">
              <Label className="text-xs text-muted-foreground font-semibold">Dağıtım Modu</Label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2.5 p-2 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="replanScope"
                    checked={replanForceAll}
                    onChange={() => setReplanForceAll(true)}
                    className="text-primary accent-primary"
                  />
                  <div>
                    <span className="font-semibold text-foreground">Tüm haftayı sıfırdan dengeli dağıt</span>
                    <p className="text-[10px] text-muted-foreground">Tüm açık görevler seçilen günlere eşit ve alan dengesiyle paylaştırılır.</p>
                  </div>
                </label>
                <label className="flex items-center gap-2.5 p-2 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="replanScope"
                    checked={!replanForceAll}
                    onChange={() => setReplanForceAll(false)}
                    className="text-primary accent-primary"
                  />
                  <div>
                    <span className="font-semibold text-foreground">Sadece tarihsiz / havuzdaki görevleri dağıt</span>
                    <p className="text-[10px] text-muted-foreground">Mevcut atanmış günlerdeki görevler yerinde kalır.</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReplanModalOpen(false)}
              className="text-xs"
            >
              Vazgeç
            </Button>
            <Button
              size="sm"
              onClick={() => handleExecuteReplan(tempPlanDays, replanForceAll)}
              disabled={tempPlanDays.length === 0}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold"
            >
              Seçilen Günlere Dağıt ({tempPlanDays.length} Gün)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
