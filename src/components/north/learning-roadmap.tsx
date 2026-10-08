"use client";

import { useRef, useState, type ReactNode } from "react";
import { Download, ExternalLink, GitBranch, Plus, Search, Upload } from "lucide-react";
import { useWorkspace } from "@/components/features/workspace-provider";
import { Button } from "@/components/ui/button";
import {
  createLearningRoadmapState,
  createRoadmapPlan,
  getScheduledWeek,
  isRoadmapBackup,
  normalizeLearningRoadmapState,
  roadmapStatus,
  type LearningRoadmapState,
  type RoadmapMilestone,
  type RoadmapRecord,
  type RoadmapStatus,
  type RoadmapTask,
  type RoadmapWeek,
} from "@/lib/learning-roadmap";

const statuses: RoadmapStatus[] = ["yapılmadı", "devam ediyor", "tamamlandı", "engellendi"];
const days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const shortDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function todayInIstanbul() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}
function weekStart(startDate: string, week: number) {
  const date = new Date(`${startDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + (week - 1) * 7);
  return date;
}
function weekNumber(date: string, startDate: string, maxWeek: number) {
  const daysSinceStart = (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86400000;
  return Math.max(1, Math.min(maxWeek, Math.floor(daysSinceStart / 7) + 1));
}
function dateText(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", { timeZone: "UTC", day: "numeric", month: "short" }).format(date);
}
function rangeText(startDate: string, week: number) {
  const start = weekStart(startDate, week);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return `${dateText(start)} – ${dateText(end)}`;
}
function percentage(tasks: RoadmapTask[], state: LearningRoadmapState) {
  return tasks.length ? Math.round(tasks.filter((task) => roadmapStatus(state, task.id) === "tamamlandı").length / tasks.length * 100) : 0;
}
function planPhases(weeks: RoadmapWeek[]) {
  const phases: { title: string; start: number; end: number }[] = [];
  for (const week of weeks) {
    const last = phases.at(-1);
    if (last?.title === week.phase) last.end = week.week;
    else phases.push({ title: week.phase, start: week.week, end: week.week });
  }
  return phases;
}

export function LearningRoadmap() {
  const workspace = useWorkspace();
  const state = workspace.learningRoadmap ?? createLearningRoadmapState();
  const plan = state.plan;
  const update = workspace.updateLearningRoadmap;
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [query, setQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [weekFilter, setWeekFilter] = useState("");
  const [visibleCount, setVisibleCount] = useState(80);
  const [editingTask, setEditingTask] = useState<RoadmapTask | null>(null);
  const [newTaskWeek, setNewTaskWeek] = useState<number | null>(null);
  const [editWeek, setEditWeek] = useState(false);
  const [editMilestone, setEditMilestone] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const today = todayInIstanbul();
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2600); };

  async function importFile(file: File) {
    try {
      const value: unknown = JSON.parse(await file.text());
      if (!isRoadmapBackup(value)) throw new Error("invalid backup");
      if (plan && !window.confirm("Mevcut yol haritan ve görev kayıtların içe aktarılan planla değiştirilsin mi?")) return;
      update(() => normalizeLearningRoadmapState(value.state));
      setSelectedWeek(1);
      notify("Yol haritası hesabına eklendi.");
    } catch {
      notify("Geçerli bir Planorth yol haritası JSON dosyası seç.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  function exportFile() {
    const file = new Blob([JSON.stringify({ schema: 2, exportedAt: new Date().toISOString(), state }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `planorth-yol-haritasi-${today}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  function createPlan(input: { title: string; startDate: string; weekCount: number; description: string }) {
    update(() => ({ ...createLearningRoadmapState(), plan: createRoadmapPlan(input) }));
    setSelectedWeek(1);
  }
  function replacePlan() {
    if (!window.confirm("Mevcut yol haritası ve tüm görev kayıtları silinip yeni plan oluşturma ekranı açılsın mı? Önce JSON yedeği alabilirsin.")) return;
    update(() => createLearningRoadmapState());
    setSelectedWeek(1);
  }

  const fileInput = <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(event) => event.target.files?.[0] && void importFile(event.target.files[0])} />;
  if (!workspace.ready) return <div className="p-8 text-sm text-muted-foreground">Yol haritan yükleniyor…</div>;
  if (!plan) return <div className="mx-auto max-w-3xl space-y-6 pb-10">{fileInput}<RoadmapSetup onCreate={createPlan} onImport={() => fileRef.current?.click()} />{toast && <Toast>{toast}</Toast>}</div>;

  const tasks = plan.weeks.flatMap((week) => week.tasks);
  const areas = [...new Set(tasks.map((task) => task.area))].sort((a, b) => a.localeCompare(b, "tr"));
  const activeWeek = Math.min(Math.max(1, selectedWeek), plan.weeks.length);
  const currentWeek = weekNumber(today, plan.startDate, plan.weeks.length);
  const hasStarted = today >= plan.startDate;
  const scheduled = (task: RoadmapTask) => getScheduledWeek(state, task);
  const tasksInWeek = (week: number) => tasks.filter((task) => scheduled(task) === week);
  const currentTasks = tasksInWeek(currentWeek);
  const selectedTasks = tasksInWeek(activeWeek);
  const selected = plan.weeks[activeWeek - 1];
  const todayName = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", weekday: "long" }).format(new Date());
  const todaysTasks = hasStarted ? currentTasks.filter((task) => task.day.toLocaleLowerCase("tr-TR") === todayName.toLocaleLowerCase("tr-TR")) : [];
  const late = tasks.filter((task) => scheduled(task) < currentWeek && roadmapStatus(state, task.id) !== "tamamlandı");
  const blocked = tasks.filter((task) => roadmapStatus(state, task.id) === "engellendi");
  const q = query.toLocaleLowerCase("tr-TR");
  const filtered = tasks.filter((task) =>
    (!q || `${task.title} ${task.detail} ${task.resource.label} ${plan.weeks[task.week - 1]?.phase}`.toLocaleLowerCase("tr-TR").includes(q)) &&
    (!areaFilter || task.area === areaFilter) &&
    (!statusFilter || roadmapStatus(state, task.id) === statusFilter) &&
    (!weekFilter || scheduled(task) === Number(weekFilter))
  );
  const done = tasks.filter((task) => roadmapStatus(state, task.id) === "tamamlandı").length;
  const actualMinutes = tasks.reduce((sum, task) => sum + (state.records[task.id]?.spentMinutes ?? 0), 0);
  const phases = planPhases(plan.weeks);

  function changeStatus(task: RoadmapTask, status: RoadmapStatus) {
    update((current) => ({ ...current, records: { ...current.records, [task.id]: { ...current.records[task.id], status, ...(status === "tamamlandı" && !current.records[task.id]?.date ? { date: today } : {}) } } }));
  }
  function saveTask(task: RoadmapTask, record: RoadmapRecord) {
    update((current) => {
      if (!current.plan) return current;
      const weeks = current.plan.weeks.map((week) => week.week === task.week ? {
        ...week,
        tasks: week.tasks.some((item) => item.id === task.id) ? week.tasks.map((item) => item.id === task.id ? task : item) : [...week.tasks, task],
      } : week);
      return { ...current, plan: { ...current.plan, weeks }, records: { ...current.records, [task.id]: record }, scheduledWeeks: { ...current.scheduledWeeks, [task.id]: current.scheduledWeeks[task.id] ?? task.week } };
    });
    setEditingTask(null);
    setNewTaskWeek(null);
    notify("Görev kaydedildi.");
  }
  function deleteTask(task: RoadmapTask) {
    if (!window.confirm("Bu görev ve kayıtları silinsin mi?")) return;
    update((current) => {
      if (!current.plan) return current;
      const records = { ...current.records };
      const scheduledWeeks = { ...current.scheduledWeeks };
      delete records[task.id]; delete scheduledWeeks[task.id];
      return { ...current, records, scheduledWeeks, plan: { ...current.plan, weeks: current.plan.weeks.map((week) => ({ ...week, tasks: week.tasks.filter((item) => item.id !== task.id) })) } };
    });
    setEditingTask(null);
  }
  function saveWeek(week: RoadmapWeek) {
    update((current) => {
      if (!current.plan) return current;
      const weeks = current.plan.weeks.map((item) => item.week === week.week ? week : item);
      return { ...current, plan: { ...current.plan, weeks, phases: planPhases(weeks) } };
    });
    setEditWeek(false);
  }
  function saveMilestone(milestone: RoadmapMilestone, index: number | null) {
    update((current) => {
      if (!current.plan) return current;
      const milestones = index === null ? [...current.plan.milestones, milestone] : current.plan.milestones.map((item, position) => position === index ? milestone : item);
      return { ...current, plan: { ...current.plan, milestones } };
    });
    setEditMilestone(null);
  }
  function deferWeek() {
    if (!plan) return;
    if (activeWeek >= plan.weeks.length) return notify("Son haftanın ötesine erteleme yapılamıyor.");
    const pending = selectedTasks.filter((task) => roadmapStatus(state, task.id) !== "tamamlandı");
    if (!pending.length) return notify("Ertelenecek eksik görev yok.");
    update((current) => ({ ...current, scheduledWeeks: { ...current.scheduledWeeks, ...Object.fromEntries(pending.map((task) => [task.id, activeWeek + 1])) } }));
    setSelectedWeek(activeWeek + 1);
    notify(`${pending.length} eksik görev sonraki haftaya taşındı.`);
  }

  return <div className="mx-auto w-full max-w-[1440px] space-y-5 px-4 pb-12 pt-5 sm:px-6 lg:px-8">
    {fileInput}
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-[11px] font-semibold uppercase tracking-[.18em] text-primary">Bilişsel yol haritası · kişisel gelişim</p><h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{plan.title}</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">{plan.description || `${plan.weeks.length} haftalık kişisel çalışma planın`}</p><p className="mt-1 text-xs text-muted-foreground">{workspace.syncMode === "firebase" ? "Plan, kendi Planorth hesabında eşitleniyor." : "Plan bu cihazda saklanıyor."}</p></div>
      <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={exportFile}><Download size={15} />Yedekle</Button><Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}><Upload size={15} />İçe aktar</Button><Button size="sm" variant="outline" onClick={replacePlan}>Yeni plan</Button></div>
    </header>
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Yol haritası özeti">
      <Metric label="Toplam ilerleme" value={`${percentage(tasks, state)}%`} sub={`${done} / ${tasks.length} görev`} />
      <Metric label="Bu hafta" value={`${percentage(currentTasks, state)}%`} sub={`Hafta ${currentWeek} · ${rangeText(plan.startDate, currentWeek)}`} />
      <Metric label="Kaydedilen çalışma" value={`${Math.round(actualMinutes / 6) / 10}`} sub="saat · girdiğin süre" />
      <Metric label="Geciken / engelli" value={`${late.length} / ${blocked.length}`} sub="tamamlanmış sayılmaz" />
    </section>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><main className="min-w-0 space-y-5">
      <StageAtlas phases={phases} weeks={plan.weeks} state={state} activeWeek={activeWeek} onSelect={setSelectedWeek} />
      <Panel title="Bugünün görevleri" side={new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", weekday: "long", day: "numeric", month: "long" }).format(new Date())}>
        {!hasStarted ? <Empty>Plan henüz başlamadı. İlk hafta {rangeText(plan.startDate, 1)}.</Empty> : todaysTasks.length ? <div className="space-y-2">{todaysTasks.map((task) => <TaskLine key={task.id} task={task} state={state} shifted={scheduled(task) !== task.week} onToggle={changeStatus} onEdit={setEditingTask} />)}</div> : <Empty>Bugün için planlanmış görev yok.</Empty>}
      </Panel>
      <Panel title="Bu haftanın takvimi" side={rangeText(plan.startDate, currentWeek)}><p className="mb-3 text-xs text-muted-foreground">{plan.scheduleNote || "Görevleri günlerine göre burada izle."}</p><div className="grid grid-cols-7 gap-1.5 sm:gap-2">{days.map((day, index) => { const date = weekStart(plan.startDate, currentWeek); date.setUTCDate(date.getUTCDate() + index); const count = currentTasks.filter((task) => task.day === day).length; return <div key={day} className="min-h-20 rounded-xl border p-2 text-center sm:min-h-24"><span className="block text-[10px] text-muted-foreground">{shortDays[index]}</span><b className="my-1 block text-sm">{date.getUTCDate()}</b>{count > 0 && <span className="mx-auto block size-1.5 rounded-full bg-primary" />}<span className="mt-1 hidden text-[10px] text-muted-foreground sm:block">{count ? `${count} görev` : ""}</span></div>; })}</div></Panel>
      <Panel title="Tüm görevler" side={`${filtered.length} görev`}>
        <div className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4"><label className="relative sm:col-span-2 xl:col-span-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(80); }} placeholder="Görev veya kaynak ara" className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-xs" /></label><select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)} className="h-9 rounded-lg border bg-background px-2 text-xs"><option value="">Tüm alanlar</option>{areas.map((area) => <option key={area}>{area}</option>)}</select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 rounded-lg border bg-background px-2 text-xs"><option value="">Tüm durumlar</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select><select value={weekFilter} onChange={(event) => setWeekFilter(event.target.value)} className="h-9 rounded-lg border bg-background px-2 text-xs"><option value="">Tüm haftalar</option>{plan.weeks.map((week) => <option key={week.week} value={week.week}>Hafta {week.week}</option>)}</select></div>
        <div className="max-h-[660px] space-y-2 overflow-y-auto pr-1">{filtered.length ? filtered.slice(0, visibleCount).map((task) => <TaskLine key={task.id} task={task} state={state} shifted={scheduled(task) !== task.week} onToggle={changeStatus} onEdit={setEditingTask} />) : <Empty>Bu filtrelerle görev bulunamadı.</Empty>}</div>
        {filtered.length > visibleCount && <Button className="mt-3 w-full" variant="outline" size="sm" onClick={() => setVisibleCount(visibleCount + 80)}>Daha fazla görev göster</Button>}
      </Panel>
    </main><aside className="space-y-5">
      <Panel title="Hafta ayrıntısı" side={rangeText(plan.startDate, activeWeek)}><div className="mb-3 flex items-center gap-1"><Button variant="outline" size="icon" className="size-8" onClick={() => setSelectedWeek(Math.max(1, activeWeek - 1))} aria-label="Önceki hafta">‹</Button><select value={activeWeek} onChange={(event) => setSelectedWeek(Number(event.target.value))} className="h-8 flex-1 rounded-lg border bg-background px-2 text-xs">{plan.weeks.map((week) => <option key={week.week} value={week.week}>Hafta {week.week}</option>)}</select><Button variant="outline" size="icon" className="size-8" onClick={() => setSelectedWeek(Math.min(plan.weeks.length, activeWeek + 1))} aria-label="Sonraki hafta">›</Button></div><span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">{selected.phase}</span><h3 className="mt-3 text-lg font-semibold">{selected.title}</h3><p className="mt-1 text-xs text-muted-foreground">{selected.goal || "Bu haftanın hedefini ekle."}</p><Button variant="ghost" size="sm" className="mt-1 px-0" onClick={() => setEditWeek(true)}>Haftayı düzenle</Button><div className="my-3 flex justify-between text-xs"><b>İlerleme</b><span>{percentage(selectedTasks, state)}%</span></div><Progress value={percentage(selectedTasks, state)} /><div className="mt-3 space-y-1">{selectedTasks.map((task) => <TaskLine key={task.id} compact task={task} state={state} shifted={scheduled(task) !== task.week} onToggle={changeStatus} onEdit={setEditingTask} />)}</div><Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setNewTaskWeek(activeWeek)}><Plus size={14} />Görev ekle</Button>{selected.gate && <div className="my-3 rounded-xl border border-primary/10 bg-primary/5 p-3 text-xs"><b>Geçiş ölçütü</b><p className="mt-1 text-muted-foreground">{selected.gate}</p></div>}<Button variant="outline" size="sm" className="mt-3 w-full" onClick={deferWeek}>Eksik görevleri sonraki haftaya ertele</Button></Panel>
      <Panel title="Alanlara göre ilerleme">{areas.length ? <div className="space-y-3">{areas.map((area) => { const group = tasks.filter((task) => task.area === area); return <div key={area}><div className="mb-1 flex justify-between text-xs"><span>{area}</span><span>{percentage(group, state)}%</span></div><Progress value={percentage(group, state)} /></div>; })}</div> : <Empty>İlerleme alanları, görev ekledikçe burada görünecek.</Empty>}</Panel>
      <Panel title="Kilometre taşları" side={`${plan.milestones.length} kayıt`}><div className="max-h-64 space-y-3 overflow-y-auto">{plan.milestones.map((milestone, index) => <button key={`${milestone.week}-${index}`} onClick={() => setEditMilestone(index)} className="block w-full border-t pt-2 text-left first:border-0 first:pt-0"><b className="block text-xs">{milestone.title}</b><span className="text-[10px] text-muted-foreground">Hafta {milestone.week} · {milestone.criterion}</span></button>)}</div><Button className="mt-3 w-full" size="sm" variant="outline" onClick={() => setEditMilestone(-1)}><Plus size={14} />Kilometre taşı ekle</Button></Panel>
      <Panel title="Geciken / engelli" side={`${late.length} / ${blocked.length}`}><div className="max-h-52 space-y-2 overflow-y-auto">{[...new Map([...late, ...blocked].map((task) => [task.id, task])).values()].slice(0, 10).map((task) => <button key={task.id} onClick={() => setEditingTask(task)} className="block w-full border-t py-2 text-left first:border-0"><b className="block text-xs">Hafta {scheduled(task)} · {task.title}</b><span className="text-[10px] text-muted-foreground">{roadmapStatus(state, task.id)} · {task.area}</span></button>)}{late.length + blocked.length === 0 && <Empty>Şu an geciken veya engelli görev yok.</Empty>}</div></Panel>
      <Panel title="Gelecek hafta" side={currentWeek < plan.weeks.length ? `Hafta ${currentWeek + 1}` : "Planın sonu"}>{currentWeek < plan.weeks.length ? tasksInWeek(currentWeek + 1).slice(0, 4).map((task) => <div key={task.id} className="border-t py-2 text-xs first:border-0"><b>{task.title}</b><p className="text-muted-foreground">{task.day} · {task.minutes} dk</p></div>) : <Empty>Son haftadasın.</Empty>}</Panel>
    </aside></div>
    {(editingTask || newTaskWeek !== null) && <TaskEditor key={editingTask?.id ?? `new-${newTaskWeek}`} week={newTaskWeek ?? editingTask!.week} task={editingTask} record={editingTask ? state.records[editingTask.id] : undefined} onClose={() => { setEditingTask(null); setNewTaskWeek(null); }} onSave={saveTask} onDelete={deleteTask} />}
    {editWeek && <WeekEditor key={activeWeek} week={selected} onClose={() => setEditWeek(false)} onSave={saveWeek} />}
    {editMilestone !== null && <MilestoneEditor key={editMilestone} milestone={editMilestone < 0 ? null : plan.milestones[editMilestone]} defaultWeek={activeWeek} maxWeek={plan.weeks.length} onClose={() => setEditMilestone(null)} onSave={(milestone) => saveMilestone(milestone, editMilestone < 0 ? null : editMilestone)} onDelete={() => { if (editMilestone < 0) return; if (!window.confirm("Bu kilometre taşı silinsin mi?")) return; update((current) => current.plan ? { ...current, plan: { ...current.plan, milestones: current.plan.milestones.filter((_, index) => index !== editMilestone) } } : current); setEditMilestone(null); }} />}
    {toast && <Toast>{toast}</Toast>}
  </div>;
}

