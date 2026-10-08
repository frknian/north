export type RoadmapStatus = "yapılmadı" | "devam ediyor" | "tamamlandı" | "engellendi";
export type RoadmapRecord = {
  status: RoadmapStatus;
  date?: string;
  spentMinutes?: number;
  note?: string;
  proofUrl?: string;
};
export type RoadmapTask = {
  id: string;
  week: number;
  title: string;
  area: string;
  minutes: number;
  day: string;
  kind: string;
  resource: { label: string; url: string };
  detail: string;
};
export type RoadmapWeek = {
  week: number;
  phase: string;
  title: string;
  goal: string;
  hours: number;
  gate: string;
  tasks: RoadmapTask[];
};
export type RoadmapPhase = { title: string; start: number; end: number };
export type RoadmapMilestone = { month: number; week: number; title: string; criterion: string };
export type RoadmapPlan = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  scheduleNote: string;
  weeks: RoadmapWeek[];
  phases: RoadmapPhase[];
  milestones: RoadmapMilestone[];
};
export type LearningRoadmapState = {
  plan: RoadmapPlan | null;
  records: Record<string, RoadmapRecord>;
  scheduledWeeks: Record<string, number>;
};

export function createLearningRoadmapState(): LearningRoadmapState {
  return { plan: null, records: {}, scheduledWeeks: {} };
}

export function normalizeLearningRoadmapState(value: unknown): LearningRoadmapState {
  if (!value || typeof value !== "object") return createLearningRoadmapState();
  const saved = value as Partial<LearningRoadmapState>;
  return {
    plan: isRoadmapPlan(saved.plan) ? saved.plan : null,
    records: saved.records && typeof saved.records === "object" && !Array.isArray(saved.records) ? saved.records : {},
    scheduledWeeks: saved.scheduledWeeks && typeof saved.scheduledWeeks === "object" && !Array.isArray(saved.scheduledWeeks) ? saved.scheduledWeeks : {},
  };
}

export function createRoadmapPlan(input: { title: string; startDate: string; weekCount: number; description?: string }): RoadmapPlan {
  const count = Math.max(1, Math.min(156, Math.round(input.weekCount)));
  return {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    startDate: input.startDate,
    scheduleNote: "",
    weeks: Array.from({ length: count }, (_, index) => ({
      week: index + 1,
      phase: "Kişisel plan",
      title: `${index + 1}. hafta`,
      goal: "",
      hours: 0,
      gate: "",
      tasks: [],
    })),
    phases: [{ title: "Kişisel plan", start: 1, end: count }],
    milestones: [],
  };
}

export function isRoadmapPlan(value: unknown): value is RoadmapPlan {
  if (!value || typeof value !== "object") return false;
  const plan = value as Partial<RoadmapPlan>;
  if (typeof plan.id !== "string" || !plan.id || typeof plan.title !== "string" || !plan.title.trim() || typeof plan.description !== "string" || typeof plan.scheduleNote !== "string" || typeof plan.startDate !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(plan.startDate) || Number.isNaN(Date.parse(`${plan.startDate}T00:00:00Z`))) return false;
  if (!Array.isArray(plan.weeks) || plan.weeks.length < 1 || plan.weeks.length > 156) return false;
  if (!Array.isArray(plan.phases) || !Array.isArray(plan.milestones)) return false;
  const ids = new Set<string>();
  for (const [index, week] of plan.weeks.entries()) {
    if (!week || week.week !== index + 1 || typeof week.phase !== "string" || typeof week.title !== "string" || typeof week.goal !== "string" || typeof week.gate !== "string" || typeof week.hours !== "number" || !Number.isFinite(week.hours) || !Array.isArray(week.tasks) || week.tasks.length > 100) return false;
    for (const task of week.tasks) {
      if (!task || typeof task.id !== "string" || !task.id || ids.has(task.id) || task.week !== week.week || typeof task.title !== "string" || typeof task.area !== "string" || typeof task.day !== "string" || typeof task.kind !== "string" || typeof task.detail !== "string" || typeof task.minutes !== "number" || !Number.isFinite(task.minutes) || task.minutes < 0 || !task.resource || typeof task.resource.label !== "string" || typeof task.resource.url !== "string" || (task.resource.url !== "" && !/^https?:\/\//i.test(task.resource.url))) return false;
      ids.add(task.id);
    }
  }
  if (plan.phases.some((phase) => !phase || typeof phase.title !== "string" || !Number.isInteger(phase.start) || !Number.isInteger(phase.end) || phase.start < 1 || phase.end > plan.weeks!.length || phase.start > phase.end)) return false;
  return plan.milestones.length <= 156 && plan.milestones.every((milestone) => milestone && Number.isInteger(milestone.month) && Number.isInteger(milestone.week) && milestone.week >= 1 && milestone.week <= plan.weeks!.length && typeof milestone.title === "string" && typeof milestone.criterion === "string");
}

export function isRoadmapBackup(value: unknown): value is { schema: 2; state: LearningRoadmapState } {
  if (!value || typeof value !== "object") return false;
  const backup = value as { schema?: unknown; state?: Partial<LearningRoadmapState> };
  if (backup.schema !== 2 || !backup.state || !isRoadmapPlan(backup.state.plan)) return false;
  if (!backup.state.records || typeof backup.state.records !== "object" || Array.isArray(backup.state.records)) return false;
  if (!backup.state.scheduledWeeks || typeof backup.state.scheduledWeeks !== "object" || Array.isArray(backup.state.scheduledWeeks)) return false;
  const ids = new Set(backup.state.plan.weeks.flatMap((week) => week.tasks.map((task) => task.id)));
  if (Object.entries(backup.state.records).some(([id, record]) => !ids.has(id) || !record || !["yapılmadı", "devam ediyor", "tamamlandı", "engellendi"].includes(record.status) || (record.spentMinutes !== undefined && (typeof record.spentMinutes !== "number" || !Number.isFinite(record.spentMinutes) || record.spentMinutes < 0)))) return false;
  return Object.entries(backup.state.scheduledWeeks).every(([id, week]) => ids.has(id) && Number.isInteger(week) && week >= 1 && week <= backup.state!.plan!.weeks.length);
}

export function getScheduledWeek(state: LearningRoadmapState, task: RoadmapTask): number {
  return state.scheduledWeeks[task.id] ?? task.week;
}

export function roadmapStatus(state: LearningRoadmapState, id: string): RoadmapStatus {
  return state.records[id]?.status ?? "yapılmadı";
}
