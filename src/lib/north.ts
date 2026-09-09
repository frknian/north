import type { WorkspaceState } from "./types";

export type AreaKind = "math" | "cyber" | "reading" | "chess" | "projects" | "custom";
export type NorthTaskStatus = "pending" | "done" | "partial" | "skipped" | "cancelled";
export type SupportSource = "ai" | "documentation" | "video" | "course" | "friend" | "forum" | "walkthrough" | "none" | "other";
export interface Area {
  id: string; name: string; kind: AreaKind; icon: string; goal: string; priority: number;
  weeklyMinutes: number; minimumMinutes: number; archived: boolean; metric: string;
  target: number; notes: string; resources: string;
  description?: string; preferredSessionMinutes?: number; accent?: string; domainId?: string;
  level?: string;
  status?: "active" | "paused" | "archived";
}
export interface NorthTask {
  id: string; areaId: string; title: string; goal: string; minutes: number;
  intensity: "low" | "normal" | "high"; mandatory: boolean; status: NorthTaskStatus;
  date: string; deadline: string; resource: string; why: string; week: string;
  taskType?: "deep_work" | "practice" | "problem_solving" | "lab" | "review" | "reading" | "creative" | "administrative" | "light";
  difficulty?: "easy" | "medium" | "hard";
  plannedStart?: string;
  completedAt?: string;
  rescheduledCount?: number;
}
export interface NorthActivity {
  id: string; taskId: string; areaId: string; date: string; minutes: number;
  outcome: "done" | "partial" | "skipped"; difficulty: string; reflection: string;
  amount: number; metric: string; endedAt: string;
  plannedMinutes?: number; actualStart?: string; plannedStart?: string;
  energy?: "low" | "normal" | "high"; pauseCount?: number; earlyExit?: boolean;
  completionPercent?: number; taskType?: NorthTask["taskType"];
  supportSources?: SupportSource[];
  proofType?: "output_text" | "photo" | "step" | "ai_verified" | "scratchpad" | "none" | "abandoned";
  proofContent?: string;
  tabSwitches?: number;
  ironWill?: boolean;
}
export interface NorthDailyAdaptation {
  date: string; taskId?: string; originalMinutes?: number; recommendedMinutes?: number;
  message: string;
}
export interface NorthEvent {
  id: string;
  areaId: string;
  title: string;
  date: string;
  time: string;
  kind: "exam" | "deadline" | "block" | "class" | "shift" | "personal";
  minutes: number;
}
export interface NorthState {
  records?: AreaRecord[];
  version: 1;
  areas: Area[];
  tasks: NorthTask[];
  activities: NorthActivity[];
  events: NorthEvent[];
  energy: { date: string; level: "low" | "normal" | "high" };
  weeklyHours: number;
  mode: string;
  customMode: string;
  protection: { areaId: string; date: string; kind: "rest" | "freeze" }[];
  intelligence?: NorthIntelligenceState;
  dailyAdaptation?: NorthDailyAdaptation;
  feedbackMemory?: import("./types").FeedbackMemoryItem[];
  weeklyAreaExclusions?: Record<string, string[]>;
}
export type PatternStatus = "insufficient" | "emerging" | "reliable" | "strong";
export type PatternConfidence = "low" | "medium" | "high";
export interface BehaviorPattern {
  id:string; patternType:"best_time"|"session_length"|"procrastination"|"capacity"|"duration_estimation"|"area_preference"|"energy_response";
  areaId?:string; taskType?:NorthTask["taskType"]; timeRange?:string; observationStart:string; observationEnd:string;
  sampleSize:number; metricName:string; metricValue:number; baselineValue?:number; confidence:PatternConfidence; status:PatternStatus;
  summary:string; recommendation:string; createdAt:string; updatedAt:string;
}
export interface NorthExperiment { id:string; patternId:string; startedAt:string; endsAt:string; status:"active"|"completed"|"cancelled"; baselineValue:number; baselineSampleSize:number; summary:string; }
export interface NorthIntelligenceState {
  patterns:BehaviorPattern[]; dismissedPatternIds:string[]; incorrectPatternIds:string[]; experiments:NorthExperiment[];
  lockedSchedule:Record<string,string>; lockedDurations:Record<string,number>; learningStartedAt?:string; updatedAt:string;
}
export interface AreaRecord { id:string;areaId:string;module:string;title:string;values:Record<string,string>;notes:string }
export const areaModules: Record<AreaKind, {name:string;fields:{key:string;label:string;type:"text"|"number"|"date"}[]}[]> = {
  math:[{name:"Dersler",fields:[{key:"exam",label:"Sınav tarihi",type:"date"}]},{name:"Konular",fields:[{key:"solved",label:"Çözülen problem",type:"number"},{key:"correct",label:"Doğru çözüm",type:"number"},{key:"revision",label:"Tekrar tarihi",type:"date"}]}],
  reading:[{name:"Kitaplar",fields:[{key:"pages",label:"Okunan sayfa",type:"number"},{key:"total",label:"Toplam sayfa",type:"number"}]}],
  chess:[{name:"Oyunlar",fields:[{key:"opening",label:"Açılış",type:"text"},{key:"rating",label:"Oyun sonrası puan",type:"number"},{key:"blunders",label:"Büyük hata sayısı",type:"number"},{key:"result",label:"Sonuç (galibiyet / beraberlik / yenilgi)",type:"text"}]},{name:"Taktikler",fields:[{key:"attempts",label:"Bulmaca Sayısı",type:"number"},{key:"correct",label:"Doğru",type:"number"}]}],
  projects:[{name:"Çıktılar",fields:[{key:"deadline",label:"Son tarih",type:"date"},{key:"link",label:"Kanıt bağlantısı",type:"text"}]}],
  cyber:[],custom:[{name:"Çalışmalar",fields:[{key:"output",label:"Çıktı",type:"text"}]}],
};
export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
export function shiftDay(day: string, count: number) { const d = new Date(day+"T12:00:00"); d.setDate(d.getDate()+count); return dayKey(d); }
export function weekKey(day = dayKey()) { const d = new Date(day+"T12:00:00"); return shiftDay(day, -((d.getDay()+6)%7)); }
export const kindLabels: Record<AreaKind, string> = { math: "Matematik", cyber: "Siber Güvenlik", reading: "Okuma", chess: "Satranç", projects: "Projeler", custom: "Özel alan" };
export const metricDefaults: Record<AreaKind, string> = { math: "Çözülen problem", cyber: "Tamamlanan lab", reading: "Okunan sayfa", chess: "Çözülen taktik", projects: "Tamamlanan çıktı", custom: "Tamamlanan çalışma" };
export const areaAccents = ["#9ebeb8", "#9aa9c7", "#b5a58a", "#a89bb8", "#9eae91", "#b39a9a"];
export function areaStatus(area: Area) { return area.archived || area.status === "archived" ? "archived" : area.status === "paused" ? "paused" : "active"; }
export function isAreaActive(area: Area) { return areaStatus(area) === "active"; }
export function isAreaActiveForWeek(state: NorthState, areaId: string, week: string = weekKey()): boolean {
  const area = state.areas.find((a) => a.id === areaId);
  if (!area || !isAreaActive(area)) return false;
  const exclusions = state.weeklyAreaExclusions?.[week] ?? [];
  return !exclusions.includes(areaId);
}
export function toggleAreaForWeek(state: NorthState, areaId: string, week: string = weekKey()): NorthState {
  const currentExclusions = state.weeklyAreaExclusions?.[week] ?? [];
  const isExcluded = currentExclusions.includes(areaId);
  const updatedExclusions = isExcluded
    ? currentExclusions.filter((id) => id !== areaId)
    : [...currentExclusions, areaId];

  // If excluding, unassign any pending/partial tasks in this week belonging to this area to the pool (date: "")
  let updatedTasks = state.tasks;
  if (!isExcluded) {
    updatedTasks = state.tasks.map((task) => {
      if (
        task.areaId === areaId &&
        ["pending", "partial"].includes(task.status) &&
        (task.week === week || (!task.week && task.date && weekKey(task.date) === week)) &&
        task.date
      ) {
        return { ...task, date: "", week };
      }
      return task;
    });
  }

  return {
    ...state,
    tasks: updatedTasks,
    weeklyAreaExclusions: {
      ...(state.weeklyAreaExclusions ?? {}),
      [week]: updatedExclusions,
    },
  };
}
export function setAreaActiveForWeek(state: NorthState, areaId: string, week: string, active: boolean): NorthState {
  const currentExclusions = state.weeklyAreaExclusions?.[week] ?? [];
  const isCurrentlyExcluded = currentExclusions.includes(areaId);
  if (active && isCurrentlyExcluded) {
    return {
      ...state,
      weeklyAreaExclusions: {
        ...(state.weeklyAreaExclusions ?? {}),
        [week]: currentExclusions.filter((id) => id !== areaId),
      },
    };
  } else if (!active && !isCurrentlyExcluded) {
    const updatedTasks = state.tasks.map((task) => {
      if (
        task.areaId === areaId &&
        ["pending", "partial"].includes(task.status) &&
        (task.week === week || (!task.week && task.date && weekKey(task.date) === week)) &&
        task.date
      ) {
        return { ...task, date: "", week };
      }
      return task;
    });
    return {
      ...state,
      tasks: updatedTasks,
      weeklyAreaExclusions: {
        ...(state.weeklyAreaExclusions ?? {}),
        [week]: [...currentExclusions, areaId],
      },
    };
  }
  return state;
}
export function createArea(kind: AreaKind, id: string): Area {
  return { id, kind, name: kindLabels[kind], icon: ({math:"∑",cyber:"⌘",reading:"▤",chess:"♞",projects:"◇",custom:"◎"})[kind], goal: "", priority: 2, weeklyMinutes: 0, minimumMinutes: 10, archived: false, metric: metricDefaults[kind], target: 0, notes: "", resources: "", description: "", preferredSessionMinutes: 50, accent: areaAccents[0], status: "active" };
}
export interface RolloverDetail {
  taskId: string;
  taskTitle: string;
  fromDate: string;
  toDate: string;
}

