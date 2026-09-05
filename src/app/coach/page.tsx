"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bot, CheckCircle2, LoaderCircle, RotateCcw, Send, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { useWorkspace } from "@/components/features/workspace-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getFirebase } from "@/lib/firebase/client";
import type { CoachAction, CoachMessage, CoachingOnboarding } from "@/lib/types";

const suggestions = ["Bugünkü durumuma göre tek görev seç.", "Yaptıklarımı analiz et ve ana darboğazımı söyle.", "Sınav haftasına göre planımı yeniden öner.", "Bu hafta yapamadıklarımı gerçekçi biçimde yeniden sırala."];

export default function CoachPage() {
  const workspace = useWorkspace();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const messages = workspace.coachMessages;
  const metrics = useMemo(() => getMetrics(workspace), [workspace]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || busy) return;
    const today = new Date().toISOString().slice(0, 10);
    const usage = workspace.coaching.preferences.aiUsage;
    const count = usage.date === today ? usage.count : 0;
    if (count >= workspace.coaching.preferences.dailyAiLimit) {
      toast.error(`Bugünkü AI koç limitine ulaştın (${count}/${workspace.coaching.preferences.dailyAiLimit}). Önce öğrendiklerini uygula.`);
      return;
    }
    setInput("");
    setBusy(true);
    const generationId = crypto.randomUUID();
    workspace.addCoachMessage({ id: crypto.randomUUID(), role: "user", content: clean, createdAt: new Date().toISOString() });
    try {
      const token = await getFirebase()?.auth.currentUser?.getIdToken();
      if (!token) throw new Error("North'u kullanmak için önce Firebase hesabına giriş yapmalısın.");
      const response = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ generationId, message: clean, history: messages.slice(-20).map(({ role, content }) => ({ role, content })), workspace: buildCoachContext(workspace, metrics) }),
      });
      const data = await response.json() as { generationId?: string; reply?: string; actions?: CoachAction[]; model?: string; totalTokens?: number; error?: string };
      if (!response.ok || !data.reply) throw new Error(data.error ?? "Yanıt alınamadı.");
      const message: CoachMessage = { id: crypto.randomUUID(), role: "assistant", content: data.reply, createdAt: new Date().toISOString(), generationId: data.generationId ?? generationId, model: data.model, totalTokens: data.totalTokens, actions: data.actions ?? [], actionsApplied: !(data.actions?.length) };
      workspace.addCoachMessage(message);
      workspace.updateCoachingPreferences({ aiUsage: { date: today, count: count + 1 } });
      if (message.actions?.length) {
        workspace.queueCoachActions(message.id, message.actions);
        toast.success("Koç değişiklik önerileri hazırladı. Uygulamadan önce onayını bekliyor.");
      }
    } catch (error) {
      const content = error instanceof Error ? error.message : "North yanıt veremedi.";
      workspace.addCoachMessage({ id: crypto.randomUUID(), role: "assistant", content, createdAt: new Date().toISOString(), generationId, failed: true });
      toast.error(content);
    } finally { setBusy(false); }
  }

  return <><PageHeader eyebrow="Tanı → planla → uygula → ölç" title="North AI Koç" description="Planını kanıtlara göre düzenleyen; öneriyi senden onay almadan uygulamayan çalışma koçu." /><div className="mx-auto grid max-w-7xl gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-8">
    {!workspace.coaching.onboarding ? <Onboarding onComplete={workspace.completeOnboarding} /> : <CoachConversation messages={messages} busy={busy} input={input} setInput={setInput} onSend={send} />}
    <aside className="space-y-4">
      <CoachContext metrics={metrics} limit={workspace.coaching.preferences.dailyAiLimit} usage={workspace.coaching.preferences.aiUsage.count} />
      {workspace.coaching.pendingActions.map((pending) => <PendingActions key={pending.id} pending={pending} onApply={() => workspace.applyPendingActions(pending.id)} onDismiss={() => workspace.dismissPendingActions(pending.id)} />)}
      {workspace.coaching.actionHistory.filter((item) => !item.revertedAt).slice(0, 1).map((history) => <Card key={history.id}><CardHeader><CardTitle className="text-base">Son uygulanan değişiklik</CardTitle></CardHeader><CardContent><p className="mb-3 text-xs text-muted-foreground">{history.summaries.join(" · ")}</p><Button variant="outline" size="sm" onClick={() => workspace.undoActionBatch(history.id)}><RotateCcw /> Geri al</Button></CardContent></Card>)}
      <Card className="border-primary/20"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="size-4 text-primary" /> Koç ilkeleri</CardTitle></CardHeader><CardContent className="space-y-2 text-xs leading-5 text-muted-foreground"><p>• Yalnızca yetkili lablar için yönlendirme yapar.</p><p>• Kaynakları kütüphaneden seçer, URL uydurmaz.</p><p>• Plan değişikliklerini sen onaylamadan uygulamaz.</p><p>• Saatten çok somut kanıt ve bağımsız çözümü ölçer.</p></CardContent></Card>
    </aside>
  </div></>;
}

