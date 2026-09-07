"use client";

import { useState } from "react";
import { CalendarPlus, Pencil, Plus } from "lucide-react";
import { dayKey, isAreaActive, shiftDay, weekKey, type NorthEvent, type NorthTask } from "@/lib/north";
import { useNorth, Heading, Field, fieldClass } from "./shared";
import { Button } from "@/components/ui/button";

const taskSymbols: Record<NonNullable<NorthTask["taskType"]>, string> = { deep_work: "◎", practice: "✦", problem_solving: "◈", lab: "⚗", review: "↻", reading: "▤", creative: "◇", administrative: "□", light: "·" };
const taskLabels = { deep_work: "Derin çalışma", practice: "Pratik", problem_solving: "Problem çözme", lab: "Lab", review: "Tekrar", reading: "Okuma", creative: "Yaratıcı çalışma", administrative: "İdari iş", light: "Hafif görev" } as const;

export function NorthCalendar() {
  const { state, update } = useNorth();
  const [date, setDate] = useState(dayKey);
  const [view, setView] = useState("week");
  const [eventDraft, setEventDraft] = useState<NorthEvent | null>(null);
  const [taskDraft, setTaskDraft] = useState<NorthTask | null>(null);
  const activeAreas = state.areas.filter(isAreaActive);
  const start = view === "day" ? date : view === "week" ? weekKey(date) : date.slice(0, 7) + "-01";
  const count = view === "day" ? 1 : view === "week" ? 7 : new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)), 0).getDate();
  const days = Array.from({ length: count }, (_, index) => shiftDay(start, index));
  const leading = view === "month" ? (new Date(start + "T12:00:00").getDay() + 6) % 7 : 0;
  const areaFor = (areaId: string) => state.areas.find(area => area.id === areaId);
  const dateTasks = state.tasks.filter(task => task.date && task.status !== "cancelled");
  const optionalPool = state.tasks.filter(task => !task.mandatory && !task.date && !["done", "cancelled"].includes(task.status));

  const addTask = (mandatory: boolean, plannedDate = date) => {
    const area = activeAreas[0];
    if (!area) return;
    setTaskDraft({ id: crypto.randomUUID(), areaId: area.id, title: "", goal: "", minutes: area.preferredSessionMinutes ?? 35, intensity: "normal", mandatory, status: "pending", date: plannedDate, deadline: "", resource: "", why: mandatory ? "Takvimden eklenen çalışma." : "İsteğe bağlı çalışma; uygun olduğunda yapabilirsin.", week: weekKey(plannedDate), taskType: mandatory ? "deep_work" : "light" });
  };
  const saveTask = () => {
    if (!taskDraft) return;
    update(current => ({ ...current, tasks: current.tasks.some(item => item.id === taskDraft.id) ? current.tasks.map(item => item.id === taskDraft.id ? { ...taskDraft, week: taskDraft.date ? weekKey(taskDraft.date) : taskDraft.week, rescheduledCount: (item.rescheduledCount ?? 0) + (item.date !== taskDraft.date ? 1 : 0) } : item) : [...current.tasks, { ...taskDraft, week: taskDraft.date ? weekKey(taskDraft.date) : taskDraft.week }] }));
    setTaskDraft(null);
  };

  return <div className="page-content space-y-6">
    <Heading title="Takvim" description="Her günün görevi, son tarihi ve esnek çalışması tek bakışta burada."><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={!activeAreas.length} onClick={() => addTask(false)}><Plus />İsteğe bağlı çalışma</Button><Button disabled={!activeAreas.length} onClick={() => setEventDraft({ id: crypto.randomUUID(), areaId: activeAreas[0].id, title: "", date, time: "", kind: "block", minutes: activeAreas[0].preferredSessionMinutes ?? 50 })}><CalendarPlus />Etkinlik ekle</Button></div></Heading>
    <div className="north-calendar-toolbar"><div className="north-calendar-controls">{[["day", "Gün"], ["week", "Hafta"], ["month", "Ay"]].map(([value, label]) => <Button key={value} variant={view === value ? "secondary" : "ghost"} aria-pressed={view === value} onClick={() => setView(value)}>{label}</Button>)}</div><input aria-label="Takvim tarihi" className={fieldClass + " max-w-44"} type="date" value={date} onChange={event => { if (event.target.value) setDate(event.target.value); }} /></div>
    {optionalPool.length > 0 && <section className="north-optional-pool"><div><p className="north-calendar-kicker">ESNEK ÇALIŞMA HAVUZU</p><p className="mt-1 text-sm text-muted-foreground">Bunlar zorunlu değil. Uygun bir güne yerleştir veya olduğu gibi bırak.</p></div><div className="north-optional-list">{optionalPool.slice(0, 5).map(task => <button key={task.id} type="button" onClick={() => setTaskDraft({ ...task, date })}><span>{taskSymbols[task.taskType ?? "light"]}</span>{task.title}<small>{task.minutes} dk</small></button>)}</div></section>}
    {eventDraft && <EventEditor draft={eventDraft} activeAreas={activeAreas} onChange={setEventDraft} onCancel={() => setEventDraft(null)} onSave={() => { update(current => ({ ...current, events: current.events.some(item => item.id === eventDraft.id) ? current.events.map(item => item.id === eventDraft.id ? eventDraft : item) : [...current.events, eventDraft] })); setEventDraft(null); }} />}
    {taskDraft && <TaskEditor draft={taskDraft} activeAreas={activeAreas} onChange={setTaskDraft} onCancel={() => setTaskDraft(null)} onSave={saveTask} />}
    <div className={`north-calendar-grid is-${view}`}>
      {view === "month" && ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map(label => <div key={label} className="north-calendar-weekday">{label}</div>)}
      {Array.from({ length: leading }, (_, index) => <div key={`blank-${index}`} className="north-calendar-blank" aria-hidden="true" />)}
      {days.map(currentDate => {
        const tasks = dateTasks.filter(task => task.date === currentDate);
        const events = state.events.filter(event => event.date === currentDate);
        const activity = state.activities.filter(item => item.date === currentDate);
        return <section key={currentDate} className={`north-calendar-day ${currentDate === dayKey() ? "is-today" : ""}`}>
          <button className="north-calendar-date" onClick={() => { setDate(currentDate); setView("day"); }} aria-label={`${currentDate} gününü aç`}>{new Date(currentDate + "T12:00:00").toLocaleDateString("tr-TR", view === "month" ? { day: "numeric" } : { weekday: "short", day: "numeric", month: "short" })}<span>{tasks.length ? `${tasks.length} görev` : "Boş"}</span></button>
          <div className="north-calendar-items">
            {events.map(event => { const area = areaFor(event.areaId); return <button type="button" key={event.id} onClick={() => setEventDraft({ ...event })} className="north-calendar-event" style={{ borderLeftColor: area?.accent }}><span>◷</span><div><small>{area?.name}</small>{event.time && `${event.time} · `}{event.title}</div></button>; })}
            {tasks.map(task => { const area = areaFor(task.areaId); const done = task.status === "done"; return <button type="button" key={task.id} onClick={() => setTaskDraft({ ...task })} className={`north-calendar-task ${done ? "is-done" : ""} ${task.mandatory ? "is-mandatory" : "is-optional"}`} style={{ borderLeftColor: area?.accent }}><span className="north-calendar-task-symbol">{done ? "✓" : taskSymbols[task.taskType ?? "deep_work"]}</span><div><small>{area?.name} · {task.mandatory ? "Öncelikli" : "İsteğe bağlı"}</small><strong>{task.title}</strong><em>{task.minutes} dk</em></div><Pencil className="size-3" aria-hidden="true"/></button>; })}
            {state.tasks.filter(task => task.deadline === currentDate && task.date !== currentDate && !["done", "cancelled"].includes(task.status)).map(task => <p key={task.id} className="north-calendar-deadline">! Son tarih: {task.title}</p>)}
            {activity.map(item => <p key={item.id} className="north-calendar-complete">✓ {areaFor(item.areaId)?.name} · {item.minutes} dk</p>)}
            {!tasks.length && !events.length && view !== "month" && <button type="button" className="north-calendar-add-day" onClick={() => { setDate(currentDate); addTask(false, currentDate); }}>+ Esnek çalışma ekle</button>}
          </div>
        </section>;
      })}
    </div>
  </div>;
}

