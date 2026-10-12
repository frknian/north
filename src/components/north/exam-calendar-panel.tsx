"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, CalendarClock, Flag, Target } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/features/workspace-provider";
import { Button } from "@/components/ui/button";
import { examTemplates } from "@/lib/exam-system";
import { buildExamCalendar, examCalendarToTasks } from "@/lib/exam-calendar";
import { dayKey, type Area, type NorthEvent, type NorthTask } from "@/lib/north";
import type { ExamProfile } from "@/lib/types";
import { useNorth } from "./shared";

const fmtDay = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });

export function ExamCalendarPanel({ area, profile }: { area: Area; profile: ExamProfile }) {
  const { state, update } = useNorth();
  const workspace = useWorkspace();
  const [date, setDate] = useState(profile.examDate);
  const [showAll, setShowAll] = useState(false);
  const template = examTemplates[profile.examType === "other" ? "yks_tyt" : profile.examType];
  const today = dayKey();
  const prefix = `examplan-${profile.id}-`;

  const calendar = useMemo(() => buildExamCalendar({
    examDate: profile.examDate,
    today,
    weeklyMinutes: Math.max(120, Math.round(state.weeklyHours * 60)),
    subjects: template.subjects.map((subject) => ({ id: subject.id, name: subject.name, questionCount: subject.questionCount })),
    activeSubjects: profile.activeSubjects,
    trials: profile.trials,
    trialMinutes: template.defaultDurationMinutes,
  }), [profile.examDate, profile.activeSubjects, profile.trials, state.weeklyHours, template, today]);

  const applied = state.tasks.filter((task) => task.id.startsWith(prefix)).length;

  function saveDate() {
    if (!date || date < today) { toast.error("Sınav tarihi bugünden sonra olmalı."); return; }
    workspace.saveExamProfile({ ...profile, examDate: date });
    toast.success("Sınav tarihi güncellendi.");
  }

  function applyPlan() {
    const planned = examCalendarToTasks(calendar, profile.id);
    const tasks: NorthTask[] = planned.map((item) => ({
      id: item.id, areaId: area.id, title: item.title, goal: item.goal, minutes: item.minutes, intensity: item.kind === "trial" ? "high" : "normal",
      mandatory: item.kind === "trial", status: "pending", date: item.date, deadline: "", resource: "", why: item.why, week: item.week,
      taskType: item.kind === "trial" ? "problem_solving" : "practice", plannedStart: item.plannedStart,
    }));
    const examEvent: NorthEvent = { id: `${prefix}exam-day`, areaId: area.id, title: `${profile.title} — sınav günü`, date: profile.examDate, time: "09:00", kind: "exam", minutes: template.defaultDurationMinutes };
    update((current) => ({
      ...current,
      tasks: [...tasks, ...current.tasks.filter((task) => !task.id.startsWith(prefix) || task.status === "done")],
      events: [examEvent, ...current.events.filter((event) => !event.id.startsWith(prefix))],
    }));
    toast.success(`Önümüzdeki 4 haftanın ${tasks.length} görevi ve sınav günü eklendi. Plan ekranında günlere dağıtabilirsin; haftalar ilerledikçe planı yeniden oluştur.`);
  }

  const visibleWeeks = showAll ? calendar.weeks : calendar.weeks.slice(0, 4);

  return (
    <section className="exam-cal surface" aria-label="Sınav takvimi">
      <header className="exam-cal-head">
        <div><p className="north-eyebrow">Sınav takvimi</p><h3>{profile.title}</h3></div>
        <div className="exam-cal-date">
          <label>Sınav tarihi<input type="date" min={today} value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <Button size="sm" variant="outline" disabled={date === profile.examDate} onClick={saveDate}>Kaydet</Button>
        </div>
      </header>

      {calendar.expired ? <p className="exam-cal-empty">Sınav tarihi geçmiş görünüyor. Yeni bir tarih seç.</p> : (
        <>
          <div className="exam-cal-stats">
            <div><CalendarClock size={16} /><b>{calendar.daysLeft}</b><span>gün kaldı</span></div>
            <div><Flag size={16} /><b>{calendar.weeksLeft}</b><span>hafta</span></div>
            <div><Target size={16} /><b>{calendar.weeks.filter((week) => week.trial).length}</b><span>planlı deneme</span></div>
          </div>
          {calendar.weakSubjects.length > 0 && <p className="exam-cal-note">Son denemelere göre öncelik verilen konular: <b>{calendar.weakSubjects.join(", ")}</b>. Bu derslere daha fazla süre ayrıldı.</p>}

          <ol className="exam-cal-phases">
            {calendar.phases.map((phase) => (
              <li key={phase.id}><b>{phase.name}</b><span>{phase.startWeek === phase.endWeek ? `${phase.startWeek}. hafta` : `${phase.startWeek}–${phase.endWeek}. hafta`}</span><p>{phase.description}</p></li>
            ))}
          </ol>

          <div className="exam-cal-weeks">
            {visibleWeeks.map((week) => (
              <article key={week.index} className={week.index === 1 ? "is-current" : ""}>
                <header><b>{week.index}. hafta · {fmtDay(week.weekStart)}</b><span>{week.phaseName}</span></header>
                {week.containsExam && <p className="exam-cal-exam">Sınav haftası — hafif tekrar, iyi uyku, sınav günü {fmtDay(profile.examDate)}.</p>}
                <ul>{week.subjects.map((subject) => <li key={subject.subjectId}><span>{subject.name}</span><span>{subject.minutes} dk</span></li>)}</ul>
                {week.trial && <p className="exam-cal-trial">Deneme: {fmtDay(week.trial.date)} Cumartesi</p>}
              </article>
            ))}
          </div>
          {calendar.weeks.length > 4 && <Button variant="ghost" size="sm" onClick={() => setShowAll((value) => !value)}>{showAll ? "Daha az göster" : `Tüm ${calendar.weeks.length} haftayı göster`}</Button>}

          <div className="exam-cal-actions">
            <Button onClick={applyPlan}><CalendarCheck size={16} />{applied ? "Planı yeniden oluştur" : "Planı takvime ve haftalık plana ekle"}</Button>
            <span>{applied ? `${applied} sınav planı görevi aktif; yeniden oluşturursan tamamlanmamışlar güncellenir.` : "Önümüzdeki 4 haftanın görevleri ve 8 haftalık denemeler haftalık havuza eklenir; Plan ekranından günlere dağıtılır."}</span>
          </div>
        </>
      )}
    </section>
  );
}
