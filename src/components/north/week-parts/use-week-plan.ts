"use client";

import {
} from "lucide-react";
import {
  capacity,
  dayKey,
  dropTask,
  isAreaActive,
  poolTask,
  postponeTask,
  shiftDay,
  shrinkTask,
  weekKey,
  distributePlanTasksToCalendar,
  isAreaActiveForWeek,
  toggleAreaForWeek,
  type NorthTask,
  type Area,
} from "@/lib/north";
import { getAreaStyling } from "./area-styling";
import {
} from "@/components/ui/dialog";
import { useState, useMemo, useRef, useEffect } from "react";
import { useNorth } from "../shared";

export function useWeekPlan() {
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

  // Active Planning Days (7-day automatic default: [0, 1, 2, 3, 4, 5, 6])
  const [activePlanDays, setActivePlanDays] = useState<number[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedV2 = localStorage.getItem("north_active_plan_days_v2");
        if (savedV2) {
          const parsed = JSON.parse(savedV2);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [0, 1, 2, 3, 4, 5, 6];
  });

  // Synchronize with workspace profile workingDays if configured
  useEffect(() => {
    if (workspace?.profile?.workingDays && workspace.profile.workingDays.length > 0) {
      const pDays = workspace.profile.workingDays;
      setActivePlanDays(pDays);
      try {
        localStorage.setItem("north_active_plan_days_v2", JSON.stringify(pDays));
        localStorage.setItem("north_active_plan_days", JSON.stringify(pDays));
      } catch {}
    }
  }, [workspace?.profile?.workingDays]);

  const updateActivePlanDays = (days: number[]) => {
    setActivePlanDays(days);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("north_active_plan_days_v2", JSON.stringify(days));
        localStorage.setItem("north_active_plan_days", JSON.stringify(days));
      } catch {}
    }
    if (workspace?.updateProfile) {
      workspace.updateProfile({ workingDays: days });
    }
  };

  const [replanModalOpen, setReplanModalOpen] = useState(false);
  const [tempPlanDays, setTempPlanDays] = useState<number[]>(activePlanDays);
  const [tempExcludedAreas, setTempExcludedAreas] = useState<string[]>([]);
  const [replanForceAll, setReplanForceAll] = useState(true);

  const currentWeekKey = useMemo(() => {
    if (scopeFilter === "nextWeek") return shiftDay(weekKey(), 7);
    return week;
  }, [scopeFilter, week]);

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
  const handleAutoPlan = (force = false, days = activePlanDays, excludedAreas?: string[]) => {
    const targetWeek = currentWeekKey;
    const targetExclusions = excludedAreas ?? (state.weeklyAreaExclusions?.[targetWeek] ?? []);

    update((curr) => {
      const updated = distributePlanTasksToCalendar(curr.tasks, {
        weeklyHours: curr.weeklyHours,
        events: curr.events,
        week: targetWeek,
        forceRedistribute: force,
        activeDayIndices: days,
        excludedAreaIds: targetExclusions,
      });
      return {
        ...curr,
        weeklyAreaExclusions: {
          ...(curr.weeklyAreaExclusions ?? {}),
          [targetWeek]: targetExclusions,
        },
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

  const handleExecuteReplan = (days: number[], force: boolean, excludedAreas: string[]) => {
    updateActivePlanDays(days);
    handleAutoPlan(force, days, excludedAreas);
    setReplanModalOpen(false);
  };

  const handleToggleDayRest = (dayIndex: number) => {
    let nextDays: number[];
    const dayLabels = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
    const dayName = dayLabels[dayIndex] || "Gün";

    if (activePlanDays.includes(dayIndex)) {
      if (activePlanDays.length <= 1) {
        showToast("⚠️ En az 1 çalışma günü açık olmalıdır.");
        return;
      }
      nextDays = activePlanDays.filter((i) => i !== dayIndex);
      updateActivePlanDays(nextDays);
      const targetDate = weekDays[dayIndex]?.date;
      if (targetDate) {
        update((curr) => {
          const tasksToShift = curr.tasks.map((t) =>
            t.date === targetDate && t.status !== "done" && t.status !== "cancelled"
              ? { ...t, date: "" }
              : t
          );
          const redistributed = distributePlanTasksToCalendar(tasksToShift, {
            weeklyHours: curr.weeklyHours,
            events: curr.events,
            week: currentWeekKey,
            forceRedistribute: false,
            activeDayIndices: nextDays,
          });
          return { ...curr, tasks: redistributed };
        });
      }
      showToast(`🏖️ ${dayName} tatil / dinlenme günü yapıldı. Görevler diğer günlere aktarıldı.`);
    } else {
      nextDays = [...activePlanDays, dayIndex].sort((a, b) => a - b);
      updateActivePlanDays(nextDays);
      showToast(`💼 ${dayName} çalışma günü olarak plana dahil edildi.`);
    }
  };

  const handleToggleAreaForWeek = (areaId: string, customWeek?: string) => {
    const targetWeek = customWeek || currentWeekKey;
    const area = state.areas.find((a) => a.id === areaId);
    const areaName = area?.name || "Alan";
    const isCurrentlyActive = isAreaActiveForWeek(state, areaId, targetWeek);

    update((curr) => toggleAreaForWeek(curr, areaId, targetWeek));

    if (isCurrentlyActive) {
      showToast(`⏸ "${areaName}" bu hafta (${targetWeek === weekKey() ? 'Bu Hafta' : 'Seçilen Hafta'}) için mola moduna alındı. Görevler havuza taşındı (diğer haftalarda plan devam eder).`);
    } else {
      showToast(`▶️ "${areaName}" bu haftanın planına başarıyla dahil edildi.`);
    }
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

  function openCreateTaskModal(targetDate?: string) {
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
  }

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

  return {
    week,
    setWeek,
    activeAreaFilter,
    setActiveAreaFilter,
    scopeFilter,
    setScopeFilter,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    notification,
    setNotification,
    defaultSelectedDay,
    selectedDay,
    setSelectedDay,
    activePlanDays,
    setActivePlanDays,
    updateActivePlanDays,
    replanModalOpen,
    setReplanModalOpen,
    tempPlanDays,
    setTempPlanDays,
    tempExcludedAreas,
    setTempExcludedAreas,
    replanForceAll,
    setReplanForceAll,
    currentWeekKey,
    taskModalOpen,
    setTaskModalOpen,
    editingTask,
    setEditingTask,
    assignDayTarget,
    setAssignDayTarget,
    searchInputRef,
    activeAreas,
    isCurrentWeek,
    hasAutoPlannedRef,
    weekDays,
    weekStartDate,
    weekEndDate,
    weekLabel,
    currentSelectedDayObj,
    allTasksInScope,
    filteredTasks,
    currentWeekTasks,
    completedTasks,
    plannedMinutes,
    completedMinutes,
    weeklyCapMinutes,
    dailyTargetCap,
    completionPct,
    capacityLoadPct,
    areaBreakdown,
    overdueTasks,
    showToast,
    handleAutoPlan,
    handleExecuteReplan,
    handleToggleDayRest,
    handleToggleAreaForWeek,
    handleToggleTask,
    handleShrinkTask,
    handlePoolTask,
    handlePostponeTask,
    handleDropTask,
    handleAssignTaskToDay,
    openCreateTaskModal,
    openEditTaskModal,
    handleSaveTaskModal,
    periodMilestones,
    state,
    update,
    workspace,
  };
}

export type WeekPlan = ReturnType<typeof useWeekPlan>;
