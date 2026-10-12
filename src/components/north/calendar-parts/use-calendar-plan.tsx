"use client";

import {
  useState,
  useEffect,
} from "react";
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
import {
  useNorth,
} from "../shared";
import {
  toast,
} from "sonner";
import {
  buildIcs,
} from "@/lib/ics";
import {
  CalendarDaySetting,
  loadDaySettings,
  saveDaySettings,
} from "./module-level";

export function useCalendarPlan() {
  const { state, update, workspace } = useNorth();

  function exportCalendar() {
    const ics = buildIcs({ tasks: state.tasks, events: state.events });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "planorth-takvim.ics";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Takvim dosyası indirildi. Google, Apple veya Outlook takvimine içe aktarabilirsin.");
  }
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


  return {
    state,
    update,
    workspace,
    exportCalendar,
    date,
    setDate,
    view,
    setView,
    eventDraft,
    setEventDraft,
    taskDraft,
    setTaskDraft,
    rolloverNotice,
    setRolloverNotice,
    activeAreas,
    start,
    count,
    days,
    leading,
    trailing,
    monthDate,
    monthName,
    selectedDateFormatted,
    navigateMonth,
    dateTasks,
    optionalPool,
    selectedTasks,
    selectedMinutes,
    selectedEvents,
    selectedBlockingEvents,
    daySettings,
    setDaySettings,
    daySettingsOpen,
    setDaySettingsOpen,
    daySettingDraft,
    setDaySettingDraft,
    distributeModalOpen,
    setDistributeModalOpen,
    distributeStrategy,
    setDistributeStrategy,
    distributeAreaId,
    setDistributeAreaId,
    distAllowedDays,
    setDistAllowedDays,
    distRespectRest,
    setDistRespectRest,
    distRespectBlocks,
    setDistRespectBlocks,
    distMaxDailyTasks,
    setDistMaxDailyTasks,
    distMaxDailyMinutes,
    setDistMaxDailyMinutes,
    isAllDays,
    isWeekdaysOnly,
    isWeekendsOnly,
    toggleAllowedDay,
    openDaySettingsModal,
    saveCurrentDaySetting,
    applySettingToAllWeekendsInMonth,
    resetCurrentDaySetting,
    shiftTasksToTomorrow,
    moveTasksToPool,
    handleMonthlyDistribution,
    selectedDaySetting,
    handleRebalance,
    toggleTaskDone,
    assignPoolTaskToDate,
    openNewTaskModal,
    openNewEventModal,
  };
}

export type CalendarPlanCtx = ReturnType<typeof useCalendarPlan>;
