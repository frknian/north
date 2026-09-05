"use client";

import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2, Clock3, FlaskConical, Target } from "lucide-react";
import { DailyCheckinCard } from "@/components/features/daily-checkin-card";
import { FocusSessionDialog } from "@/components/features/focus-session-dialog";
import { ProgressResetDialog } from "@/components/features/progress-reset-dialog";
import { useWorkspace } from "@/components/features/workspace-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Task } from "@/lib/types";

export default function HomePage() {
  const workspace = useWorkspace();
  const { profile, tasks, focusSessions, labs, weeklyPlan, ready, coaching } = workspace;
  const mission = tasks.find((task) => task.isDailyMission && task.status !== "completed") ?? tasks.find((task) => task.status === "pending");
  const completed = tasks.filter((task) => task.status === "completed").length;
  const focusMinutes = focusSessions.reduce((sum, session) => sum + session.durationMinutes, 0);
  const completedLabs = labs.filter((lab) => lab.status === "completed");
  const independentLabs = completedLabs.filter((lab) => lab.aiAssistanceLevel <= 1 && !lab.walkthroughUsed).length;
  const coachNote = workspace.coachMessages.filter((message) => message.role === "assistant" && !message.failed).at(-1)?.content ?? weeklyPlan.aiSummary;

  if (!ready) return <div className="page-content"><div className="h-72 animate-pulse rounded-xl border bg-card" /></div>;

  return <div>
    <header className="border-b border-border/80 px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto flex max-w-6xl items-start justify-between gap-4"><div><p className="text-sm text-muted-foreground">Hoş geldin, {profile.fullName}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Bugünkü hedefin hazır.</h1></div><ProgressResetDialog /></div></header>
    <div className="page-content space-y-7">
      {!coaching.onboarding ? <Card className="border-primary/25"><CardContent className="flex flex-col items-start justify-between gap-3 py-4 sm:flex-row sm:items-center"><div><p className="font-medium">Çalışma düzenini birlikte ayarlayalım</p><p className="mt-1 text-sm text-muted-foreground">Kısa başlangıç değerlendirmesi, görev yoğunluğunu sana göre düzenler.</p></div><Button asChild size="sm"><Link href="/coach">Başla <ArrowRight /></Link></Button></CardContent></Card> : <DailyCheckinCard />}
      {mission ? <MissionCard mission={mission} /> : <CompletionState />}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card><CardContent className="py-5"><p className="section-label">BU HAFTA</p><div className="mt-3 flex items-baseline justify-between"><p className="metric-number text-3xl font-semibold">{completed}<span className="text-base text-muted-foreground">/{tasks.length}</span></p><span className="text-xs text-muted-foreground">görev</span></div><div className="mt-4 grid grid-cols-3 gap-2 border-t pt-4 text-xs"><MiniMetric value={`${Math.round(focusMinutes / 60)}s`} label="odak" /><MiniMetric value={String(labs.length)} label="lab" /><MiniMetric value={String(independentLabs)} label="bağımsız" /></div></CardContent></Card>
        <Card><CardContent className="py-5"><p className="section-label">ŞU ANKİ ODAK</p><p className="mt-3 font-medium">{profile.primaryFocus}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{coaching.milestones.find((item) => item.status === "active")?.description ?? "Bu haftanın görev havuzundan tek bir göreve odaklan."}</p><Button asChild variant="link" className="mt-3 h-auto px-0"><Link href="/plan">Planı aç <ArrowRight /></Link></Button></CardContent></Card>
        <Card><CardContent className="py-5"><p className="section-label">KOÇ NOTU</p><div className="mt-3 flex gap-3"><Bot className="mt-0.5 size-4 shrink-0 text-primary" /><p className="line-clamp-4 text-sm leading-6 text-muted-foreground">{coachNote}</p></div><Button asChild variant="link" className="mt-3 h-auto px-0"><Link href="/coach">Koçla konuş <ArrowRight /></Link></Button></CardContent></Card>
      </section>
      <section><div className="mb-3 flex items-center justify-between"><div><h2 className="font-semibold">Bu haftanın görev havuzu</h2><p className="mt-1 text-sm text-muted-foreground">Sırayla değil, hazır olduğunda tamamla.</p></div><Button asChild variant="ghost" size="sm"><Link href="/plan">Tüm görevler <ArrowRight /></Link></Button></div><div className="divide-y rounded-xl border border-border/80 bg-card">{tasks.slice(0, 5).map((task) => <TaskPreview key={task.id} task={task} />)}</div></section>
    </div>
  </div>;
}

function MissionCard({ mission }: { mission: Task }) { return <section className="overflow-hidden rounded-xl border border-primary/35 bg-card"><div className="max-w-4xl px-5 py-6 sm:px-7 sm:py-8"><p className="section-label text-primary">BUGÜNÜN GÖREVİ</p><div className="mt-4 flex flex-wrap gap-2"><Badge variant="secondary">{mission.category}</Badge><Badge variant="outline">{difficultyLabel(mission.difficulty)}</Badge><span className="flex items-center gap-1 px-1 text-xs text-muted-foreground"><Clock3 className="size-3.5" />{mission.duration} dk</span></div><h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">{mission.title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{mission.description}</p><div className="mt-6 border-l-2 border-primary/50 pl-4"><p className="section-label">BAŞARI ÖLÇÜTÜ</p><ul className="mt-2 space-y-1.5 text-sm">{mission.successCriteria.slice(0, 3).map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{item}</li>)}</ul></div><div className="mt-7 flex flex-wrap gap-2"><FocusSessionDialog task={mission} trigger={<Button>Oturumu başlat <ArrowRight /></Button>} /><Button asChild variant="outline"><Link href="/plan">Görev detayları</Link></Button></div></div></section>; }
function TaskPreview({ task }: { task: Task }) { return <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5"><div className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-xs text-muted-foreground">{task.status === "completed" ? <CheckCircle2 className="size-4 text-primary" /> : <Target className="size-3.5" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{task.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{task.category} · {task.duration} dk</p></div><Badge variant={task.status === "completed" ? "secondary" : "outline"}>{task.status === "completed" ? "Bitti" : "Bekliyor"}</Badge></div>; }
function MiniMetric({ value, label }: { value: string; label: string }) { return <div><p className="metric-number text-base font-semibold">{value}</p><p className="mt-0.5 text-muted-foreground">{label}</p></div>; }
function CompletionState() { return <Card><CardContent className="py-10 text-center"><FlaskConical className="mx-auto size-6 text-primary" /><p className="mt-3 font-medium">Bu haftanın görevleri tamamlandı</p><Button asChild className="mt-4" size="sm"><Link href="/reviews">Haftayı değerlendir</Link></Button></CardContent></Card>; }
function difficultyLabel(value: string) { return ({ easy: "Kolay", medium: "Orta", hard: "Zor" } as Record<string, string>)[value] ?? value; }
