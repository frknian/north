"use client";

import Link from "next/link";
import { allocation, dailySelection, dayKey, isAreaActive, missedAdvice, shiftDay, weekKey } from "@/lib/north";
import { useNorth, TaskRow, fieldClass } from "./shared";
import { Button } from "@/components/ui/button";
import { DailyCheckinCard } from "@/components/features/daily-checkin-card";

export function NorthToday() {
  const { state, update, ready, workspace } = useNorth();
  const today = dayKey();
  const selected = dailySelection(state, today).slice(0, 4);
  const activeAreas = state.areas.filter(isAreaActive);
  const completed = state.activities.filter(activity => activity.date === today && activity.outcome === "done");
  const missed = state.tasks.filter(task => ((task.date && task.date < today) || task.status === "skipped") && !["done", "cancelled"].includes(task.status));
  const checkedIn = workspace.coaching.checkins.some(item => item.date === today);
  const weekend = [0, 6].includes(new Date(today + "T12:00:00").getDay());
  const primaryArea = state.areas.find(area => area.id === selected[0]?.areaId);
  const secondaryArea = state.areas.find(area => area.id === selected[1]?.areaId);
  const maintenance = activeAreas.filter(area => area.priority === 0).map(area => area.name).slice(0, 2);
  const direction = selected[0]
    ? `Bugün ana yönün ${primaryArea?.name ?? "öncelikli hedefin"}. ${secondaryArea ? `${secondaryArea.name} ikinci sırada.` : "Tek bir güçlü adım yeterli."}${maintenance.length ? ` ${maintenance.join(" ve ")} bakım seviyesinde.` : ""}`
    : "Bugün için zorunlu bir plan yok. Bir sonraki anlamlı adımı seçebilir veya bilinçli biçimde dinlenebilirsin.";
  const plannedMinutes = selected.reduce((total, task) => total + task.minutes, 0);

  if (!ready) return <div className="page-content" aria-busy="true">Çalışma alanın hazırlanıyor…</div>;

  return <div className="page-content north-today">
    <header className="north-page-header">
      <div><p className="north-eyebrow">{new Date(today + "T12:00:00").toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}</p><h1>Bugün</h1></div>
      <select aria-label="Bugünkü enerji" className={fieldClass + " max-w-44"} value={state.energy.date === today ? state.energy.level : "normal"} onChange={event => update(current => ({ ...current, energy: { date: today, level: event.target.value as typeof current.energy.level } }))}><option value="low">Düşük enerji</option><option value="normal">Normal enerji</option><option value="high">Yüksek enerji</option></select>
    </header>

    <section className="rounded-2xl border border-border/70 bg-card/35 px-5 py-5"><p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Bugünün yönü</p><p className="mt-3 max-w-3xl leading-7">{direction}</p></section>

    {selected[0] ? <section><div className="north-section-heading"><h2>Ana görev</h2><Link href="/week">Planı düzenle ↗</Link></div><TaskRow task={selected[0]} primary /></section> : <section className="north-focus-card"><h2>Yönünü sen belirle.</h2><p className="mt-3 text-sm text-muted-foreground">Hedefinden küçük bir görev seç veya bugün dinlenme alanı bırak.</p><Button asChild className="mt-6"><Link href={activeAreas.some(area => area.goal) ? "/week" : "/areas"}>Bir sonraki adımı seç</Link></Button></section>}
    {selected[1] && <section><div className="north-section-heading"><h2>İkinci görev</h2></div><TaskRow task={selected[1]} /></section>}
    {selected.length > 2 && <section className="north-later"><div className="north-section-heading"><h2>Hafif işler</h2><span>Vaktin kalırsa</span></div>{selected.slice(2).map(task => <TaskRow key={task.id} task={task} />)}</section>}

    <footer className="north-today-summary"><span>{selected.length} görev · {plannedMinutes} dk planlandı</span><span>{new Set(completed.map(activity => activity.taskId)).size} tamamlandı</span><Link href="/progress">İlerleme ↗</Link></footer>

    {activeAreas.length > 0 && <section className="surface p-5"><div className="north-section-heading"><h2>Bu haftanın dengesi</h2><Link href="/week">Dağılımı düzenle ↗</Link></div><div className="mt-4 space-y-4">{activeAreas.slice(0, 6).map(area => {
      const target = allocation(state, area);
      const actual = state.activities.filter(activity => activity.areaId === area.id && activity.date >= weekKey() && activity.outcome === "done").reduce((total, activity) => total + activity.minutes, 0);
      const percent = target ? Math.min(100, Math.round(actual / target * 100)) : 0;
      return <div key={area.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 text-sm"><Link href={`/areas/${area.id}`} className="truncate">{area.icon} {area.name}</Link><span className="text-xs text-muted-foreground">{actual} / {target} dk</span><div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${percent}%`, background: area.accent ?? "var(--primary)" }} /></div></div>;
    })}</div></section>}

    {(workspace.coaching.preferences.dailyReminderEnabled || checkedIn) && <details className="north-disclosure"><summary>{checkedIn ? "Bugünkü check-in kaydedildi · düzenle" : "Günlük check-in’i tamamla"}</summary><div className="mt-4"><DailyCheckinCard /></div></details>}
    {weekend && workspace.coaching.preferences.weeklyReviewReminderEnabled && <details className="north-disclosure"><summary>Haftayı değerlendir</summary><p className="mt-3 text-sm text-muted-foreground">Tamamlananları, ertelenenleri ve gerçek çalışma kanıtlarını birlikte incele.</p><Link href="/reviews" className="mt-3 inline-block text-sm text-primary">Değerlendirmeyi aç →</Link></details>}
    {missed.length > 0 && <details className="north-disclosure"><summary>Yeniden değerlendirilecekler · {missed.length}</summary><div className="mt-3">{missed.map(task => { const advice = missedAdvice(task); return <div key={task.id} className="border-t py-4"><p className="text-sm">{task.title}</p><p className="my-2 text-xs text-muted-foreground">{advice.why}</p><Button size="sm" variant="outline" onClick={() => update(current => ({ ...current, tasks: current.tasks.map(item => item.id === task.id ? { ...item, status: advice.action === "cancel" ? "cancelled" : "pending", date: "", week: weekKey(), minutes: advice.action === "reduce" ? Math.ceil(item.minutes / 2) : item.minutes, why: advice.why } : item) }))}>{advice.label}</Button><Button asChild size="sm" variant="ghost"><Link href="/week">Başka seçenek</Link></Button></div>; })}</div></details>}
    {state.events.some(event => event.date >= today && event.date <= shiftDay(today, 7)) && <details className="north-disclosure"><summary>Yaklaşan tarihler</summary>{state.events.filter(event => event.date >= today && event.date <= shiftDay(today, 7)).slice(0, 3).map(event => <Link key={event.id} className="mt-3 block text-sm text-muted-foreground" href="/calendar">{event.date === today ? "Bugün" : event.date} · {event.time} {event.title} →</Link>)}</details>}
  </div>;
}
