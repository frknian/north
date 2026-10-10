"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ExternalLink, GitBranch, Link2, Play } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/features/workspace-provider";
import { Button } from "@/components/ui/button";
import { getScheduledWeek, resolveRoadmapAreaId, roadmapStatus, type RoadmapTask, type RoadmapStatus } from "@/lib/learning-roadmap";
import { initializeNorth, type Area } from "@/lib/north";
import { activateRoadmapWeek, istanbulToday } from "@/lib/roadmap-scheduling";

const statuses: RoadmapStatus[] = ["yapılmadı", "devam ediyor", "tamamlandı", "engellendi"];
const istanbulDate = istanbulToday;

function planWeek(startDate: string, length: number) {
  const days = Math.floor((Date.parse(`${istanbulDate()}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86400000);
  return Math.max(1, Math.min(length, Math.floor(days / 7) + 1));
}

export function RoadmapAreaOverview({ areas }: { areas: Area[] }) {
  const workspace = useWorkspace();
  const roadmap = workspace.learningRoadmap;
  const plan = roadmap?.plan;
  if (!plan) return <section className="surface area-roadmap-overview"><div className="area-roadmap-intro"><GitBranch size={22} /><div><p className="north-eyebrow">YOL HARİTASI</p><h2>Planını alanlarınla birleştir</h2><p>Yol haritanı oluştur veya JSON dosyanı içe aktar. Sonra her çalışma alanının görevlerini burada gör.</p></div></div><Button asChild variant="outline"><Link href="/roadmap">Yol haritasını aç <ArrowRight size={15} /></Link></Button></section>;

  const tasks = plan.weeks.flatMap((week) => week.tasks);
  const labels = [...new Set(tasks.map((task) => task.area))].sort((a, b) => a.localeCompare(b, "tr"));
  const done = tasks.filter((task) => roadmapStatus(roadmap, task.id) === "tamamlandı").length;
  const unmatched = labels.filter((label) => !resolveRoadmapAreaId(label, areas, roadmap.areaLinks));

  return <section className="surface area-roadmap-overview">
    <div className="area-roadmap-intro"><GitBranch size={23} /><div><p className="north-eyebrow">YOL HARİTASI · ALAN BAĞLANTILARI</p><h2>{plan.title}</h2><p>{done} / {tasks.length} görev tamamlandı · {unmatched.length ? `${unmatched.length} alan etiketi eşleştirilmeyi bekliyor` : "Tüm alan etiketleri eşleşti"}</p></div></div>
    <div className="area-roadmap-mappings">{labels.map((label) => {
      const automatic = resolveRoadmapAreaId(label, areas, {});
      const count = tasks.filter((task) => task.area === label).length;
      return <label key={label}><span><b>{label}</b><small>{count} görev</small></span><select aria-label={`${label} yol haritası alanını bağla`} value={roadmap.areaLinks[label] ?? ""} onChange={(event) => workspace.updateLearningRoadmap((current) => { const areaLinks = { ...current.areaLinks }; if (event.target.value) areaLinks[label] = event.target.value; else delete areaLinks[label]; return { ...current, areaLinks }; })}><option value="">{automatic ? `Otomatik · ${areas.find((area) => area.id === automatic)?.name}` : "Alan seç"}</option><option value="-">Eşleştirme yok</option>{areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select></label>;
    })}</div>
    <Button asChild variant="ghost" size="sm"><Link href="/roadmap">Tüm haftaları yönet <ArrowRight size={14} /></Link></Button>
  </section>;
}

export function RoadmapAreaBadge({ area, areas }: { area: Area; areas: Area[] }) {
  const roadmap = useWorkspace().learningRoadmap;
  if (!roadmap?.plan) return null;
  const tasks = roadmap.plan.weeks.flatMap((week) => week.tasks).filter((task) => resolveRoadmapAreaId(task.area, areas, roadmap.areaLinks) === area.id);
  if (!tasks.length) return null;
  const done = tasks.filter((task) => roadmapStatus(roadmap, task.id) === "tamamlandı").length;
  return <Link href={`/areas/${area.id}#roadmap`} className="area-roadmap-badge"><GitBranch size={13} /><span>Yol haritası</span><b>{done}/{tasks.length}</b><ArrowRight size={13} /></Link>;
}

export function AreaRoadmapTab({ area, areas }: { area: Area; areas: Area[] }) {
  const workspace = useWorkspace();
  const roadmap = workspace.learningRoadmap;
  const plan = roadmap?.plan;
  const [selectedWeek, setSelectedWeek] = useState(() => plan ? planWeek(plan.startDate, plan.weeks.length) : 1);
  const [showAll, setShowAll] = useState(false);
  if (!roadmap || !plan) return <div className="surface area-roadmap-empty"><GitBranch size={25} /><h2>Henüz bir yol haritası yok</h2><p>Plan oluşturduğunda bu alana bağlanan görevler burada görünür.</p><Button asChild><Link href="/roadmap">Plan oluştur veya içe aktar</Link></Button></div>;

  const tasks = plan.weeks.flatMap((week) => week.tasks).filter((task) => resolveRoadmapAreaId(task.area, areas, roadmap.areaLinks) === area.id);
  const weeks = [...new Set(tasks.map((task) => getScheduledWeek(roadmap, task)))].sort((a, b) => a - b);
  const displayWeek = weeks.includes(selectedWeek) ? selectedWeek : (weeks[0] ?? 1);
  const shown = tasks.filter((task) => (showAll || getScheduledWeek(roadmap, task) === displayWeek)).sort((a, b) => getScheduledWeek(roadmap, a) - getScheduledWeek(roadmap, b));
  const done = tasks.filter((task) => roadmapStatus(roadmap, task.id) === "tamamlandı").length;
  const progress = tasks.length ? Math.round(done / tasks.length * 100) : 0;

  function updateStatus(task: RoadmapTask, status: RoadmapStatus) {
    workspace.updateLearningRoadmap((current) => ({ ...current, records: { ...current.records, [task.id]: { ...current.records[task.id], status, ...(status === "tamamlandı" && !current.records[task.id]?.date ? { date: istanbulDate() } : {}) } } }));
  }

  function startWeek() {
    if (!roadmap) return;
    const preview = activateRoadmapWeek(roadmap, workspace.north ?? initializeNorth(workspace), displayWeek, istanbulToday(), area.id);
    if (!preview.created) return toast.info(preview.unmapped.length ? "Önce alan bağlantılarını düzenle." : "Bu haftanın uygun görevleri zaten planda veya tamamlandı.");
    workspace.activateRoadmapWeek(displayWeek, area.id);
    toast.success(`${preview.scheduled} görev günlere yayıldı${preview.pooled ? `; ${preview.pooled} görev haftalık havuzda` : ""}.`);
  }

  return <section className="area-roadmap-tab space-y-4">
    <div className="surface area-roadmap-summary"><div><p className="north-eyebrow">{plan.title}</p><h2>{area.name} yol haritası</h2><p>İlerleme yalnızca işaretlediğin görevlerden hesaplanır.</p></div><div className="area-roadmap-progress"><strong>{progress}%</strong><span>{done} / {tasks.length} görev</span></div></div>
    {!tasks.length ? <div className="surface area-roadmap-empty"><Link2 size={23} /><h2>Bu alana bağlı görev yok</h2><p>Alanlar sayfasında yol haritası etiketlerini bu alanla eşleştir.</p><Button asChild variant="outline"><Link href="/areas">Alan bağlantılarını düzenle</Link></Button></div> : <>
      <div className="area-roadmap-filter"><label>Hafta <select value={displayWeek} onChange={(event) => { setSelectedWeek(Number(event.target.value)); setShowAll(false); }}>{weeks.map((week) => <option key={week} value={week}>Hafta {week} · {plan.weeks[week - 1]?.title}</option>)}</select></label><div className="flex flex-wrap gap-2"><Button size="sm" onClick={startWeek}><Play size={14} /> Başlat ve haftaya yay</Button><Button variant="outline" size="sm" onClick={() => setShowAll(!showAll)}>{showAll ? "Seçili haftayı göster" : "Tüm görevleri göster"}</Button><Button asChild variant="outline" size="sm"><Link href="/week">Haftalık planı aç</Link></Button></div></div>
      <div className="area-roadmap-task-list">{shown.map((task) => { const status = roadmapStatus(roadmap, task.id); const record = roadmap.records[task.id]; return <article key={task.id} className="surface area-roadmap-task"><div className="area-roadmap-task-main"><span className="area-roadmap-task-week">HAFTA {getScheduledWeek(roadmap, task)} · {task.day} · {task.minutes} dk</span><h3>{task.title}</h3><p>{task.detail}</p><div className="area-roadmap-task-links">{/^https?:\/\//i.test(task.resource.url) && <a href={task.resource.url} target="_blank" rel="noreferrer"><ExternalLink size={13} /> {task.resource.label || "Kaynak"}</a>}{record?.proofUrl && /^https?:\/\//i.test(record.proofUrl) && <a href={record.proofUrl} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Kanıt</a>}<Link href={`/roadmap?week=${getScheduledWeek(roadmap, task)}`}>Ayrıntıyı düzenle <ArrowRight size={13} /></Link></div></div><label className="area-roadmap-status">Durum<select aria-label={`${task.title} durumu`} value={status} onChange={(event) => updateStatus(task, event.target.value as RoadmapStatus)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select>{status === "tamamlandı" && <CheckCircle2 size={16} />}</label></article>; })}</div>
    </>}
  </section>;
}
