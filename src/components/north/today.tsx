"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Feather, Moon, Play, Sparkles, Sun, Users } from "lucide-react";
import { dailySelection, dayKey, rolloverUnfinishedTasks } from "@/lib/north";
import { useNorth, Companion } from "./shared";
import { Button } from "@/components/ui/button";
import { RestCelebrationCard } from "./progress-charts";
import { getTodayWisdom } from "@/lib/daily-wisdom";
import { MicroHabitsWidget, MorningCompassModal, EveningWinddownModal } from "./daily-rituals";

export function NorthToday() {
  const { state, update, ready } = useNorth();
  const [morningOpen, setMorningOpen] = useState(false);
  const [eveningOpen, setEveningOpen] = useState(false);
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

  const wisdom = getTodayWisdom();
  const hour = new Date().getHours();
  const libraryCount = hour < 6 ? 16 : hour < 10 ? 38 : hour < 15 ? 64 : hour < 19 ? 82 : hour < 23 ? 56 : 24;

  if (!ready) return <div className="page-content" aria-busy="true">North hazırlanıyor…</div>;

  return (
    <div className="page-content north-today-v2 space-y-6">
    <header className="north-today-header">
      <div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <p className="north-eyebrow mb-0">{dateLabel}</p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Users className="size-3" />
            Sanal Kütüphane: {libraryCount} kişi odakta
          </span>
        </div>
        <h1>Bugün ne yapacaksın?</h1>
        <p>{direction}</p>
      </div>
      <div className="flex flex-col sm:items-end gap-2">
        <Companion state={state}/>
        <div className="flex gap-1.5">
          <Button variant="outline" size="xs" onClick={() => setMorningOpen(true)} className="rounded-lg text-[11px] h-7">
            <Sun className="mr-1 size-3 text-amber-500" />
            Sabah Pusulası
          </Button>
          <Button variant="outline" size="xs" onClick={() => setEveningOpen(true)} className="rounded-lg text-[11px] h-7">
            <Moon className="mr-1 size-3 text-indigo-400" />
            Günü Kapat
          </Button>
        </div>
      </div>
    </header>

    <div className="rounded-2xl border border-border/60 bg-card/40 px-4 py-3 text-xs flex items-start gap-2.5 shadow-xs">
      <Feather className="size-4 text-primary shrink-0 mt-0.5" />
      <div>
        <p className="italic text-foreground font-serif text-[13px] leading-relaxed">
          &ldquo;{wisdom.quote}&rdquo;
        </p>
        <span className="text-[10px] text-muted-foreground font-sans mt-0.5 block">— {wisdom.author}</span>
      </div>
    </div>

    {adaptation && <section className="north-adaptation" aria-live="polite">
      <Sparkles size={17}/><div><p>North gününü yeniden okudu</p><span>{adaptation.message}</span></div>
      <div className="north-adaptation-actions">
        {adaptation.taskId && adaptation.recommendedMinutes && <Button size="sm" onClick={() => update(currentState => ({ ...currentState, tasks: currentState.tasks.map(task => task.id === adaptation.taskId ? { ...task, minutes: adaptation.recommendedMinutes! } : task), dailyAdaptation: undefined }))}>Öneriyi uygula</Button>}
        <Button size="sm" variant="ghost" onClick={() => update(currentState => ({ ...currentState, dailyAdaptation: undefined }))}>Planı koru</Button>
      </div>
    </section>}

    <section className="north-ai-nudge" aria-label="North önerisi"><Sparkles size={17}/><div><p>North&apos;un bugünkü önerisi</p><span>{current ? `${current.title} ile başla; ardından planını gerçek enerjine göre güncelleyelim.` : "Takviminde net bir başlangıç yok. Bir sonraki küçük adımı birlikte seçelim."}</span></div><Button asChild size="sm" variant="outline"><Link href="/north-ai">North&apos;a sor</Link></Button></section>

    {current ? (
      <section className="north-now-card">
        <div className="north-now-label"><span>ŞİMDİ</span><span>{currentArea?.icon} {currentArea?.name}</span></div>
        <div className="north-now-content"><div><h2>{current.title}</h2><p className="north-now-goal">{current.goal}</p><p className="north-now-reason">{current.why || "Bu görev, haftalık yönündeki en etkili sonraki adım."}</p></div><div className="north-now-time"><strong>{current.minutes}</strong><span>dakika</span></div></div>
        <div className="north-now-actions"><Button asChild size="lg"><Link href={`/focus/${current.id}`}><Play size={17}/>Odaklanmaya başla</Link></Button><details><summary>Neden bu görev?</summary><p>{current.why || "Hedefin, bu haftaki planın ve tamamlanmamış işlerin dikkate alınarak seçildi."}</p></details></div>
      </section>
    ) : completed > 0 ? (
      <RestCelebrationCard
        completedCount={completed}
        totalMinutes={state.activities.filter(a => a.date === today && a.outcome === "done").reduce((acc, a) => acc + a.minutes, 0)}
        areaCount={new Set(state.activities.filter(a => a.date === today && a.outcome === "done").map(a => a.areaId)).size || 1}
      />
    ) : (
      <section className="north-empty-state"><p>ŞİMDİ</p><h2>Bugün için net bir sonraki adım yok.</h2><span>Bir hedef ekle veya North’tan haftanı planlamasını iste.</span><div><Button asChild><Link href="/week">Planı aç</Link></Button><Button asChild variant="ghost"><Link href="/north-ai">North AI ile konuş</Link></Button></div></section>
    )}

    {next.length > 0 && <section className="north-next-section"><div className="north-next-heading"><div><p>SONRAKİ</p><h2>Sıra sende değil, planında.</h2></div><Link href="/week">Planı düzenle <ArrowRight size={15}/></Link></div><div className="north-next-list">{next.map((task, index) => { const area = state.areas.find(item => item.id === task.areaId); return <article key={task.id}><span>{String(index + 2).padStart(2, "0")}</span><div><p>{area?.name}</p><h3>{task.title}</h3></div><time>{task.minutes} dk</time></article>; })}</div></section>}

    <MicroHabitsWidget />

    <footer className="north-today-footer"><span><b>{completed}</b> / {Math.max(completed + sequence.length, 1)} tamamlandı</span><span><b>{plannedMinutes}</b> dk sırada</span><Link href="/progress">Gerçek ilerlemeyi gör <ArrowRight size={14}/></Link></footer>

    {/* RITUAL MODALS */}
    <MorningCompassModal
      open={morningOpen}
      onOpenChange={setMorningOpen}
      state={state}
      onSelectPrimary={(taskId) => {
        update((curr) => ({
          ...curr,
          tasks: curr.tasks.map((t) => (t.id === taskId ? { ...t, mandatory: true, date: today } : t)),
        }));
      }}
    />

    <EveningWinddownModal
      open={eveningOpen}
      onOpenChange={setEveningOpen}
      state={state}
      onApplyRollover={() => {
        const result = rolloverUnfinishedTasks(state, today);
        update(() => result.state);
      }}
    />
  </div>
  );
}
