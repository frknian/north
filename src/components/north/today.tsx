"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Feather, GitBranch, Moon, Play, Sparkles, Sun, Zap, BookOpen, Target, GraduationCap, Search } from "lucide-react";
import { dailySelection, dayKey, getActiveSprint, rolloverUnfinishedTasks } from "@/lib/north";
import { getScheduledWeek, roadmapStatus } from "@/lib/learning-roadmap";
import { useNorth, Companion } from "./shared";
import { Button } from "@/components/ui/button";
import { RestCelebrationCard } from "./progress-charts";
import { getTodayWisdom } from "@/lib/daily-wisdom";
import { MicroHabitsWidget, MorningCompassModal, EveningWinddownModal } from "./daily-rituals";
import { FocusLauncherDialog } from "./focus-launcher-dialog";
import { SprintLauncherDialog } from "./area-sprint-hub";

export function NorthToday() {
  const { state, update, ready, workspace } = useNorth();
  const [morningOpen, setMorningOpen] = useState(false);
  const [eveningOpen, setEveningOpen] = useState(false);
  const [focusLauncherOpen, setFocusLauncherOpen] = useState(false);
  const [focusLauncherMode, setFocusLauncherMode] = useState<"free" | "reading">("free");
  const [sprintLauncherOpen, setSprintLauncherOpen] = useState(false);
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
    : "Planorth, sıradaki anlamlı adımını bulmaya hazır.";

  const wisdom = getTodayWisdom();

  const activeSprint = getActiveSprint(state, currentArea?.id) || getActiveSprint(state);
  const activeSprintArea = activeSprint ? areas.find(area => area.id === activeSprint.areaId) : undefined;
  const sprintDaysLeft = activeSprint
    ? Math.max(0, Math.ceil((new Date(`${activeSprint.targetDate}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const sprintDoneCount = activeSprint ? activeSprint.modules.filter(m => m.status === "done").length : 0;
  const sprintTotalCount = activeSprint ? activeSprint.modules.length : 0;
  const isCurrentTaskInSprint = current && (current.sprintId === activeSprint?.id || Boolean(current.sprintModuleId));
  const roadmap = workspace.learningRoadmap;
  const roadmapPlan = roadmap?.plan;
  const roadmapWeek = roadmapPlan ? Math.max(1, Math.min(roadmapPlan.weeks.length, Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${roadmapPlan.startDate}T00:00:00Z`)) / 604800000) + 1)) : 0;
  const roadmapWeekTasks = roadmapPlan && roadmap ? roadmapPlan.weeks.flatMap((week) => week.tasks).filter((task) => getScheduledWeek(roadmap, task) === roadmapWeek) : [];
  const roadmapDone = roadmapWeekTasks.filter((task) => roadmap && roadmapStatus(roadmap, task.id) === "tamamlandı").length;
  const firstName = workspace.profile.fullName?.trim().split(/\s+/)[0];

  if (!ready) return <div className="page-content" aria-busy="true">Planorth hazırlanıyor…</div>;

  return (
    <div className="page-content north-today-v2 space-y-2.5 sm:space-y-3 pb-32 md:pb-2">
      <header className="north-today-header flex flex-col md:flex-row md:items-start md:justify-between gap-2.5 md:gap-6 mb-1 sm:mb-2">
          <div className="w-full md:w-auto">
            <p className="north-eyebrow mb-1 text-[11px] font-bold text-primary tracking-wider uppercase">{dateLabel}</p>
            <h1 className="text-2xl sm:text-3xl md:text-[34px] font-extrabold tracking-tight text-foreground">{firstName ? `Hoş geldin, ${firstName}` : "Bugünün odağı"}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-xl">{direction}</p>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between w-full md:w-auto gap-2 pt-1 border-t md:border-t-0 border-border/60">
            <div className="flex items-center justify-between w-full sm:w-auto gap-2">
              <Companion state={state}/>
              <div className="flex sm:hidden items-center gap-1.5 shrink-0">
                <Button variant="outline" size="xs" onClick={() => setMorningOpen(true)} className="rounded-xl text-[11px] h-8 px-2 shadow-2xs">
                  <Sun className="mr-1 size-3 text-amber-500" />
                  Sabah
                </Button>
                <Button variant="outline" size="xs" onClick={() => setEveningOpen(true)} className="rounded-xl text-[11px] h-8 px-2 shadow-2xs">
                  <Moon className="mr-1 size-3 text-indigo-400" />
                  Akşam
                </Button>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <Button variant="outline" size="xs" onClick={() => setMorningOpen(true)} className="rounded-xl text-[11px] h-8 px-2.5 shadow-2xs">
                <Sun className="mr-1 size-3.5 text-amber-500" />
                Sabah Pusulası
              </Button>
              <Button variant="outline" size="xs" onClick={() => setEveningOpen(true)} className="rounded-xl text-[11px] h-8 px-2.5 shadow-2xs">
                <Moon className="mr-1 size-3.5 text-indigo-400" />
                Günü Kapat
              </Button>
            </div>
          </div>
        </header>

        <div className="today-stitch-overview" aria-label="Bugünkü çalışma özeti">
          <div className="surface"><span>BUGÜN TAMAMLANAN</span><strong>{completed}</strong><small>Gerçek görev kayıtların</small></div>
          <div className="surface"><span>SIRADAKİ GÖREVLER</span><strong>{sequence.length}</strong><small>Bugünkü planından</small></div>
          <div className="surface"><span>PLANLANAN ODAK</span><strong>{plannedMinutes} <em>dk</em></strong><small>Kalan görev süresi</small></div>
        </div>

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
          <div className="rounded-2xl border border-border/50 bg-card/40 px-3.5 py-2 text-xs flex items-center justify-between gap-2 shadow-2xs backdrop-blur-xs">
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

        {/* AKTİF ALT KONU / SINAV KAMPI GÖSTERGESİ */}
        {activeSprint && (
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card/90 to-background px-3.5 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-2xs backdrop-blur-xs w-full max-w-full overflow-hidden">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex items-center justify-center size-5 rounded-lg bg-primary/20 text-primary shrink-0">
                <Target className="size-3" />
              </span>
              <div className="min-w-0 flex items-center gap-2">
                <span className="font-bold text-foreground truncate text-xs">
                  {activeSprintArea?.name} › {activeSprint.title}
                </span>
                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                  ({activeSprint.level})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono font-bold text-primary">
                ⏱️ {sprintDaysLeft} gün kaldı
              </span>
              <span className="text-muted-foreground text-[10px] hidden sm:inline">•</span>
              <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
                {sprintDoneCount}/{sprintTotalCount} modül
              </span>
              <Button asChild size="xs" variant="ghost" className="h-6 px-2 text-[10px] rounded-lg">
                <Link href={`/areas/${activeSprint.areaId}`}>
                  Kampa Git <ArrowRight className="size-2.5 ml-0.5" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        <div className="today-cockpit-grid">
          <div className="today-main-stack">
        {/* ŞİMDİ ODAK KARTI (DAHA BÜYÜK, DAHA MODERN VE GENİŞ) */}
        {current ? (
          <section className="north-now-card rounded-3xl border border-primary/25 bg-card/90 p-6 sm:p-7 md:p-8 shadow-md relative overflow-hidden backdrop-blur-md transition-all hover:border-primary/35">
            <div className="absolute -top-24 -right-24 size-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

            <div className="north-now-label flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-primary">
                  <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                  ŞİMDİ
                </span>
                <span className="font-medium text-xs text-muted-foreground">{currentArea?.icon} {currentArea?.name}</span>
                {activeSprint && (isCurrentTaskInSprint || currentArea?.id === activeSprint.areaId) && (
                  <span className="rounded-full bg-primary/15 text-primary border border-primary/25 px-2 py-0.5 text-[10px] font-bold truncate max-w-[160px] sm:max-w-[240px]">
                    🎯 {activeSprint.title}
                  </span>
                )}
              </div>
              {current.mandatory && (
                <span className="rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-semibold">
                  Öncelikli
                </span>
              )}
            </div>

            <div className="north-now-content mt-4 sm:mt-5 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1 min-w-0 pr-0 md:pr-4">
                <h2 className="text-2xl sm:text-3xl md:text-[32px] font-black tracking-tight text-foreground leading-[1.2]">
                  {current.title}
                </h2>
                {current.goal && (
                  <p className="north-now-goal text-xs sm:text-sm md:text-base text-muted-foreground mt-2 leading-relaxed max-w-2xl">
                    {current.goal}
                  </p>
                )}
              </div>
              <div className="north-now-time flex md:flex-col items-baseline md:items-end justify-center shrink-0 bg-primary/5 border border-primary/15 px-4 py-2 sm:px-5 sm:py-3 rounded-2xl">
                <strong className="text-3xl sm:text-4xl md:text-5xl font-black text-primary font-mono tracking-tight leading-none">
                  {current.minutes}
                </strong>
                <span className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-1">dakika</span>
              </div>
            </div>

            <div className="north-now-actions mt-5 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              <Button asChild size="lg" className="w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-7 text-sm sm:text-base font-bold rounded-2xl shadow-md shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.01] active:scale-[0.98] transition-all">
                <Link href={`/focus/${current.id}`}><Play size={17} className="fill-current mr-2"/>Odaklanmaya başla</Link>
              </Button>
              <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => { setFocusLauncherMode("free"); setFocusLauncherOpen(true); }}
                  className="w-full sm:w-auto h-10 sm:h-12 px-3 sm:px-4.5 text-xs sm:text-sm font-semibold rounded-2xl border-border/80 bg-background/80 hover:border-amber-500/40 hover:bg-amber-500/5 active:scale-[0.98] transition-all"
                >
                  <Zap className="size-3.5 sm:size-4 mr-1.5 text-amber-500 shrink-0" /> <span className="truncate">Serbest Odak</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => { setFocusLauncherMode("reading"); setFocusLauncherOpen(true); }}
                  className="w-full sm:w-auto h-10 sm:h-12 px-3 sm:px-4.5 text-xs sm:text-sm font-semibold rounded-2xl border-border/70 bg-background/80 hover:border-indigo-500/40 hover:bg-indigo-500/5 active:scale-[0.98] transition-all"
                >
                  <BookOpen className="size-3.5 sm:size-4 mr-1.5 text-indigo-500 shrink-0" /> <span className="truncate">Kitap Okuma</span>
                </Button>
              </div>
            </div>
          </section>
        ) : completed > 0 ? (
          <RestCelebrationCard
            completedCount={completed}
            totalMinutes={state.activities.filter(a => a.date === today && a.outcome === "done").reduce((acc, a) => acc + a.minutes, 0)}
            areaCount={new Set(state.activities.filter(a => a.date === today && a.outcome === "done").map(a => a.areaId)).size || 1}
          />
        ) : (
          <section className="north-empty-state p-7 sm:p-9 rounded-3xl border border-border bg-card/60 text-center sm:text-left space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-primary">
              ŞİMDİ
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Bugün için net bir sonraki adım yok.</h2>
            <span className="text-xs sm:text-sm text-muted-foreground block">Bir hedef ekle veya sistemden bağımsız hemen serbest bir odak oturumu başlat.</span>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                onClick={() => { setFocusLauncherMode("free"); setFocusLauncherOpen(true); }}
                className="rounded-xl text-xs font-semibold shadow-xs h-9 px-4"
              >
                <Zap className="size-3.5 mr-1.5 fill-current" /> Serbest Odak Başlat
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setFocusLauncherMode("reading"); setFocusLauncherOpen(true); }}
                className="rounded-xl text-xs font-semibold h-9 px-4"
              >
                <BookOpen className="size-3.5 mr-1.5 text-primary" /> Kitap Okuma Odağı
              </Button>
              <Button asChild variant="ghost" className="rounded-xl text-xs h-9 px-3">
                <Link href="/week">Planı aç</Link>
              </Button>
              <Button asChild variant="ghost" className="rounded-xl text-xs h-9 px-3">
                <Link href="/coach">Koç ile konuş</Link>
              </Button>
            </div>
          </section>
        )}

        {next.length > 0 && (
          <section className="north-next-section mt-2 shrink-0">
            <div className="north-next-heading flex items-center justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">SONRAKİ</span>
                <h2 className="text-xs sm:text-sm font-semibold text-foreground">Sıra sende değil, planında.</h2>
              </div>
              <Link href="/week" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0">
                Planı düzenle <ArrowRight size={13}/>
              </Link>
            </div>
            <div className="north-next-list divide-y divide-border border-y border-border">
              {next.map((task, index) => {
                const area = state.areas.find(item => item.id === task.areaId);
                return (
                  <article key={task.id} className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 py-1.5">
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
          </section>
        )}
          </div>
          <aside className="today-side-stack" aria-label="Bugünün yardımcı panelleri">
            <section className="surface today-zen-panel">
              <div className="today-side-heading"><span className="today-side-icon"><Zap size={19} /></span><div><p className="north-eyebrow">ZEN ODAK KOKPİTİ</p><h2>Bir oturum başlat</h2></div></div>
              <p>Hazır bir görevin olmasa da çalışma süreni ve çıktını kaydedebilirsin.</p>
              <div className="today-zen-actions"><Button onClick={() => { setFocusLauncherMode("free"); setFocusLauncherOpen(true); }}><Play size={15} /> Serbest odak</Button><Button variant="outline" onClick={() => { setFocusLauncherMode("reading"); setFocusLauncherOpen(true); }}><BookOpen size={15} /> Okuma</Button></div>
            </section>
            <section className="surface today-roadmap-panel">
              <div className="today-side-heading"><span className="today-side-icon"><GitBranch size={19} /></span><div><p className="north-eyebrow">YOL HARİTASI</p><h2>{roadmapPlan ? `${roadmapWeek}. hafta` : "Planını bağla"}</h2></div></div>
              {roadmapPlan ? <><p>{roadmapPlan.weeks[roadmapWeek - 1]?.title}</p><div className="today-roadmap-progress"><span>{roadmapDone} / {roadmapWeekTasks.length} görev</span><b>{roadmapWeekTasks.length ? Math.round(roadmapDone / roadmapWeekTasks.length * 100) : 0}%</b></div><div className="today-roadmap-bar"><span style={{ width: `${roadmapWeekTasks.length ? Math.round(roadmapDone / roadmapWeekTasks.length * 100) : 0}%` }} /></div><Link href="/areas" className="today-panel-link">Alanlardaki görevleri gör <ArrowRight size={14} /></Link></> : <><p>Öğrenme planını Alanlar içinde takip et.</p><Link href="/roadmap" className="today-panel-link">Yol haritasını aç <ArrowRight size={14} /></Link></>}
            </section>
        {/* GÜNLÜK MİKRO ALIŞKANLIKLAR (YUKARI KAYDIRILDI) */}
        <MicroHabitsWidget compact={true} />

        {/* HIZLI KISAYOLLAR: ALT KONU / SINAV KAMPI BAŞLAT & KAYNAK VE KİTAP ARA */}
        <div className="today-quick-links grid grid-cols-1 gap-2.5 pt-0.5 w-full max-w-full overflow-hidden">
          <button
            type="button"
            onClick={() => setSprintLauncherOpen(true)}
            className="group flex items-center justify-between gap-3 px-3.5 py-2 sm:py-2.5 rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-card/80 to-background hover:border-primary/50 hover:bg-primary/15 active:scale-[0.98] transition-all text-left shadow-2xs cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <GraduationCap className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">Alt Konu &amp; Sınav Kampı Başlat</p>
                <p className="text-[10px] text-muted-foreground truncate">Vize, final veya özel konu sprinti oluştur</p>
              </div>
            </div>
            <ArrowRight className="size-3.5 text-primary shrink-0 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </button>

          <Link
            href="/resources"
            className="group flex items-center justify-between gap-3 px-3.5 py-2 sm:py-2.5 rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-card/80 to-background hover:border-primary/50 hover:bg-primary/15 active:scale-[0.98] transition-all text-left shadow-2xs cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Search className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">Kaynak ve Kitap Ara</p>
                <p className="text-[10px] text-muted-foreground truncate">Web, Google PDF, NotebookLM ve kütüphane</p>
              </div>
            </div>
            <ArrowRight className="size-3.5 text-primary shrink-0 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
          </aside>
        </div>

        {/* GÜNLÜK TAMAMLANMA VE SIRA DURUMU */}
        <div className="flex items-center justify-center sm:justify-start gap-3 pt-0.5 px-1 text-[11px] text-muted-foreground">
          <span><b className="text-foreground font-semibold">{completed}</b> / {Math.max(completed + sequence.length, 1)} tamamlandı</span>
          <span>•</span>
          <span><b className="text-foreground font-semibold">{plannedMinutes}</b> dk sırada</span>
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

      <FocusLauncherDialog
        open={focusLauncherOpen}
        onOpenChange={setFocusLauncherOpen}
        defaultMode={focusLauncherMode}
      />

      <SprintLauncherDialog
        open={sprintLauncherOpen}
        onOpenChange={setSprintLauncherOpen}
        defaultAreaId={currentArea?.id || state.areas[0]?.id}
      />
    </div>
  );
}