export interface RolloverResult {
  state: NorthState;
  rolledOverCount: number;
  details: RolloverDetail[];
}

export function distributePlanTasksToCalendar(
  tasks: NorthTask[],
  options: {
    weeklyHours?: number;
    events?: NorthEvent[];
    today?: string;
    week?: string;
    forceRedistribute?: boolean;
    activeDayIndices?: number[];
    excludedAreaIds?: string[];
  } = {}
): NorthTask[] {
  const today = options.today || dayKey();
  const currentWeek = options.week || weekKey(today);
  const events = options.events || [];
  const excludedAreaIds = options.excludedAreaIds || [];
  const weeklyMinutes = (options.weeklyHours ?? 10) * 60;
  // Default to Mon-Fri (0, 1, 2, 3, 4) - weekends excluded by default
  const activeDayIndices = options.activeDayIndices && options.activeDayIndices.length > 0
    ? options.activeDayIndices
    : [0, 1, 2, 3, 4];
  const dailyTargetCapacity = Math.max(45, Math.round(weeklyMinutes / Math.max(1, activeDayIndices.length)));

  const dayMinutes: Record<string, number> = {};

  const daysInCurrentWeek: string[] = [];
  for (let i = 0; i < 7; i++) {
    daysInCurrentWeek.push(shiftDay(currentWeek, i));
  }

  // Active days mapped to date strings
  const activeDays = activeDayIndices.map((i) => daysInCurrentWeek[i]).filter(Boolean);

  for (const t of tasks) {
    const isTaskOnActiveDay = activeDays.includes(t.date);
    if (t.date && t.status !== "cancelled" && isTaskOnActiveDay && (!options.forceRedistribute || t.week !== currentWeek || t.status === "done")) {
      dayMinutes[t.date] = (dayMinutes[t.date] || 0) + t.minutes;
    }
  }

  for (const ev of events) {
    if (ev.date && ["class", "shift", "personal", "block", "exam"].includes(ev.kind)) {
      dayMinutes[ev.date] = (dayMinutes[ev.date] || 0) + Math.min(ev.minutes, 360);
    }
  }

  let availableDays = activeDays.length > 0 ? activeDays : daysInCurrentWeek.slice(0, 5);
  if (!options.week && !options.forceRedistribute && today > activeDays[0]) {
    const fromToday = activeDays.filter((d) => d >= today);
    if (fromToday.length > 0) {
      availableDays = fromToday;
    }
  }

  // Separate tasks to be distributed from those that stay as-is
  const tasksToDistribute: NorthTask[] = [];

  for (const task of tasks) {
    if (task.status === "done" || task.status === "cancelled") {
      continue;
    }
    // If area is excluded for this week, do NOT place in this week's active days
    if (excludedAreaIds.includes(task.areaId)) {
      continue;
    }
    const isTaskOnActiveDay = activeDays.includes(task.date);
    if (task.date && !options.forceRedistribute && isTaskOnActiveDay) {
      continue;
    }
    if (task.week && task.week !== currentWeek && task.date && isTaskOnActiveDay) {
      continue;
    }
    tasksToDistribute.push(task);
  }

  if (tasksToDistribute.length === 0) {
    if (options.forceRedistribute && excludedAreaIds.length > 0) {
      return tasks.map((task) => {
        if (
          excludedAreaIds.includes(task.areaId) &&
          task.status !== "done" &&
          task.status !== "cancelled" &&
          (task.week === currentWeek || (task.date && daysInCurrentWeek.includes(task.date)))
        ) {
          return { ...task, date: "", week: currentWeek };
        }
        return task;
      });
    }
    return tasks;
  }

  // Group tasks by areaId so we can interleave them across days (Pzt x, y; Sal y, z; etc.)
  const tasksByArea: Record<string, NorthTask[]> = {};
  for (const task of tasksToDistribute) {
    if (!tasksByArea[task.areaId]) tasksByArea[task.areaId] = [];
    tasksByArea[task.areaId].push(task);
  }

  // Interleave tasks from different areas for variety
  const interleavedTasks: NorthTask[] = [];
  const areaKeys = Object.keys(tasksByArea);
  let hasMore = true;
  let round = 0;
  while (hasMore) {
    hasMore = false;
    for (const aId of areaKeys) {
      if (round < tasksByArea[aId].length) {
        interleavedTasks.push(tasksByArea[aId][round]);
        hasMore = true;
      }
    }
    round++;
  }

  // Assign interleaved tasks to available days with least load
  const assignedMap = new Map<string, string>();
  for (const task of interleavedTasks) {
    let bestDay = availableDays[0];
    let minMin = Infinity;
    for (const d of availableDays) {
      const currentLoad = dayMinutes[d] || 0;
      if (currentLoad < minMin) {
        minMin = currentLoad;
        bestDay = d;
      }
    }
    dayMinutes[bestDay] = (dayMinutes[bestDay] || 0) + task.minutes;
    assignedMap.set(task.id, bestDay);
  }

  return tasks.map((task) => {
    // If area is excluded for this week and forceRedistribute is true, move pending task to pool
    if (
      excludedAreaIds.includes(task.areaId) &&
      options.forceRedistribute &&
      task.status !== "done" &&
      task.status !== "cancelled" &&
      (task.week === currentWeek || (task.date && daysInCurrentWeek.includes(task.date)))
    ) {
      return {
        ...task,
        date: "",
        week: currentWeek,
      };
    }
    if (assignedMap.has(task.id)) {
      return {
        ...task,
        date: assignedMap.get(task.id)!,
        week: currentWeek,
      };
    }
    return task;
  });
}

