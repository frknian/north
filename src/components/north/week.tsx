"use client";

import { useState } from "react";
import Link from "next/link";
import { allocation, capacity, dayKey, dropTask, isAreaActive, poolTask, postponeTask, shiftDay, shrinkTask, weekKey, type NorthTask } from "@/lib/north";
import { recommendedSessionMinutes } from "@/lib/north-intelligence";
import { useNorth, Heading, Field, fieldClass } from "./shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const phaseLabels: Record<string, string> = {
  starter: "1. Başlangıç",
  mid_check: "2. Ara Kontrol",
  application: "3. Uygulama",
  review: "4. Tekrar",
  final_proof: "5. Final Kanıtı",
};

export function NorthWeek() {
  const { state, update, workspace } = useNorth();
  const [draft, setDraft] = useState<NorthTask | null>(null);
  const [filter, setFilter] = useState("active");
  const [week, setWeek] = useState(weekKey);
  const activeAreas = state.areas.filter(isAreaActive);
  const pending = state.tasks.filter(task => task.week === week && !["done", "cancelled"].includes(task.status));
  const planned = pending.reduce((total, task) => total + task.minutes, 0);
  const primaryArea = activeAreas.toSorted((a, b) => b.priority - a.priority)[0];
  const yearGoal = workspace.profile.goal || "Yıl sonu yönünü belirle";
  const quarterGoal = workspace.coaching.milestones.find(milestone => milestone.horizonDays === 90 && milestone.status !== "completed")?.title ?? "90 günlük ara hedef belirle";
  const monthlyGoal = workspace.coaching.milestones.find(milestone => milestone.horizonDays === 30 && milestone.status !== "completed")?.title ?? "Aylık yönünü belirle";
  const weeklyGoal = primaryArea?.goal || "Bu haftanın sonucunu belirle";
  const isSunday = new Date(`${dayKey()}T12:00:00`).getDay() === 0;

  const periodMilestones = workspace.coaching.milestones.filter(m => m.phase);
  const overdueTasks = state.tasks.filter(t => t.date && t.date < dayKey() && !["done", "cancelled"].includes(t.status));

  const deadlines = [
    ...state.tasks.filter(task => task.deadline && task.deadline >= week && task.deadline <= shiftDay(week, 6) && !["done", "cancelled"].includes(task.status)).map(task => ({ id: `task-${task.id}`, date: task.deadline, title: task.title, areaId: task.areaId })),
    ...state.events.filter(event => event.kind === "deadline" && event.date >= week && event.date <= shiftDay(week, 6)).map(event => ({ id: `event-${event.id}`, date: event.date, title: event.title, areaId: event.areaId })),
  ].toSorted((a, b) => a.date.localeCompare(b.date));

  const addTask = () => {
    if (!activeAreas.length) return;
    const area = activeAreas[0];
    setDraft({ id: crypto.randomUUID(), areaId: area.id, title: "", goal: "", minutes: area.preferredSessionMinutes ?? recommendedSessionMinutes(state, area.id), intensity: "normal", mandatory: true, status: "pending", date: "", deadline: "", resource: "", why: "Kendi hedefin için eklediğin görev.", week });
  };

  return <div className="page-content space-y-8">
    <Heading title="Plan" description="Nereye gittiğini ve bu hafta atacağın adımı tek bir çizgide gör."><Button disabled={!activeAreas.length} onClick={addTask}>Görev ekle</Button></Heading>

    {isSunday && <section className="north-sunday-ritual"><div><p>PAZAR RİTÜELİ</p><h2>Önce haftayı kapat, sonra yenisini aç.</h2><span>North tamamlananları, zorlanan noktaları ve yardım kaynaklarını değerlendirmeye hazır.</span></div><Button asChild><Link href="/reviews">Haftayı değerlendir</Link></Button></section>}

    {/* OVERDUE & DYNAMIC RESCHEDULING (NO GUILT/DEBT) */}
    {overdueTasks.length > 0 && (
      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-500" />
              <h3 className="text-sm font-semibold text-amber-500">Esnek Yük Düzenleme (Otomatik Borç Yok)</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Önceki günlerden kalan {overdueTasks.length} görev var. North&apos;ta stres veya otomatik borç birikmez; süreyi küçültebilir, havuza alabilir veya erteleyebilirsin.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => update(current => ({ ...current, tasks: current.tasks.map(t => overdueTasks.some(o => o.id === t.id) ? poolTask(t) : t) }))}
            >
              Tümünü Havuza Al
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => update(current => ({ ...current, tasks: current.tasks.map(t => overdueTasks.some(o => o.id === t.id) ? postponeTask(t, shiftDay(t.date || dayKey(), 1)) : t) }))}
            >
              Tümünü Yarına Ertele
            </Button>
          </div>
        </div>
        <div className="mt-3 divide-y divide-border/40">
          {overdueTasks.map(task => (
            <div key={task.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
              <div>
                <span className="font-medium">{task.title}</span>
                <span className="ml-2 text-muted-foreground">({task.minutes} dk · {task.date})</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button size="xs" variant="ghost" onClick={() => update(current => ({ ...current, tasks: current.tasks.map(t => t.id === task.id ? shrinkTask(t) : t) }))}>
                  Küçült (½ dk)
                </Button>
                <Button size="xs" variant="ghost" onClick={() => update(current => ({ ...current, tasks: current.tasks.map(t => t.id === task.id ? poolTask(t) : t) }))}>
                  Havuza Al
                </Button>
                <Button size="xs" variant="ghost" onClick={() => update(current => ({ ...current, tasks: current.tasks.map(t => t.id === task.id ? postponeTask(t, shiftDay(t.date || dayKey(), 1)) : t) }))}>
                  +1 Gün
                </Button>
                <Button size="xs" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => update(current => ({ ...current, tasks: current.tasks.map(t => t.id === task.id ? dropTask(t) : t) }))}>
                  Bırak
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    )}

    {/* 5-PHASE PERIOD PLAN */}
    {periodMilestones.length > 0 ? (
      <section className="surface p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Dönem Planı &amp; Aşamalar</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">5 yapılandırılmış aşamadan oluşan uzun vadeli gelişim çizgisi</p>
          </div>
          <Badge variant="outline" className="text-xs">{periodMilestones.length} Aşama</Badge>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-5">
          {periodMilestones.map((m, idx) => {
            const isCompleted = m.status === "completed";
            const isActive = m.status === "active";
            return (
              <div key={m.id} className={`rounded-xl border p-3 text-xs transition-colors ${isCompleted ? "border-emerald-500/40 bg-emerald-500/5" : isActive ? "border-primary bg-primary/5" : "bg-muted/20"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary">{m.phase ? phaseLabels[m.phase] ?? `Aşama ${idx + 1}` : `Aşama ${idx + 1}`}</span>
                  <span className="text-[10px] text-muted-foreground">Hafta {m.targetWeek ?? Math.round(m.horizonDays / 7)}</span>
                </div>
                <p className="mt-2 font-medium line-clamp-2">{m.title}</p>
                <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{m.description}</p>
                <div className="mt-3">
                  <Badge variant={isCompleted ? "default" : isActive ? "secondary" : "outline"} className="text-[10px]">
                    {isCompleted ? "Tamamlandı" : isActive ? "Devam Ediyor" : "Planlandı"}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    ) : (
      <section className="surface p-5 sm:p-6">
        <div className="north-plan-hierarchy">
          <PlanStep label="Yıl" value={yearGoal} href="/profile" />
          <PlanStep label="90 gün" value={quarterGoal} href="/profile" />
          <PlanStep label="Ay" value={monthlyGoal} href="/profile" />
          <PlanStep label="Bu hafta" value={weeklyGoal} href={primaryArea ? `/areas/${primaryArea.id}` : "/areas"} />
          <PlanStep label="Şimdi" value={pending[0]?.title ?? "İlk görevi ekle"} href={pending[0] ? `/focus/${pending[0].id}` : undefined} />
        </div>
      </section>
    )}

    <section>
      <div className="north-section-heading"><div><h2>Haftalık alan dağılımı</h2><p className="mt-1 text-sm text-muted-foreground">{planned} / {capacity(state)} dk görev planlandı</p></div><Link href="/north-ai">North’tan öneri al ↗</Link></div>
      <div className="surface divide-y px-5">{activeAreas.map(area => {
        const minutes = allocation(state, area);
        const share = capacity(state) ? Math.round(minutes / capacity(state) * 100) : 0;
        return <div key={area.id} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_130px_70px] sm:items-center">
          <div><p className="font-medium"><span className="mr-2" style={{ color: area.accent }}>{area.icon}</span>{area.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{area.goal || "Hedef eklenmedi"}</p></div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground"><input aria-label={`${area.name} haftalık dakika`} className={fieldClass + " w-24"} type="number" min="0" max="10080" value={area.weeklyMinutes} onChange={event => update(current => ({ ...current, areas: current.areas.map(item => item.id === area.id ? { ...item, weeklyMinutes: Math.max(0, Math.min(10080, Number(event.target.value))) } : item) }))} /> dk</label>
          <span className="text-right text-xs text-muted-foreground">%{share}</span>
        </div>;
      })}</div>
      <details className="north-disclosure mt-3"><summary>Kapasite ve hafta modu</summary><div className="mt-5 grid gap-4 sm:grid-cols-3"><Field label="Haftalık müsait saat"><input className={fieldClass} type="number" min="0" max="168" value={state.weeklyHours} onChange={event => update(current => ({ ...current, weeklyHours: Math.max(0, Math.min(168, Number(event.target.value))) }))} /></Field><Field label="Hafta modu"><select className={fieldClass} value={state.mode} onChange={event => update(current => ({ ...current, mode: event.target.value }))}><option value="normal">Normal hafta</option><option value="exam">Sınav haftası · %30 daha az yük</option><option value="free">Serbest hafta</option><option value="custom">Özel mod</option></select></Field>{state.mode === "custom" && <Field label="Mod adı"><input className={fieldClass} value={state.customMode} onChange={event => update(current => ({ ...current, customMode: event.target.value }))} /></Field>}</div>{planned > capacity(state) && <p role="status" className="mt-4 text-sm text-amber-400">Plan kapasitenin {planned - capacity(state)} dk üzerinde. İsteğe bağlı işleri bırakabilir veya küçültebilirsin.</p>}</details>
    </section>

    {draft && <TaskEditor draft={draft} activeAreas={activeAreas} state={state} week={week} onChange={setDraft} onCancel={() => setDraft(null)} onSave={() => { update(current => ({ ...current, tasks: current.tasks.some(task => task.id === draft.id) ? current.tasks.map(task => task.id === draft.id ? { ...draft, rescheduledCount: (task.rescheduledCount ?? 0) + (task.date !== draft.date ? 1 : 0) } : task) : [...current.tasks, draft] })); setDraft(null); }} />}

    <section>
      <div className="north-section-heading"><h2>Bu haftanın görevleri</h2><div className="flex gap-2"><select aria-label="Planlanacak hafta" className={fieldClass + " max-w-44"} value={week} onChange={event => setWeek(event.target.value)}><option value={weekKey()}>Bu hafta</option><option value={shiftDay(weekKey(), 7)}>Sonraki hafta</option></select><select aria-label="Görev filtresi" className={fieldClass + " max-w-40"} value={filter} onChange={event => setFilter(event.target.value)}><option value="active">Aktif</option><option value="all">Tümü</option></select></div></div>
      <div className="surface divide-y px-5">{state.tasks.filter(task => filter === "all" || task.week === week && !["done", "cancelled"].includes(task.status)).map(task => <div key={task.id} className="flex flex-wrap justify-between gap-4 py-4"><div><p>{task.title}</p><p className="mt-1 text-xs text-muted-foreground">{state.areas.find(area => area.id === task.areaId)?.name} · {task.minutes} dk · {task.date || "Esnek havuz"} · {task.mandatory ? "Önemli" : "İsteğe bağlı"}</p></div><div className="flex flex-wrap gap-2"><Button variant="ghost" size="sm" onClick={() => setDraft({ ...task })}>Düzenle</Button><Button variant="ghost" size="sm" onClick={() => update(current => ({ ...current, tasks: current.tasks.map(item => item.id === task.id ? shrinkTask(item) : item) }))} title="Süreyi yarıya indir">Küçült</Button><Button variant="ghost" size="sm" onClick={() => update(current => ({ ...current, tasks: current.tasks.map(item => item.id === task.id ? poolTask(item) : item) }))} title="Günü kaldır, esnek havuza koy">Havuza</Button><Button variant="ghost" size="sm" onClick={() => update(current => ({ ...current, tasks: current.tasks.map(item => item.id === task.id ? postponeTask(item, shiftDay(item.date || dayKey(), 1)) : item) }))} title="Bir gün sonraya ertele">+1 Gün</Button><Button variant="ghost" size="sm" onClick={() => update(current => ({ ...current, tasks: current.tasks.map(item => item.id === task.id ? { ...item, mandatory: !item.mandatory } : item) }))}>{task.mandatory ? "Önceliği azalt" : "Önemli yap"}</Button><Button variant="ghost" size="sm" onClick={() => update(current => ({ ...current, tasks: current.tasks.map(item => item.id === task.id ? dropTask(item) : item) }))}>{task.status === "cancelled" ? "Geri al" : "Bırak"}</Button></div></div>)}{!state.tasks.some(task => filter === "all" || task.week === week && !["done", "cancelled"].includes(task.status)) && <p className="py-8 text-center text-sm text-muted-foreground">Bu hafta için görev yok.</p>}</div>
    </section>

    <section><div className="north-section-heading"><h2>Son tarihler</h2><Link href="/calendar">Takvimi aç ↗</Link></div><div className="surface divide-y px-5">{deadlines.length ? deadlines.map(deadline => <div key={deadline.id} className="flex items-center justify-between gap-4 py-4"><div><p>{deadline.title}</p><p className="mt-1 text-xs text-muted-foreground">{state.areas.find(area => area.id === deadline.areaId)?.name}</p></div><time className="text-sm text-muted-foreground">{new Date(deadline.date + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</time></div>) : <p className="py-8 text-center text-sm text-muted-foreground">Bu hafta için son tarih yok.</p>}</div></section>
  </div>;
}

function PlanStep({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = <><p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-2 line-clamp-2 font-medium leading-6">{value}</p></>;
  return href ? <Link href={href} className="rounded-xl p-2 transition-colors hover:bg-muted/60">{content}</Link> : <div className="rounded-xl p-2">{content}</div>;
}

function TaskEditor({ draft, activeAreas, state, week, onChange, onCancel, onSave }: { draft: NorthTask; activeAreas: ReturnType<typeof useNorth>["state"]["areas"]; state: ReturnType<typeof useNorth>["state"]; week: string; onChange: (task: NorthTask) => void; onCancel: () => void; onSave: () => void }) {
  return <section className="surface grid gap-4 p-5 sm:grid-cols-2"><Field label="Alan"><select className={fieldClass} value={draft.areaId} onChange={event => { const area = activeAreas.find(item => item.id === event.target.value); onChange({ ...draft, areaId: event.target.value, minutes: area?.preferredSessionMinutes ?? recommendedSessionMinutes(state, event.target.value) }); }}>{activeAreas.map(area => <option key={area.id} value={area.id}>{area.name}</option>)}</select></Field><Field label="Görev"><input className={fieldClass} value={draft.title} onChange={event => onChange({ ...draft, title: event.target.value })} /></Field><Field label="Somut çıktı / amaç"><input className={fieldClass} value={draft.goal} onChange={event => onChange({ ...draft, goal: event.target.value })} placeholder="Örn. 5 problem çöz" /></Field><Field label="Dakika"><input className={fieldClass} type="number" min="5" max="240" value={draft.minutes} onChange={event => onChange({ ...draft, minutes: Math.max(5, Math.min(240, Number(event.target.value))) })} /></Field><Field label="Görev türü"><select className={fieldClass} value={draft.taskType ?? "deep_work"} onChange={event => onChange({ ...draft, taskType: event.target.value as NorthTask["taskType"] })}><option value="deep_work">Derin çalışma</option><option value="practice">Pratik</option><option value="problem_solving">Problem çözme</option><option value="lab">Lab</option><option value="review">Tekrar</option><option value="reading">Okuma</option><option value="creative">Yaratıcı çalışma</option><option value="administrative">İdari iş</option><option value="light">Hafif görev</option></select></Field><Field label="Enerji ihtiyacı"><select className={fieldClass} value={draft.intensity} onChange={event => onChange({ ...draft, intensity: event.target.value as NorthTask["intensity"] })}><option value="low">Düşük</option><option value="normal">Normal</option><option value="high">Yüksek</option></select></Field><Field label="Planlanan gün"><input className={fieldClass} type="date" value={draft.date} onChange={event => onChange({ ...draft, date: event.target.value, week: event.target.value ? weekKey(event.target.value) : week })} /></Field><Field label="Son tarih"><input className={fieldClass} type="date" value={draft.deadline} onChange={event => onChange({ ...draft, deadline: event.target.value })} /></Field><Field label="Kaynak (HTTPS)"><input className={fieldClass} type="url" value={draft.resource} onChange={event => onChange({ ...draft, resource: event.target.value })} /></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.mandatory} onChange={event => onChange({ ...draft, mandatory: event.target.checked })} />Bu hafta önemli</label><div className="flex gap-2"><Button disabled={!draft.title.trim() || !draft.goal.trim() || !!draft.resource && !draft.resource.startsWith("https://")} onClick={onSave}>Kaydet</Button><Button variant="ghost" onClick={onCancel}>Vazgeç</Button></div></section>;
}
