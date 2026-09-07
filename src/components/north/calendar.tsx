"use client";

import { useState } from "react";
import Link from "next/link";
import { dayKey, isAreaActive, shiftDay, weekKey, type NorthEvent } from "@/lib/north";
import { useNorth, Heading, Field, fieldClass } from "./shared";
import { Button } from "@/components/ui/button";

export function NorthCalendar() {
  const { state, update } = useNorth();
  const [date, setDate] = useState(dayKey);
  const [view, setView] = useState("week");
  const [draft, setDraft] = useState<NorthEvent | null>(null);
  const activeAreas = state.areas.filter(isAreaActive);
  const start = view === "day" ? date : view === "week" ? weekKey(date) : date.slice(0, 7) + "-01";
  const count = view === "day" ? 1 : view === "week" ? 7 : new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)), 0).getDate();
  const days = Array.from({ length: count }, (_, index) => shiftDay(start, index));
  const leading = view === "month" ? (new Date(start + "T12:00:00").getDay() + 6) % 7 : 0;
  const areaFor = (areaId: string) => state.areas.find(area => area.id === areaId);

  return <div className="page-content space-y-6">
    <Heading title="Takvim" description="Alanlarına bağlı tarihleri ve odak bloklarını sakin bir görünümde izle."><Button disabled={!activeAreas.length} onClick={() => setDraft({ id: crypto.randomUUID(), areaId: activeAreas[0].id, title: "", date, time: "", kind: "block", minutes: activeAreas[0].preferredSessionMinutes ?? 50 })}>Etkinlik ekle</Button></Heading>
    <div className="north-calendar-toolbar"><div className="north-calendar-controls">{[["day", "Gün"], ["week", "Hafta"], ["month", "Ay"]].map(([value, label]) => <Button key={value} variant={view === value ? "secondary" : "ghost"} aria-pressed={view === value} onClick={() => setView(value)}>{label}</Button>)}</div><input aria-label="Takvim tarihi" className={fieldClass + " max-w-44"} type="date" value={date} onChange={event => { if (event.target.value) setDate(event.target.value); }} /></div>

    {draft && <section className="surface grid gap-4 p-5 sm:grid-cols-2"><Field label="Başlık"><input className={fieldClass} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} /></Field><Field label="Tür"><select className={fieldClass} value={draft.kind} onChange={event => setDraft({ ...draft, kind: event.target.value as NorthEvent["kind"] })}><option value="block">Odak bloğu</option><option value="exam">Sınav</option><option value="deadline">Son tarih</option></select></Field><Field label="Alan"><select className={fieldClass} value={draft.areaId} onChange={event => setDraft({ ...draft, areaId: event.target.value })}>{activeAreas.map(area => <option key={area.id} value={area.id}>{area.name}</option>)}</select></Field><Field label="Tarih"><input className={fieldClass} type="date" value={draft.date} onChange={event => setDraft({ ...draft, date: event.target.value })} /></Field><Field label="Saat"><input className={fieldClass} type="time" value={draft.time} onChange={event => setDraft({ ...draft, time: event.target.value })} /></Field><Field label="Süre (dakika)"><input className={fieldClass} type="number" min="0" max="1440" value={draft.minutes} onChange={event => setDraft({ ...draft, minutes: Math.max(0, Math.min(1440, Number(event.target.value))) })} /></Field><Button disabled={!draft.title.trim() || !draft.date} onClick={() => { update(current => ({ ...current, events: current.events.some(item => item.id === draft.id) ? current.events.map(item => item.id === draft.id ? draft : item) : [...current.events, draft] })); setDraft(null); }}>Kaydet</Button><Button variant="ghost" onClick={() => setDraft(null)}>Vazgeç</Button></section>}

    <div className={`north-calendar-grid is-${view}`}>
      {view === "month" && ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map(label => <div key={label} className="north-calendar-weekday">{label}</div>)}
      {Array.from({ length: leading }, (_, index) => <div key={`blank-${index}`} className="north-calendar-blank" aria-hidden="true" />)}
      {days.map(currentDate => <section key={currentDate} className={`north-calendar-day ${currentDate === dayKey() ? "is-today" : ""}`}>
        <button className="north-calendar-date" onClick={() => { setDate(currentDate); setView("day"); }} aria-label={`${currentDate} gününü aç`}>{new Date(currentDate + "T12:00:00").toLocaleDateString("tr-TR", view === "month" ? { day: "numeric" } : { weekday: "short", day: "numeric", month: "short" })}</button>
        <div className="north-calendar-items">
          {state.events.filter(event => event.date === currentDate).map(event => { const area = areaFor(event.areaId); return <button key={event.id} onClick={() => setDraft({ ...event })} className="north-calendar-event" style={{ borderLeftColor: area?.accent }}><span className="block text-[10px] text-muted-foreground">{area?.name}</span>{event.time} {event.title}</button>; })}
          {state.tasks.filter(task => task.date === currentDate && task.status !== "cancelled").map(task => { const area = areaFor(task.areaId); return <details key={task.id} className="north-calendar-task" style={{ borderLeftColor: area?.accent }}><summary><span className="text-[10px] text-muted-foreground">{area?.name} · </span>{task.title} · {task.minutes} dk</summary><Link className="my-2 block text-primary" href="/week">Görevi düzenle ↗</Link><input aria-label={`${task.title} yeniden planla`} className={fieldClass + " mt-2"} type="date" value={task.date} onChange={event => update(current => ({ ...current, tasks: current.tasks.map(item => item.id === task.id ? { ...item, date: event.target.value, week: event.target.value ? weekKey(event.target.value) : weekKey(), rescheduledCount: (item.rescheduledCount ?? 0) + (event.target.value !== item.date ? 1 : 0) } : item) }))} /></details>; })}
          {state.tasks.filter(task => task.deadline === currentDate && task.date !== currentDate && !["done", "cancelled"].includes(task.status)).map(task => <p key={task.id} className="my-2 text-xs text-amber-400">Son tarih: {task.title}</p>)}
          {state.activities.filter(activity => activity.date === currentDate).map(activity => <p key={activity.id} className="my-2 text-xs text-emerald-400">✓ {areaFor(activity.areaId)?.name} · {activity.minutes} dk</p>)}
        </div>
      </section>)}
    </div>
    <Link href="/week" className="text-sm text-primary">Tarihsiz görevleri plana ekle →</Link>
  </div>;
}