function StageAtlas({ phases, weeks, state, activeWeek, onSelect }: { phases: { title: string; start: number; end: number }[]; weeks: RoadmapWeek[]; state: LearningRoadmapState; activeWeek: number; onSelect: (week: number) => void }) {
  return <section className="roadmap-atlas" aria-label="Beceri aşamaları ve hafta hiyerarşisi">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><GitBranch size={18} className="text-primary" /><h2 className="text-base font-semibold">Beceri aşamaları ve hafta hiyerarşisi</h2></div><span className="text-[11px] text-muted-foreground">{weeks.length} hafta · ilerleme yalnızca işaretlediğin görevlerden hesaplanır</span></div>
    <div className="roadmap-timeline space-y-3">{phases.map((phase, index) => {
      const phaseWeeks = weeks.slice(phase.start - 1, phase.end);
      const phaseTasks = phaseWeeks.flatMap((week) => week.tasks);
      const phaseProgress = percentage(phaseTasks, state);
      const isActive = activeWeek >= phase.start && activeWeek <= phase.end;
      const complete = phaseTasks.length > 0 && phaseProgress === 100;
      return <div key={`${phase.title}-${phase.start}`} className={`roadmap-stage ${isActive ? "is-active" : ""}`}>
        <button type="button" onClick={() => onSelect(phase.start)} className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={isActive}>
          <div className="min-w-0"><span className="text-[10px] font-bold uppercase tracking-wider text-primary">Aşama {String(index + 1).padStart(2, "0")} · hafta {phase.start}–{phase.end}</span><h3 className="mt-1 text-sm font-semibold sm:text-base">{phase.title}</h3></div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${complete ? "bg-emerald-500/10 text-emerald-400" : "bg-primary/10 text-primary"}`}>{phaseProgress}%</span>
        </button>
        <div className="mt-3"><Progress value={phaseProgress} /></div>
        {isActive && <div className="mt-4 grid gap-2 sm:grid-cols-2">{phaseWeeks.map((week) => {
          const progress = percentage(week.tasks, state);
          const selected = activeWeek === week.week;
          return <button type="button" key={week.week} onClick={() => onSelect(week.week)} className={`roadmap-node ${selected ? "is-selected" : ""}`} aria-current={selected ? "step" : undefined}>
            <span className="roadmap-node-index">{String(week.week).padStart(2, "0")}</span><span className="min-w-0 flex-1"><b className="block truncate text-xs font-semibold">{week.title}</b><small className="mt-0.5 block text-[10px] text-muted-foreground">{week.tasks.length} görev · {week.hours} saat</small></span><span className="text-[11px] font-semibold text-primary">{progress}%</span>
          </button>;
        })}</div>}
      </div>;
    })}</div>
  </section>;
}

function RoadmapSetup({ onCreate, onImport }: { onCreate: (input: { title: string; startDate: string; weekCount: number; description: string }) => void; onImport: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(todayInIstanbul());
  const [weekCount, setWeekCount] = useState(12);
  return <><header><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Yol Haritam</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Kendi yol haritanı oluştur</h1><p className="mt-2 text-sm text-muted-foreground">Planın kendi çalışma alanında saklanır. Haftaları, görevleri ve kilometre taşlarını hedeflerine göre düzenleyebilirsin.</p></header><div className="grid gap-4 rounded-2xl border bg-card p-5"><Field label="Plan adı"><input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Örn. Siber güvenlik temelleri" className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field><Field label="Kısa açıklama"><input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Bu planın amacı" className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Başlangıç tarihi"><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field><Field label="Hafta sayısı (1–156)"><input type="number" min="1" max="156" value={weekCount} onChange={(event) => setWeekCount(Number(event.target.value))} className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field></div><div className="flex flex-wrap gap-2"><Button disabled={!title.trim() || !startDate || weekCount < 1 || weekCount > 156} onClick={() => onCreate({ title, description, startDate, weekCount })}>Plan oluştur</Button><Button variant="outline" onClick={onImport}><Upload size={15} />JSON plan içe aktar</Button></div></div></>;
}
function TaskLine({ task, state, shifted, onToggle, onEdit, compact = false }: { task: RoadmapTask; state: LearningRoadmapState; shifted: boolean; onToggle: (task: RoadmapTask, status: RoadmapStatus) => void; onEdit: (task: RoadmapTask) => void; compact?: boolean }) {
  const status = roadmapStatus(state, task.id);
  return <div className={`roadmap-task flex items-start gap-2.5 rounded-xl border p-2.5 ${compact ? "bg-muted/30" : ""}`}><button type="button" aria-label={`${task.title}: tamamlandı durumunu değiştir`} onClick={() => onToggle(task, status === "tamamlandı" ? "yapılmadı" : "tamamlandı")} className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded border text-[11px] ${status === "tamamlandı" ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>{status === "tamamlandı" ? "✓" : ""}</button><button type="button" onClick={() => onEdit(task)} className="min-w-0 flex-1 text-left"><span className="block text-xs font-medium leading-5">{task.title}{shifted && <span className="ml-1 rounded bg-amber-500/10 px-1 py-0.5 text-[9px] text-amber-700">ertelendi</span>}</span><span className="mt-0.5 flex flex-wrap gap-x-2 text-[10px] text-muted-foreground"><span>{task.day}</span><span>{task.area}</span><span>{task.minutes} dk</span><span>{status}</span></span></button>{task.resource.url && <a href={task.resource.url} target="_blank" rel="noreferrer" aria-label={`${task.resource.label} kaynağını aç`} className="mt-1 text-muted-foreground hover:text-primary"><ExternalLink size={14} /></a>}</div>;
}
function TaskEditor({ week, task, record, onClose, onSave, onDelete }: { week: number; task: RoadmapTask | null; record?: RoadmapRecord; onClose: () => void; onSave: (task: RoadmapTask, record: RoadmapRecord) => void; onDelete: (task: RoadmapTask) => void }) {
  const [draft, setDraft] = useState<RoadmapTask>(task ?? { id: crypto.randomUUID(), week, title: "", area: "Genel", minutes: 45, day: "Pazar", kind: "Çalışma", resource: { label: "", url: "" }, detail: "" });
  const [status, setStatus] = useState<RoadmapStatus>(record?.status ?? "yapılmadı");
  const [date, setDate] = useState(record?.date ?? "");
  const [spent, setSpent] = useState(String(record?.spentMinutes ?? ""));
  const [note, setNote] = useState(record?.note ?? "");
  const [proof, setProof] = useState(record?.proofUrl ?? "");
  return <Modal title={task ? "Görevi düzenle" : "Görev ekle"} onClose={onClose}><p className="mb-3 text-xs text-muted-foreground">Hafta {week} · Görevin içeriğini ve kendi çalışma kaydını düzenle.</p><div className="grid gap-3 sm:grid-cols-2"><Field label="Görev adı" full><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field><Field label="Alan"><input value={draft.area} onChange={(event) => setDraft({ ...draft, area: event.target.value })} className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field><Field label="Gün"><select value={draft.day} onChange={(event) => setDraft({ ...draft, day: event.target.value })} className="h-10 rounded-lg border bg-background px-3 text-sm">{days.map((day) => <option key={day}>{day}</option>)}</select></Field><Field label="Tahmini süre (dakika)"><input type="number" min="0" value={draft.minutes} onChange={(event) => setDraft({ ...draft, minutes: Math.max(0, Number(event.target.value)) })} className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field><Field label="Görev türü"><input value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value })} className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field><Field label="Kaynak adı"><input value={draft.resource.label} onChange={(event) => setDraft({ ...draft, resource: { ...draft.resource, label: event.target.value } })} className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field><Field label="Kaynak bağlantısı"><input type="url" value={draft.resource.url} onChange={(event) => setDraft({ ...draft, resource: { ...draft.resource, url: event.target.value } })} placeholder="https://…" className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field><Field label="Uygulama ve kanıt beklentisi" full><textarea value={draft.detail} onChange={(event) => setDraft({ ...draft, detail: event.target.value })} rows={3} className="rounded-lg border bg-background p-3 text-sm" /></Field><Field label="Durum"><select value={status} onChange={(event) => setStatus(event.target.value as RoadmapStatus)} className="h-10 rounded-lg border bg-background px-3 text-sm">{statuses.map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Çalışma / tamamlanma tarihi"><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field><Field label="Harcanan süre (dakika)"><input type="number" min="0" value={spent} onChange={(event) => setSpent(event.target.value)} className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field><Field label="Kanıt bağlantısı"><input type="url" value={proof} onChange={(event) => setProof(event.target.value)} placeholder="https://…" className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field><Field label="Notlar" full><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="rounded-lg border bg-background p-3 text-sm" /></Field></div><div className="mt-4 flex justify-between gap-2">{task ? <Button variant="outline" onClick={() => onDelete(task)}>Görevi sil</Button> : <span />}<div className="flex gap-2"><Button variant="outline" onClick={onClose}>Vazgeç</Button><Button disabled={!draft.title.trim() || !draft.area.trim()} onClick={() => onSave({ ...draft, title: draft.title.trim(), area: draft.area.trim() }, { status, date, spentMinutes: Number(spent) || 0, note, proofUrl: proof })}>Kaydet</Button></div></div></Modal>;
}
function WeekEditor({ week, onClose, onSave }: { week: RoadmapWeek; onClose: () => void; onSave: (week: RoadmapWeek) => void }) {
  const [draft, setDraft] = useState(week);
  return <Modal title={`Hafta ${week.week}`} onClose={onClose}><div className="grid gap-3"><Field label="Hafta başlığı"><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field><Field label="Aşama"><input value={draft.phase} onChange={(event) => setDraft({ ...draft, phase: event.target.value })} className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field><Field label="Bu haftanın hedefi"><textarea value={draft.goal} onChange={(event) => setDraft({ ...draft, goal: event.target.value })} rows={2} className="rounded-lg border bg-background p-3 text-sm" /></Field><Field label="Geçiş ölçütü"><textarea value={draft.gate} onChange={(event) => setDraft({ ...draft, gate: event.target.value })} rows={2} className="rounded-lg border bg-background p-3 text-sm" /></Field></div><div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Vazgeç</Button><Button disabled={!draft.title.trim()} onClick={() => onSave(draft)}>Kaydet</Button></div></Modal>;
}
function MilestoneEditor({ milestone, defaultWeek, maxWeek, onClose, onSave, onDelete }: { milestone: RoadmapMilestone | null; defaultWeek: number; maxWeek: number; onClose: () => void; onSave: (milestone: RoadmapMilestone) => void; onDelete: () => void }) {
  const [draft, setDraft] = useState<RoadmapMilestone>(milestone ?? { month: 1, week: defaultWeek, title: "", criterion: "" });
  return <Modal title={milestone ? "Kilometre taşını düzenle" : "Kilometre taşı ekle"} onClose={onClose}><div className="grid gap-3"><Field label="Başlık"><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field><Field label="Hedef hafta"><input type="number" min="1" max={maxWeek} value={draft.week} onChange={(event) => setDraft({ ...draft, week: Number(event.target.value) })} className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field><Field label="Başarı ölçütü"><textarea value={draft.criterion} onChange={(event) => setDraft({ ...draft, criterion: event.target.value })} rows={3} className="rounded-lg border bg-background p-3 text-sm" /></Field></div><div className="mt-4 flex justify-between gap-2">{milestone ? <Button variant="outline" onClick={onDelete}>Sil</Button> : <span />}<div className="flex gap-2"><Button variant="outline" onClick={onClose}>Vazgeç</Button><Button disabled={!draft.title.trim() || draft.week < 1 || draft.week > maxWeek} onClick={() => onSave(draft)}>Kaydet</Button></div></div></Modal>;
}
function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) { return <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-black/50 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section role="dialog" aria-modal="true" aria-label={title} className="my-auto max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl border bg-card p-5 shadow-2xl"><div className="mb-4 flex items-start justify-between gap-3"><h2 className="text-lg font-semibold">{title}</h2><button aria-label="Pencereyi kapat" className="text-xl text-muted-foreground" onClick={onClose}>×</button></div>{children}</section></div>; }
function Panel({ title, side, children }: { title: string; side?: string; children: ReactNode }) { return <section className="roadmap-panel rounded-2xl border p-4 sm:p-5"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">{title}</h2>{side && <span className="text-xs text-muted-foreground">{side}</span>}</div>{children}</section>; }
function Metric({ label, value, sub }: { label: string; value: string; sub: string }) { return <div className="roadmap-metric rounded-2xl border p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div><p className="mt-1 text-[11px] text-muted-foreground">{sub}</p></div>; }
function Progress({ value }: { value: number }) { return <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-primary transition-all" style={{ width: `${value}%` }} /></div>; }
function Empty({ children }: { children: ReactNode }) { return <p className="rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground">{children}</p>; }
function Field({ label, children, full = false }: { label: string; children: ReactNode; full?: boolean }) { return <label className={`grid gap-1.5 text-xs text-muted-foreground ${full ? "sm:col-span-2" : ""}`}><span>{label}</span>{children}</label>; }
function Toast({ children }: { children: ReactNode }) { return <div role="status" className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-foreground px-4 py-2 text-xs text-background shadow-lg">{children}</div>; }
