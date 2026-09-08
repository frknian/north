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
  MoreHorizontal,
  Paperclip,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";

export function NorthAI({
  taskId,
  embedded = false,
  focusDocked = false,
  onClose,
}: {
  taskId?: string;
  embedded?: boolean;
  focusDocked?: boolean;
  onClose?: () => void;
} = {}) {
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

  const currentTimeStr = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={focusDocked ? "h-full flex flex-col min-h-0 overflow-hidden" : embedded ? "north-ai-embedded h-full flex flex-col min-h-0" : "page-content max-w-2xl mx-auto space-y-5"}>
      {/* CONVERSATION CONTAINER */}
      <div className={cn(
        "flex flex-col overflow-hidden bg-[#0B101D] text-zinc-100",
        focusDocked ? "h-full min-h-0 border-0 shadow-none" : "rounded-3xl border border-zinc-800/80 shadow-2xl h-[640px] max-h-[85vh]"
      )}>
        {/* HEADER matching user's uploaded reference */}
        <div className="flex items-center justify-between gap-3 border-b border-zinc-800/80 px-4 sm:px-5 py-3.5 bg-[#0B101D] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-600 text-white shadow-md">
              <Bot className="size-5.5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white tracking-tight truncate">North Koç</h3>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                Sade, kişiye özel ve eyleme dönüştürülebilir koçluk.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Limit Badge matching user's image */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-[#0E1A33] px-3 py-1 text-xs text-blue-400 font-medium">
              <Sparkles className="size-3 text-blue-400" />
              <span>Limit: <strong className="text-white font-bold">{usageCount}</strong> <span className="text-zinc-500">/</span> <span className="text-blue-400">{dailyLimit}</span></span>
            </span>

            {/* Options Menu & Close Button in top right */}
            <div className="flex flex-col items-end gap-0.5">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-zinc-400 hover:text-white transition p-1 rounded-md hover:bg-zinc-800/60"
                  title="Kapat"
                >
                  <X className="size-4" />
                </button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="text-zinc-400 hover:text-white transition p-1 rounded-md hover:bg-zinc-800/60"
                    title="Seçenekler"
                  >
                    <MoreHorizontal className="size-4.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 bg-[#0E1526] border-zinc-800 text-zinc-200">
                  <DropdownMenuItem
                    onClick={handleStartNewChat}
                    disabled={workspace.coachMessages.length === 0}
                    className="gap-2 text-xs cursor-pointer hover:bg-blue-600 hover:text-white"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Yeni Sohbet Başlat</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="gap-2 text-xs cursor-pointer hover:bg-blue-600 hover:text-white">
                    <Link href="/profile?tab=memory">
                      <History className="size-3.5" />
                      <span>Sohbet Geçmişi</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* CONVERSATION MESSAGES */}
        <Conversation className="flex-1 min-h-0 overflow-y-auto bg-[#0B101D]">
          <ConversationContent className="gap-4 p-4">
            {workspace.coachMessages.length ? (
              workspace.coachMessages.slice(-30).map((message) => {
                const isAssistant = message.role === "assistant";
                return isAssistant ? (
                  <div key={message.id} className="flex items-start gap-3">
                    <span className="grid size-9 sm:size-10 shrink-0 place-items-center rounded-full bg-blue-600 text-white shadow-sm">
                      <Bot className="size-5" />
                    </span>
                    <div className="max-w-[85%] space-y-1">
                      <div className="rounded-2xl rounded-tl-xs bg-[#131B2E] border border-blue-950/70 p-4 text-xs sm:text-sm leading-relaxed text-zinc-200 shadow-xs">
                        <MessageResponse>{message.content}</MessageResponse>
                      </div>
                      <span className="text-[10px] text-zinc-500 ml-1 block">{currentTimeStr}</span>
                    </div>
                  </div>
                ) : (
                  <div key={message.id} className="flex flex-col items-end space-y-1">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-blue-600 text-white px-4 py-2.5 text-xs sm:text-sm shadow-sm">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <span className="text-[10px] text-zinc-500 mr-1 block">{currentTimeStr}</span>
                  </div>
                );
              })
            ) : (
              /* Initial Greeting Bubble matching the user's uploaded image */
              <div className="flex items-start gap-3">
                <span className="grid size-9 sm:size-10 shrink-0 place-items-center rounded-full bg-blue-600 text-white shadow-sm">
                  <Bot className="size-5" />
                </span>
                <div className="max-w-[85%] space-y-1">
                  <div className="rounded-2xl rounded-tl-xs bg-[#131B2E] border border-blue-950/70 p-4 shadow-xs">
                    <h4 className="text-sm font-bold text-white mb-1">Merhaba!</h4>
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">{greeting}</p>
                  </div>
                  <span className="text-[10px] text-zinc-500 ml-1 block">{currentTimeStr}</span>
                </div>
              </div>
            )}

            {busy && (
              <div className="flex items-start gap-3">
                <span className="grid size-9 sm:size-10 shrink-0 place-items-center rounded-full bg-blue-600 text-white shadow-sm">
                  <Bot className="size-5" />
                </span>
                <div className="inline-flex items-center gap-2 rounded-2xl bg-[#131B2E] border border-blue-950/70 px-4 py-3 text-xs text-zinc-300">
                  <LoaderCircle className="size-3.5 animate-spin text-blue-500" />
                  North durumunu ve hedeflerini değerlendiriyor…
                </div>
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {/* COMPOSER matching user's image */}
        <div className="p-3 sm:p-4 border-t border-zinc-800/80 bg-[#0B101D] shrink-0">
          <div className="flex items-center gap-2.5 rounded-2xl border border-zinc-800/90 bg-[#0E1526] px-3.5 py-2 shadow-inner focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
            <label className="cursor-pointer text-zinc-400 hover:text-white transition p-1 shrink-0" title="Ek veya görsel ekle">
              <Paperclip className="size-4.5" />
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  toast.info(`"${file.name}" seçildi. North analize hazır.`);
                }}
              />
            </label>

            <input
              type="text"
              className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder:text-zinc-500 outline-none"
              maxLength={3000}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void ask();
                }
              }}
              placeholder="North'a soru sor, planını paylaş..."
              aria-label="North'a mesaj yaz"
            />

            <Button
              size="icon"
              className="size-9 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition shadow-sm shrink-0 disabled:opacity-40"
              disabled={busy || !question.trim()}
              onClick={() => void ask()}
              aria-label={busy ? "North düşünüyor" : "Gönder"}
            >
              <Send className="size-4" />
            </Button>
          </div>
          {error && <p role="alert" className="mt-1.5 text-xs font-medium text-destructive px-1">{error}</p>}
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
