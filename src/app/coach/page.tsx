"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bot, CheckCircle2, LoaderCircle, Send, Sparkles, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { useWorkspace } from "@/components/features/workspace-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { CoachAction, CoachMessage } from "@/lib/types";
import { getFirebase } from "@/lib/firebase/client";

const suggestions = [
  "Önce beni tanımak için sorular sor, sonra bu haftaki planımı değerlendir.",
  "Yaptıklarımı analiz et ve en büyük darboğazımı söyle.",
  "Sınav haftasına girdim; planımı daha gerçekçi hale getir.",
  "Bugünkü görevi tamamladım. Sıradaki en mantıklı görevi seç.",
];

export default function CoachPage() {
  const workspace = useWorkspace();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const messages = workspace.coachMessages ?? [];

  const metrics = useMemo(() => {
    const completedLabs = workspace.labs.filter((lab) => lab.status === "completed");
    return {
      totalFocusMinutes: workspace.focusSessions.reduce((sum, session) => sum + session.durationMinutes, 0),
      labsAttempted: workspace.labs.length,
      labsCompleted: completedLabs.length,
      independentLabs: completedLabs.filter((lab) => lab.aiAssistanceLevel <= 1 && !lab.walkthroughUsed).length,
      averageAiLevel: workspace.labs.length ? Number((workspace.labs.reduce((sum, lab) => sum + lab.aiAssistanceLevel, 0) / workspace.labs.length).toFixed(1)) : 0,
      completedTasks: workspace.tasks.filter((task) => task.status === "completed").length,
    };
  }, [workspace.focusSessions, workspace.labs, workspace.tasks]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || busy) return;
    setInput(""); setBusy(true);
    const generationId = crypto.randomUUID();
    const userMessage: CoachMessage = { id: crypto.randomUUID(), role: "user", content: clean, createdAt: new Date().toISOString() };
    workspace.addCoachMessage(userMessage);
    try {
      const firebase = getFirebase();
      const token = await firebase?.auth.currentUser?.getIdToken();
      if (!token) throw new Error("AI koçunu kullanmak için önce Firebase hesabına giriş yapmalısın.");
      const response = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          generationId,
          message: clean,
          history: messages.slice(-20).map(({ role, content }) => ({ role, content })),
          workspace: {
            profile: { fullName: workspace.profile.fullName, goal: workspace.profile.goal, universityMode: workspace.profile.universityMode, weeklyCapacityHours: workspace.profile.weeklyCapacityHours, primaryFocus: workspace.profile.primaryFocus },
            weeklyPlan: workspace.weeklyPlan,
            tasks: workspace.tasks.map(({ id, title, description, category, duration, difficulty, status, isDailyMission }) => ({ id, title, description, category, duration, difficulty, status, isDailyMission })),
            metrics,
            recentLabs: workspace.labs.slice(0, 8).map(({ name, status, aiAssistanceLevel, walkthroughUsed, stuck, learned }) => ({ name, status, aiAssistanceLevel, walkthroughUsed, stuck, learned })),
            skills: workspace.skills.map(({ name, score, evidence }) => ({ name, score, evidence })),
            resources: workspace.resources.filter((resource) => resource.active).map(({ id, title, provider, category, subcategory, resourceType, priority, recommendedForSkills, rating }) => ({ id, title, provider, category, subcategory, resourceType, priority, recommendedForSkills, rating })),
            resourceHistory: workspace.resourceHistory.slice(0, 30).map(({ resourceId, completed, rating }) => ({ resourceId, completed, rating })),
            sourceLocks: workspace.sourceLocks,
          },
        }),
      });
      const data = await response.json() as { generationId?: string; reply?: string; actions?: CoachAction[]; model?: string; totalTokens?: number; error?: string };
      if (!response.ok || !data.reply) throw new Error(data.error ?? "Yanıt alınamadı.");
      const assistantMessage: CoachMessage = { id: crypto.randomUUID(), role: "assistant", content: data.reply, createdAt: new Date().toISOString(), generationId: data.generationId ?? generationId, model: data.model, totalTokens: data.totalTokens, actions: data.actions ?? [], actionsApplied: !(data.actions?.length) };
      workspace.addCoachMessage(assistantMessage);
      if (assistantMessage.actions?.length) {
        workspace.applyCoachActions(assistantMessage.id, assistantMessage.actions);
        toast.success(`${assistantMessage.actions.length} dashboard değişikliği uygulandı.`);
      }
    } catch (error) {
      const content = error instanceof Error ? error.message : "AI koçu yanıt veremedi.";
      workspace.addCoachMessage({ id: crypto.randomUUID(), role: "assistant", content, createdAt: new Date().toISOString(), generationId, failed: true });
      toast.error(content);
    } finally { setBusy(false); }
  }

  function submit(event: FormEvent) { event.preventDefault(); void send(input); }

  return <><PageHeader eyebrow="Sor → uygula → ölç" title="AI Kariyer Koçu" description="Rehberini, mevcut planını ve çalışma kanıtlarını birlikte değerlendirir; istediğinde dashboard'u günceller." /><div className="mx-auto grid max-w-7xl gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:p-8"><Card className="flex min-h-[72dvh] flex-col overflow-hidden"><CardHeader className="border-b"><div className="flex items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><Bot className="size-5 text-primary" /> Furkan&apos;ın koçu</CardTitle><CardDescription className="mt-1">Mesajlar ve uygulanan değişiklikler Firebase hesabında saklanır.</CardDescription></div><Badge variant="outline">GPT</Badge></div></CardHeader><CardContent className="flex min-h-0 flex-1 flex-col p-0"><Conversation className="min-h-[440px]"><ConversationContent>{messages.length === 0 ? <div className="mx-auto flex max-w-xl flex-col items-center py-12 text-center"><div className="mb-4 grid size-12 place-items-center rounded-xl bg-primary/10 text-primary"><WandSparkles /></div><h2 className="text-lg font-semibold">Rehberini okudum. Seni tanıyarak başlayalım.</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Hedefini, haftalık kapasiteni ve mevcut ilerlemeni biliyorum. Eksik bağlam varsa sana kısa sorular sorarım; açıkça istediğinde görevlerini ve planını güncellerim.</p><div className="mt-6 grid gap-2 text-left sm:grid-cols-2">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => void send(suggestion)} className="rounded-lg border p-3 text-sm leading-5 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/30 hover:text-foreground">{suggestion}</button>)}</div></div> : messages.map((message) => <Message key={message.id} from={message.role}><MessageContent>{message.role === "assistant" ? <MessageResponse>{message.content}</MessageResponse> : <p className="whitespace-pre-wrap">{message.content}</p>}{message.actions?.length ? <div className="mt-3 space-y-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"><p className="flex items-center gap-2 text-xs font-medium text-emerald-300"><CheckCircle2 className="size-3.5" /> Dashboard güncellendi</p>{message.actions.map((action, index) => <p key={`${message.id}-${index}`} className="text-xs leading-5 text-muted-foreground">• {action.summary}</p>)}</div> : null}{message.role === "assistant" && message.model ? <p className="mt-2 font-mono text-[10px] text-muted-foreground/60">{message.model}{message.totalTokens ? ` · ${message.totalTokens} token` : ""} · #{message.generationId?.slice(0, 8)}</p> : null}</MessageContent></Message>)}{busy ? <Message from="assistant"><MessageContent><div className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> Planın ve kanıtların inceleniyor…</div></MessageContent></Message> : null}</ConversationContent><ConversationScrollButton /></Conversation><form onSubmit={submit} className="border-t p-3 sm:p-4"><Textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(input); } }} placeholder="Örn. İkinci görevi yaptım; tamamlandı olarak işaretle ve sıradaki odağımı seç." className="min-h-20 resize-none" /><div className="mt-2 flex items-center justify-between gap-3"><p className="text-[11px] text-muted-foreground">Enter gönderir · Shift+Enter yeni satır</p><Button type="submit" disabled={busy || !input.trim()}><Send /> Gönder</Button></div></form></CardContent></Card><div className="space-y-4"><Card><CardHeader><CardTitle className="text-base">Canlı bağlam</CardTitle><CardDescription>Koç bu verileri her mesajda görür.</CardDescription></CardHeader><CardContent className="space-y-3 text-sm"><ContextRow label="Haftalık görev" value={`${metrics.completedTasks}/${workspace.tasks.length}`} /><ContextRow label="Odak süresi" value={`${(metrics.totalFocusMinutes / 60).toFixed(1)} sa.`} /><ContextRow label="Bağımsız lab" value={String(metrics.independentLabs)} /><ContextRow label="Ortalama AI yardımı" value={`Seviye ${metrics.averageAiLevel}`} /><ContextRow label="Hafta modu" value={workspace.weeklyPlan.mode === "exam" ? "Sınav" : workspace.weeklyPlan.mode === "free" ? "Rahat" : "Normal"} /></CardContent></Card><Card className="border-primary/20"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="size-4 text-primary" /> Neler yapabilir?</CardTitle></CardHeader><CardContent className="space-y-2 text-xs leading-5 text-muted-foreground"><p>• Görevi tamamlandı, kısmi veya başarısız işaretler.</p><p>• Görevin süresini, zorluğunu ve içeriğini değiştirir.</p><p>• Yeni görev ekler veya açıkça istediğin görevi kaldırır.</p><p>• Günün tek ana görevini seçer.</p><p>• Haftanı okul yüküne göre yeniden dengeler.</p><p>• Lab bağımsızlığını ve beceri kanıtlarını analiz eder.</p></CardContent></Card></div></div></>;
}

function ContextRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3 border-b pb-2 last:border-0 last:pb-0"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>; }