function EventEditor({ draft, activeAreas, onChange, onCancel, onSave }: { draft: NorthEvent; activeAreas: ReturnType<typeof useNorth>["state"]["areas"]; onChange: (event: NorthEvent) => void; onCancel: () => void; onSave: () => void }) {
  return <section className="surface grid gap-4 p-5 sm:grid-cols-2"><Field label="Başlık"><input className={fieldClass} value={draft.title} onChange={event => onChange({ ...draft, title: event.target.value })} /></Field><Field label="Tür"><select className={fieldClass} value={draft.kind} onChange={event => onChange({ ...draft, kind: event.target.value as NorthEvent["kind"] })}><option value="block">Odak bloğu</option><option value="exam">Sınav</option><option value="deadline">Son tarih</option></select></Field><Field label="Alan"><select className={fieldClass} value={draft.areaId} onChange={event => onChange({ ...draft, areaId: event.target.value })}>{activeAreas.map(area => <option key={area.id} value={area.id}>{area.name}</option>)}</select></Field><Field label="Tarih"><input className={fieldClass} type="date" value={draft.date} onChange={event => onChange({ ...draft, date: event.target.value })} /></Field><Field label="Saat"><input className={fieldClass} type="time" value={draft.time} onChange={event => onChange({ ...draft, time: event.target.value })} /></Field><Field label="Süre (dakika)"><input className={fieldClass} type="number" min="0" max="1440" value={draft.minutes} onChange={event => onChange({ ...draft, minutes: Math.max(0, Math.min(1440, Number(event.target.value))) })} /></Field><div className="flex gap-2"><Button disabled={!draft.title.trim() || !draft.date} onClick={onSave}>Kaydet</Button><Button variant="ghost" onClick={onCancel}>Vazgeç</Button></div></section>;
}

