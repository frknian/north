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
  const areas = state?.areas ?? [];
  const currentArea = areas.find(area => area.id === current?.areaId);
  const completed = new Set((state?.activities ?? []).filter(activity => activity.date === today && activity.outcome === "done").map(activity => activity.taskId)).size;
  const plannedMinutes = sequence.reduce((total, task) => total + task.minutes, 0);
  const adaptation = state?.dailyAdaptation?.date === today ? state.dailyAdaptation : undefined;
  const dateLabel = new Date(`${today}T12:00:00`).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
  const direction = currentArea
    ? `Bugünün ana önceliği ${currentArea.name}. ${next[0] ? `${areas.find(area => area.id === next[0].areaId)?.name ?? "Sonraki görev"} ikinci sırada.` : "Tek bir anlamlı adım yeterli."}`
    : "North, sıradaki anlamlı adımını bulmaya hazır.";

  const wisdom = getTodayWisdom();
  const hour = new Date().getHours();
  const libraryCount = hour < 6 ? 16 : hour < 10 ? 38 : hour < 15 ? 64 : hour < 19 ? 82 : hour < 23 ? 56 : 24;

  if (!ready) return <div className="page-content" aria-busy="true">Planorth hazırlanıyor…</div>;

  return (
    <div className="page-content north-today-v2 max-w-[1240px] px-3.5 sm:px-6 lg:px-8 py-2.5 lg:py-3 space-y-3 sm:space-y-4">
      <header className="north-today-header flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-6 mb-2 sm:mb-3">
        <div className="w-full md:w-auto">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="north-eyebrow mb-0 text-[11px] font-bold text-primary tracking-wider uppercase">{dateLabel}</p>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <Users className="size-3" />
              Sanal Kütüphane: {libraryCount} kişi odakta
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground">Bugün ne yapacaksın?</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-xl line-clamp-1">{direction}</p>
        </div>
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-2 pt-1 border-t md:border-t-0 border-border/60">
          <Companion state={state}/>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="xs" onClick={() => setMorningOpen(true)} className="rounded-lg text-[11px] h-7 px-2.5 shadow-2xs">
              <Sun className="mr-1 size-3 text-amber-500" />
              Sabah Pusulası
            </Button>
            <Button variant="outline" size="xs" onClick={() => setEveningOpen(true)} className="rounded-lg text-[11px] h-7 px-2.5 shadow-2xs">
              <Moon className="mr-1 size-3 text-indigo-400" />
              Günü Kapat
            </Button>
          </div>
        </div>
      </header>

      {/* 2-COLUMN COCKPIT (SINGLE SCREEN FIT ON DESKTOP) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 lg:gap-5 items-start">
        {/* LEFT COLUMN: Wisdom/Adaptation + NOW CARD */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {adaptation ? (
            <section className="north-adaptation" aria-live="polite">
              <Sparkles size={16}/><div><p>North gününü yeniden okudu</p><span>{adaptation.message}</span></div>
              <div className="north-adaptation-actions">
                {adaptation.taskId && adaptation.recommendedMinutes && (
                  <Button size="xs" onClick={() => update(currentState => ({ ...currentState, tasks: currentState.tasks.map(task => task.id === adaptation.taskId ? { ...task, minutes: adaptation.recommendedMinutes! } : task), dailyAdaptation: undefined }))}>Öneriyi uygula</Button>
                )}
                <Button size="xs" variant="ghost" onClick={() => update(currentState => ({ ...currentState, dailyAdaptation: undefined }))}>Planı koru</Button>
              </div>
            </section>
          ) : (
            <div className="rounded-xl border border-border/50 bg-card/40 px-3 py-2 text-xs flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                <Feather className="size-3.5 text-primary shrink-0" />
                <p className="italic text-foreground truncate text-xs">
                  &ldquo;{wisdom.quote}&rdquo; <span className="text-muted-foreground font-normal">— {wisdom.author}</span>
                </p>
              </div>
              <Button asChild size="xs" variant="ghost" className="shrink-0 text-[11px] h-6 px-2">
                <Link href="/coach">Koça Danış</Link>
              </Button>
            </div>
          )}

          {current ? (
            <section className="north-now-card rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
              <div className="north-now-label flex items-center justify-between text-xs font-semibold text-primary">
                <span className="uppercase tracking-wider">ŞİMDİ</span>
                <span className="font-medium text-muted-foreground">{currentArea?.icon} {currentArea?.name}</span>
              </div>
              <div className="north-now-content mt-2.5 sm:mt-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-foreground">{current.title}</h2>
                  {current.goal && (
                    <p className="north-now-goal text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{current.goal}</p>
                  )}
                </div>
                <div className="north-now-time flex sm:flex-col items-baseline sm:items-end gap-1 shrink-0 bg-muted/40 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-xl">
                  <strong className="text-2xl sm:text-3xl font-black text-primary font-mono">{current.minutes}</strong>
                  <span className="text-[10px] text-muted-foreground">dakika</span>
                </div>
              </div>
              <div className="north-now-actions mt-3.5 sm:mt-4 flex items-center gap-3">
                <Button asChild size="default" className="h-9 px-4 text-sm font-semibold shadow-xs">
                  <Link href={`/focus/${current.id}`}><Play size={15} className="fill-current mr-1.5"/>Odaklanmaya başla</Link>
                </Button>
              </div>
            </section>
          ) : completed > 0 ? (
            <RestCelebrationCard
              completedCount={completed}
              totalMinutes={state.activities.filter(a => a.date === today && a.outcome === "done").reduce((acc, a) => acc + a.minutes, 0)}
              areaCount={new Set(state.activities.filter(a => a.date === today && a.outcome === "done").map(a => a.areaId)).size || 1}
            />
          ) : (
            <section className="north-empty-state p-5 rounded-2xl border border-border bg-card/60 text-center sm:text-left space-y-2.5">
              <p className="text-xs font-bold text-primary tracking-wider uppercase">ŞİMDİ</p>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">Bugün için net bir sonraki adım yok.</h2>
              <span className="text-xs text-muted-foreground block">Bir hedef ekle veya North’tan haftanı planlamasını iste.</span>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Button asChild size="sm" className="w-full sm:w-auto"><Link href="/week">Planı aç</Link></Button>
                <Button asChild size="sm" variant="outline" className="w-full sm:w-auto"><Link href="/coach">Koç ile konuş</Link></Button>
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: Next Tasks + Micro Habits + Summary Footer */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <section className="rounded-2xl border border-border/70 bg-card/50 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">SONRAKİ</p>
                <h2 className="text-xs sm:text-sm font-bold text-foreground">Sıra sende değil, planında.</h2>
              </div>
              <Link href="/week" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0">
                Planı düzenle <ArrowRight size={13}/>
              </Link>
            </div>
            {next.length > 0 ? (
              <div className="divide-y divide-border/60">
                {next.map((task, index) => {
                  const area = state.areas.find(item => item.id === task.areaId);
                  return (
                    <article key={task.id} className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-2.5 py-2">
                      <span className="text-xs font-mono text-muted-foreground font-bold">{String(index + 2).padStart(2, "0")}</span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-primary truncate">{area?.name}</p>
                        <h3 className="text-xs font-medium text-foreground truncate">{task.title}</h3>
                      </div>
                      <time className="text-xs font-mono text-muted-foreground font-medium shrink-0">{task.minutes} dk</time>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2">Sırada bekleyen başka görev yok. Günlük akışın tamamlandı veya serbest zaman.</p>
            )}
          </section>

          <MicroHabitsWidget />

          <footer className="rounded-xl border border-border/60 bg-card/30 px-3.5 py-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2.5 text-[11px]">
              <span><b className="text-foreground">{completed}</b> / {Math.max(completed + sequence.length, 1)} bitti</span>
              <span>•</span>
              <span><b className="text-foreground">{plannedMinutes}</b> dk plan</span>
            </div>
            <Link href="/progress" className="text-primary hover:underline font-medium inline-flex items-center gap-1 text-[11px]">
              İlerlemeyi gör <ArrowRight size={12}/>
            </Link>
          </footer>
        </div>
      </div>

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
