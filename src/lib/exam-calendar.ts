import type { TrialExam } from "./types";

export type ExamPhaseId = "foundation" | "practice" | "trial" | "final";
export interface ExamPhase { id: ExamPhaseId; name: string; description: string; startWeek: number; endWeek: number }
export interface ExamWeekSubject { subjectId: string; name: string; minutes: number }
export interface ExamWeekPlan {
  index: number;
  weekStart: string;
  phaseId: ExamPhaseId;
  phaseName: string;
  studyMinutes: number;
  subjects: ExamWeekSubject[];
  trial?: { date: string; title: string; minutes: number };
  containsExam: boolean;
}
export interface ExamCalendar { daysLeft: number; weeksLeft: number; phases: ExamPhase[]; weeks: ExamWeekPlan[]; weakSubjects: string[]; expired: boolean }
export interface ExamCalendarInput {
  examDate: string;
  today: string;
  weeklyMinutes: number;
  subjects: { id: string; name: string; questionCount: number }[];
  activeSubjects?: string[];
  trials?: Pick<TrialExam, "subjectScores" | "date">[];
  /** Length of one full mock exam, analysis time is added automatically. */
  trialMinutes?: number;
}

const PHASES: Record<ExamPhaseId, { name: string; description: string; load: number }> = {
  foundation: { name: "Temel ve eksik kapatma", description: "Konuları baştan sağlamlaştır, formül ve kavram notlarını çıkar.", load: 1 },
  practice: { name: "Soru çözümü ve pekiştirme", description: "Konu bazlı soru çöz, yanlış defterini tut, zayıf konuları tekrar et.", load: 1 },
  trial: { name: "Deneme ve analiz", description: "Her hafta deneme çöz, yanlışlarını analiz et, süre yönetimini çalış.", load: 1 },
  final: { name: "Son tekrar ve dinlenme", description: "Yeni konu açma; özet notlar, yanlış defteri ve uyku düzeni.", load: 0.6 },
};

const DAY = 86_400_000;
const parse = (date: string) => Date.parse(`${date}T12:00:00Z`);
const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (date: string, days: number) => fmt(parse(date) + days * DAY);
export function mondayOf(date: string) {
  const day = new Date(parse(date)).getUTCDay();
  return addDays(date, -((day + 6) % 7));
}
const round5 = (value: number) => Math.max(0, Math.round(value / 5) * 5);

function phaseCounts(weeks: number): Record<ExamPhaseId, number> {
  if (weeks <= 1) return { foundation: 0, practice: 0, trial: 0, final: weeks };
  if (weeks === 2) return { foundation: 0, practice: 1, trial: 0, final: 1 };
  const final = weeks >= 10 ? 2 : 1;
  const trial = weeks >= 6 ? Math.max(1, Math.round(weeks * 0.25)) : 0;
  const foundation = weeks >= 6 ? Math.max(1, Math.round(weeks * 0.35)) : 1;
  const practice = Math.max(1, weeks - final - trial - foundation);
  return { foundation, practice, trial, final: weeks - foundation - practice - trial };
}

/** Average weakness per subject (0 = perfect, 1 = no correct answers) from the latest three mock exams. */
export function subjectWeakness(subjects: { id: string; questionCount: number }[], trials: ExamCalendarInput["trials"] = []) {
  const recent = [...trials].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  return Object.fromEntries(subjects.map((subject) => {
    const nets = recent.map((trial) => trial.subjectScores.find((score) => score.subjectId === subject.id)?.net).filter((net): net is number => typeof net === "number");
    if (!nets.length) return [subject.id, 0.5];
    const ratio = nets.reduce((sum, net) => sum + net, 0) / nets.length / Math.max(1, subject.questionCount);
    return [subject.id, Math.min(1, Math.max(0, 1 - ratio))];
  }));
}

