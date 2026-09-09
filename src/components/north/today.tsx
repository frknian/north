"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Feather, Moon, Play, Sparkles, Sun, Zap, BookOpen } from "lucide-react";
import { dailySelection, dayKey, rolloverUnfinishedTasks } from "@/lib/north";
import { useNorth, Companion } from "./shared";
import { Button } from "@/components/ui/button";
import { RestCelebrationCard } from "./progress-charts";
import { getTodayWisdom } from "@/lib/daily-wisdom";
import { MicroHabitsWidget, MorningCompassModal, EveningWinddownModal } from "./daily-rituals";
import { FocusLauncherDialog } from "./focus-launcher-dialog";

export function NorthToday() {
  const { state, update, ready } = useNorth();
  const [morningOpen, setMorningOpen] = useState(false);
  const [eveningOpen, setEveningOpen] = useState(false);
  const [focusLauncherOpen, setFocusLauncherOpen] = useState(false);
  const [focusLauncherMode, setFocusLauncherMode] = useState<"free" | "reading">("free");
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

  if (!ready) return <div className="page-content" aria-busy="true">Planorth hazırlanıyor…</div>;

  return (
    <div className="page-content north-today-v2 space-y-6 pb-20 md:pb-12">
      <header className="north-today-header flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-8 mb-4 sm:mb-6">
        <div className="w-full md:w-auto">
          <p className="north-eyebrow mb-1 text-[11px] font-bold text-primary tracking-wider uppercase">{dateLabel}</p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">Bugün ne yapacaksın?</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">{direction}</p>
        </div>
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-2 pt-1 border-t md:border-t-0 border-border/60">
          <Companion state={state}/>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="xs" onClick={() => setMorningOpen(true)} className="rounded-lg text-[11px] h-8 px-2.5 shadow-2xs">
              <Sun className="mr-1 size-3.5 text-amber-500" />
              Sabah Pusulası
            </Button>
            <Button variant="outline" size="xs" onClick={() => setEveningOpen(true)} className="rounded-lg text-[11px] h-8 px-2.5 shadow-2xs">
              <Moon className="mr-1 size-3.5 text-indigo-400" />
              Günü Kapat
            </Button>
          </div>
        </div>
      </header>

      {/* AKILLI UYARI VEYA GÜNLÜK İLHAM (TEK, TEMİZ ŞERİT) */}
      {adaptation ? (
        <section className="north-adaptation" aria-live="polite">
          <Sparkles size={17}/><div><p>North gününü yeniden okudu</p><span>{adaptation.message}</span></div>
          <div className="north-adaptation-actions">
            {adaptation.taskId && adaptation.recommendedMinutes && (
              <Button size="sm" onClick={() => update(currentState => ({ ...currentState, tasks: currentState.tasks.map(task => task.id === adaptation.taskId ? { ...task, minutes: adaptation.recommendedMinutes! } : task), dailyAdaptation: undefined }))}>Öneriyi uygula</Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => update(currentState => ({ ...currentState, dailyAdaptation: undefined }))}>Planı koru</Button>
          </div>
        </section>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card/40 px-3.5 py-2.5 text-xs flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 text-muted-foreground min-w-0">
            <Feather className="size-3.5 text-primary shrink-0" />
            <p className="italic text-foreground truncate text-xs">
              &ldquo;{wisdom.quote}&rdquo; <span className="text-muted-foreground font-normal">— {wisdom.author}</span>
            </p>
          </div>
          <Button asChild size="xs" variant="ghost" className="shrink-0 text-[11px] h-7 px-2">
            <Link href="/coach">Koça Danış</Link>
          </Button>
        </div>
      )}

      {current ? (
        <section className="north-now-card rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
          <div className="north-now-label flex items-center justify-between text-xs font-semibold text-primary">
            <span className="uppercase tracking-wider">ŞİMDİ</span>
            <span className="font-medium text-muted-foreground">{currentArea?.icon} {currentArea?.name}</span>
          </div>
          <div className="north-now-content mt-3 sm:mt-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{current.title}</h2>
              {current.goal && (
                <p className="north-now-goal text-xs sm:text-sm text-muted-foreground mt-1.5">{current.goal}</p>
              )}
            </div>
            <div className="north-now-time flex md:flex-col items-baseline md:items-end gap-1 shrink-0 bg-muted/40 md:bg-transparent px-3 py-1.5 md:p-0 rounded-xl">
              <strong className="text-2xl sm:text-3xl font-black text-primary font-mono">{current.minutes}</strong>
              <span className="text-[11px] text-muted-foreground">dakika</span>
            </div>
          </div>
          <div className="north-now-actions mt-5 flex flex-wrap items-center gap-2.5">
            <Button asChild size="lg" className="h-10 px-5 text-sm font-semibold shadow-xs">
              <Link href={`/focus/${current.id}`}><Play size={16} className="fill-current mr-1.5"/>Odaklanmaya başla</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => { setFocusLauncherMode("free"); setFocusLauncherOpen(true); }}
              className="h-10 px-3.5 text-xs font-semibold rounded-xl"
            >
              <Zap className="size-3.5 mr-1.5 text-amber-500" /> Serbest Odak
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => { setFocusLauncherMode("reading"); setFocusLauncherOpen(true); }}
              className="h-10 px-3.5 text-xs font-semibold rounded-xl"
            >
              <BookOpen className="size-3.5 mr-1.5 text-primary" /> Kitap Okuma
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
        <section className="north-empty-state p-6 sm:p-8 rounded-2xl border border-border bg-card/60 text-center sm:text-left space-y-3">
          <p className="text-xs font-bold text-primary tracking-wider uppercase">ŞİMDİ</p>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Bugün için net bir sonraki adım yok.</h2>
          <span className="text-xs sm:text-sm text-muted-foreground block">Bir hedef ekle veya sistemden bağımsız hemen serbest bir odak oturumu başlat.</span>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              onClick={() => { setFocusLauncherMode("free"); setFocusLauncherOpen(true); }}
              className="rounded-xl text-xs font-semibold shadow-xs"
            >
              <Zap className="size-3.5 mr-1.5 fill-current" /> Serbest Odak Başlat
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setFocusLauncherMode("reading"); setFocusLauncherOpen(true); }}
              className="rounded-xl text-xs font-semibold"
            >
              <BookOpen className="size-3.5 mr-1.5 text-primary" /> Kitap Okuma Odağı
            </Button>
            <Button asChild variant="ghost" className="rounded-xl text-xs">
              <Link href="/week">Planı aç</Link>
            </Button>
            <Button asChild variant="ghost" className="rounded-xl text-xs">
              <Link href="/coach">Koç ile konuş</Link>
            </Button>
          </div>
        </section>
      )}

      {next.length > 0 && (
        <section className="north-next-section mt-6">
          <div className="north-next-heading flex items-end justify-between gap-3 mb-3">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">SONRAKİ</p>
              <h2 className="text-base sm:text-lg font-bold text-foreground">Sıra sende değil, planında.</h2>
            </div>
            <Link href="/week" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0">
              Planı düzenle <ArrowRight size={14}/>
            </Link>
          </div>
          <div className="north-next-list divide-y divide-border border-y border-border">
            {next.map((task, index) => {
              const area = state.areas.find(item => item.id === task.areaId);
              return (
                <article key={task.id} className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 py-3">
                  <span className="text-xs font-mono text-muted-foreground font-bold">{String(index + 2).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-primary truncate">{area?.name}</p>
                    <h3 className="text-xs sm:text-sm font-medium text-foreground truncate">{task.title}</h3>
                  </div>
                  <time className="text-xs font-mono text-muted-foreground font-medium shrink-0">{task.minutes} dk</time>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <MicroHabitsWidget />

      <footer className="north-today-footer pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-muted-foreground pb-6">
        <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
          <span><b className="text-foreground">{completed}</b> / {Math.max(completed + sequence.length, 1)} tamamlandı</span>
          <span>•</span>
          <span><b className="text-foreground">{plannedMinutes}</b> dk sırada</span>
        </div>
        <Link href="/progress" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
          Gerçek ilerlemeyi gör <ArrowRight size={14}/>
        </Link>
      </footer>

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

    <FocusLauncherDialog
      open={focusLauncherOpen}
      onOpenChange={setFocusLauncherOpen}
      defaultMode={focusLauncherMode}
    />
  </div>
  );
}