export function distributePoolTasksToWeek(
  state: NorthState,
  week: string = weekKey(),
  options: { activeDayIndices?: number[]; forceRedistribute?: boolean; excludedAreaIds?: string[] } = {}
): NorthState {
  const excludedAreaIds = options.excludedAreaIds ?? (state.weeklyAreaExclusions?.[week] ?? []);
  const updatedTasks = distributePlanTasksToCalendar(state.tasks, {
    weeklyHours: state.weeklyHours,
    events: state.events,
    week,
    forceRedistribute: options.forceRedistribute ?? false,
    activeDayIndices: options.activeDayIndices,
    excludedAreaIds,
  });
  return {
    ...state,
    tasks: updatedTasks,
  };
}

export interface MonthDistributionOptions {
  monthKey: string; // "YYYY-MM", e.g. "2026-09"
  strategy?: "all_pool" | "rebalance_month" | "area_specific";
  areaId?: string;
  skipWeekends?: boolean;
  allowedDaysOfWeek?: number[]; // [0..6] where 0=Pazar, 1=Pzt, ..., 6=Cmt. If set, restricts to these days.
  respectRestDays?: boolean;
  respectBlockingEvents?: boolean;
  maxDailyMinutes?: number;
  maxDailyTasks?: number;
  startFromToday?: boolean;
  today?: string;
  restDates?: string[];
  customDayLimits?: Record<string, number>;
  events?: NorthEvent[];
  protection?: { areaId: string; date: string; kind: "rest" | "freeze" }[];
}

export interface MonthDistributionResult {
  tasks: NorthTask[];
  distributedCount: number;
  daysUsedCount: number;
  summary: string;
}

export function distributeTasksAcrossMonth(
  tasks: NorthTask[],
  options: MonthDistributionOptions
): MonthDistributionResult {
  const today = options.today || dayKey();
  const monthKey = options.monthKey || today.slice(0, 7);
  const strategy = options.strategy || "all_pool";
  const skipWeekends = options.skipWeekends ?? true;
  const allowedDays =
    options.allowedDaysOfWeek && options.allowedDaysOfWeek.length > 0
      ? new Set(options.allowedDaysOfWeek)
      : null;
  const respectRestDays = options.respectRestDays ?? true;
  const respectBlockingEvents = options.respectBlockingEvents ?? true;
  const maxDailyMinutes = options.maxDailyMinutes || 90;
  const maxDailyTasks = options.maxDailyTasks || 2;
  const startFromToday = options.startFromToday ?? true;
  const restDates = new Set(options.restDates || []);
  const customDayLimits = options.customDayLimits || {};
  const events = options.events || [];
  const protection = options.protection || [];

  if (respectRestDays) {
    for (const p of protection) {
      if (p.kind === "rest") {
        restDates.add(p.date);
      }
    }
  }

  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const daysInMonthCount = new Date(year, month, 0).getDate();

  const allMonthDays: string[] = [];
  for (let d = 1; d <= daysInMonthCount; d++) {
    const dayDate = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    allMonthDays.push(dayDate);
  }

  const isCurrentMonth = today.startsWith(monthKey);
  let candidateDays = allMonthDays.filter((d) => {
    if (isCurrentMonth && startFromToday && d < today) {
      return false;
    }
    const dayOfWeek = new Date(`${d}T12:00:00`).getDay();
    if (allowedDays) {
      if (!allowedDays.has(dayOfWeek)) {
        return false;
      }
    } else if (skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      return false;
    }
    if (respectRestDays && restDates.has(d)) {
      return false;
    }
    if (customDayLimits[d] === 0) {
      return false;
    }
    return true;
  });

  if (candidateDays.length === 0) {
    return {
      tasks,
      distributedCount: 0,
      daysUsedCount: 0,
      summary: "Seçilen gün ve kısıtlara uygun boş gün bulunamadı. Lütfen hedef gün seçiminizi veya kısıtları esnetin.",
    };
  }

  const dayMinutes: Record<string, number> = {};
  const dayTaskCounts: Record<string, number> = {};

  for (const d of candidateDays) {
    dayMinutes[d] = 0;
    dayTaskCounts[d] = 0;
  }

  if (respectBlockingEvents) {
    for (const ev of events) {
      if (candidateDays.includes(ev.date) && ["class", "shift", "personal", "block", "exam"].includes(ev.kind)) {
        dayMinutes[ev.date] = (dayMinutes[ev.date] || 0) + Math.min(ev.minutes, 240);
      }
    }
  }

  const tasksToDistribute: NorthTask[] = [];

  for (const t of tasks) {
    if (t.status === "done" || t.status === "cancelled") {
      if (candidateDays.includes(t.date)) {
        dayMinutes[t.date] = (dayMinutes[t.date] || 0) + t.minutes;
        dayTaskCounts[t.date] = (dayTaskCounts[t.date] || 0) + 1;
      }
      continue;
    }

    if (strategy === "area_specific" && options.areaId && t.areaId !== options.areaId) {
      if (candidateDays.includes(t.date)) {
        dayMinutes[t.date] = (dayMinutes[t.date] || 0) + t.minutes;
        dayTaskCounts[t.date] = (dayTaskCounts[t.date] || 0) + 1;
      }
      continue;
    }

    if (strategy === "all_pool") {
      if (!t.date || t.date === "") {
        tasksToDistribute.push(t);
      } else {
        if (candidateDays.includes(t.date)) {
          dayMinutes[t.date] = (dayMinutes[t.date] || 0) + t.minutes;
          dayTaskCounts[t.date] = (dayTaskCounts[t.date] || 0) + 1;
        }
      }
      continue;
    }

    if (strategy === "rebalance_month") {
      if (!t.date || t.date === "" || (t.date.startsWith(monthKey) && (!startFromToday || !isCurrentMonth || t.date >= today))) {
        tasksToDistribute.push(t);
      } else {
        if (candidateDays.includes(t.date)) {
          dayMinutes[t.date] = (dayMinutes[t.date] || 0) + t.minutes;
          dayTaskCounts[t.date] = (dayTaskCounts[t.date] || 0) + 1;
        }
      }
      continue;
    }

    tasksToDistribute.push(t);
  }

  if (tasksToDistribute.length === 0) {
    return {
      tasks,
      distributedCount: 0,
      daysUsedCount: 0,
      summary: "Dağıtılacak bekleyen görev bulunamadı.",
    };
  }

  const tasksByArea: Record<string, NorthTask[]> = {};
  for (const task of tasksToDistribute) {
    if (!tasksByArea[task.areaId]) tasksByArea[task.areaId] = [];
    tasksByArea[task.areaId].push(task);
  }

  const interleaved: NorthTask[] = [];
  const areaKeys = Object.keys(tasksByArea);
  let hasMore = true;
  let round = 0;
  while (hasMore) {
    hasMore = false;
    for (const aId of areaKeys) {
      if (round < tasksByArea[aId].length) {
        interleaved.push(tasksByArea[aId][round]);
        hasMore = true;
      }
    }
    round++;
  }

  const assignedDates = new Map<string, string>();
  const daysUsed = new Set<string>();

  for (const task of interleaved) {
    const sortedDays = [...candidateDays].sort((a, b) => {
      const loadA = dayMinutes[a] || 0;
      const loadB = dayMinutes[b] || 0;
      if (loadA !== loadB) return loadA - loadB;
      return (dayTaskCounts[a] || 0) - (dayTaskCounts[b] || 0);
    });

    let chosenDay = sortedDays[0];
    for (const d of sortedDays) {
      const limit = customDayLimits[d] ?? maxDailyMinutes;
      const currentMins = dayMinutes[d] || 0;
      const currentCount = dayTaskCounts[d] || 0;

      if (currentCount < maxDailyTasks && currentMins + task.minutes <= limit) {
        chosenDay = d;
        break;
      }
    }

    assignedDates.set(task.id, chosenDay);
    daysUsed.add(chosenDay);
    dayMinutes[chosenDay] = (dayMinutes[chosenDay] || 0) + task.minutes;
    dayTaskCounts[chosenDay] = (dayTaskCounts[chosenDay] || 0) + 1;
  }

  const updatedTasks = tasks.map((t) => {
    if (assignedDates.has(t.id)) {
      const assignedDay = assignedDates.get(t.id)!;
      return {
        ...t,
        date: assignedDay,
        week: weekKey(assignedDay),
      };
    }
    return t;
  });

  return {
    tasks: updatedTasks,
    distributedCount: tasksToDistribute.length,
    daysUsedCount: daysUsed.size,
    summary: `${tasksToDistribute.length} görev ${monthKey} ayının ${daysUsed.size} gününe dengeli dağıtıldı.`,
  };
}

