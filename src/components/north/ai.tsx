"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Brain,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  ExternalLink,
  FileText,
  Flame,
  Globe2,
  HelpCircle,
  History,
  Lightbulb,
  LoaderCircle,
  Minimize2,
  MoreHorizontal,
  Paperclip,
  Play,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import type { CoachMessageAttachment } from "@/lib/types";
import {
  diagnoseDomainState,
  type DomainArchetype,
  type DomainDiagnosticsReport,
  type DomainPrescribedAction,
} from "@/lib/coaching/domain-engine";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { MessageResponse } from "@/components/ai-elements/message";
import { authenticatedAiFetch } from "@/lib/ai/client";
import { northOutput, type NorthSuggestion } from "@/lib/ai/north-roles";
import { plannerIntelligenceContext } from "@/lib/north-intelligence";
import { capacity, dayKey, isAreaActive, weekKey, type NorthTask } from "@/lib/north";
import { useNorth } from "./shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [answer, setAnswer] = useState<NorthSuggestion | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState<number[]>([]);
  const [help, setHelp] = useState("2");
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [mobileTab, setMobileTab] = useState<"cockpit" | "chat">("chat");

  const currentTask = state.tasks.find((t) => t.id === taskId);
  const selectedArea =
    (selectedAreaId ? state.areas.find((a) => a.id === selectedAreaId) : null) ||
    (currentTask?.areaId ? state.areas.find((a) => a.id === currentTask.areaId) : null) ||
    state.areas.find(isAreaActive) ||
    state.areas[0];

  const domainDiagnosis: DomainDiagnosticsReport | null = useMemo(() => {
    if (!selectedArea) return null;
    return diagnoseDomainState(selectedArea, state, workspace);
  }, [selectedArea, state, workspace]);

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
    const shouldClear = preferencesRef.current.clearChatOnClose !== false;
    if (shouldClear && messagesRef.current.length > 0) {
      archiveSessionRef.current();
    }
    return () => {
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

  const handleStartPrescribedAction = (action: DomainPrescribedAction) => {
    if (!selectedArea) return;
    const today = dayKey();
    const currentWk = weekKey();
    const newTask: NorthTask = {
      id: crypto.randomUUID(),
      areaId: selectedArea.id,
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

    router.push(`/focus/${newTask.id}`);
  };

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

    const promptToSend =
      textPrompt ||
      (attachmentsToSend.length > 0 ? `[${attachmentsToSend.map((a) => a.name).join(", ")} dosyası eklendi]` : "");

    workspace.addCoachMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: textPrompt,
      attachments: attachmentsToSend.length > 0 ? attachmentsToSend : undefined,
      createdAt: new Date().toISOString(),
    });
    setQuestion("");

    // If on mobile, auto switch to chat tab so user sees the answer immediately
    setMobileTab("chat");

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
            domainDiagnostics: domainDiagnosis,
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
  const usageCount =
    workspace.coaching.preferences.aiUsage.date === today ? workspace.coaching.preferences.aiUsage.count : 0;
  const dailyLimit = workspace.coaching.preferences.dailyAiLimit;

  const archetypeIcons: Record<DomainArchetype, React.ReactNode> = {
    exam: <Target className="size-4 text-rose-500" />,
    tech: <Code2 className="size-4 text-emerald-500" />,
    language: <Globe2 className="size-4 text-sky-500" />,
    theory: <BookOpen className="size-4 text-amber-500" />,
    skill: <Brain className="size-4 text-violet-500" />,
  };

  const statusConfig = domainDiagnosis
    ? {
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
          label: "Darboğaz Tespiti",
          colorClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25",
          badgeIcon: <AlertTriangle className="size-3.5 text-orange-500" />,
          ringColor: "text-orange-500",
        },
        at_risk: {
          label: "Kritik Müdahale",
          colorClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
          badgeIcon: <AlertOctagon className="size-3.5 text-rose-500" />,
          ringColor: "text-rose-500",
        },
      }[domainDiagnosis.status]
    : null;

  // Proactive greeting based on actual domain diagnosis
  const proactiveGreeting = domainDiagnosis
    ? `Merhaba! ${selectedArea?.name || "Hedef alanın"} için arka plan teşhisini inceledim. Durum: ${domainDiagnosis.statusLabel} (Sağlık: %${domainDiagnosis.healthScore}). ${
        domainDiagnosis.findings[0]
          ? `Öne çıkan tespit: "${domainDiagnosis.findings[0].title}". `
          : ""
      }Bugünü en net adımlarla planlayalım.`
    : "Merhaba! Bugün için çalışma hedeflerini birlikte netleştirelim ve en verimli odak planını kuralım.";

  // Quick Zero-Prompt action chips
  const quickActions = [
    {
      icon: <Target className="size-3.5 text-blue-500" />,
      label: "Günün Planını Kilitle",
      prompt: `Bugün ${selectedArea?.name || "alanım"} için takvimimdeki öncelikli işleri netleştir ve kapasiteme göre planı kilitle.`,
    },
    {
      icon: <Minimize2 className="size-3.5 text-amber-500" />,
      label: "Tıkandım / Görevi Küçült",
      prompt: `Şu anki görevde tıkandım veya süre uzun geliyor; görevi daha küçük ve net adımlara böl.`,
    },
    {
      icon: <Zap className="size-3.5 text-rose-500" />,
      label: "Darboğazımı Nasıl Aşarım?",
      prompt: `${selectedArea?.name || "Bu alan"} için saptanan darboğazı (${domainDiagnosis?.statusLabel || "tıkanıklık"}) bertaraf etmek için en etkili taktik nedir?`,
    },
    {
      icon: <Sparkles className="size-3.5 text-emerald-500" />,
      label: "Gelişim Raporumu Değerlendir",
      prompt: `Son çalışmalarımı ve ritmimi analiz et; neyi iyi yapıyorum, hangi noktayı acil değiştirmeliyim?`,
    },
  ];

  // -------------------------------------------------------------
  // COMPACT VIEW: FOR FOCUS DOCKED OR EMBEDDED MODAL
  // -------------------------------------------------------------
  if (focusDocked || embedded) {
    return (
      <div className="flex flex-col h-full w-full min-h-0 text-foreground bg-card p-2 sm:p-3 overflow-hidden">
        {/* Compact Header */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <NorthCoachSymbol size={30} variant="avatar" priority />
            <div className="min-w-0">
              <span className="text-xs font-bold text-foreground block truncate">Planorth Koç</span>
              <span className="text-[10px] text-muted-foreground truncate block">
                {currentTask ? currentTask.title : selectedArea?.name || "Odak Rehberi"}
              </span>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon-xs" onClick={handleClose} className="size-7 rounded-lg">
              <X className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Conversation */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden pt-2">
          <Conversation className="flex-1 min-h-0 overflow-y-auto">
            <ConversationContent className="gap-3 p-1 sm:p-2">
              {workspace.coachMessages.slice(-20).map((message) => (
                <div
                  key={message.id}
                  className={cn("flex flex-col space-y-1 text-xs", message.role === "user" ? "items-end" : "items-start")}
                >
                  <div
                    className={cn(
                      "max-w-[90%] rounded-xl p-2.5 leading-relaxed",
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/70 text-foreground border border-border/70"
                    )}
                  >
                    <MessageResponse>{message.content}</MessageResponse>
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                  <LoaderCircle className="size-3 animate-spin text-primary" />
                  Koç düşünüyor…
                </div>
              )}
            </ConversationContent>
          </Conversation>

          {/* Compact Input */}
          <div className="pt-2 border-t border-border shrink-0">
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-1.5">
              <input
                type="text"
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void ask();
                  }
                }}
                placeholder="Koça danış..."
              />
              <Button size="icon-xs" className="size-6 rounded-md" disabled={busy || !question.trim()} onClick={() => void ask()}>
                <Send className="size-2.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // FULL PAGE VIEW: PLANORTH COACHING STUDIO (TWO-COLUMN HYBRID)
  // -------------------------------------------------------------
  return (
    <div className="w-full h-[calc(100dvh-4.5rem)] max-w-7xl mx-auto p-2 sm:p-4 flex flex-col gap-3">
      {/* MOBILE SEGMENT SWITCHER (< 1024px) */}
      <div className="flex lg:hidden items-center p-1 rounded-xl bg-muted/60 border border-border shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab("cockpit")}
          className={cn(
            "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center flex items-center justify-center gap-1.5",
            mobileTab === "cockpit" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Activity className="size-3.5 text-primary" />
          <span>Alan Teşhisi &amp; Reçete</span>
          {domainDiagnosis && (
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary">
              %{domainDiagnosis.healthScore}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("chat")}
          className={cn(
            "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center flex items-center justify-center gap-1.5",
            mobileTab === "chat" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="size-3.5 text-primary" />
          <span>Koç Seansı</span>
        </button>
      </div>

      {/* DESKTOP 12-COLUMN STUDIO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
        {/* ========================================================= */}
        {/* LEFT COLUMN: DIAGNOSTICS & PRESCRIPTION DESK (5 Cols)      */}
        {/* ========================================================= */}
        <aside
          className={cn(
            "lg:col-span-5 flex flex-col gap-3.5 overflow-y-auto pr-0 lg:pr-1.5 custom-scrollbar",
            mobileTab === "chat" && "hidden lg:flex"
          )}
        >
          {/* Desk Header & Area Selector */}
          <div className="rounded-2xl border border-border/80 bg-card/80 backdrop-blur-sm p-4 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <NorthCoachSymbol size={36} variant="avatar-rounded" priority />
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-foreground tracking-tight">Planorth Koçluk Masası</h2>
                  <p className="text-[11px] text-muted-foreground truncate">Arka plan deterministik teşhis motoru</p>
                </div>
              </div>

              {/* Health Score Circle */}
              {domainDiagnosis && statusConfig && (
                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative size-10 flex items-center justify-center">
                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-muted/30"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={statusConfig.ringColor}
                        strokeDasharray={`${domainDiagnosis.healthScore}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-black font-mono">{domainDiagnosis.healthScore}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Active Area Selector */}
            {selectedArea && (
              <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] font-semibold text-muted-foreground shrink-0">Alan:</span>
                  {state.areas.length > 1 ? (
                    <select
                      value={selectedArea.id}
                      onChange={(e) => setSelectedAreaId(e.target.value)}
                      className="rounded-lg border bg-background px-2.5 py-1 text-xs text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer truncate max-w-[200px]"
                    >
                      {state.areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.icon} {a.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-semibold text-foreground text-xs inline-flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded-lg truncate">
                      <span>{selectedArea.icon}</span>
                      <span>{selectedArea.name}</span>
                    </span>
                  )}
                </div>

                {domainDiagnosis && statusConfig && (
                  <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 font-semibold", statusConfig.colorClass)}>
                    {statusConfig.badgeIcon}
                    <span className="ml-1">{statusConfig.label}</span>
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* PRESCRIBED ACTION HERO CARD */}
          {domainDiagnosis?.prescribedAction && (
            <div className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Zap className="size-4 fill-primary/20 text-primary" />
                  <span>Koçun Günlük Müdahalesi</span>
                </div>
                <Badge variant="secondary" className="text-[10px] font-mono px-2 py-0.5">
                  <Clock className="size-3 mr-1" />
                  {domainDiagnosis.prescribedAction.minutes} dk
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-bold text-foreground">{domainDiagnosis.prescribedAction.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {domainDiagnosis.prescribedAction.goal}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-primary/15 text-[11px] text-muted-foreground">
                <span className="italic line-clamp-1">Neden: {domainDiagnosis.prescribedAction.rationale}</span>
                <Button
                  size="sm"
                  onClick={() => handleStartPrescribedAction(domainDiagnosis.prescribedAction!)}
                  className="rounded-xl text-xs font-semibold shadow-xs"
                >
                  <Play className="size-3 mr-1.5 fill-current" />
                  Müdahaleyi Başlat
                </Button>
              </div>
            </div>
          )}

          {/* BENTO METRICS GRID */}
          {domainDiagnosis && (
            <div className="rounded-2xl border border-border/80 bg-card/80 p-3.5 shadow-xs space-y-2.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                {domainDiagnosis.archetypeLabel} Metrikleri
              </span>
              <div className="grid grid-cols-2 gap-2">
                {domainDiagnosis.metrics.map((metric, idx) => (
                  <div key={idx} className="rounded-xl border bg-background/60 p-2.5 flex flex-col justify-between shadow-2xs">
                    <span className="text-[10px] text-muted-foreground truncate">{metric.label}</span>
                    <div className="flex items-baseline justify-between gap-1 mt-1">
                      <span className="text-sm font-black font-mono text-foreground">{metric.value}</span>
                      {metric.change && (
                        <span
                          className={cn(
                            "text-[9px] font-mono inline-flex items-center gap-0.5",
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
            </div>
          )}

          {/* TOP BOTTLENECK FINDINGS */}
          {domainDiagnosis && domainDiagnosis.findings.length > 0 && (
            <div className="rounded-2xl border border-border/80 bg-card/80 p-3.5 shadow-xs space-y-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Teşhis Bulgusu &amp; Röntgen
              </span>
              <div
                className={cn(
                  "rounded-xl border p-3 flex items-start gap-2.5 text-xs",
                  domainDiagnosis.findings[0].type === "critical" && "border-rose-500/30 bg-rose-500/5 text-rose-950 dark:text-rose-200",
                  domainDiagnosis.findings[0].type === "warning" && "border-amber-500/30 bg-amber-500/5 text-amber-950 dark:text-amber-200",
                  domainDiagnosis.findings[0].type === "optimal" && "border-emerald-500/30 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200",
                  domainDiagnosis.findings[0].type === "info" && "border-border/60 bg-muted/20 text-foreground"
                )}
              >
                {domainDiagnosis.findings[0].type === "critical" && <AlertOctagon className="size-4 text-rose-500 shrink-0 mt-0.5" />}
                {domainDiagnosis.findings[0].type === "warning" && <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />}
                {domainDiagnosis.findings[0].type === "optimal" && <ShieldCheck className="size-4 text-emerald-500 shrink-0 mt-0.5" />}
                {domainDiagnosis.findings[0].type === "info" && <Lightbulb className="size-4 text-primary shrink-0 mt-0.5" />}

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">{domainDiagnosis.findings[0].title}</span>
                    {domainDiagnosis.findings[0].metricBadge && (
                      <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0">
                        {domainDiagnosis.findings[0].metricBadge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed">{domainDiagnosis.findings[0].description}</p>
                </div>
              </div>
            </div>
          )}

          {/* ZERO-PROMPT QUICK SEED ACTIONS */}
          <div className="rounded-2xl border border-border/80 bg-card/80 p-3.5 shadow-xs space-y-2.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Hızlı Koçluk İstekleri (Tek Tık)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickActions.map((qa, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => void ask(qa.prompt)}
                  disabled={busy}
                  className="rounded-xl border border-border/60 bg-background/50 hover:bg-muted/50 p-2.5 text-left transition-all flex items-start gap-2 shadow-2xs group cursor-pointer disabled:opacity-50"
                >
                  <span className="mt-0.5 shrink-0">{qa.icon}</span>
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {qa.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: INTERACTIVE COACHING SESSION (7 Cols)        */}
        {/* ========================================================= */}
        <section
          className={cn(
            "lg:col-span-7 flex flex-col h-full rounded-2xl border border-border/80 bg-card/90 backdrop-blur-sm overflow-hidden shadow-xs",
            mobileTab === "cockpit" && "hidden lg:flex"
          )}
        >
          {/* Session Header */}
          <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 border-b border-border/70 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="size-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-foreground tracking-tight">Koçluk Seansı</h3>
                <p className="text-[11px] text-muted-foreground">Kişiselleştirilmiş strateji ve eylem rehberi</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground font-medium">
                <Sparkles className="size-3 text-primary shrink-0" />
                <span>Kullanım: <strong className="text-foreground">{usageCount}</strong> / {dailyLimit}</span>
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-xs" className="size-8 rounded-lg">
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
                <Button variant="ghost" size="icon-xs" onClick={handleClose} className="size-8 rounded-lg">
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Conversation Stream */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <Conversation className="flex-1 min-h-0 overflow-y-auto">
              <ConversationContent className="gap-4 p-3 sm:p-5">
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
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="space-y-1.5">
                              {message.attachments.map((att) =>
                                att.type === "image" ? (
                                  <div key={att.id} className="relative overflow-hidden rounded-xl border border-white/20 bg-black/20">
                                    <img
                                      src={att.url}
                                      alt={att.name}
                                      className="max-h-52 w-auto max-w-full rounded-xl object-contain cursor-pointer"
                                      onClick={() => window.open(att.url, "_blank")}
                                    />
                                    <div className="p-1 flex items-center justify-between text-[10px] text-white/90 bg-black/40">
                                      <span className="truncate max-w-[150px] font-medium">{att.name}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <a
                                    key={att.id}
                                    href={att.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    download={att.name}
                                    className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 p-2 text-left"
                                  >
                                    <FileText className="size-4 text-white" />
                                    <span className="text-xs text-white truncate">{att.name}</span>
                                  </a>
                                )
                              )}
                            </div>
                          )}
                          {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
                        </div>
                        <span className="text-[10px] text-muted-foreground mr-1 block font-mono">
                          {new Date(message.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  /* Proactive Greeting Card */
                  <div className="flex items-start gap-3">
                    <NorthCoachSymbol size={34} variant="avatar" />
                    <div className="max-w-[88%] space-y-1">
                      <div className="rounded-2xl rounded-tl-xs bg-muted/60 dark:bg-muted/30 border border-border/80 p-4 shadow-2xs space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground">Hoş geldin!</h4>
                          {domainDiagnosis && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold">
                              {domainDiagnosis.archetypeLabel}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">{proactiveGreeting}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground ml-1 block font-mono">
                        {new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                )}

                {busy && (
                  <div className="flex items-start gap-3">
                    <NorthCoachSymbol size={32} variant="avatar" />
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-muted/60 border border-border px-4 py-2.5 text-xs text-foreground shadow-2xs">
                      <LoaderCircle className="size-3.5 animate-spin text-primary" />
                      Planorth Koç teşhis koyuyor…
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
                    <p className="text-xs text-muted-foreground">Onayladığın adımlar otomatik olarak takvimine işlenir.</p>

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
                          <div key={i} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-2xs">
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
            <div className="p-3 border-t border-border/70 shrink-0 bg-background/50">
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
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3.5 py-2.5 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
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
                  className="size-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition shadow-xs shrink-0 disabled:opacity-40"
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
        </section>
      </div>
    </div>
  );
}
