"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Calendar,
  Check,
  ExternalLink,
  FileText,
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
import type { CoachMessageAttachment } from "@/lib/types";
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
import { NorthCoachSymbol } from "./north-coach-symbol";

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
  const router = useRouter();
  const role = taskId ? "coach" : "planner";
  const [question, setQuestion] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<CoachMessageAttachment[]>([]);

  function formatFileSize(bytes?: number): string {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      if (file.size > 15 * 1024 * 1024) {
        toast.error(`"${file.name}" 15MB boyut sınırını aşıyor.`);
        return;
      }
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!isImage && !isPdf) {
        toast.error(`Sadece PDF ve görsel (PNG, JPG, WebP) formatları desteklenir.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const newAtt: CoachMessageAttachment = {
          id: crypto.randomUUID(),
          name: file.name,
          type: isImage ? "image" : "pdf",
          url: dataUrl,
          size: file.size,
        };
        setPendingAttachments((prev) => [...prev, newAtt]);
        toast.success(`"${file.name}" eklendi.`);
      };
      reader.onerror = () => {
        toast.error(`"${file.name}" okunurken hata oluştu.`);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push("/dashboard");
    }
  };
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
    setPendingAttachments([]);
  }

  async function ask(customPrompt?: string) {
    const textPrompt = (customPrompt || question).trim();
    if ((!textPrompt && pendingAttachments.length === 0) || busy) return;

    const today = dayKey();
    const usage = workspace.coaching.preferences.aiUsage;
    const count = usage.date === today ? usage.count : 0;
    if (count >= workspace.coaching.preferences.dailyAiLimit) {
      setError(`Bugünkü North AI sınırına ulaştın (${count}/${workspace.coaching.preferences.dailyAiLimit}).`);
      return;
    }

    const attachmentsToSend = [...pendingAttachments];
    setPendingAttachments([]);

    setBusy(true);
    setError("");
    setAnswer(null);
    setApplied([]);

    const promptToSend = textPrompt || (attachmentsToSend.length > 0
      ? `[${attachmentsToSend.map((a) => a.name).join(", ")} dosyası eklendi]`
      : "");

    workspace.addCoachMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: textPrompt,
      attachments: attachmentsToSend.length > 0 ? attachmentsToSend : undefined,
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

  const cardContent = (
    <div
      className={cn(
        "flex flex-col overflow-hidden text-foreground bg-card transition-colors",
        focusDocked
          ? "h-full w-full min-h-0 p-2 sm:p-3"
          : embedded
          ? "h-full w-full"
          : "w-full max-w-3xl h-[calc(100dvh-6.5rem)] rounded-2xl border border-border shadow-sm p-3 sm:p-5"
      )}
    >
      {/* HEADER: Clean, spacious coach identity */}
      <div className="flex items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <NorthCoachSymbol size={40} variant="avatar-rounded" priority />
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight leading-tight">Planorth Koç</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] text-primary font-medium">
                Aktif
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              Kişiselleştirilmiş gelişim ve strateji rehberin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Limit Badge */}
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground font-medium">
            <Sparkles className="size-3 text-primary shrink-0" />
            <span>Kullanım: <strong className="text-foreground">{usageCount}</strong> / {dailyLimit}</span>
          </span>

          {/* Options Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                title="Seçenekler"
                aria-label="Seçenekler"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 shadow-lg">
              <DropdownMenuItem
                onClick={handleStartNewChat}
                disabled={workspace.coachMessages.length === 0}
                className="gap-2 text-xs cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
                <span>Yeni Sohbet Başlat</span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="gap-2 text-xs cursor-pointer">
                <Link href="/profile?tab=memory">
                  <History className="size-3.5" />
                  <span>Sohbet Geçmişi</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {onClose && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleClose}
              className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
              title="Kapat"
              aria-label="Kapat"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* CONVERSATION AREA */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden pt-2">
        <Conversation className="flex-1 min-h-0 overflow-y-auto">
          <ConversationContent className="gap-4 p-2 sm:p-4">
            {workspace.coachMessages.length ? (
              workspace.coachMessages.slice(-30).map((message) => {
                const isAssistant = message.role === "assistant";
                return isAssistant ? (
                  <div key={message.id} className="flex items-start gap-3">
                    <NorthCoachSymbol size={32} variant="avatar" />
                    <div className="max-w-[85%] space-y-1">
                      <div className="rounded-2xl rounded-tl-xs bg-muted/60 dark:bg-muted/30 border border-border/80 p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed text-foreground shadow-2xs">
                        <MessageResponse>{message.content}</MessageResponse>
                      </div>
                      <span className="text-[10px] text-muted-foreground ml-1 block font-mono">
                        {new Date(message.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div key={message.id} className="flex flex-col items-end space-y-1">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-primary text-primary-foreground px-4 py-3 text-xs sm:text-sm shadow-sm space-y-2">
                      {/* Attached PDFs and Images */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="space-y-1.5">
                          {message.attachments.map((att) =>
                            att.type === "image" ? (
                              <div key={att.id} className="relative group overflow-hidden rounded-xl border border-white/20 bg-black/20">
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  className="max-h-52 w-auto max-w-full rounded-xl object-contain cursor-pointer hover:opacity-95 transition"
                                  onClick={() => window.open(att.url, "_blank")}
                                />
                                <div className="p-1.5 flex items-center justify-between text-[10px] text-white/90 bg-black/40">
                                  <span className="truncate max-w-[150px] font-medium">{att.name}</span>
                                  {att.size && (
                                    <span className="text-[9px] opacity-75 font-mono ml-1 shrink-0">
                                      {formatFileSize(att.size)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <a
                                key={att.id}
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                download={att.name}
                                className="flex items-center gap-2.5 rounded-xl border border-white/25 bg-white/10 hover:bg-white/20 p-2.5 text-left transition group shadow-xs"
                              >
                                <div className="grid size-8 place-items-center rounded-lg bg-red-500 text-white shrink-0 shadow-xs">
                                  <FileText className="size-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs font-semibold text-white truncate block">{att.name}</span>
                                  <p className="text-[10px] opacity-80 font-mono">
                                    {att.size ? formatFileSize(att.size) : "PDF Belgesi"} • Aç / İndir
                                  </p>
                                </div>
                                <ExternalLink className="size-3 text-white/80 group-hover:text-white shrink-0" />
                              </a>
                            )
                          )}
                        </div>
                      )}
                      {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
                    </div>
                    <span className="text-[10px] text-muted-foreground mr-1 block font-mono text-right">
                      {new Date(message.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })
            ) : (
              /* Initial Greeting */
              <div className="flex items-start gap-3">
                <NorthCoachSymbol size={32} variant="avatar" />
                <div className="max-w-[85%] space-y-1">
                  <div className="rounded-2xl rounded-tl-xs bg-muted/60 dark:bg-muted/30 border border-border/80 p-3.5 sm:p-4 shadow-2xs">
                    <h3 className="text-sm font-bold text-foreground mb-1 tracking-tight">Merhaba!</h3>
                    <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">{greeting}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground ml-1 block font-mono">{currentTimeStr}</span>
                </div>
              </div>
            )}

            {busy && (
              <div className="flex items-start gap-3">
                <NorthCoachSymbol size={32} variant="avatar" />
                <div className="inline-flex items-center gap-2 rounded-2xl bg-muted/60 border border-border px-4 py-2.5 text-xs text-foreground shadow-2xs">
                  <LoaderCircle className="size-3.5 animate-spin text-primary" />
                  Planorth Koç düşünüyor…
                </div>
              </div>
            )}

            {/* ACTIONABLE CHANGE PROPOSALS */}
            {answer && answer.changes && answer.changes.length > 0 && (
              <section className="space-y-2.5 rounded-2xl border border-primary/30 bg-primary/5 p-3.5 sm:p-4 my-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <Lightbulb className="size-3.5" />
                  <span>Koç Plan Önerisi ({answer.changes.length} Adım)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Onayladığın adımlar otomatik olarak takvimine işlenir.
                </p>

                <div className="space-y-2 pt-1">
                  {answer.changes.map((change, i) => {
                    const area = state.areas.find((a) => a.id === change.areaId && isAreaActive(a));
                    const task = state.tasks.find((t) => t.id === change.taskId);
                    const valid =
                      !!area &&
                      (change.action === "create" ||
                        (!!task && task.areaId === area.id && !["done", "cancelled"].includes(task.status)));

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
                        className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-2xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                              <IconComp className="size-3" />
                              {meta.label}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                              {task?.title || change.title}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {change.why} {!["complete", "skip"].includes(change.action) ? `· ${change.minutes} dk` : ""}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          variant={applied.includes(i) ? "secondary" : "default"}
                          disabled={!valid || applied.includes(i)}
                          className="w-full text-xs h-8"
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
                                            minutes:
                                              change.action === "reduce"
                                                ? Math.min(t.minutes, change.minutes)
                                                : t.minutes,
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
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {/* COMPOSER INPUT */}
        <div className="pt-3 border-t border-border shrink-0">
          {/* Pending Attachments preview */}
          {pendingAttachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5 p-1.5 rounded-xl bg-muted/60 border border-border">
              {pendingAttachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-1.5 rounded-lg bg-card border border-border px-2 py-1 text-xs text-foreground shadow-2xs"
                >
                  {att.type === "image" ? (
                    <img src={att.url} alt={att.name} className="size-5 rounded object-cover" />
                  ) : (
                    <FileText className="size-3.5 text-red-500 shrink-0" />
                  )}
                  <span className="max-w-[130px] truncate text-[11px] font-medium">{att.name}</span>
                  <span className="text-[9px] text-muted-foreground font-mono">({formatFileSize(att.size)})</span>
                  <button
                    type="button"
                    onClick={() => setPendingAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                    className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition ml-0.5"
                    title="Kaldır"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            <label className="cursor-pointer text-muted-foreground hover:text-foreground transition p-1 shrink-0" title="PDF veya görsel yükle">
              <Paperclip className="size-4.5 rotate-45" />
              <input
                type="file"
                accept="image/*,application/pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleFileSelect(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>

            <input
              type="text"
              className="flex-1 bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none"
              maxLength={3000}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void ask();
                }
              }}
              placeholder={pendingAttachments.length > 0 ? "Dosyalar eklendi. Soru sor veya gönder..." : "Koçuna bir soru sor veya hedefini paylaş..."}
              aria-label="Koçuna mesaj yaz"
            />

            <Button
              size="icon"
              className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition shadow-xs shrink-0 disabled:opacity-40"
              disabled={busy || (!question.trim() && pendingAttachments.length === 0)}
              onClick={() => void ask()}
              aria-label={busy ? "Düşünüyor" : "Gönder"}
            >
              <Send className="size-3.5" />
            </Button>
          </div>
          {error && <p role="alert" className="mt-1.5 text-xs font-medium text-destructive px-1">{error}</p>}
        </div>
      </div>
    </div>
  );

  if (focusDocked || embedded) {
    return cardContent;
  }

  return (
    <div className="w-full min-h-[calc(100dvh-4.5rem)] flex items-center justify-center p-3 sm:p-6 bg-background">
      {cardContent}
    </div>
  );
}