export function rolloverUnfinishedTasks(state: NorthState, today = dayKey()): RolloverResult {
  const currentWeek = weekKey(today);
  const weekEnd = shiftDay(currentWeek, 6);
  const events = state.events || [];
  const weeklyMinutes = capacity(state);
  const dailyTargetCapacity = Math.max(45, Math.round(weeklyMinutes / 5));

  const candidateDays: string[] = [];
  for (let d = today; d <= weekEnd; d = shiftDay(d, 1)) {
    candidateDays.push(d);
  }
  if (candidateDays.length === 0) {
    candidateDays.push(today);
  }

  const dayMinutes: Record<string, number> = {};
  for (const t of state.tasks) {
    if (t.date && t.date >= today && t.status !== "cancelled") {
      dayMinutes[t.date] = (dayMinutes[t.date] || 0) + t.minutes;
    }
  }
  for (const ev of events) {
    if (ev.date && ev.date >= today && ["class", "shift", "personal", "block", "exam"].includes(ev.kind)) {
      dayMinutes[ev.date] = (dayMinutes[ev.date] || 0) + Math.min(ev.minutes, 360);
    }
  }

  const details: RolloverDetail[] = [];

  const updatedTasks = state.tasks.map(task => {
    if (task.date && task.date < today && !["done", "cancelled"].includes(task.status)) {
      const fromDate = task.date;

      let targetDay = candidateDays[0];
      let foundDay = false;

      for (const d of candidateDays) {
        const load = dayMinutes[d] || 0;
        if (load + task.minutes <= dailyTargetCapacity) {
          targetDay = d;
          foundDay = true;
          break;
        }
      }

      if (!foundDay) {
        targetDay = candidateDays.reduce((minD, d) => {
          return (dayMinutes[d] || 0) < (dayMinutes[minD] || 0) ? d : minD;
        }, candidateDays[0]);
      }

      dayMinutes[targetDay] = (dayMinutes[targetDay] || 0) + task.minutes;

      details.push({
        taskId: task.id,
        taskTitle: task.title,
        fromDate,
        toDate: targetDay,
      });

      return {
        ...task,
        date: targetDay,
        week: weekKey(targetDay),
        rescheduledCount: (task.rescheduledCount ?? 0) + 1,
        why: `${task.why ? `${task.why} · ` : ""}Önceki gün (${fromDate}) tamamlanamadığı için North tarafından bu haftanın (${targetDay}) gününe aktarıldı (borçsuz esnek plan).`.trim(),
      };
    }
    return task;
  });

  return {
    state: {
      ...state,
      tasks: updatedTasks,
    },
    rolledOverCount: details.length,
    details,
  };
}

