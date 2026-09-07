"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CalendarRange,
  CheckCircle2,
  Clock3,
  FlaskConical,
  HelpCircle,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/features/workspace-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Review } from "@/lib/types";
import { authenticatedAiFetch } from "@/lib/ai/client";
import { initializeNorth } from "@/lib/north";
import { plannerIntelligenceContext } from "@/lib/north-intelligence";
import { cn } from "@/lib/utils";

export default function ReviewsPage() {
  const workspace = useWorkspace();
  const [busy, setBusy] = useState(false);
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");

  const totalMinutes = workspace.focusSessions.reduce((sum, item) => sum + item.durationMinutes, 0);
  const completedTasks = workspace.tasks.filter((task) => task.status === "completed").length;
  const labsCompleted = workspace.labs.filter((lab) => lab.status === "completed");
  const independentSolves = labsCompleted.filter(
    (lab) => lab.aiAssistanceLevel <= 1 && !lab.walkthroughUsed
  ).length;
  const independentRate = labsCompleted.length
    ? Math.round((independentSolves / labsCompleted.length) * 100)
    : 0;

  const latestHaftalık = workspace.reviews.find((review) => review.period === "weekly");
  const latestAylık = workspace.reviews.find((review) => review.period === "monthly");
  const currentReview = period === "weekly" ? latestHaftalık : latestAylık;

  async function generate(selectedPeriod: "weekly" | "monthly") {
    setBusy(true);
    const aiLevels = workspace.labs.reduce<Record<string, number>>((acc, lab) => {
      const key = lab.walkthroughUsed ? "walkthrough" : `level_${lab.aiAssistanceLevel}`;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const metrics = {
      period: selectedPeriod,
      completedTasks,
      totalTasks: workspace.tasks.length,
      totalMinutes,
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

    let result: { summary: string; strongestArea: string; weakestArea: string; nextFocus: string };
    try {
      const response = await authenticatedAiFetch("/api/ai/reviewer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metrics),
      });
      if (!response.ok) throw new Error();
      result = await response.json();
    } catch {
      setBusy(false);
      toast.error("Değerlendirme alınamadı. İnternet ve oturumunu kontrol edip tekrar dene.");
      return;
    }

    const review: Review = {
      id: crypto.randomUUID(),
      period: selectedPeriod,
      title: selectedPeriod === "weekly" ? "Haftalık Performans Değerlendirmesi" : "Aylık Strateji Değerlendirmesi",
      date: new Date().toISOString().slice(0, 10),
      summary: `${result.summary}\n\nSonraki Odak: ${result.nextFocus}`,
      strongestArea: result.strongestArea,
      weakestArea: result.weakestArea,
      totalMinutes,
      completedTasks,
      labsCompleted: labsCompleted.length,
      independentSolveRate: independentRate,
    };

    workspace.addReview(review);
    setBusy(false);
    toast.success(`${selectedPeriod === "weekly" ? "Haftalık" : "Aylık"} değerlendirme hazırlandı.`);
  }

  return (
    <div className="page-content space-y-6 pb-20">
      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Haftalık Değerlendirme &amp; Ritüel
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Geçen haftanın kanıtlarını incele, güçlü ve zayıf kaslarını belirle, sonraki haftanın tek hedefini seç.
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="rounded-xl text-xs">
          <Link href="/week">Haftalık Plana Git →</Link>
        </Button>
      </header>

      {/* KPI STATS */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-card/60 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-muted-foreground">Odaklanma</span>
            <p className="mt-1 text-xl font-bold font-mono tracking-tight text-foreground">
              {(totalMinutes / 60).toFixed(1)} <span className="text-xs font-normal text-muted-foreground">saat</span>
            </p>
          </div>
          <Clock3 className="size-5 text-primary" />
        </div>

        <div className="rounded-2xl border bg-card/60 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-muted-foreground">Görevler</span>
            <p className="mt-1 text-xl font-bold font-mono tracking-tight text-foreground">
              {completedTasks} <span className="text-xs font-normal text-muted-foreground">/ {workspace.tasks.length}</span>
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
          onClick={() => setPeriod("weekly")}
          className={cn(
            "rounded-lg px-3.5 py-1.5 font-medium transition-all",
            period === "weekly"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Haftalık Değerlendirme
        </button>
        <button
          type="button"
          onClick={() => setPeriod("monthly")}
          className={cn(
            "rounded-lg px-3.5 py-1.5 font-medium transition-all",
            period === "monthly"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Aylık Strateji
        </button>
      </div>

      {/* REVIEW CARD */}
      <div className="rounded-2xl border bg-card/60 p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/40 pb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {period === "weekly" ? "Haftalık Yansıma & Durum" : "Aylık Stratejik Rapor"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {period === "weekly"
                ? "Tamamladıkların, tutarlılığın ve gelecek haftanın odak rotası."
                : "Hazırlık düzeyin, portföy çıktılarının kalitesi ve uzun vadeli ivmen."}
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => generate(period)}
            disabled={busy}
            className="rounded-xl text-xs shadow-xs"
          >
            <Sparkles className="size-3.5 mr-1.5" />
            {busy ? "Analiz Ediliyor…" : `Yeni ${period === "weekly" ? "Haftalık" : "Aylık"} Analiz Al`}
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
              Henüz kaydedilmiş {period === "weekly" ? "haftalık" : "aylık"} değerlendirme yok
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Yukarıdaki butona tıklayarak North AI&apos;ın bu dönemdeki tüm çalışmalarını, seanslarını ve lablarını analiz etmesini sağla.
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
  );
}
