"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Award,
  BookOpen,
  Calendar,
  CalendarRange,
  CheckCircle2,
  Clock,
  Clock3,
  Flame,
  FlaskConical,
  GitBranch,
  Moon,
  RotateCcw,
  ShieldAlert,
  Snowflake,
  Sparkles,
  Target,
  Bot,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import {
  allocation,
  areaStreak,
  dayKey,
  shiftDay,
  weeklyConsistency,
  weekKey,
  initializeNorth,
} from "@/lib/north";
import { useNorth } from "./shared";
import { NorthIntelligencePanel } from "./intelligence-panel";
import { ProgressResetDialog } from "@/components/features/progress-reset-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CertificateModal } from "./certificate-modal";
import { FlashcardsModal } from "./flashcards";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Review } from "@/lib/types";
import { authenticatedAiFetch } from "@/lib/ai/client";
import { plannerIntelligenceContext } from "@/lib/north-intelligence";

interface NorthProgressProps {
  initialTab?: "progress" | "reviews";
}

export function NorthProgress({ initialTab }: NorthProgressProps) {
  const { state, update, workspace } = useNorth();
  const searchParams = useSearchParams();
  const queryTab = searchParams.get("tab");

  const [mainTab, setMainTab] = useState<"progress" | "reviews">(
    queryTab === "reviews" || initialTab === "reviews" ? "reviews" : "progress"
  );

  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [certOpen, setCertOpen] = useState(false);
  const [cardsOpen, setCardsOpen] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [githubLoading, setGithubLoading] = useState(false);

  // Review state
  const [reviewPeriod, setReviewPeriod] = useState<"weekly" | "monthly">("weekly");
  const [reviewBusy, setReviewBusy] = useState(false);

  const today = dayKey();
  const start = period === "weekly" ? weekKey(today) : today.slice(0, 7) + "-01";
  const sessions = state.activities.filter((a) => a.date >= start && a.date <= today);
  const areas = state.areas.filter((a) => !a.archived);

  const totalFocusMinutes = sessions.reduce((n, a) => n + a.minutes, 0);
  const activeDaysCount = new Set(sessions.filter((a) => a.minutes > 0).map((a) => a.date)).size;

  const completedTaskIds = new Set([
    ...sessions.filter((a) => a.outcome === "done").map((a) => a.taskId),
    ...state.tasks
      .filter(
        (task) =>
          task.status === "done" &&
          task.completedAt &&
          task.completedAt.slice(0, 10) >= start &&
          task.completedAt.slice(0, 10) <= today
      )
      .map((task) => task.id),
  ]);

  // Review calculations
  const totalReviewMinutes = workspace.focusSessions.reduce((sum, item) => sum + item.durationMinutes, 0) || totalFocusMinutes;
  const completedTasksCount = workspace.tasks.filter((task) => task.status === "completed").length || completedTaskIds.size;
  const labsCompleted = workspace.labs.filter((lab) => lab.status === "completed");
  const independentSolves = labsCompleted.filter(
    (lab) => lab.aiAssistanceLevel <= 1 && !lab.walkthroughUsed
  ).length;
  const independentRate = labsCompleted.length
    ? Math.round((independentSolves / labsCompleted.length) * 100)
    : 0;

  const latestHaftalık = workspace.reviews.find((review) => review.period === "weekly");
  const latestAylık = workspace.reviews.find((review) => review.period === "monthly");
  const currentReview = reviewPeriod === "weekly" ? latestHaftalık : latestAylık;

  async function generateReview(selectedPeriod: "weekly" | "monthly") {
    setReviewBusy(true);
    const aiLevels = workspace.labs.reduce<Record<string, number>>((acc, lab) => {
      const key = lab.walkthroughUsed ? "walkthrough" : `level_${lab.aiAssistanceLevel}`;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const metrics = {
      period: selectedPeriod,
      completedTasks: completedTasksCount,
      totalTasks: workspace.tasks.length || state.tasks.length,
      totalMinutes: totalReviewMinutes,
      labsAttempted: workspace.labs.length,
      labsCompleted: labsCompleted.length,
      independentSolves,
      aiLevels,
      missedTasks: workspace.tasks.filter((task) => task.status !== "completed").map((task) => task.title),
      skillChanges: workspace.skills.map((skill) => `${skill.name}: ${skill.previousScore} → ${skill.score}`),
    };

    const intelligence = plannerIntelligenceContext(workspace.north ?? initializeNorth(workspace));
    Object.assign(metrics, {
      intelligence: {
        summary: intelligence.summary,
        observationCount: intelligence.observationCount,
        reliablePatterns: intelligence.reliablePatterns.map((p) => ({
          type: p.type,
          sampleSize: p.sampleSize,
          recommendation: p.recommendation,
        })),
      },
    });

    try {
      const response = await authenticatedAiFetch("/api/ai/reviewer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metrics),
      });
      if (!response.ok) throw new Error();
      const result = await response.json();

      const review: Review = {
        id: crypto.randomUUID(),
        period: selectedPeriod,
        title: selectedPeriod === "weekly" ? "Haftalık Performans Değerlendirmesi" : "Aylık Strateji Değerlendirmesi",
        date: new Date().toISOString().slice(0, 10),
        summary: `${result.summary}\n\nSonraki Odak: ${result.nextFocus}`,
        strongestArea: result.strongestArea,
        weakestArea: result.weakestArea,
        totalMinutes: totalReviewMinutes,
        completedTasks: completedTasksCount,
        labsCompleted: labsCompleted.length,
        independentSolveRate: independentRate,
      };

      workspace.addReview(review);
      toast.success(`${selectedPeriod === "weekly" ? "Haftalık" : "Aylık"} değerlendirme hazırlandı.`);
    } catch {
      toast.error("Değerlendirme alınamadı. İnternet ve oturumunu kontrol edip tekrar dene.");
    } finally {
      setReviewBusy(false);
    }
  }

  const handleSyncGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;
    setGithubLoading(true);
    try {
      const res = await fetch("/api/github/repository", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: githubUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "GitHub bağlantısı başarısız.");

      const areaId = areas[0]?.id || "primary-goal";
      if (workspace.addDomainProof) {
        workspace.addDomainProof({
          id: crypto.randomUUID(),
          areaId,
          title: `GitHub: ${data.title}`,
          kind: "github_link",
          description: data.description || "Doğrulanmış GitHub deposu.",
          url: data.url,
          createdAt: new Date().toISOString(),
        });
      }
      toast.success(`GitHub reposu ve son commitler doğrulandı: ${data.title}`);
      setGithubUrl("");
    } catch (err: unknown) {
      toast.error((err as Error).message || "GitHub reposu okunamadı.");
    } finally {
      setGithubLoading(false);
    }
  };

  return (
    <div className="page-content progress-stitch space-y-6 pb-32 md:pb-20">
      {/* 1. TOP HEADER & MAIN TAB SWITCHER (İLERLEME & DEĞERLENDİRME BİRLEŞİK) */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {mainTab === "progress" ? "Gelişim & istatistikler" : "Değerlendirme & ritüel"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {mainTab === "progress"
              ? "Süreler ve çıktılar gerçek kayıtlarından gelir. Dinlenme başarısızlık değildir; sürdürülebilirliktir."
              : "Geçen dönemin kanıtlarını incele, güçlü ve zayıf kaslarını belirle, gelecek dönemin tek hedefini seç."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-2xl border border-border/70 bg-muted/40 p-1 text-xs gap-1">
          <button
            type="button"
            onClick={() => setMainTab("progress")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-all",
              mainTab === "progress"
                ? "bg-background text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <TrendingUp className="size-3.5 text-primary" />
            <span>İlerleme &amp; Analiz</span>
          </button>
          <button
            type="button"
            onClick={() => setMainTab("reviews")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-all",
              mainTab === "reviews"
                ? "bg-background text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Award className="size-3.5 text-amber-500" />
            <span>Değerlendirme &amp; Ritüel</span>
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* VIEW 1: İLERLEME & ANALİZ                                             */}
      {/* ===================================================================== */}
      {mainTab === "progress" && (
        <div className="space-y-6">
          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex rounded-xl border border-border/70 bg-muted/40 p-1 text-xs max-w-fit">
              <button
                type="button"
                onClick={() => setPeriod("weekly")}
                className={cn(
                  "rounded-lg px-3 py-1 font-medium transition-all",
                  period === "weekly" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Bu Hafta
              </button>
              <button
                type="button"
                onClick={() => setPeriod("monthly")}
                className={cn(
                  "rounded-lg px-3 py-1 font-medium transition-all",
                  period === "monthly" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Bu Ay
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCertOpen(true)} className="rounded-xl text-xs h-8">
                <Award className="mr-1.5 size-3.5 text-amber-500" />
                Başarı Karnesi &amp; Portföy
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCardsOpen(true)} className="rounded-xl text-xs h-8">
                <BookOpen className="mr-1.5 size-3.5 text-purple-400" />
                Akıllı Bilgi Kartları
              </Button>
              <ProgressResetDialog />
            </div>
          </div>

          {/* METRIC OVERVIEW CARDS */}
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border bg-card/60 p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground">Toplam Odaklanma</span>
                <p className="mt-1 text-2xl font-bold font-mono tracking-tight text-foreground">
                  {(totalFocusMinutes / 60).toFixed(1)} <span className="text-xs font-normal text-muted-foreground">saat</span>
                </p>
              </div>
              <Clock className="size-5 text-primary" />
            </div>

            <div className="rounded-2xl border bg-card/60 p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground">Tamamlanan Görev</span>
                <p className="mt-1 text-2xl font-bold font-mono tracking-tight text-foreground">
                  {completedTaskIds.size} <span className="text-xs font-normal text-muted-foreground">çıktı</span>
                </p>
              </div>
              <CheckCircle2 className="size-5 text-emerald-500" />
            </div>

            <div className="rounded-2xl border bg-card/60 p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground">Aktif Gün</span>
                <p className="mt-1 text-2xl font-bold font-mono tracking-tight text-foreground">
                  {activeDaysCount} <span className="text-xs font-normal text-muted-foreground">gün</span>
                </p>
              </div>
              <Calendar className="size-5 text-amber-500" />
            </div>

            <div className="rounded-2xl border bg-card/60 p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground">Tutarlılık Skoru</span>
                <p className="mt-1 text-2xl font-bold font-mono tracking-tight text-foreground">
                  %{areas.length > 0 ? Math.round(areas.reduce((acc, a) => acc + weeklyConsistency(state, a), 0) / areas.length) : 100}
                </p>
              </div>
              <Flame className="size-5 text-red-500" />
            </div>
          </div>

          {/* AREA CONSISTENCY & ALLOCATION */}
          <div className="grid gap-5 xl:grid-cols-2 items-start">
            <div className="rounded-2xl border bg-card/60 p-5 shadow-xs space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Alan İlerlemeleri &amp; Seriler</h2>
              <div className="space-y-3">
                {areas.map((area) => {
                  const areaSessions = sessions.filter((s) => s.areaId === area.id);
                  const mins = areaSessions.reduce((sum, s) => sum + s.minutes, 0);
                  const streak = areaStreak(state, area);
                  return (
                    <div key={area.id} className="rounded-xl border bg-background/60 p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg">{area.icon}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{area.name}</p>
                          <p className="text-[10px] text-muted-foreground">{mins} dk çalışıldı</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {streak > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                            <Flame className="size-3" />
                            {streak} gün seri
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* NORTH INTELLIGENCE PANEL */}
            <div className="rounded-2xl border bg-card/60 p-5 shadow-xs space-y-4">
              <NorthIntelligencePanel />
            </div>
          </div>

          {/* GITHUB PROOF VERIFICATION */}
          <section className="rounded-2xl border bg-card/60 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <GitBranch className="size-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-primary">
                GitHub Repo &amp; Commit Kanıtı Eşitle
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Herhangi bir GitHub reposunun linkini yapıştır; commitler kanıt olarak kaydedilsin.
            </p>

            <form onSubmit={handleSyncGithub} className="flex gap-2">
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/kullanici/proje"
                className="flex-1 rounded-xl border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
              <Button type="submit" size="sm" disabled={githubLoading} className="rounded-xl text-xs">
                {githubLoading ? "Eşitleniyor…" : "Commitleri Eşitle"}
              </Button>
            </form>
          </section>

          {/* SESSIONS HISTORY DETAILS */}
          <details className="rounded-2xl border bg-card/40 p-4 shadow-xs group">
            <summary className="cursor-pointer text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Oturum Geçmişi ({sessions.length} seans)</span>
              <span className="text-muted-foreground text-[10px] group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-3 divide-y divide-border/40 text-xs">
              {[...sessions].reverse().map((a) => (
                <div key={a.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {state.tasks.find((t) => t.id === a.taskId)?.title || "Odak Oturumu"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {a.reflection || "Not eklenmedi"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-semibold">{a.minutes} dk</span>
                    <span className="block text-[10px] text-muted-foreground">{a.date}</span>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">Bu dönem için kayıtlı seans yok.</p>
              )}
            </div>
          </details>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 2: DEĞERLENDİRME & RİTÜEL (MERGED FROM REVIEWS PAGE)             */}
      {/* ===================================================================== */}
      {mainTab === "reviews" && (
        <div className="space-y-6">
          {/* KPI STATS */}
          <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border bg-card/60 p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground">Odaklanma</span>
                <p className="mt-1 text-xl font-bold font-mono tracking-tight text-foreground">
                  {(totalReviewMinutes / 60).toFixed(1)} <span className="text-xs font-normal text-muted-foreground">saat</span>
                </p>
              </div>
              <Clock3 className="size-5 text-primary" />
            </div>

            <div className="rounded-2xl border bg-card/60 p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground">Görevler</span>
                <p className="mt-1 text-xl font-bold font-mono tracking-tight text-foreground">
                  {completedTasksCount} <span className="text-xs font-normal text-muted-foreground">çıktı</span>
                </p>
              </div>
              <Target className="size-5 text-emerald-500" />
            </div>

            <div className="rounded-2xl border bg-card/60 p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground">Lablar</span>
                <p className="mt-1 text-xl font-bold font-mono tracking-tight text-foreground">
                  {labsCompleted.length} <span className="text-xs font-normal text-muted-foreground">tamamlandı</span>
                </p>
              </div>
              <FlaskConical className="size-5 text-amber-500" />
            </div>

            <div className="rounded-2xl border bg-card/60 p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground">Bağımsızlık</span>
                <p className="mt-1 text-xl font-bold font-mono tracking-tight text-foreground">
                  %{independentRate}
                </p>
              </div>
              <Bot className="size-5 text-indigo-400" />
            </div>
          </div>

          {/* PERIOD SWITCHER */}
          <div className="flex rounded-xl border border-border/70 bg-muted/40 p-1 text-xs max-w-fit">
            <button
              type="button"
              onClick={() => setReviewPeriod("weekly")}
              className={cn(
                "rounded-lg px-3.5 py-1.5 font-medium transition-all",
                reviewPeriod === "weekly"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Haftalık Değerlendirme
            </button>
            <button
              type="button"
              onClick={() => setReviewPeriod("monthly")}
              className={cn(
                "rounded-lg px-3.5 py-1.5 font-medium transition-all",
                reviewPeriod === "monthly"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Aylık Strateji
            </button>
          </div>

          {/* MAIN REVIEW CARD */}
          <div className="rounded-2xl border bg-card/60 p-6 shadow-xs space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/40 pb-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {reviewPeriod === "weekly" ? "Haftalık Yansıma & Durum" : "Aylık Stratejik Rapor"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {reviewPeriod === "weekly"
                    ? "Tamamladıkların, tutarlılığın ve gelecek haftanın odak rotası."
                    : "Hazırlık düzeyin, portföy çıktılarının kalitesi ve uzun vadeli ivmen."}
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => generateReview(reviewPeriod)}
                disabled={reviewBusy}
                className="rounded-xl text-xs shadow-xs"
              >
                <Sparkles className="size-3.5 mr-1.5" />
                {reviewBusy ? "Analiz Ediliyor…" : `Yeni ${reviewPeriod === "weekly" ? "Haftalık" : "Aylık"} Analiz Al`}
              </Button>
            </div>

            {currentReview ? (
              <div className="space-y-4">
                <div className="rounded-xl border bg-muted/20 p-4 text-xs text-foreground leading-relaxed whitespace-pre-line font-sans">
                  {currentReview.summary}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      En Güçlü Alan
                    </span>
                    <p className="font-semibold text-foreground text-sm">{currentReview.strongestArea}</p>
                  </div>

                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Geliştirilecek Kas
                    </span>
                    <p className="font-semibold text-foreground text-sm">{currentReview.weakestArea}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <CalendarRange className="size-8 mx-auto text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">
                  Henüz kaydedilmiş {reviewPeriod === "weekly" ? "haftalık" : "aylık"} değerlendirme yok
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Yukarıdaki butona tıklayarak Planorth Koç&apos;ın bu dönemdeki tüm çalışmalarını, seanslarını ve lablarını analiz etmesini sağla.
                </p>
              </div>
            )}
          </div>

          {/* AI ASSISTANCE DEPENDENCY BREAKDOWN */}
          <div className="rounded-2xl border bg-card/60 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-foreground">AI Yardım &amp; Bağımsızlık Dağılımı</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Yardım almak ceza değil; zamanla yardım ihtiyacının azalıp bağımsızlığın artması hedeflenir.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3, 4].map((level) => {
                const val = workspace.labs.filter((l) => l.aiAssistanceLevel === level && !l.walkthroughUsed).length;
                const pct = workspace.labs.length ? Math.round((val / workspace.labs.length) * 100) : 0;
                return (
                  <div key={level} className="flex items-center gap-3 text-xs">
                    <span className="w-16 text-[11px] text-muted-foreground">L{level} {level === 0 ? "Tam Bağımsız" : level === 1 ? "Hafif İpucu" : "Yardımlı"}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right font-mono text-[10px] text-muted-foreground">{val} lab</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <CertificateModal open={certOpen} onOpenChange={setCertOpen} workspace={workspace} north={state} />
      <FlashcardsModal open={cardsOpen} onOpenChange={setCardsOpen} />
    </div>
  );
}