export function initializeNorth(workspace: WorkspaceState): NorthState {
  const interests = (workspace.profile.interests?.length ? workspace.profile.interests : [workspace.profile.primaryFocus]).map(item => item.trim()).filter(Boolean);
  const areas = interests.map((name, index) => {
    const domain = basicDomainProfile(name);
    const kind: AreaKind = domain?.kind ?? (/siber|güvenlik|pentest|soc|grc/i.test(name) ? "cyber" : /okuma|kitap|edebiyat/i.test(name) ? "reading" : "custom");
    const area = createArea(kind, `area-${index + 1}`);
    area.name = name;
    area.domainId = domain?.id;
    area.icon = domain?.icon ?? area.icon;
    area.metric = domain?.metric ?? area.metric;
    const configuredGoal = workspace.profile.areaGoals?.[name];
    area.goal = configuredGoal?.goal || (index === 0 ? workspace.profile.goal : "");
    area.description = configuredGoal?.targetWeeks ? `${configuredGoal.targetWeeks} haftalık hedef` : "";
    area.resources = domain?.resources.join("\n") ?? starterResourcesFor(kind);
    area.weeklyMinutes = index === 0 ? workspace.profile.weeklyCapacityHours * 60 : 0;
    area.priority = index === 0 ? 3 : 2;

    const lang = detectLangQuick(name);
    if (lang) {
      area.kind = "reading";
      area.domainId = lang.id;
      area.icon = lang.flag;
      area.metric = "Aktif kelime, dinleme ve konuşma";
      area.level = configuredGoal?.level ?? "beginner";
      area.resources = lang.resources.join("\n");
    } else if (configuredGoal?.level) {
      area.level = configuredGoal.level;
    }

    return area;
  });
  const primary = areas[0] ?? createArea("custom", "primary-goal");
  const baseTasks: NorthTask[] = workspace.tasks.map(t => {
    const taskArea = areas.find(area => area.name === t.category) ?? primary;
    const status: NorthTaskStatus = t.status === "completed" ? "done" : t.status === "partial" ? "partial" : t.status === "failed" ? "skipped" : "pending";
    const date = t.completedAt ? dayKey(new Date(t.completedAt)) : (t.isDailyMission ? dayKey() : "");
    return {
      id: t.id,
      areaId: taskArea.id,
      title: t.title,
      goal: t.outputRequirement || t.description,
      minutes: t.duration,
      intensity: t.difficulty === "hard" ? "high" : "normal",
      mandatory: t.isDailyMission,
      status,
      date,
      deadline: "",
      resource: workspace.resources.find(r => r.id === t.practicalResourceId)?.url ?? "",
      why: "Kişisel başlangıç planından aktarıldı.",
      week: date ? weekKey(date) : weekKey(),
      taskType: t.taskType,
      completedAt: t.completedAt,
    };
  });

  const distributedTasks = distributePlanTasksToCalendar(baseTasks, {
    weeklyHours: workspace.profile.weeklyCapacityHours,
    today: dayKey(),
  });

  return {
    version: 1,
    areas,
    weeklyHours: workspace.profile.weeklyCapacityHours,
    mode: "normal",
    customMode: "",
    energy: { date: "", level: "normal" },
    events: [],
    protection: [],
    tasks: distributedTasks,
    activities: workspace.focusSessions.map(s => ({
      id: s.id,
      taskId: s.taskId,
      areaId: primary.id,
      date: dayKey(new Date(s.completedAt)),
      minutes: s.durationMinutes,
      outcome: s.status === "completed" ? "done" : "partial",
      difficulty: "",
      reflection: s.notes,
      amount: 0,
      metric: primary.metric,
      endedAt: s.completedAt,
    })),
  };
}
function basicDomainProfile(name:string){const value=name.toLocaleLowerCase("tr-TR");if(/robotik|arduino|raspberry|embedded|gömülü|mikrodenetleyici|elektronik/.test(value))return {id:"robotics",kind:"projects" as const,icon:"⚙",metric:"Çalışan prototip",resources:["Arduino Documentation — https://docs.arduino.cc/","Raspberry Pi Documentation — https://www.raspberrypi.com/documentation/"]};if(/borsa|yatırım|finans|hisse|trading|kripto|portföy/.test(value))return {id:"finance",kind:"custom" as const,icon:"↗",metric:"Analiz edilen şirket",resources:["Borsa İstanbul Akademi — https://www.borsaistanbul.com/","SPK Yatırımcı Bilgilendirme — https://spk.gov.tr/"]};if(/inşaat|betonarme|şantiye|statik|zemin|metraj/.test(value))return {id:"civil-engineering",kind:"custom" as const,icon:"▰",metric:"Tamamlanan teknik çalışma",resources:["Türkiye Bina Deprem Yönetmeliği — https://www.afad.gov.tr/","MIT OpenCourseWare Civil Engineering — https://ocw.mit.edu/"]};if(/matematik|calculus|istatistik|lineer cebir|geometri/.test(value))return {id:"mathematics",kind:"math" as const,icon:"∑",metric:"Çözülen problem",resources:["Khan Academy — https://www.khanacademy.org/math","MIT OpenCourseWare — https://ocw.mit.edu/"]};if(/satranç|satranc|chess/.test(value))return {id:"chess",kind:"chess" as const,icon:"♞",metric:"Çözülen taktik",resources:["Lichess Studies — https://lichess.org/study","Chess.com Lessons — https://www.chess.com/lessons"]};if(/yazılım|uygulama|programlama|kodlama|web geliştirme|mobil geliştirme|frontend|backend/.test(value))return {id:"software",kind:"projects" as const,icon:"◇",metric:"Tamamlanan çıktı",resources:["MDN Web Docs — https://developer.mozilla.org/","The Odin Project — https://www.theodinproject.com/"]};return undefined;}
function detectLangQuick(name: string) {
  const norm = name.toLocaleLowerCase("tr").replace(/\u0307/g, "").trim();
  if (/ingilizce|english|ielts|toefl/i.test(norm)) return { id: "english", name: "İngilizce", flag: "🇬🇧", resources: ["BBC Learning English — https://www.bbc.co.uk/learningenglish", "Cambridge Dictionary — https://dictionary.cambridge.org/"] };
  if (/almanca|german|deutsch|goethe/i.test(norm)) return { id: "german", name: "Almanca", flag: "🇩🇪", resources: ["Deutsche Welle Deutsch Lernen — https://learngerman.dw.com/", "Duden Online Wörterbuch — https://www.duden.de/"] };
  if (/fransızca|french|français|delf/i.test(norm)) return { id: "french", name: "Fransızca", flag: "🇫🇷", resources: ["TV5Monde Apprendre le français — https://apprendre.tv5monde.com/", "Le Robert Dictionnaire — https://www.lerobert.com/"] };
  if (/japonca|japanese|nihongo|jlpt/i.test(norm)) return { id: "japanese", name: "Japonca", flag: "🇯🇵", resources: ["NHK World Easy Japanese — https://www.nhk.or.jp/lesson/english/", "Jisho Japanese Dictionary — https://jisho.org/"] };
  if (/arapça|arabic|arabca|fasih arapça/i.test(norm)) return { id: "arabic", name: "Arapça", flag: "🇸🇦", resources: ["Al-Jazeera Learning Arabic — https://learning.aljazeera.net/", "Almaany Arabic-Turkish Dictionary — https://www.almaany.com/"] };
  return undefined;
}
function starterResourcesFor(kind: AreaKind) {
  if (kind === "cyber") return "OWASP Web Security Testing Guide — https://owasp.org/www-project-web-security-testing-guide/\nPortSwigger Web Security Academy — https://portswigger.net/web-security";
  if (kind === "math") return "Khan Academy Matematik — https://www.khanacademy.org/math\nMIT OpenCourseWare — https://ocw.mit.edu/";
  if (kind === "projects") return "MDN Web Docs — https://developer.mozilla.org/\nThe Odin Project — https://www.theodinproject.com/";
  return "Bu alan için kendi güvenilir kaynaklarını ekle.";
}
export function capacity(state: NorthState) { return Math.round(state.weeklyHours*60*(state.mode === "exam" ? .7 : 1)); }
export function allocation(state: NorthState, area: Area) {
  if (!isAreaActive(area)) return 0;
  const active = state.areas.filter(isAreaActive);
  const total = active.reduce((s,a)=>s+a.weeklyMinutes,0);
  return Math.round(area.weeklyMinutes*(total > capacity(state) ? capacity(state)/total : 1));
}
export function dailySelection(state: NorthState, today=dayKey()) {
  const energy = state.energy.date === today ? state.energy.level : "normal";
  const week = weekKey(today);
  const candidates = state.tasks.filter(t => ["pending","partial"].includes(t.status) && state.areas.some(a=>a.id===t.areaId&&isAreaActive(a)&&a.goal.trim()) && (!t.date ? t.week === week : t.date === today));
  const score = (t: NorthTask) => {
    const a=state.areas.find(a=>a.id===t.areaId)!;
    const spent=state.activities.filter(s=>s.areaId===a.id&&s.date>=week&&s.date<=today).reduce((n,s)=>n+s.minutes,0);
    const hour=new Date().getHours();const currentRange=hour<6?"Gece":hour<9?"Erken sabah":hour<12?"Sabah":hour<18?"Öğleden sonra":hour<22?"Akşam":"Geç gece";
    const learned=state.intelligence?.patterns.filter(p=>(p.status==="reliable"||p.status==="strong")&&!state.intelligence?.dismissedPatternIds.includes(p.id)&&!state.intelligence?.incorrectPatternIds.includes(p.id))??[];
    const timeFit=learned.some(p=>(p.patternType==="best_time"||p.patternType==="area_preference")&&p.timeRange===currentRange&&(!p.areaId||p.areaId===t.areaId))?18:0;
    return (t.mandatory?100:0)+(t.deadline && t.deadline<=shiftDay(today,2)?80:0)+a.priority*10+(spent<allocation(state,a)?20:0)+(t.intensity===energy?15:0)-(energy==="low"&&t.intensity==="high"?35:0)+timeFit;
  };
  const ranked=[...candidates].sort((a,b)=>score(b)-score(a));
  const touched=new Set(state.activities.filter(a=>a.date===today).map(a=>a.taskId));
  const usedDeep=state.tasks.filter(t=>touched.has(t.id)&&t.minutes>20).length;
  const usedLight=state.tasks.filter(t=>touched.has(t.id)&&t.minutes<=20).length;
  const deep=ranked.filter(t=>t.minutes>20&&!touched.has(t.id)).slice(0,Math.max(0,2-usedDeep));
  const light=ranked.filter(t=>t.minutes<=20&&!touched.has(t.id)).slice(0,Math.max(0,2-usedLight));
  const spent=state.activities.filter(a=>a.date>=week&&a.date<=today).reduce((n,a)=>n+a.minutes,0);
  const blockedMinutes=state.events.filter(event=>event.date===today&&["block","class","shift","personal","exam"].includes(event.kind)).reduce((total,event)=>total+event.minutes,0);
  const dailyCapacity=blockedMinutes ? Math.max(0,Math.round(capacity(state)/7)-blockedMinutes) : capacity(state);
  let remaining=Math.min(Math.max(0,capacity(state)-spent),dailyCapacity);
  return [...deep,...light].slice(0,4).filter(t=>{
    if(state.protection.some(p=>p.areaId===t.areaId&&p.date===today)||t.minutes>remaining)return false;
    remaining-=t.minutes;return true;
  });
}
export function suggestDailyAdaptation(state: NorthState, activity: NorthActivity): NorthDailyAdaptation | undefined {
  if (activity.outcome === "done" && activity.difficulty !== "Zor") return undefined;
  const next = dailySelection({ ...state, activities: [...state.activities, activity], tasks: state.tasks.map(task => task.id === activity.taskId ? { ...task, status: activity.outcome } : task) }, activity.date)[0];
  if (!next) return { date: activity.date, message: "Bugünün kalanında yeni zorunlu görev eklemedim. İstersen planını burada bırakabilirsin." };
  const shouldReduce = activity.outcome !== "done" || activity.difficulty === "Zor";
  if (!shouldReduce || next.minutes <= 25) return { date: activity.date, taskId: next.id, message: "Geri bildirimin kaydedildi. Sıradaki görev aynı kaldı; başlamadan önce süresini değiştirebilirsin." };
  const recommendedMinutes = Math.max(25, Math.min(next.minutes - 10, 35));
  return {
    date: activity.date,
    taskId: next.id,
    originalMinutes: next.minutes,
    recommendedMinutes,
    message: `Bu oturum zorlayıcı geçti. Sıradaki yoğun görevi ${next.minutes} dakikadan ${recommendedMinutes} dakikaya indirmeyi öneriyorum.`,
  };
}
export function areaStreak(state: NorthState, area: Area, today=dayKey()) {
  let cursor=today, streak=0;
  const qualifies=(d:string)=>state.activities.filter(s=>s.areaId===area.id&&s.date===d&&s.outcome!=="skipped").reduce((n,s)=>n+s.minutes,0)>=area.minimumMinutes;
  if(!qualifies(cursor)&&!state.protection.some(p=>p.areaId===area.id&&p.date===cursor))cursor=shiftDay(cursor,-1);
  for(let i=0;i<366;i++,cursor=shiftDay(cursor,-1)) {
    if(qualifies(cursor))streak++;
    else if(!state.protection.some(p=>p.areaId===area.id&&p.date===cursor))break;
  }
  return streak;
}
export function weeklyConsistency(state: NorthState, area: Area, today=dayKey()) {
  const start=weekKey(today); let eligible=0, active=0;
  for(let d=start;d<=today;d=shiftDay(d,1)) {
    if(state.protection.some(p=>p.areaId===area.id&&p.date===d))continue;
    eligible++; if(state.activities.filter(s=>s.areaId===area.id&&s.date===d&&s.outcome!=="skipped").reduce((n,s)=>n+s.minutes,0)>=area.minimumMinutes)active++;
  }
  return eligible ? Math.round(active/eligible*100) : 0;
}
export function missedAdvice(task: NorthTask) {
  if(!task.mandatory&&!task.deadline)return {action:"cancel" as const,label:"Bu hafta bırak",why:"İsteğe bağlı bir görev; yeni bir borca dönüşmek zorunda değil."};
  if(task.minutes>50)return {action:"reduce" as const,label:"Küçült ve havuza al",why:"Daha küçük bir oturumla yeniden başlamak kolaylaşabilir."};
  return {action:"pool" as const,label:"Haftalık havuza al",why:"Önemli görev korunur; uygun günü sen seçersin."};
}

