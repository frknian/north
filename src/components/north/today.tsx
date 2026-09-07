"use client";

import Link from "next/link";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { dailySelection, dayKey } from "@/lib/north";
import { useNorth, Companion } from "./shared";
import { Button } from "@/components/ui/button";

export function NorthToday() {
  const { state, update, ready } = useNorth();
  const today = dayKey();
  const sequence = dailySelection(state, today);
  const current = sequence[0];
  const next = sequence.slice(1, 3);
  const currentArea = state.areas.find(area => area.id === current?.areaId);
  const completed = new Set(state.activities.filter(activity => activity.date === today && activity.outcome === "done").map(activity => activity.taskId)).size;
  const plannedMinutes = sequence.reduce((total, task) => total + task.minutes, 0);
  const adaptation = state.dailyAdaptation?.date === today ? state.dailyAdaptation : undefined;
  const dateLabel = new Date(`${today}T12:00:00`).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
  const direction = currentArea
    ? `Bugünün ana önceliği ${currentArea.name}. ${next[0] ? `${state.areas.find(area => area.id === next[0].areaId)?.name ?? "Sonraki görev"} ikinci sırada.` : "Tek bir anlamlı adım yeterli."}`
    : "North, sıradaki anlamlı adımını bulmaya hazır.";

  if (!ready) return <div className="page-content" aria-busy="true">North hazırlanıyor…</div>;

  return <div className="page-content north-today-v2">
    <header className="north-today-header">
      <div><p className="north-eyebrow">{dateLabel}</p><h1>Bugün ne yapacaksın?</h1><p>{direction}</p></div>
      <Companion state={state}/>
    </header>

    {adaptation && <section className="north-adaptation" aria-live="polite">
      <Sparkles size={17}/><div><p>North gününü yeniden okudu</p><span>{adaptation.message}</span></div>
      <div className="north-adaptation-actions">
        {adaptation.taskId && adaptation.recommendedMinutes && <Button size="sm" onClick={() => update(currentState => ({ ...currentState, tasks: currentState.tasks.map(task => task.id === adaptation.taskId ? { ...task, minutes: adaptation.recommendedMinutes! } : task), dailyAdaptation: undefined }))}>Öneriyi uygula</Button>}
        <Button size="sm" variant="ghost" onClick={() => update(currentState => ({ ...currentState, dailyAdaptation: undefined }))}>Planı koru</Button>
      </div>
    </section>}

    <section className="north-ai-nudge" aria-label="North önerisi"><Sparkles size={17}/><div><p>North&apos;un bugünkü önerisi</p><span>{current ? `${current.title} ile başla; ardından planını gerçek enerjine göre güncelleyelim.` : "Takviminde net bir başlangıç yok. Bir sonraki küçük adımı birlikte seçelim."}</span></div><Button asChild size="sm" variant="outline"><Link href="/north-ai">North&apos;a sor</Link></Button></section>

    {current ? <section className="north-now-card">
      <div className="north-now-label"><span>ŞİMDİ</span><span>{currentArea?.icon} {currentArea?.name}</span></div>
      <div className="north-now-content"><div><h2>{current.title}</h2><p className="north-now-goal">{current.goal}</p><p className="north-now-reason">{current.why || "Bu görev, haftalık yönündeki en etkili sonraki adım."}</p></div><div className="north-now-time"><strong>{current.minutes}</strong><span>dakika</span></div></div>
      <div className="north-now-actions"><Button asChild size="lg"><Link href={`/focus/${current.id}`}><Play size={17}/>Odaklanmaya başla</Link></Button><details><summary>Neden bu görev?</summary><p>{current.why || "Hedefin, bu haftaki planın ve tamamlanmamış işlerin dikkate alınarak seçildi."}</p></details></div>
    </section> : <section className="north-empty-state"><p>ŞİMDİ</p><h2>Bugün için net bir sonraki adım yok.</h2><span>Bir hedef ekle veya North’tan haftanı planlamasını iste.</span><div><Button asChild><Link href="/week">Planı aç</Link></Button><Button asChild variant="ghost"><Link href="/north-ai">North AI ile konuş</Link></Button></div></section>}

    {next.length > 0 && <section className="north-next-section"><div className="north-next-heading"><div><p>SONRAKİ</p><h2>Sıra sende değil, planında.</h2></div><Link href="/week">Planı düzenle <ArrowRight size={15}/></Link></div><div className="north-next-list">{next.map((task, index) => { const area = state.areas.find(item => item.id === task.areaId); return <article key={task.id}><span>{String(index + 2).padStart(2, "0")}</span><div><p>{area?.name}</p><h3>{task.title}</h3></div><time>{task.minutes} dk</time></article>; })}</div></section>}

    <footer className="north-today-footer"><span><b>{completed}</b> / {Math.max(completed + sequence.length, 1)} tamamlandı</span><span><b>{plannedMinutes}</b> dk sırada</span><Link href="/progress">Gerçek ilerlemeyi gör <ArrowRight size={14}/></Link></footer>
  </div>;
}
