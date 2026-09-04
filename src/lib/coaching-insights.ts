import type { WorkspaceState } from "@/lib/types";

export function getCoachingInsights(state: WorkspaceState) {
  const completedTasks = state.tasks.filter((task) => task.status === "completed").length;
  const totalTasks = state.tasks.length;
  const completionRate = totalTasks ? Math.round(completedTasks / totalTasks * 100) : 0;
  const completedLabs = state.labs.filter((lab) => lab.status === "completed");
  const independentLabs = completedLabs.filter((lab) => lab.aiAssistanceLevel <= 1 && !lab.walkthroughUsed).length;
  const independentRate = completedLabs.length ? Math.round(independentLabs / completedLabs.length * 100) : 0;
  const activeDays = new Set([...state.focusSessions.map((session) => session.completedAt.slice(0, 10)), ...state.coaching.checkins.map((checkin) => checkin.date)]).size;
  const stuck = state.coaching.checkins.filter((checkin) => checkin.outcome === "stuck");
  const commonBlocker = stuck.map((checkin) => checkin.blocker?.trim()).find(Boolean);
  const averageAiLevel = state.labs.length ? Number((state.labs.reduce((sum, lab) => sum + lab.aiAssistanceLevel, 0) / state.labs.length).toFixed(1)) : 0;
  const nextFocus = commonBlocker ? `Önce bu engeli küçült: ${commonBlocker}` : completedTasks === 0 ? "İlk somut çıktını üretmek için tek bir 45 dakikalık görevi tamamla." : independentRate < 50 ? "Bir sonraki kolay labı daha düşük AI yardımıyla tekrar dene." : "Mevcut alanında tekrarı koruyup bir sonraki zorluk seviyesine hazırlan.";
  return { completedTasks, totalTasks, completionRate, independentLabs, independentRate, activeDays, averageAiLevel, stuckCount: stuck.length, commonBlocker: commonBlocker ?? "Henüz kayıt yok", nextFocus };
}