export function shrinkTask(task: NorthTask, newMinutes = Math.max(10, Math.round(task.minutes / 2))): NorthTask {
  return {
    ...task,
    minutes: newMinutes,
    why: `${task.why ? `${task.why} · ` : ""}Süre ${task.minutes} dk'dan ${newMinutes} dk'ya indirildi.`.trim(),
  };
}

export function poolTask(task: NorthTask): NorthTask {
  return {
    ...task,
    date: "",
    mandatory: false,
    why: `${task.why ? `${task.why} · ` : ""}Haftalık esnek havuza alındı.`.trim(),
  };
}

export function postponeTask(task: NorthTask, targetDate: string): NorthTask {
  return {
    ...task,
    date: targetDate,
    week: weekKey(targetDate),
    rescheduledCount: (task.rescheduledCount ?? 0) + 1,
    why: `${task.why ? `${task.why} · ` : ""}${targetDate} tarihine ertelendi.`.trim(),
  };
}

export function dropTask(task: NorthTask): NorthTask {
  return {
    ...task,
    status: "cancelled",
    why: "Borca dönüştürülmeden bırakıldı.",
  };
}

export function generatePeriodPlan(targetWeeks: number, primaryGoal: string): import("./types").Milestone[] {
  const weeks = targetWeeks >= 4 && targetWeeks <= 52 ? targetWeeks : ([4, 8, 12, 16, 24].includes(targetWeeks) ? targetWeeks : 12);
  const totalDays = weeks * 7;
  const d1 = Math.max(7, Math.round(totalDays * 0.15));
  const d2 = Math.max(d1 + 7, Math.round(totalDays * 0.35));
  const d3 = Math.max(d2 + 7, Math.round(totalDays * 0.65));
  const d4 = Math.max(d3 + 7, Math.round(totalDays * 0.85));
  const d5 = totalDays;

  const g = primaryGoal.toLocaleLowerCase("tr").replace(/\u0307/g, "").trim();
  const isChess = /satranç|chess|elo/i.test(g);
  const isExam = /yks|tyt|ayt|kpss|ales|dgs|banka|müfettiş/i.test(g);
  const isLanguage = Boolean(detectLangQuick(g)) || /ingilizce|almanca|fransızca|japonca|arapça|english|german|french|japanese|arabic|yabancı dil|dil öğren|toefl|ielts|jlpt/i.test(g);

  if (isLanguage) {
    return [
      {
        id: "phase-starter",
        title: "1. Aşama: Fonetik, Temel Kelime & Gramer Haritası",
        horizonDays: d1,
        targetWeek: Math.max(1, Math.round(d1 / 7)),
        phase: "starter",
        description: `${primaryGoal} için temel telaffuz/alfabe kurallarını, ilk 300-500 aktif kelimeyi ve temel zaman yapılarını çalış.`,
        successCriteria: ["İlk aktif kelime flashcard seti oluşturuldu", "Temel dinleme kaynağı ve telaffuz rutini belirlendi", "En az 5 odaklı dil oturumu tamamlandı"],
        status: "active",
      },
      {
        id: "phase-mid-check",
        title: "2. Aşama: Aktif Cümle Kurma ve Dinleme Pratiği",
        horizonDays: d2,
        targetWeek: Math.max(2, Math.round(d2 / 7)),
        phase: "mid_check",
        description: "Kısa diyaloglar, bağlaçlar ve dinleme-tekrar (shadowing) egzersizleri ile anlama hızını artır.",
        successCriteria: ["İlk sesli telaffuz/diyalog kaydı alındı", "Shadowing dinleme serisi tamamlandı", "Yeni kelimeler bağlam içinde kullanıldı"],
        status: "upcoming",
      },
      {
        id: "phase-application",
        title: "3. Aşama: Yoğun Üretim ve Akıcılık Odaklanması",
        horizonDays: d3,
        targetWeek: Math.max(3, Math.round(d3 / 7)),
        phase: "application",
        description: "Kısa deneme metinleri yazma, konuşma pratiği, podcast dinleme ve karmaşık cümle yapıları kurma.",
        successCriteria: ["Haftalık serbest yazım veya konuşma kaydı yapıldı", "Hedef dilde podcast/haber özeti çıkarıldı", "Deyimler ve kalıp ifadeler uygulandı"],
        status: "upcoming",
      },
      {
        id: "phase-review",
        title: "4. Aşama: Aralıklı Tekrar ve İleri Seviye Düzeltme",
        horizonDays: d4,
        targetWeek: Math.max(4, Math.round(d4 / 7)),
        phase: "review",
        description: "Zorlanılan gramer yapılarını ve unutulan kelimeleri aralıklı tekrarla pekiştir; hata günlüğünü incele.",
        successCriteria: ["Zorlanılan kalıplar ve yanlış telaffuzlar tekrar edildi", "Aralıklı tekrar seti %90+ başarıyla tamamlandı", "Hızlı anlama testleri yapıldı"],
        status: "upcoming",
      },
      {
        id: "phase-final-proof",
        title: "5. Aşama: Seviye Kanıtı ve Akıcı Portföy",
        horizonDays: d5,
        targetWeek: weeks,
        phase: "final_proof",
        description: `${primaryGoal} hedefini sesli konuşma kaydı, seviye tespit sınavı sonucu veya yazılı makale ile somutlaştır.`,
        successCriteria: ["Doğrulanabilir seviye test sonucu veya sesli sunum kaydedildi", "Dönem kazanımları değerlendirildi", "Bir sonraki seviye rotası belirlendi"],
        status: "upcoming",
      },
    ];
  }

  if (isChess) {
    return [
      {
        id: "phase-starter",
        title: "1. Aşama: Başlangıç ve Taktik Harita",
        horizonDays: d1,
        targetWeek: Math.max(1, Math.round(d1 / 7)),
        phase: "starter",
        description: `${primaryGoal} için taktik motifleri, temel açılış ilkelerini ve analiz araçlarını (Lichess/Stockfish) belirle.`,
        successCriteria: ["Taktik çalışma rutini kuruldu", "İlk analiz ve antrenman platformları belirlendi", "En az 3 odaklı taktik oturumu tamamlandı"],
        status: "active",
      },
      {
        id: "phase-mid-check",
        title: "2. Aşama: Ara Kontrol ve Parti Analizleri",
        horizonDays: d2,
        targetWeek: Math.max(2, Math.round(d2 / 7)),
        phase: "mid_check",
        description: "İlk taktik setlerini ve maçları oyna; kaçırılan taktikleri (blunder) ve açılış hatalarını sınıflandır.",
        successCriteria: ["İlk parti analizleri ve PGN kayıtları tamamlandı", "Sık yapılan hata motifleri belirlendi", "Hesaplama süresi optimize edildi"],
        status: "upcoming",
      },
      {
        id: "phase-application",
        title: "3. Aşama: Yoğun Taktik ve Oyun Sonu Tekniği",
        horizonDays: d3,
        targetWeek: Math.max(3, Math.round(d3 / 7)),
        phase: "application",
        description: "Zorlayıcı taktik bulmacalar, konumsal planlama ve temel oyun sonu prensiplerine odaklan.",
        successCriteria: ["En az 100 taktik bulmaca veya derin parti analizi tamamlandı", "Haftalık taktik tutarlılığı korundu", "Oyun sonu kural ve motifleri kaydedildi"],
        status: "upcoming",
      },
      {
        id: "phase-review",
        title: "4. Aşama: Taktik Tekrar ve Süreli Çözüm",
        horizonDays: d4,
        targetWeek: Math.max(4, Math.round(d4 / 7)),
        phase: "review",
        description: "Zayıf taktik motifleri aralıklı tekrarla pekiştir, süreli bulmaca ve pratik parti simülasyonları yap.",
        successCriteria: ["Zayıf taktik motifler tekrar edildi", "Taktik ve parti analiz sonuçları kaydedildi", "Blunder analizi tamamlandı"],
        status: "upcoming",
      },
      {
        id: "phase-final-proof",
        title: "5. Aşama: Hedef Elo ve Final Portföyü",
        horizonDays: d5,
        targetWeek: weeks,
        phase: "final_proof",
        description: `${primaryGoal} hedefini doğrulanabilir bir Lichess/Chess.com rating gelişimi veya analiz portföyü ile tamamla.`,
        successCriteria: ["Final rating ve analiz kanıtı kaydedildi", "Dönem değerlendirmesi tamamlandı", "Sonraki gelişim rotası belirlendi"],
        status: "upcoming",
      },
    ];
  }

  if (isExam) {
    return [
      {
        id: "phase-starter",
        title: "1. Aşama: Başlangıç ve Konu Haritası",
        horizonDays: d1,
        targetWeek: Math.max(1, Math.round(d1 / 7)),
        phase: "starter",
        description: `${primaryGoal} için sınav müfredatını, eksik konuları ve ilk güvenilir soru kaynaklarını belirle.`,
        successCriteria: ["Konu ve kazanım haritası çıkarıldı", "İlk teşhis denemesi tamamlandı", "Haftalık soru hedefi belirlendi"],
        status: "active",
      },
      {
        id: "phase-mid-check",
        title: "2. Aşama: Ara Kontrol ve Branş Denemeleri",
        horizonDays: d2,
        targetWeek: Math.max(2, Math.round(d2 / 7)),
        phase: "mid_check",
        description: "İlk branş denemelerini süre baskısıyla çöz, net dağılımını ve kronik yanlışları analiz et.",
        successCriteria: ["Branş deneme karneleri kaydedildi", "Yanlış defteri oluşturuldu", "Süre yönetimi optimize edildi"],
        status: "upcoming",
      },
      {
        id: "phase-application",
        title: "3. Aşama: Yoğun Soru Çözümü ve Derin Odak",
        horizonDays: d3,
        targetWeek: Math.max(3, Math.round(d3 / 7)),
        phase: "application",
        description: "Eksik alt konularda derinleşerek soru bankalarını tara ve hız kazan.",
        successCriteria: ["Hedef soru hacmine ulaşıldı", "Aralıksız haftalık çalışma tutarlılığı korundu", "Kritik soru tipleri kavrandı"],
        status: "upcoming",
      },
      {
        id: "phase-review",
        title: "4. Aşama: Deneme Sınavları ve Yanlış Analizi",
        horizonDays: d4,
        targetWeek: Math.max(4, Math.round(d4 / 7)),
        phase: "review",
        description: "Eksik kalan alt konuları aralıklı tekrarla güçlendir, tam süre genel deneme sınavı simülasyonları yap.",
        successCriteria: ["Zayıf alt konular tekrar edildi", "Deneme sınavı netleri kaydedildi", "Yanlış soru analizi tamamlandı"],
        status: "upcoming",
      },
      {
        id: "phase-final-proof",
        title: "5. Aşama: Final Net Hedefi ve Sınav Provası",
        horizonDays: d5,
        targetWeek: weeks,
        phase: "final_proof",
        description: `${primaryGoal} hedefini hedeflenen net seviyesi ve doğrulanabilir deneme karneleri ile tamamla.`,
        successCriteria: ["Hedef net skoru aşıldı", "Dönem değerlendirmesi tamamlandı", "Son sınav stratejisi netleştirildi"],
        status: "upcoming",
      },
    ];
  }

  return [
    {
      id: "phase-starter",
      title: "1. Aşama: Başlangıç ve Temel Harita",
      horizonDays: d1,
      targetWeek: Math.max(1, Math.round(d1 / 7)),
      phase: "starter",
      description: `${primaryGoal} için kavramsal çerçeveyi, araç kurulumunu ve ilk güvenilir kaynakları belirle.`,
      successCriteria: ["Temel ön koşul haritası hazırlandı", "İlk güvenilir kaynaklar belirlendi", "En az 3 odak oturumu tamamlandı"],
      status: "active",
    },
    {
      id: "phase-mid-check",
      title: "2. Aşama: Ara Kontrol ve İlk Çıktı",
      horizonDays: d2,
      targetWeek: Math.max(2, Math.round(d2 / 7)),
      phase: "mid_check",
      description: "İlk pratikleri test et, karşılaşılan darboğazları belirle ve çalışma ritmini doğrula.",
      successCriteria: ["İlk küçük uygulama/kanıt tamamlandı", "Zorlanılan alt konular sınıflandırıldı", "Kapasite ve çalışma saatleri optimize edildi"],
      status: "upcoming",
    },
    {
      id: "phase-application",
      title: "3. Aşama: Yoğun Uygulama ve Derin Odak",
      horizonDays: d3,
      targetWeek: Math.max(3, Math.round(d3 / 7)),
      phase: "application",
      description: "Yönlendirme ihtiyacını azaltarak bağımsız problem çözme ve proje üretimine odaklan.",
      successCriteria: ["En az 2 bağımsız teknik çalışma veya pratik çıktı", "Aralıksız haftalık tutarlılık sağlandı", "Kaynak kullanım notları kaydedildi"],
      status: "upcoming",
    },
    {
      id: "phase-review",
      title: "4. Aşama: Tekrar ve Pekiştirme",
      horizonDays: d4,
      targetWeek: Math.max(4, Math.round(d4 / 7)),
      phase: "review",
      description: "Eksik kalan alt konuları aralıklı tekrarla güçlendir, kapsamlı uygulama ve pekiştirme çalışmaları yap.",
      successCriteria: ["Zayıf alt konular tekrar edildi", "Uygulama ve pekiştirme sonuçları kaydedildi", "Hataların analizi tamamlandı"],
      status: "upcoming",
    },
    {
      id: "phase-final-proof",
      title: "5. Aşama: Final Kanıt ve Portföy",
      horizonDays: d5,
      targetWeek: weeks,
      phase: "final_proof",
      description: `${primaryGoal} hedefini somut, doğrulanabilir bir portföy çıktısı veya sertifikalı başarı ile tamamla.`,
      successCriteria: ["Final kanıtı kaydedildi", "Dönem değerlendirmesi tamamlandı", "Sonraki gelişim rotası belirlendi"],
      status: "upcoming",
    },
  ];
}
