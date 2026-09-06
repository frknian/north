"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { FocusSessionDialog } from "@/components/features/focus-session-dialog";
import { useWorkspace } from "@/components/features/workspace-provider";
import { TaskDetail } from "@/components/features/task-detail";
import { Button } from "@/components/ui/button";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Task } from "@/lib/types";
import { authenticatedAiFetch } from "@/lib/ai/client";
import { initializeNorth } from "@/lib/north";
import { plannerIntelligenceContext } from "@/lib/north-intelligence";

export default function PlanPage() {
  const workspace = useWorkspace(); const [filter, setFilter] = useState("all"); const [generating, setGenerating] = useState(false);
  const completed = workspace.tasks.filter((task) => task.status === "completed").length;
  const visible = useMemo(() => workspace.tasks.filter((task) => filter === "all" || task.category === filter), [filter, workspace.tasks]);
  const categories = [...new Set(workspace.tasks.map((task) => task.category))];
  async function generatePlan() {
    setGenerating(true);
    const context = { profile: { mode: workspace.profile.universityMode, primaryFocus: workspace.profile.primaryFocus, weeklyCapacityHours: workspace.profile.weeklyCapacityHours }, skills: workspace.skills.map((s) => ({ name: s.name, score: s.score, evidence: s.evidence })), recentLabs: workspace.labs.slice(0,5).map((l) => ({ name: l.name, status: l.status, aiLevel: l.aiAssistanceLevel, stuck: l.stuck })), unfinishedTasks: workspace.tasks.filter((t) => t.status !== "completed").map((t) => t.title), lastReview: workspace.reviews[0]?.summary, resources: workspace.resources.filter((r) => r.active).map(({ id, title, provider, category, subcategory, resourceType, priority, recommendedForSkills, rating }) => ({ id, title, provider, category, subcategory, resourceType, priority, recommendedForSkills, rating })), resourceHistory: workspace.resourceHistory.slice(0,30).map(({ resourceId, completed, rating }) => ({ resourceId, completed, rating })), sourceLocks: workspace.sourceLocks };
    Object.assign(context,{intelligence:plannerIntelligenceContext(workspace.north??initializeNorth(workspace))});
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
  return <><PageHeader title="Plan" description="Bu haftanın görevlerini istediğin sırayla tamamla." action={<Button onClick={() => void generatePlan()} disabled={generating}><Sparkles />{generating ? "Oluşturuluyor…" : "Gelecek haftayı oluştur"}</Button>} /><div className="page-content space-y-6"><div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5 text-sm"><span>{completed}/{workspace.tasks.length} görev tamamlandı</span><span>{({normal:"Normal hafta",exam:"Sınav haftası",free:"Rahat hafta"})[workspace.profile.universityMode]}</span><span>Kalan: {(workspace.tasks.filter(t=>t.status!=="completed").reduce((sum,t)=>sum+t.duration,0)/60).toFixed(1)} saat</span><Select value={filter} onValueChange={setFilter}><SelectTrigger aria-label="Kategori filtresi"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tüm kategoriler</SelectItem>{categories.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>{categories.filter(c=>filter==="all"||filter===c).map(category=><section key={category}><h2 className="mb-3 text-sm font-medium text-muted-foreground">{category}</h2><div className="divide-y rounded-xl border bg-card">{visible.filter(t=>t.category===category).map(task=><div key={task.id} className="flex flex-wrap items-center gap-3 p-4"><div className="min-w-48 flex-1"><h3 className="text-sm font-medium">{task.title}</h3><p className="mt-1 text-xs text-muted-foreground">{task.duration} dk · {({easy:"Kolay",medium:"Orta",hard:"Zor"})[task.difficulty]} · AI ≤ {task.aiHelpLimit} · {task.theoryResourceId && task.practicalResourceId ? "Kaynaklar bağlı" : "Kaynak eksik"}</p></div><span className="text-xs text-muted-foreground">{task.status === "completed" ? "Tamamlandı" : task.status === "pending" ? "Bekliyor" : "Devam ediyor"}</span><TaskDetail task={task} />{task.status!=="completed"&&<FocusSessionDialog task={task} trigger={<Button size="sm">Başla</Button>}/>}<DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={task.title+" işlemleri"}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onClick={()=>workspace.setDailyMission(task.id)}>Bugünün görevi yap</DropdownMenuItem><DropdownMenuItem onClick={()=>workspace.updateTask(task.id,{status:"completed",completedAt:new Date().toISOString()})}>Tamamlandı olarak işaretle</DropdownMenuItem><DropdownMenuItem onClick={()=>workspace.updateTask(task.id,{status:"pending",completedAt:undefined})}>Yeniden beklemeye al</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>)}</div></section>)}{!visible.length&&<p className="py-10 text-center text-muted-foreground">Bu görünümde görev yok.</p>}</div></>;
}
