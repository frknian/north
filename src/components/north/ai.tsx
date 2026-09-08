"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Calendar,
  Check,
  HelpCircle,
  History,
  Lightbulb,
  LoaderCircle,
  Minimize2,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { MessageResponse } from "@/components/ai-elements/message";
import { authenticatedAiFetch } from "@/lib/ai/client";
import { northOutput, type NorthSuggestion } from "@/lib/ai/north-roles";
import { plannerIntelligenceContext } from "@/lib/north-intelligence";
import { capacity, dayKey, isAreaActive, weekKey } from "@/lib/north";
import { useNorth, Heading, fieldClass, Field } from "./shared";
import { Button } from "@/components/ui/button";

export function NorthAI({ taskId, embedded = false, focusDocked = false }: { taskId?: string; embedded?: boolean; focusDocked?: boolean } = {}) {
  const { state, update, workspace } = useNorth();
  const role = taskId ? "coach" : "planner";
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<NorthSuggestion | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState<number[]>([]);
  const [help, setHelp] = useState("2");
  const currentTask = state.tasks.find((t) => t.id === taskId);

  // Archive and reset chat on close/open if enabled in settings
  const messagesRef = useRef(workspace.coachMessages);
  const preferencesRef = useRef(workspace.coaching.preferences);
  const archiveSessionRef = useRef(workspace.archiveCurrentCoachSession);

  useEffect(() => {
    messagesRef.current = workspace.coachMessages;
    preferencesRef.current = workspace.coaching.preferences;
    archiveSessionRef.current = workspace.archiveCurrentCoachSession;
  }, [workspace.coachMessages, workspace.coaching.preferences, workspace.archiveCurrentCoachSession]);

  useEffect(() => {
    // When North AI opens: if clearChatOnClose is enabled, archive previous session so the screen starts clean
    const shouldClear = preferencesRef.current.clearChatOnClose !== false;
    if (shouldClear && messagesRef.current.length > 0) {
      archiveSessionRef.current();
    }

    return () => {
      // When leaving North AI (closing screen): archive current messages so they are preserved in Settings!
      const shouldClearOnExit = preferencesRef.current.clearChatOnClose !== false;
      if (shouldClearOnExit && messagesRef.current.length > 0) {
        archiveSessionRef.current();
      }
    };
  }, []);

  function handleStartNewChat() {
    if (workspace.coachMessages.length > 0) {
      workspace.archiveCurrentCoachSession();
      toast.success("Önceki konuşma Ayarlar'a kaydedildi. Yeni sohbet başlatıldı.");
    }
    setAnswer(null);
    setError("");
    setApplied([]);
  }

  async function ask(customPrompt?: string) {
    const promptToSend = (customPrompt || question).trim();
    if (!promptToSend || busy) return;

    const today = dayKey();
    const usage = workspace.coaching.preferences.aiUsage;
    const count = usage.date === today ? usage.count : 0;
    if (count >= workspace.coaching.preferences.dailyAiLimit) {
      setError(`Bugünkü North AI sınırına ulaştın (${count}/${workspace.coaching.preferences.dailyAiLimit}).`);
      return;
    }

    setBusy(true);
    setError("");
    setAnswer(null);
    setApplied([]);
    workspace.addCoachMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: promptToSend,
      createdAt: new Date().toISOString(),
    });
    setQuestion("");

    try {
      const intelligence = plannerIntelligenceContext(state);
      const response = await authenticatedAiFetch("/api/ai/north", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          question: promptToSend,
          history: workspace.coachMessages.slice(-20).map(({ role, content }) => ({ role, content })),
          context: JSON.stringify({
            profile: workspace.profile,
            onboarding: workspace.coaching.onboarding,
            checkins: workspace.coaching.checkins.slice(0, 14),
            milestones: workspace.coaching.milestones,
            currentTask,
            helpLevel: currentTask ? Number(help) : undefined,
            today: dayKey(),
            capacityMinutes: capacity(state),
            mode: state.mode,
            energy: state.energy,
            areas: state.areas.filter(isAreaActive),
            tasks: state.tasks.slice(-100),
            activities: state.activities.slice(-100),
            events: state.events.slice(-50),
            intelligence,
            feedbackMemory: workspace.feedbackMemory,
            examProfiles: workspace.examProfiles,
          }),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Yanıt alınamadı");
      const parsed = northOutput.parse(data);
      setAnswer(parsed);
      workspace.addCoachMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: parsed.summary,
        createdAt: data.createdAt ?? new Date().toISOString(),
        generationId: data.generationId,
        model: data.model,
        totalTokens: data.totalTokens,
        actionsApplied: parsed.changes.length === 0,
      });
      workspace.updateCoachingPreferences({ aiUsage: { date: today, count: count + 1 } });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Yanıt alınamadı.";
      setError(message);
      workspace.addCoachMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: message,
        createdAt: new Date().toISOString(),
        failed: true,
      });
    } finally {
      setBusy(false);
    }
  }

  const today = dayKey();
  const todayTasks = state.tasks.filter((task) => task.date === today && ["pending", "partial"].includes(task.status));
  const optionalPool = state.tasks.filter((task) => !task.mandatory && !task.date && ["pending", "partial"].includes(task.status));
  const primaryArea = state.areas.find((a) => isAreaActive(a)) || state.areas[0];
  const greeting = todayTasks.length
    ? `Bugün takviminde ${todayTasks.length} odak görevi var. Seni dinliyorum, planını birlikte en verimli hale getirelim.`
    : optionalPool.length
    ? `Bugün takviminde zorunlu iş görünmüyor; havuzda ${optionalPool.length} esnek görev var.`
    : "Bugün için planlı görev görünmüyor. İstersen senin için gerçekçi ve motive edici bir sonraki adım belirleyelim.";

  const usageCount = workspace.coaching.preferences.aiUsage.date === today ? workspace.coaching.preferences.aiUsage.count : 0;
  const dailyLimit = workspace.coaching.preferences.dailyAiLimit;

  return (
    <div className={embedded ? "north-ai-embedded space-y-4" : "page-content max-w-4xl space-y-5"}>
      {/* CONVERSATION CONTAINER */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 sm:px-5 py-3.5 bg-card/60">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Bot className="size-4" />
            </span>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-foreground">North Koç</h3>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Sade, kişiye özel ve eyleme dönüştürülebilir koçluk.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-foreground">
              <Sparkles className="size-3 text-primary" />
              <span>Limit: <strong className="text-primary font-semibold">{usageCount}</strong> / {dailyLimit}</span>
            </span>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleStartNewChat}
              disabled={workspace.coachMessages.length === 0}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              title="Mevcut konuşmayı kaydeder ve yeni temiz bir sohbet başlatır"
            >
              <RotateCcw className="size-3" />
              <span className="hidden sm:inline">Yeni Sohbet</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              asChild
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Link href="/profile?tab=memory" title="Geçmiş sohbetleri incele">
                <History className="size-3" />
                <span className="hidden sm:inline">Geçmiş</span>
              </Link>
            </Button>
          </div>
        </div>

        <Conversation className={embedded ? "max-h-[44dvh] min-h-64" : "max-h-[50dvh] min-h-72"}>
          <ConversationContent className="gap-5 p-5">
            {workspace.coachMessages.length ? (
              workspace.coachMessages.slice(-30).map((message) =>
                message.role === "assistant" ? (
                  <div key={message.id} className="flex items-start gap-3">
                    <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                      <Bot className="size-3.5" />
                    </span>
                    <Message from="assistant" className="max-w-[calc(100%-2.5rem)] gap-0">
                      <MessageContent className="rounded-2xl border bg-background/80 px-4 py-3 text-xs leading-relaxed text-foreground shadow-none sm:text-sm">
                        <MessageResponse>{message.content}</MessageResponse>
                      </MessageContent>
                    </Message>
                  </div>
                ) : (
                  <div key={message.id} className="flex justify-end">
                    <Message from="user" className="max-w-[85%]">
                      <MessageContent className="rounded-2xl bg-primary text-primary-foreground px-4 py-2.5 text-xs sm:text-sm">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </MessageContent>
                    </Message>
                  </div>
                )
              )
            ) : (
              <div className="flex items-start gap-3 py-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <Bot className="size-4" />
                </span>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Merhaba!</p>
                  <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{greeting}</p>
                </div>
              </div>
            )}

            {busy && (
              <div className="flex items-start gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <Bot className="size-3.5" />
                </span>
                <div className="inline-flex items-center gap-2 rounded-2xl border bg-muted/40 px-3.5 py-2 text-xs text-muted-foreground">
                  <LoaderCircle className="size-3.5 animate-spin text-primary" />
                  North durumunu ve hedeflerini değerlendiriyor…
                </div>
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {/* COMPOSER */}
        <div className="border-t p-3 sm:p-4">
          <div className="flex items-end gap-2 rounded-2xl border bg-background px-3 py-2 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15">
            <textarea
              className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-1 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground sm:text-sm"
              maxLength={3000}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void ask();
                }
              }}
              placeholder="North'a soru sor, görevi küçültmesini iste veya planını gözden geçir..."
              aria-label="North'a mesaj yaz"
            />
            <Button
              size="icon"
              className="size-9 shrink-0 rounded-xl"
              disabled={busy || !question.trim()}
              onClick={() => void ask()}
              aria-label={busy ? "North düşünüyor" : "Gönder"}
            >
              <Send className="size-4" />
            </Button>
          </div>
          {error && <p role="alert" className="mt-2 text-xs font-medium text-destructive">{error}</p>}
        </div>
      </div>

      {/* ACTIONABLE CHANGE PROPOSALS */}
      {answer && answer.changes && answer.changes.length > 0 && (
        <section className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Lightbulb className="size-4" />
            North Plan Değişikliği Önerisi ({answer.changes.length} Adım)
          </div>
          <p className="text-xs text-muted-foreground">
            North planını doğrudan değiştirmez; onay verdiğin değişiklikler takvimine ve haftalık havuzuna eklenir.
          </p>

          <div className="mt-3 space-y-2.5">
            {answer.changes.map((change, i) => {
              const area = state.areas.find((a) => a.id === change.areaId && isAreaActive(a));
              const task = state.tasks.find((t) => t.id === change.taskId);
              const valid = !!area && (change.action === "create" || (!!task && task.areaId === area.id && !["done", "cancelled"].includes(task.status)));

              const actionBadges: Record<string, { label: string; icon: typeof Plus }> = {
                create: { label: "Yeni Görev", icon: Plus },
                complete: { label: "Tamamla", icon: Check },
                skip: { label: "Atla", icon: ArrowRight },
                reduce: { label: "Küçült", icon: Minimize2 },
                pool: { label: "Havuza Al", icon: Calendar },
                cancel: { label: "İptal Et", icon: HelpCircle },
              };

              const meta = actionBadges[change.action] || { label: "Düzenle", icon: Sparkles };
              const IconComp = meta.icon;

              return (
                <div
                  key={i}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3.5 shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground">
                        <IconComp className="size-3 text-primary" />
                        {meta.label}
                      </span>
                      <span className="text-xs font-semibold text-foreground">{task?.title || change.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {change.why} {!["complete", "skip"].includes(change.action) ? `· ${change.minutes} dk` : ""}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant={applied.includes(i) ? "secondary" : "default"}
                    disabled={!valid || applied.includes(i)}
                    onClick={() => {
                      const planned = state.tasks
                        .filter((t) => t.week === weekKey() && !["done", "cancelled"].includes(t.status))
                        .reduce((n, t) => n + t.minutes, 0);
                      if (change.action === "create" && planned + change.minutes > capacity(state)) {
                        setError("Öneri haftalık kapasiteyi aşıyor. Önce esnek havuzda yer aç.");
                        return;
                      }
                      update((s) => ({
                        ...s,
                        tasks:
                          change.action === "create"
                            ? [
                                ...s.tasks,
                                {
                                  id: crypto.randomUUID(),
                                  areaId: change.areaId,
                                  title: change.title,
                                  goal: change.goal,
                                  minutes: change.minutes,
                                  intensity: "normal",
                                  mandatory: false,
                                  status: "pending",
                                  date: "",
                                  deadline: "",
                                  resource: "",
                                  why: change.why,
                                  week: weekKey(),
                                },
                              ]
                            : s.tasks.map((t) =>
                                t.id === change.taskId
                                  ? {
                                      ...t,
                                      status:
                                        change.action === "complete"
                                          ? "done"
                                          : change.action === "skip"
                                          ? "skipped"
                                          : change.action === "cancel"
                                          ? "cancelled"
                                          : "pending",
                                      minutes: change.action === "reduce" ? Math.min(t.minutes, change.minutes) : t.minutes,
                                      date: ["pool", "reduce"].includes(change.action) ? "" : t.date,
                                      week: weekKey(),
                                      why: change.why,
                                    }
                                  : t
                              ),
                      }));
                      setApplied((a) => [...a, i]);
                    }}
                  >
                    {applied.includes(i) ? "Uygulandı ✓" : valid ? "Bu Öneriyi Uygula" : "Eşleşmedi"}
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