export function buildExamCalendar(input: ExamCalendarInput): ExamCalendar {
  const daysLeft = Math.round((parse(input.examDate) - parse(input.today)) / DAY);
  if (!Number.isFinite(daysLeft) || daysLeft < 0) return { daysLeft: Math.max(0, daysLeft || 0), weeksLeft: 0, phases: [], weeks: [], weakSubjects: [], expired: true };
  const firstWeek = mondayOf(input.today);
  const lastWeek = mondayOf(input.examDate);
  const total = Math.round((parse(lastWeek) - parse(firstWeek)) / (7 * DAY)) + 1;
  const counts = phaseCounts(total);
  const order: ExamPhaseId[] = ["foundation", "practice", "trial", "final"];
  const phases: ExamPhase[] = [];
  const weekPhase: ExamPhaseId[] = [];
  for (const id of order) {
    if (!counts[id]) continue;
    phases.push({ id, name: PHASES[id].name, description: PHASES[id].description, startWeek: weekPhase.length + 1, endWeek: weekPhase.length + counts[id] });
    for (let i = 0; i < counts[id]; i++) weekPhase.push(id);
  }
  const active = input.subjects.filter((subject) => !input.activeSubjects || input.activeSubjects.includes(subject.id));
  const subjects = active.length ? active : input.subjects;
  const weakness = subjectWeakness(subjects, input.trials);
  const trialMinutes = (input.trialMinutes ?? 150) + 45;
  let practiceCounter = 0;

  const weeks: ExamWeekPlan[] = weekPhase.map((phaseId, i) => {
    const weekStart = addDays(firstWeek, i * 7);
    const containsExam = i === total - 1;
    let trial: ExamWeekPlan["trial"];
    const saturday = addDays(weekStart, 5);
    const canTrial = !containsExam && saturday >= input.today && addDays(saturday, 3) <= input.examDate;
    if (canTrial && (phaseId === "trial" || (phaseId === "practice" && practiceCounter++ % 2 === 1) || (phaseId === "final" && total >= 3 && i === total - 2))) {
      trial = { date: saturday, title: `Deneme sınavı (${PHASES[phaseId].name})`, minutes: trialMinutes };
    }
    const load = containsExam ? 0.3 : PHASES[phaseId].load;
    const studyMinutes = round5(Math.max(0, input.weeklyMinutes * load - (trial?.minutes ?? 0)));
    const emphasis = phaseId === "final" ? 2 : phaseId === "trial" ? 1.5 : 1;
    const weights = subjects.map((subject) => subject.questionCount * (1 + weakness[subject.id] * emphasis));
    const sum = weights.reduce((a, b) => a + b, 0) || 1;
    const alloc = subjects.map((subject, k) => ({ subjectId: subject.id, name: subject.name, minutes: round5((weights[k] / sum) * studyMinutes) })).filter((item) => item.minutes >= 15);
    return { index: i + 1, weekStart, phaseId, phaseName: PHASES[phaseId].name, studyMinutes, subjects: alloc, trial, containsExam };
  });

  const weakSubjects = subjects.filter((subject) => weakness[subject.id] >= 0.55).sort((a, b) => weakness[b.id] - weakness[a.id]).map((subject) => subject.name);
  return { daysLeft, weeksLeft: total, phases, weeks, weakSubjects, expired: false };
}

export interface ExamPlanTask { id: string; title: string; goal: string; minutes: number; date: string; week: string; why: string; kind: "study" | "trial"; plannedStart?: string }

/** Turns the calendar into concrete tasks (study blocks of up to 50 min, plus one task per mock exam). Only a near horizon is created so the workspace stays small. */
export function examCalendarToTasks(calendar: ExamCalendar, examId: string, horizon: { studyWeeks: number; trialWeeks: number } = { studyWeeks: 4, trialWeeks: 8 }): ExamPlanTask[] {
  const tasks: ExamPlanTask[] = [];
  for (const week of calendar.weeks) {
    if (week.index > Math.max(horizon.studyWeeks, horizon.trialWeeks)) break;
    for (const subject of week.index <= horizon.studyWeeks ? week.subjects : []) {
      let left = subject.minutes;
      let part = 1;
      while (left > 0) {
        const minutes = left > 65 ? 50 : left;
        tasks.push({ id: `examplan-${examId}-w${week.index}-${subject.subjectId}-${part}`, title: `${subject.name} çalışması`, goal: `${week.phaseName}: ${subject.name} konularında soru çöz ve yanlışlarını not et.`, minutes, date: "", week: week.weekStart, why: `Sınav planı · ${week.phaseName}`, kind: "study" });
        left -= minutes;
        part += 1;
      }
    }
    if (week.trial && week.index <= horizon.trialWeeks) tasks.push({ id: `examplan-${examId}-w${week.index}-trial`, title: week.trial.title, goal: "Gerçek sınav süresiyle çöz, ardından yanlış analizini yap ve sonucu kaydet.", minutes: week.trial.minutes, date: week.trial.date, week: week.weekStart, why: `Sınav planı · ${week.phaseName}`, kind: "trial", plannedStart: "10:00" });
  }
  return tasks;
}
