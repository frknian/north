"use client";

import { useMemo, useState } from "react";
import { Bot, CheckCircle2, Clock3, MoreHorizontal, Sparkles, Target } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { FocusSessionDialog } from "@/components/features/focus-session-dialog";
import { useWorkspace } from "@/components/features/workspace-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Task } from "@/lib/types";
import { authenticatedAiFetch } from "@/lib/ai/client";

export default function PlanPage() {
  const workspace = useWorkspace(); const [filter, setFilter] = useState("all"); const [generating, setGenerating] = useState(false);
  const completed = workspace.tasks.filter((task) => task.status === "completed").length;
  const visible = useMemo(() => workspace.tasks.filter((task) => filter === "all" || task.category === filter), [filter, workspace.tasks]);
  const categories = [...new Set(workspace.tasks.map((task) => task.category))];
  async function generatePlan() {
    setGenerating(true);
    const context = { profile: { mode: workspace.profile.universityMode, primaryFocus: workspace.profile.primaryFocus, weeklyCapacityHours: workspace.profile.weeklyCapacityHours }, skills: workspace.skills.map((s) => ({ name: s.name, score: s.score, evidence: s.evidence })), recentLabs: workspace.labs.slice(0,5).map((l) => ({ name: l.name, status: l.status, aiLevel: l.aiAssistanceLevel, stuck: l.stuck })), unfinishedTasks: workspace.tasks.filter((t) => t.status !== "completed").map((t) => t.title), lastReview: workspace.reviews[0]?.summary, resources: workspace.resources.filter((r) => r.active).map(({ id, title, provider, category, subcategory, resourceType, priority, recommendedForSkills, rating }) => ({ id, title, provider, category, subcategory, resourceType, priority, recommendedForSkills, rating })), resourceHistory: workspace.resourceHistory.slice(0,30).map(({ resourceId, completed, rating }) => ({ resourceId, completed, rating })), sourceLocks: workspace.sourceLocks };
    try {
      const response = await authenticatedAiFetch("/api/ai/planner", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(context) });
      if (!response.ok) throw new Error("AI unavailable");
      const result = await response.json() as { summary: string; tasks: Omit<Task, "id" | "weeklyPlanId" | "status" | "isDailyMission">[] };
      workspace.replaceTasks(result.tasks.map((task, index) => ({ ...task, id: crypto.randomUUID(), weeklyPlanId: workspace.weeklyPlan.id, status: "pending", isDailyMission: index === 0 })), result.summary);
      toast.success("Yeni haftalık görev havuzu oluşturuldu.");
    } catch {
      const count = workspace.profile.universityMode === "exam" ? 4 : workspace.profile.universityMode === "free" ? 14 : 10;
      const source = workspace.tasks.length ? workspace.tasks : [];
      const next = Array.from({ length: count }, (_, index) => {
        const base = source[index % Math.max(source.length, 1)] ?? ({ title: "Yetkili keşif çalışması", description: "Yalnızca izinli bir hedefte sistematik keşif yap ve kanıtlarını kaydet.", category: "Network", duration: 50, difficulty: "easy", objectives: ["Güvenli pratik yap"], successCriteria: ["Kanıtları kaydet"], recommendedResources: ["Resmî dokümantasyon"], theoryResourceId: "nmap-reference", practicalResourceId: "metasploitable-2", outputRequirement: "Port, servis ve sürüm tablosu ile kısa bulgu notu üret.", aiHelpLimit: 2 } as Task);
        return { ...base, id: crypto.randomUUID(), weeklyPlanId: workspace.weeklyPlan.id, status: "pending" as const, isDailyMission: index === 0, completedAt: undefined, reflection: undefined };
      });
      workspace.replaceTasks(next, "AI yapılandırılmadığı için plan, mevcut görev düzenin ve üniversite modun kullanılarak yerel olarak oluşturuldu.");
      toast.success("Çalışma moduna uygun görev havuzu yerel olarak oluşturuldu.");
    } finally { setGenerating(false); }
  }
  return <><PageHeader eyebrow="Flexible weekly quota" title="Haftalık görev havuzu" description="Complete these blocks in any order. Choose one mission when you sit down; the plan adapts to evidence, not weekdays." action={<Button onClick={() => void generatePlan()} disabled={generating}><Sparkles />{generating ? "Oluşturuluyor…" : "Gelecek haftayı oluştur"}</Button>} /><div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6 lg:p-8"><Card><CardContent className="grid gap-4 pt-5 sm:grid-cols-[1fr_auto]"><div><div className="mb-2 flex items-end justify-between"><div><p className="text-sm font-medium">This week</p><p className="text-xs text-muted-foreground">{workspace.weeklyPlan.aiSummary}</p></div><span className="metric-number text-sm">{completed}/{workspace.tasks.length}</span></div><Progress value={workspace.tasks.length ? completed / workspace.tasks.length * 100 : 0} /></div><Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-full sm:w-44" aria-label="Filter task category"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tüm kategoriler</SelectItem>{categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select></CardContent></Card><div className="space-y-3">{visible.map((task, index) => <Card key={task.id} className={task.isDailyMission ? "border-primary/35" : undefined}><CardContent className="grid gap-4 pt-5 sm:grid-cols-[auto_1fr_auto]"><div className="metric-number grid size-8 place-items-center rounded-lg border bg-muted/40 text-xs text-muted-foreground">{String(index + 1).padStart(2,"0")}</div><div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><Badge variant={task.status === "completed" ? "default" : "secondary"}>{task.status.replace("_", " ")}</Badge><Badge variant="outline">{task.category}</Badge>{task.isDailyMission ? <span className="flex items-center gap-1 text-xs text-primary"><Target className="size-3" />Today&apos;s mission</span> : null}</div><h2 className="font-medium">{task.title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{task.description}</p><div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock3 className="size-3.5" />{task.duration} min</span><span>{task.difficulty}</span><span>AI ≤ Level {task.aiHelpLimit}</span></div></div><div className="flex items-center gap-2 sm:self-center">{task.status !== "completed" ? <FocusSessionDialog task={task} trigger={<Button variant={task.isDailyMission ? "default" : "outline"} size="sm">Start</Button>} /> : <CheckCircle2 className="size-5 text-primary" />}<DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${task.title}`}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => workspace.setDailyMission(task.id)}><Target />Bugünün görevi yap</DropdownMenuItem><DropdownMenuItem onClick={() => workspace.updateTask(task.id, { status: "completed", completedAt: new Date().toISOString() })}><CheckCircle2 />Tamamlandı olarak işaretle</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></CardContent></Card>)}</div>{visible.length === 0 ? <Card className="border-dashed"><CardContent className="flex flex-col items-center py-10 text-center"><Bot className="mb-3 size-6 text-muted-foreground" /><p className="font-medium">Bu kategoride görev yok</p><p className="text-sm text-muted-foreground">Choose another filter or generate a new week.</p></CardContent></Card> : null}</div></>;
}
