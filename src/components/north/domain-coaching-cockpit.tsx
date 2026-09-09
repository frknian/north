"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Award,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  Flame,
  Globe2,
  Info,
  Lightbulb,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  diagnoseDomainState,
  type DomainArchetype,
  type DomainDiagnosticsReport,
  type DomainPrescribedAction,
} from "@/lib/coaching/domain-engine";
import { dayKey, weekKey, type Area, type NorthTask } from "@/lib/north";
import { useNorth } from "./shared";

interface DomainCoachingCockpitProps {
  area: Area;
  className?: string;
  compact?: boolean;
  onActionApplied?: (task: NorthTask) => void;
}

export function DomainCoachingCockpit({
  area,
  className,
  compact = false,
  onActionApplied,
}: DomainCoachingCockpitProps) {
  const router = useRouter();
  const { state, update, workspace } = useNorth();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [applying, setApplying] = useState(false);

  const report: DomainDiagnosticsReport = useMemo(() => {
    return diagnoseDomainState(area, state, workspace);
  }, [area, state, workspace]);

  const archetypeIcons: Record<DomainArchetype, React.ReactNode> = {
    exam: <Target className="size-4 text-rose-500" />,
    tech: <Code2 className="size-4 text-emerald-500" />,
    language: <Globe2 className="size-4 text-sky-500" />,
    theory: <BookOpen className="size-4 text-amber-500" />,
    skill: <Brain className="size-4 text-violet-500" />,
  };

  const statusConfig = {
    optimal: {
      label: "Optimal Gelişim",
      colorClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
      badgeIcon: <CheckCircle2 className="size-3.5 text-emerald-500" />,
      ringColor: "text-emerald-500",
    },
    stagnant: {
      label: "Durağanlık Eğilimi",
      colorClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
      badgeIcon: <Activity className="size-3.5 text-amber-500" />,
      ringColor: "text-amber-500",
    },
    bottleneck: {
      label: "Darboğaz Tespit Edildi",
      colorClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25",
      badgeIcon: <AlertTriangle className="size-3.5 text-orange-500" />,
      ringColor: "text-orange-500",
    },
    at_risk: {
      label: "Kritik Müdahale Gerekli",
      colorClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
      badgeIcon: <AlertOctagon className="size-3.5 text-rose-500" />,
      ringColor: "text-rose-500",
    },
  }[report.status];

  const handleStartPrescribedAction = (action: DomainPrescribedAction) => {
    setApplying(true);
    try {
      const today = dayKey();
      const currentWk = weekKey();
      const newTask: NorthTask = {
        id: crypto.randomUUID(),
        areaId: area.id,
        title: action.title,
        goal: action.goal,
        minutes: action.minutes,
        intensity: "high",
        mandatory: true,
        status: "pending",
        date: today,
        deadline: today,
        resource: "",
        why: `Koç Müdahalesi: ${action.rationale}`,
        week: currentWk,
        taskType: action.taskType,
      };

      update((curr) => ({
        ...curr,
        tasks: [newTask, ...curr.tasks],
      }));

      toast.success("Müdahale görevi bugünün planına eklendi!", {
        description: `"${action.title}" (${action.minutes} dk) kaydedildi.`,
      });

      if (onActionApplied) {
        onActionApplied(newTask);
      } else {
        router.push(`/focus/${newTask.id}`);
      }
    } catch {
      toast.error("Görev oluşturulurken bir hata oluştu.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card/80 backdrop-blur-sm p-4 sm:p-5 shadow-sm space-y-4 transition-all",
        report.status === "bottleneck" && "border-orange-500/30 bg-orange-500/[0.02]",
        report.status === "at_risk" && "border-rose-500/30 bg-rose-500/[0.02]",
        report.status === "optimal" && "border-emerald-500/30 bg-emerald-500/[0.02]",
        className
      )}
    >
      {/* TOP HEADER: Archetype & Domain Health Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl bg-background border shadow-xs">
            {archetypeIcons[report.archetype]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground tracking-tight">
                {report.archetypeLabel} Teşhisi
              </h3>
              <Badge
                variant="outline"
                className={cn("text-[10px] font-semibold px-2 py-0.5 inline-flex items-center gap-1", statusConfig.colorClass)}
              >
                {statusConfig.badgeIcon}
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-1">
              {area.name} için arka plan koçluk motorunun nesnel analizi.
            </p>
          </div>
        </div>

        {/* Health Score Gauge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">
              Alan Sağlığı
            </span>
            <span className="font-mono text-sm font-black text-foreground">
              {report.healthScore} <span className="text-[10px] text-muted-foreground font-normal">/ 100</span>
            </span>
          </div>
          <div className="relative size-9 flex items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-muted/40"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={statusConfig.ringColor}
                strokeDasharray={`${report.healthScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[10px] font-bold font-mono">
              {report.healthScore}
            </span>
          </div>
        </div>
      </div>

      {/* METRICS ROW (Deterministic stats computed for this archetype) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {report.metrics.map((metric, idx) => (
          <div
            key={idx}
            className="rounded-xl border bg-background/50 p-2.5 flex flex-col justify-between shadow-2xs"
          >
            <span className="text-[10px] text-muted-foreground font-medium truncate block">
              {metric.label}
            </span>
            <div className="flex items-baseline justify-between gap-1 mt-1">
              <span className="text-base font-black font-mono text-foreground tracking-tight">
                {metric.value}
              </span>
              {metric.change && (
                <span
                  className={cn(
                    "text-[10px] font-mono inline-flex items-center gap-0.5",
                    metric.trend === "up" && "text-emerald-500 font-semibold",
                    metric.trend === "down" && "text-rose-500 font-semibold",
                    metric.trend === "neutral" && "text-muted-foreground"
                  )}
                >
                  {metric.trend === "up" && <TrendingUp className="size-2.5" />}
                  {metric.trend === "down" && <TrendingDown className="size-2.5" />}
                  {metric.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* PRESCRIBED ACTION HERO CARD (The core deterministic intervention) */}
      {report.prescribedAction && (
        <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-3.5 sm:p-4 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <Zap className="size-4 fill-primary/20 text-primary" />
              <span>Koçun Önerdiği Müdahale Eylemi</span>
            </div>
            <Badge variant="secondary" className="text-[10px] font-mono px-2 py-0.5">
              <Clock className="size-3 mr-1" />
              {report.prescribedAction.minutes} dk
            </Badge>
          </div>

          <div>
            <h4 className="text-sm font-bold text-foreground">
              {report.prescribedAction.title}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {report.prescribedAction.goal}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-primary/15 text-[11px] text-muted-foreground">
            <span className="italic line-clamp-1">
              Neden: {report.prescribedAction.rationale}
            </span>

            <Button
              size="sm"
              onClick={() => handleStartPrescribedAction(report.prescribedAction!)}
              disabled={applying}
              className="rounded-xl text-xs font-semibold shadow-xs"
            >
              <Play className="size-3 mr-1.5 fill-current" />
              {applying ? "Hazırlanıyor…" : "Müdahaleyi Başlat"}
            </Button>
          </div>
        </div>
      )}

      {/* DIAGNOSTIC FINDINGS (Collapsible / Expandable details) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            Teşhis Bulguları &amp; Darboğazlar ({report.findings.length})
          </span>
          <button
            type="button"
            onClick={() => setDetailsOpen(!detailsOpen)}
            className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium transition"
          >
            {detailsOpen ? "Özeti Gizle" : "Detayları Göster"}
            {detailsOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
        </div>

        {/* Primary highlight finding always visible */}
        {report.findings.length > 0 && (
          <div
            className={cn(
              "rounded-xl border p-3 flex items-start gap-2.5 text-xs transition",
              report.findings[0].type === "critical" && "border-rose-500/30 bg-rose-500/5 text-rose-950 dark:text-rose-200",
              report.findings[0].type === "warning" && "border-amber-500/30 bg-amber-500/5 text-amber-950 dark:text-amber-200",
              report.findings[0].type === "optimal" && "border-emerald-500/30 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200",
              report.findings[0].type === "info" && "border-border/60 bg-muted/20 text-foreground"
            )}
          >
            {report.findings[0].type === "critical" && <AlertOctagon className="size-4 text-rose-500 shrink-0 mt-0.5" />}
            {report.findings[0].type === "warning" && <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />}
            {report.findings[0].type === "optimal" && <ShieldCheck className="size-4 text-emerald-500 shrink-0 mt-0.5" />}
            {report.findings[0].type === "info" && <Info className="size-4 text-primary shrink-0 mt-0.5" />}

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">{report.findings[0].title}</span>
                {report.findings[0].metricBadge && (
                  <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0">
                    {report.findings[0].metricBadge}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed">
                {report.findings[0].description}
              </p>
            </div>
          </div>
        )}

        {/* Remaining findings shown when expanded */}
        {detailsOpen && report.findings.slice(1).map((finding) => (
          <div
            key={finding.id}
            className={cn(
              "rounded-xl border p-3 flex items-start gap-2.5 text-xs transition",
              finding.type === "critical" && "border-rose-500/30 bg-rose-500/5 text-rose-950 dark:text-rose-200",
              finding.type === "warning" && "border-amber-500/30 bg-amber-500/5 text-amber-950 dark:text-amber-200",
              finding.type === "optimal" && "border-emerald-500/30 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200",
              finding.type === "info" && "border-border/60 bg-muted/20 text-foreground"
            )}
          >
            {finding.type === "critical" && <AlertOctagon className="size-4 text-rose-500 shrink-0 mt-0.5" />}
            {finding.type === "warning" && <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />}
            {finding.type === "optimal" && <ShieldCheck className="size-4 text-emerald-500 shrink-0 mt-0.5" />}
            {finding.type === "info" && <Info className="size-4 text-primary shrink-0 mt-0.5" />}

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">{finding.title}</span>
                {finding.metricBadge && (
                  <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0">
                    {finding.metricBadge}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed">
                {finding.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* PEDAGOGICAL STRATEGY FOOTNOTE */}
      <div className="rounded-xl bg-muted/40 border border-border/60 p-3 text-[11px] text-muted-foreground flex items-start gap-2.5">
        <Lightbulb className="size-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-foreground">Öğrenme Metodolojisi &amp; İlke:</span>
          <p className="leading-relaxed">{report.pedagogicalAdvice}</p>
        </div>
      </div>
    </div>
  );
}