function Onboarding({ onComplete }: { onComplete: (value: Omit<CoachingOnboarding, "completedAt">) => void }) {
  const [currentLevel, setCurrentLevel] = useState<CoachingOnboarding["currentLevel"]>("foundation");
  const [englishLevel, setEnglishLevel] = useState<CoachingOnboarding["englishLevel"]>("working");
  const [labAccess, setLabAccess] = useState<CoachingOnboarding["labAccess"]>("both");
  const [preferredStyle, setPreferredStyle] = useState<CoachingOnboarding["preferredStyle"]>("balanced");
  const [constraints, setConstraints] = useState("");
  return <Card><CardHeader><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><WandSparkles /></div><div><CardTitle>Önce seni tanıyalım</CardTitle><CardDescription>Bu kısa değerlendirme CyberCoach&apos;un görev yoğunluğunu ve yardım seviyesini ayarlamasını sağlar.</CardDescription></div></div></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><Field label="Mevcut seviye"><Select value={currentLevel} onValueChange={(value) => setCurrentLevel(value as CoachingOnboarding["currentLevel"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="beginner">Yeni başlıyorum</SelectItem><SelectItem value="foundation">Temelim var</SelectItem><SelectItem value="intermediate">Orta seviye pratik yapıyorum</SelectItem></SelectContent></Select></Field><Field label="Teknik İngilizce"><Select value={englishLevel} onValueChange={(value) => setEnglishLevel(value as CoachingOnboarding["englishLevel"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="basic">Temel</SelectItem><SelectItem value="working">Çalışma düzeyi</SelectItem><SelectItem value="comfortable">Rahat</SelectItem></SelectContent></Select></Field><Field label="Lab imkânı"><Select value={labAccess} onValueChange={(value) => setLabAccess(value as CoachingOnboarding["labAccess"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="browser">Yalnızca tarayıcı</SelectItem><SelectItem value="local_vm">Yerel sanal makine</SelectItem><SelectItem value="both">İkisi de</SelectItem></SelectContent></Select></Field><Field label="Koçluk tarzı"><Select value={preferredStyle} onValueChange={(value) => setPreferredStyle(value as CoachingOnboarding["preferredStyle"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="guided">Daha yönlendirmeli</SelectItem><SelectItem value="balanced">Dengeli</SelectItem><SelectItem value="independent">Bağımsız odaklı</SelectItem></SelectContent></Select></Field><div className="sm:col-span-2"><Field label="Kısıtların veya beklentin"><Textarea value={constraints} onChange={(event) => setConstraints(event.target.value)} placeholder="Örn. Hafta içi yalnızca 45 dakika ayırabiliyorum; sınav döneminde yoğunluk düşmeli." /></Field></div><div className="sm:col-span-2"><Button onClick={() => onComplete({ currentLevel, englishLevel, labAccess, preferredStyle, constraints })}><Sparkles /> Koçluğu başlat</Button></div></CardContent></Card>;
}

function CoachConversation({ messages, busy, input, setInput, onSend }: { messages: CoachMessage[]; busy: boolean; input: string; setInput: (value: string) => void; onSend: (value: string) => void }) {
  function submit(event: FormEvent) { event.preventDefault(); void onSend(input); }
  return <Card className="flex min-h-[72dvh] flex-col overflow-hidden"><CardHeader className="border-b"><CardTitle className="flex items-center gap-2"><Bot className="size-5 text-primary" /> CyberCoach sohbeti</CardTitle><CardDescription>Yaptığını, yapamadığını veya planını açıkça söyle; koç önce önerir, sonra onayını bekler.</CardDescription></CardHeader><CardContent className="flex min-h-0 flex-1 flex-col p-0"><Conversation className="min-h-[440px]"><ConversationContent>{messages.length === 0 ? <div className="mx-auto flex max-w-xl flex-col items-center py-12 text-center"><div className="mb-4 grid size-12 place-items-center rounded-xl bg-primary/10 text-primary"><WandSparkles /></div><h2 className="text-lg font-semibold">İlk görevini birlikte seçelim.</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Kısa ve dürüst bilgi, daha gerçekçi plan demektir.</p><div className="mt-6 grid gap-2 text-left sm:grid-cols-2">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => void onSend(suggestion)} className="rounded-lg border p-3 text-sm leading-5 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/30 hover:text-foreground">{suggestion}</button>)}</div></div> : messages.map((message) => <Message key={message.id} from={message.role}><MessageContent>{message.role === "assistant" ? <MessageResponse>{message.content}</MessageResponse> : <p className="whitespace-pre-wrap">{message.content}</p>}{message.actions?.length ? <p className="mt-3 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-primary"><CheckCircle2 className="size-3.5" />{message.actionsApplied ? "Değişiklik uygulandı" : "Değişiklik önerisi onayını bekliyor"}</p> : null}</MessageContent></Message>)}{busy ? <Message from="assistant"><MessageContent><div className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> Kanıtların ve planın inceleniyor…</div></MessageContent></Message> : null}</ConversationContent><ConversationScrollButton /></Conversation><form onSubmit={submit} className="border-t p-3 sm:p-4"><Textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void onSend(input); } }} placeholder="Örn. İlk görevi yarım yaptım; nerede zorlandığımı analiz et ve yarın için daha küçük bir adım öner." className="min-h-20 resize-none" /><div className="mt-2 flex items-center justify-between gap-3"><p className="text-[11px] text-muted-foreground">Enter gönderir · Shift+Enter yeni satır</p><Button type="submit" disabled={busy || !input.trim()}><Send /> Gönder</Button></div></form></CardContent></Card>;
}

function PendingActions({ pending, onApply, onDismiss }: { pending: { actions: CoachAction[] }; onApply: () => void; onDismiss: () => void }) { return <Card className="border-primary/30"><CardHeader><CardTitle className="text-base">Koç önerisi</CardTitle><CardDescription>Uygulanmadan önce kontrol et.</CardDescription></CardHeader><CardContent className="space-y-3"><ul className="space-y-2 text-xs text-muted-foreground">{pending.actions.map((action, index) => <li key={`${action.type}-${index}`}>• {action.summary}</li>)}</ul><div className="flex gap-2"><Button size="sm" onClick={onApply}><CheckCircle2 /> Uygula</Button><Button size="sm" variant="outline" onClick={onDismiss}>Reddet</Button></div></CardContent></Card>; }
function CoachContext({ metrics, limit, usage }: { metrics: ReturnType<typeof getMetrics>; limit: number; usage: number }) { return <Card><CardHeader><CardTitle className="text-base">Canlı bağlam</CardTitle><CardDescription>Koç bunu her mesajda değerlendirir.</CardDescription></CardHeader><CardContent className="space-y-3 text-sm"><ContextRow label="Haftalık görev" value={`${metrics.completedTasks}/${metrics.totalTasks}`} /><ContextRow label="Odak süresi" value={`${(metrics.totalFocusMinutes / 60).toFixed(1)} sa.`} /><ContextRow label="Bağımsız lab" value={String(metrics.independentLabs)} /><ContextRow label="AI yardım ortalaması" value={`Seviye ${metrics.averageAiLevel}`} /><ContextRow label="Bugünkü AI kullanımı" value={`${usage}/${limit}`} /></CardContent></Card>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function ContextRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3 border-b pb-2 last:border-0 last:pb-0"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>; }
function getMetrics(workspace: ReturnType<typeof useWorkspace>) { const completedLabs = workspace.labs.filter((lab) => lab.status === "completed"); return { totalFocusMinutes: workspace.focusSessions.reduce((sum, session) => sum + session.durationMinutes, 0), labsAttempted: workspace.labs.length, labsCompleted: completedLabs.length, independentLabs: completedLabs.filter((lab) => lab.aiAssistanceLevel <= 1 && !lab.walkthroughUsed).length, averageAiLevel: workspace.labs.length ? Number((workspace.labs.reduce((sum, lab) => sum + lab.aiAssistanceLevel, 0) / workspace.labs.length).toFixed(1)) : 0, completedTasks: workspace.tasks.filter((task) => task.status === "completed").length, totalTasks: workspace.tasks.length }; }
function buildCoachContext(workspace: ReturnType<typeof useWorkspace>, metrics: ReturnType<typeof getMetrics>) { return { profile: { fullName: workspace.profile.fullName, goal: workspace.profile.goal, universityMode: workspace.profile.universityMode, weeklyCapacityHours: workspace.profile.weeklyCapacityHours, primaryFocus: workspace.profile.primaryFocus }, weeklyPlan: workspace.weeklyPlan, tasks: workspace.tasks.map(({ id, title, description, category, duration, difficulty, status, isDailyMission }) => ({ id, title, description, category, duration, difficulty, status, isDailyMission })), metrics, recentLabs: workspace.labs.slice(0, 8).map(({ name, status, aiAssistanceLevel, walkthroughUsed, stuck, learned }) => ({ name, status, aiAssistanceLevel, walkthroughUsed, stuck, learned })), skills: workspace.skills.map(({ name, score, evidence }) => ({ name, score, evidence })), resources: workspace.resources.filter((resource) => resource.active).map(({ id, title, provider, category, subcategory, resourceType, priority, recommendedForSkills, rating }) => ({ id, title, provider, category, subcategory, resourceType, priority, recommendedForSkills, rating })), resourceHistory: workspace.resourceHistory.slice(0, 30).map(({ resourceId, completed, rating }) => ({ resourceId, completed, rating })), sourceLocks: workspace.sourceLocks, coaching: { onboarding: workspace.coaching.onboarding, checkins: workspace.coaching.checkins.slice(0, 7), milestones: workspace.coaching.milestones } }; }
