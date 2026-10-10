import { getScheduledWeek, resolveRoadmapAreaId, roadmapStatus, type LearningRoadmapState } from "./learning-roadmap";
import { capacity, isAreaActive, type NorthState, type NorthTask } from "./north";

export type RoadmapActivation = { north: NorthState; created: number; scheduled: number; pooled: number; alreadyActive: number; unmapped: string[] };
export const istanbulToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

function addDays(day: string, count: number) {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

function monday(day: string) {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
  return addDays(day, -((weekday + 6) % 7));
}

const weekdays = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

export function activateRoadmapWeek(roadmap: LearningRoadmapState, north: NorthState, week: number, today = istanbulToday(), onlyAreaId?: string): RoadmapActivation {
  const plan = roadmap.plan;
  if (!plan || week < 1 || week > plan.weeks.length) return { north, created: 0, scheduled: 0, pooled: 0, alreadyActive: 0, unmapped: [] };
  const plannedMonday = addDays(plan.startDate, (week - 1) * 7);
  const targetMonday = plannedMonday < monday(today) ? monday(today) : plannedMonday;
  const firstDay = targetMonday <= today ? today : targetMonday;
  const lastDay = addDays(targetMonday, 6);
  const dates = Array.from({ length: 7 }, (_, index) => addDays(targetMonday, index)).filter((day) => day >= firstDay && day <= lastDay);
  const budget = capacity(north);
  const dailyBase = budget > 0 ? Math.min(180, Math.max(45, Math.round(budget / 5))) : 0;
  const nextTasks = [...north.tasks];
  const unmatched = new Set<string>();
  let created = 0, scheduled = 0, pooled = 0, alreadyActive = 0;
  let remainingWeek = Math.max(0, budget - nextTasks.filter((item) => item.week === targetMonday && ["pending", "partial"].includes(item.status)).reduce((sum, item) => sum + item.minutes, 0));
  const tasks = plan.weeks.flatMap((item) => item.tasks).filter((task) => getScheduledWeek(roadmap, task) === week && roadmapStatus(roadmap, task.id) !== "tamamlandı" && roadmapStatus(roadmap, task.id) !== "engellendi");

  for (const task of tasks) {
    const areaId = resolveRoadmapAreaId(task.area, north.areas, roadmap.areaLinks);
    if (onlyAreaId && areaId !== onlyAreaId) continue;
    const area = north.areas.find((item) => item.id === areaId);
    if (!area || !isAreaActive(area)) { unmatched.add(task.area); continue; }
    if (nextTasks.some((item) => item.roadmapPlanId === plan.id && item.roadmapTaskId === task.id)) { alreadyActive++; continue; }
    const preferred = weekdays.indexOf(task.day);
    const ranked = [...dates].sort((left, right) => {
      const leftIndex = new Date(`${left}T00:00:00Z`).getUTCDay();
      const rightIndex = new Date(`${right}T00:00:00Z`).getUTCDay();
      const leftDistance = preferred < 0 ? 0 : Math.abs(((leftIndex + 6) % 7) - preferred);
      const rightDistance = preferred < 0 ? 0 : Math.abs(((rightIndex + 6) % 7) - preferred);
      const leftLoad = nextTasks.filter((item) => item.date === left && ["pending", "partial"].includes(item.status)).reduce((sum, item) => sum + item.minutes, 0);
      const rightLoad = nextTasks.filter((item) => item.date === right && ["pending", "partial"].includes(item.status)).reduce((sum, item) => sum + item.minutes, 0);
      return leftDistance - rightDistance || leftLoad - rightLoad || left.localeCompare(right);
    });
    const day = remainingWeek >= task.minutes ? ranked.find((candidate) => {
      if (north.protection.some((item) => item.areaId === area.id && item.date === candidate)) return false;
      const blocked = north.events.filter((item) => item.date === candidate && ["block", "class", "shift", "personal", "exam"].includes(item.kind)).reduce((sum, item) => sum + item.minutes, 0);
      const available = Math.max(0, dailyBase - Math.max(0, blocked - 180) / 2);
      const assigned = nextTasks.filter((item) => item.date === candidate && ["pending", "partial"].includes(item.status)).reduce((sum, item) => sum + item.minutes, 0);
      return assigned + task.minutes <= available;
    }) : undefined;
    const linked: NorthTask = {
      id: crypto.randomUUID(), areaId: area.id, title: task.title, goal: task.detail || plan.weeks[task.week - 1]?.goal || "Yol haritası çalışması",
      minutes: task.minutes, intensity: "normal", mandatory: false, status: "pending", date: day ?? "", deadline: "",
      resource: task.resource.url, why: `Yol haritası · Hafta ${week} · ${task.area}`, week: targetMonday,
      roadmapPlanId: plan.id, roadmapTaskId: task.id,
    };
    nextTasks.push(linked);
    created++;
    if (day) { scheduled++; remainingWeek -= task.minutes; } else pooled++;
  }
  return { north: created ? { ...north, tasks: nextTasks } : north, created, scheduled, pooled, alreadyActive, unmapped: [...unmatched] };
}