function TaskEditor({ draft, activeAreas, onChange, onCancel, onSave }: { draft: NorthTask; activeAreas: ReturnType<typeof useNorth>["state"]["areas"]; onChange: (task: NorthTask) => void; onCancel: () => void; onSave: () => void }) {
  return <section className="surface grid gap-4 p-5 sm:grid-cols-2"><div className="sm:col-span-2"><p className="font-medium">{draft.mandatory ? "Planlı çalışma" : "İsteğe bağlı çalışma"}</p><p className="mt-1 text-sm text-muted-foreground">{draft.mandatory ? "Bu görev günün ana planında yer alır." : "Bu görev planı taşırmaz; uygun olduğunda yapabilirsin."}</p></div><Field label="Alan"><select className={fieldClass} value={draft.areaId} onChange={event => onChange({ ...draft, areaId: event.target.value })}>{activeAreas.map(area => <option key={area.id} value={area.id}>{area.name}</option>)}</select></Field><Field label="Görev"><input className={fieldClass} value={draft.title} onChange={event => onChange({ ...draft, title: event.target.value })} placeholder="Örn. 10 ağ sorusu çöz" /></Field><Field label="Somut çıktı / amaç"><input className={fieldClass} value={draft.goal} onChange={event => onChange({ ...draft, goal: event.target.value })} placeholder="Örn. notlarını kaydet" /></Field><Field label="Dakika"><input className={fieldClass} type="number" min="5" max="240" value={draft.minutes} onChange={event => onChange({ ...draft, minutes: Math.max(5, Math.min(240, Number(event.target.value))) })} /></Field><Field label="Görev türü"><select className={fieldClass} value={draft.taskType ?? "deep_work"} onChange={event => onChange({ ...draft, taskType: event.target.value as NorthTask["taskType"] })}>{Object.entries(taskSymbols).map(([value, symbol]) => <option key={value} value={value}>{symbol} {taskLabels[value as keyof typeof taskLabels]}</option>)}</select></Field><Field label="Planlanan gün"><input className={fieldClass} type="date" value={draft.date} onChange={event => onChange({ ...draft, date: event.target.value, week: event.target.value ? weekKey(event.target.value) : draft.week })} /></Field><label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={draft.mandatory} onChange={event => onChange({ ...draft, mandatory: event.target.checked })} />Günün öncelikli görevi</label><div className="flex gap-2 sm:col-span-2"><Button disabled={!draft.title.trim() || !draft.goal.trim()} onClick={onSave}>Kaydet</Button><Button variant="ghost" onClick={onCancel}>Vazgeç</Button></div></section>;
}
