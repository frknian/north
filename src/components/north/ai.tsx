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
  GraduationCap,
  HelpCircle,
  History,
  Lightbulb,
  LoaderCircle,
  Minimize2,
  Moon,
  MoreHorizontal,
  Palette,
  Paperclip,
  Play,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import type { CoachMessageAttachment, CompanionColor, CompanionOutfit, CoachResource } from "@/lib/types";
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
import { useNorth, CompanionModal } from "./shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CompanionAvatar } from "./companion-avatar";
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
  const [mobileTab, setMobileTab] = useState<"desk" | "chat">("chat");
  const [coachStyle, setCoachStyle] = useState<"balanced" | "disciplined" | "tactical">("balanced");
  const [companionModalOpen, setCompanionModalOpen] = useState(false);

  const today = dayKey();
  const userName = workspace.profile?.fullName ? workspace.profile.fullName.split(" ")[0] : "Furkan";
  const currentEnergy = state.energy?.date === today ? state.energy.level : "normal";

  const completedCount = state.activities.filter((a) => a.outcome === "done").length;
  const milestoneCount = state.areas.filter((a) => a.goal.trim()).length;
  const actualLevel = Math.max(1, Math.min(5, 1 + Math.floor((completedCount + milestoneCount * 2) / 6)));

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

  const companionSettings = {
    name: workspace.companionSettings?.name || "Yol Arkadaşım",
    color: (workspace.companionSettings?.color as CompanionColor) || "blue",
    outfit: (workspace.companionSettings?.outfit as CompanionOutfit) || "none",
  };

  function setDailyEnergy(level: "low" | "normal" | "high") {
    update((s) => ({
      ...s,
      energy: { date: today, level },
    }));
    const label = level === "high" ? "Zindeyim 🔥" : level === "low" ? "Yorgunum 😴" : "Dengeli ⚡";
    toast.success(`Enerjin "${label}" olarak ayarlandı.`, {
      description: "Koç tavsiyeleri ve görev temposu güncellendi.",
    });
  }

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

    const usage = workspace.coaching.preferences.aiUsage;
    const count = usage.date === today ? usage.count : 0;

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

    // Auto-switch to chat tab on mobile
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
            userName,
            userEnergy: currentEnergy,
            coachStyle,
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
        resources: parsed.resources && parsed.resources.length > 0 ? (parsed.resources as CoachResource[]) : undefined,
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

  function handleAttachResourceToTask(res: CoachResource) {
    if (currentTask) {
      update((s) => ({
        ...s,
        tasks: s.tasks.map((t) => (t.id === currentTask.id ? { ...t, resource: res.url } : t)),
      }));
      toast.success(`'${currentTask.title}' görevine kaynak bağlandı.`);
      return;
    }

    const pendingTasks = state.tasks.filter((t) => !["done", "cancelled"].includes(t.status));
    if (pendingTasks.length > 0) {
      const target = pendingTasks[0];
      update((s) => ({
        ...s,
        tasks: s.tasks.map((t) => (t.id === target.id ? { ...t, resource: res.url } : t)),
      }));
      toast.success(`'${target.title}' görevine kaynak bağlandı.`);
    } else {
      handleCreateTaskFromResource(res);
    }
  }

  function handleCreateTaskFromResource(res: CoachResource) {
    const targetArea = selectedArea || state.areas[0];
    const newTaskId = crypto.randomUUID();
    update((s) => ({
      ...s,
      tasks: [
        ...s.tasks,
        {
          id: newTaskId,
          areaId: targetArea?.id || "default",
          title: res.title.slice(0, 100),
          goal: res.description.slice(0, 200) || "Doğrulanmış web kaynağı üzerinden çalışma",
          minutes: res.type === "video" ? 30 : 45,
          intensity: "normal",
          mandatory: false,
          status: "pending",
          date: dayKey(),
          deadline: "",
          resource: res.url,
          why: "Canlı web taramasıyla bulunan çalışma kaynağı",
          week: weekKey(),
        },
      ],
    }));
    toast.success(`'${res.title.slice(0, 35)}...' bugünkü görevlere eklendi!`);
  }

  const usageCount =
    workspace.coaching.preferences.aiUsage.date === today ? workspace.coaching.preferences.aiUsage.count : 0;
  const dailyLimit = workspace.coaching.preferences.dailyAiLimit;

  // Personal Note from Coach
  const personalCoachNote = useMemo(() => {
    const areaTitle = selectedArea?.name || "Hedeflerin";
    if (currentEnergy === "high") {
      return {
        vibe: "Enerjin Çok Yüksek!",
        badgeColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        message: `${userName}, bugün tam bir odak günün! Zihnin açıkken ${areaTitle} için en zorlayıcı konuyu bitirelim. Tek bir sağlam blok yeterli.`,
        tip: domainDiagnosis?.pedagogicalAdvice || "Zorlu konuları enerjin zirvedeyken çözmek kalıcı öğrenmeyi 3 kat hızlandırır.",
      };
    }
    if (currentEnergy === "low") {
      return {
        vibe: "Bugün Enerjin Düşük, Koruma Modundayız",
        badgeColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        message: `${userName}, yorgun hissetmen çok insani. Kendini hırpalamak yok; bugünkü tek kuralımız sıfır çekmemek. 20 dakikalık hafif bir seansla günü kurtaracağız.`,
        tip: "Yorgun günlerde ağır soru çözmek yerine geçmiş notları ve kavram kartlarını gözden geçirmek zihni dinlendirir.",
      };
    }
    return {
      vibe: "Dengeli & İstikrarlı Tempo",
      badgeColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      message: `${userName}, ritmin gayet iyi gidiyor. ${areaTitle} için gereksiz telaş yapmadan, sıradaki adımı sakin bir odakla tamamlayalım.`,
      tip: domainDiagnosis?.pedagogicalAdvice || "Tutarlı 40 dakika, haftada bir yapılan 4 saatlik yorucu çalışmadan çok daha kalıcıdır.",
    };
  }, [userName, selectedArea, currentEnergy, domainDiagnosis]);

  // Personal zero-prompt action chips
  const quickActions = [
    {
      icon: <Target className="size-3.5 text-blue-500" />,
      label: "Bugün Ne Yapmalıyım?",
      prompt: `Selam Koç, bugün enerjim ${currentEnergy === "high" ? "yüksek" : currentEnergy === "low" ? "düşük" : "normal"}. ${selectedArea?.name || "alanım"} için bugünkü en kritik tek işi belirle.`,
    },
    {
      icon: <Minimize2 className="size-3.5 text-amber-500" />,
      label: "Tıkandım, Görevi Küçült",
      prompt: `Şu anki görevde odaklanmakta zorlanıyorum; süreyi küçült ve beni rahatlatacak daha hafif bir adım öner.`,
    },
    {
      icon: <Zap className="size-3.5 text-rose-500" />,
      label: "Bana Özel Taktik Ver",
      prompt: `${selectedArea?.name || "Bu alan"} için şu an uygulayabileceğim en pratik, sonuç getiren koçluk taktiğini söyle.`,
    },
    {
      icon: <CoffeeIcon className="size-3.5 text-emerald-500" />,
      label: "Çok Yorgunum, Ne Yapalım?",
      prompt: `Bugün zihnim ve bedenim yorgun. Ritmi bozmadan ve suçluluk hissetmeden en hafif şekilde ne yapmalıyım?`,
    },
  ];

  function CoffeeIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 2v2" />
        <path d="M14 2v2" />
        <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h12Z" />
        <path d="M6 2v2" />
      </svg>
    );
  }

  // -------------------------------------------------------------
  // COMPACT VIEW: FOR FOCUS DOCKED OR EMBEDDED MODAL
  // -------------------------------------------------------------
  if (focusDocked || embedded) {
    return (
      <div className="flex flex-col h-full w-full min-h-0 text-foreground bg-card p-2.5 sm:p-3 overflow-hidden">
        {/* Compact Header */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <CompanionAvatar
              size={30}
              color={companionSettings.color}
              outfit={companionSettings.outfit}
              level={actualLevel}
            />
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
  // FULL PAGE VIEW: PLANORTH PERSONAL COACHING STUDIO
  // -------------------------------------------------------------
  return (
    <div className="w-full h-full max-w-7xl mx-auto p-2 sm:p-3.5 flex flex-col gap-2.5 overflow-hidden">
      {/* MOBILE TOP SEGMENT BAR (< 1024px) */}
      <div className="flex lg:hidden items-center p-1 rounded-xl bg-muted/60 border border-border shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab("desk")}
          className={cn(
            "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center flex items-center justify-center gap-1.5",
            mobileTab === "desk" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CompanionAvatar
            size={18}
            color={companionSettings.color}
            outfit={companionSettings.outfit}
            level={actualLevel}
          />
          <span>Koçun Masası</span>
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
          <span>Birebir Seans</span>
        </button>
      </div>

      {/* 12-COLUMN MAIN STUDIO GRID: LOCKED TO SCREEN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0 overflow-hidden">
        {/* ========================================================= */}
        {/* LEFT COLUMN: PERSONAL COACH DESK (5 Cols)                 */}
        {/* ========================================================= */}
        <aside
          className={cn(
            "lg:col-span-5 flex flex-col gap-3 overflow-y-auto pr-0 lg:pr-1 custom-scrollbar",
            mobileTab === "chat" && "hidden lg:flex"
          )}
        >
          {/* 1. Personal Header & Companion Identity */}
          <div className="rounded-2xl border border-border/80 bg-card/85 p-3.5 sm:p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setCompanionModalOpen(true)}
                  className="relative shrink-0 group cursor-pointer transition-transform hover:scale-105 active:scale-95 text-left"
                  title="Yol arkadaşını özelleştir (renk ve kıyafet seç)"
                  aria-label="Yol arkadaşı özelleştirme penceresini aç"
                >
                  <CompanionAvatar
                    size={44}
                    color={companionSettings.color}
                    outfit={companionSettings.outfit}
                    level={actualLevel}
                    showAura
                  />
                  <span className="absolute -bottom-1 -right-1 size-3 rounded-full bg-emerald-500 border-2 border-card" />
                  <span className="absolute inset-0 rounded-full ring-2 ring-primary/0 group-hover:ring-primary/40 transition-all" />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-1.5">
                      <span>Selam, {userName}!</span>
                      <span className="text-sm font-normal">👋</span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => setCompanionModalOpen(true)}
                      className="text-[11px] text-muted-foreground hover:text-primary transition inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-muted/70 cursor-pointer"
                      title="Yol arkadaşının rengini ve kıyafetini değiştir"
                    >
                      <Palette className="size-3 text-primary" />
                      <span className="text-[10px] font-medium hidden sm:inline">Özelleştir</span>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    Kişisel gelişimin ve hedeflerin için buradayım.
                  </p>
                </div>
              </div>

              {/* Area Selector */}
              {state.areas.length > 1 ? (
                <select
                  value={selectedArea.id}
                  onChange={(e) => setSelectedAreaId(e.target.value)}
                  className="rounded-xl border bg-background px-2.5 py-1 text-xs text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer max-w-[150px] truncate"
                >
                  {state.areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.icon} {a.name}
                    </option>
                  ))}
                </select>
              ) : (
                <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 shrink-0">
                  {selectedArea.icon} {selectedArea.name}
                </Badge>
              )}
            </div>

            {/* 2. Personal Mood / Energy Check-in */}
            <div className="pt-2.5 border-t border-border/50 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground text-[11px]">Bugün kendini nasıl hissediyorsun?</span>
                <span className="text-[10px] opacity-80">Ritim buna göre esner</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setDailyEnergy("high")}
                  className={cn(
                    "py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    currentEnergy === "high"
                      ? "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/30 font-bold"
                      : "bg-background/60 hover:bg-muted/50 border-border/70 text-muted-foreground"
                  )}
                >
                  <Flame className="size-3.5 text-rose-500" />
                  <span>Zindeyim</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDailyEnergy("normal")}
                  className={cn(
                    "py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    currentEnergy === "normal"
                      ? "bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30 font-bold"
                      : "bg-background/60 hover:bg-muted/50 border-border/70 text-muted-foreground"
                  )}
                >
                  <Zap className="size-3.5 text-blue-500" />
                  <span>Dengeli</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDailyEnergy("low")}
                  className={cn(
                    "py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    currentEnergy === "low"
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30 font-bold"
                      : "bg-background/60 hover:bg-muted/50 border-border/70 text-muted-foreground"
                  )}
                >
                  <Moon className="size-3.5 text-amber-500" />
                  <span>Yorgunum</span>
                </button>
              </div>
            </div>

            {/* 3. Coaching Style Persona Vibe */}
            <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2 text-[11px]">
              <span className="text-muted-foreground font-medium">Koçun Yaklaşımı:</span>
              <div className="flex items-center gap-1">
                {[
                  { id: "balanced", label: "🧘 Dengeli", title: "Sakin ve sürdürülebilir" },
                  { id: "disciplined", label: "🥊 Disiplinli", title: "Tavizsiz ve motive edici" },
                  { id: "tactical", label: "💡 Taktikçi", title: "Stratejik ve pratik zekalı" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    title={s.title}
                    onClick={() => {
                      setCoachStyle(s.id as any);
                      toast.success(`Koç tarzı "${s.label}" olarak güncellendi.`);
                    }}
                    className={cn(
                      "px-2 py-0.5 rounded-lg text-[10px] font-semibold transition cursor-pointer",
                      coachStyle === s.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. PERSONAL HANDWRITTEN COACH NOTE */}
          <div className="rounded-2xl border border-border/80 bg-card/85 p-3.5 sm:p-4 shadow-xs space-y-2.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="size-3 text-amber-500" />
                Koçun Sana Bugünkü Notu
              </span>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", personalCoachNote.badgeColor)}>
                {personalCoachNote.vibe}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans font-medium">
              &ldquo;{personalCoachNote.message}&rdquo;
            </p>

            <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-start gap-1.5">
              <Lightbulb className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span className="leading-snug">{personalCoachNote.tip}</span>
            </div>
          </div>

          {/* 5. COLLABORATIVE TODAY'S MISSION (HERO ACTION) */}
          {domainDiagnosis?.prescribedAction && (
            <div className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-3.5 sm:p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Zap className="size-4 fill-primary/20 text-primary" />
                  <span>Birlikte Belirlediğimiz Görev</span>
                </div>
                <Badge variant="secondary" className="text-[10px] font-mono px-2 py-0.5">
                  <Clock className="size-3 mr-1" />
                  {domainDiagnosis.prescribedAction.minutes} dk
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-bold text-foreground">{domainDiagnosis.prescribedAction.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {domainDiagnosis.prescribedAction.goal}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-primary/15 text-[11px]">
                <span className="text-muted-foreground italic line-clamp-1">
                  Neden: {domainDiagnosis.prescribedAction.rationale}
                </span>

                <Button
                  size="sm"
                  onClick={() => handleStartPrescribedAction(domainDiagnosis.prescribedAction!)}
                  className="rounded-xl text-xs font-semibold shadow-xs"
                >
                  <Play className="size-3 mr-1.5 fill-current" />
                  Seansı Başlat
                </Button>
              </div>
            </div>
          )}

          {/* 6. ZERO-PROMPT QUICK CHIPS */}
          <div className="rounded-2xl border border-border/80 bg-card/85 p-3 shadow-xs space-y-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Koça Hızlı Danış (Tek Tık)
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {quickActions.map((qa, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => void ask(qa.prompt)}
                  disabled={busy}
                  className="rounded-xl border border-border/60 bg-background/50 hover:bg-muted/50 p-2 text-left transition flex items-center gap-2 cursor-pointer shadow-2xs group disabled:opacity-50"
                >
                  <span className="shrink-0">{qa.icon}</span>
                  <span className="text-[11px] font-semibold text-foreground group-hover:text-primary transition line-clamp-1">
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
            mobileTab === "desk" && "hidden lg:flex"
          )}
        >
          {/* Session Header */}
          <div className="flex items-center justify-between gap-3 p-3 sm:p-3.5 border-b border-border/70 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <CompanionAvatar
                  size={30}
                  color={companionSettings.color}
                  outfit={companionSettings.outfit}
                  level={actualLevel}
                />
                <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-card" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-1.5">
                  <span>{userName} &amp; Planorth Koç</span>
                  <span className="text-[10px] font-normal px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground font-mono">
                    {coachStyle === "disciplined" ? "Disiplinli" : coachStyle === "tactical" ? "Taktikçi" : "Dengeli"}
                  </span>
                </h3>
                <p className="text-[11px] text-muted-foreground">Kişisel gelişim ve strateji seansı</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
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

          {/* Conversation Stream: Breathable, Clean, High-Contrast */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <Conversation className="flex-1 min-h-0 overflow-y-auto">
              <ConversationContent className="gap-3.5 p-3 sm:p-5">
                {workspace.coachMessages.length ? (
                  workspace.coachMessages.slice(-30).map((message) => {
                    const isAssistant = message.role === "assistant";
                    return isAssistant ? (
                      <div key={message.id} className="flex items-start gap-2.5 sm:gap-3">
                        <CompanionAvatar
                          size={32}
                          color={companionSettings.color}
                          outfit={companionSettings.outfit}
                          level={actualLevel}
                        />
                        <div className="max-w-[85%] space-y-1">
                          <div className="rounded-2xl rounded-tl-xs bg-muted/60 dark:bg-muted/30 border border-border/80 p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed text-foreground shadow-2xs">
                            <MessageResponse>{message.content}</MessageResponse>
                          </div>
                          {message.resources && message.resources.length > 0 && (
                            <CoachResourceCards
                              resources={message.resources}
                              onAttachToTask={handleAttachResourceToTask}
                              onCreateTask={handleCreateTaskFromResource}
                            />
                          )}
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground ml-1 font-mono">
                            <span>
                              {new Date(message.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {message.model && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground/80 border border-border/60">
                                {message.model.includes("gpt")
                                  ? "OpenAI"
                                  : message.model.includes("llama")
                                  ? "Groq"
                                  : message.model.includes("deepseek")
                                  ? "DeepSeek"
                                  : message.model.includes("planorth")
                                  ? "Planorth Motoru"
                                  : message.model}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div key={message.id} className="flex flex-col items-end space-y-1">
                        <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-primary text-primary-foreground px-4 py-2.5 text-xs sm:text-sm shadow-sm space-y-2">
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
                  /* Warm Initial Greeting */
                  <div className="flex items-start gap-3">
                    <CompanionAvatar
                      size={34}
                      color={companionSettings.color}
                      outfit={companionSettings.outfit}
                      level={actualLevel}
                      showAura
                    />
                    <div className="max-w-[88%] space-y-1">
                      <div className="rounded-2xl rounded-tl-xs bg-muted/60 dark:bg-muted/30 border border-border/80 p-4 shadow-2xs space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground">Hoş geldin, {userName}!</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold">
                            {selectedArea?.name || "Kişisel Gelişim"}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                          Bugün seni dinliyorum. İster takıldığın bir konuyu sor, ister günün planını kuralım. Enerjin ve hedefin doğrultusunda yanındayım.
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground ml-1 block font-mono">
                        {new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                )}

                {busy && (
                  <div className="flex items-start gap-3">
                    <CompanionAvatar
                      size={30}
                      color={companionSettings.color}
                      outfit={companionSettings.outfit}
                      level={actualLevel}
                    />
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-muted/60 border border-border px-3.5 py-2 text-xs text-foreground shadow-2xs">
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

            {/* Clean, Focused Composer Input */}
            <div className="p-3 border-t border-border/70 shrink-0 bg-background/60 space-y-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  {
                    label: "🔍 Canlı Kaynak & Video Bul",
                    prompt: `${selectedArea?.name || "Hedefim"} için en güncel ve kaliteli video, döküman ve çalışma kaynaklarını webde araştırıp listeler misin?`,
                  },
                  {
                    label: "🎯 Nereden Başlamalıyım?",
                    prompt: `${selectedArea?.name || "Hedefim"} konusunda sıfırdan veya mevcut seviyemden nasıl ilerlemeliyim, taktik ve kaynak ver?`,
                  },
                  {
                    label: "📚 Soru & Pratik Kaynakları",
                    prompt: `${selectedArea?.name || "Hedefim"} için pratik yapabileceğim en isabetli soru bankası, lab veya test kaynaklarını bul.`,
                  },
                  {
                    label: "⚡ Günün Planını Kur",
                    prompt: "Bugünkü enerjime göre en kritik 1 veya 2 aksiyonu belirleyip planı oluştur.",
                  },
                ].map((chip, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setQuestion(chip.prompt);
                    }}
                    className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
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

              <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3.5 py-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
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
                  placeholder={pendingAttachments.length > 0 ? "Dosyalar eklendi. Gönder..." : `Koçuna danış veya hedefini paylaş...`}
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
              {error && <p role="alert" className="mt-1 text-xs font-medium text-destructive px-1">{error}</p>}
            </div>
          </div>
        </section>
      </div>

      <CompanionModal
        open={companionModalOpen}
        onOpenChange={setCompanionModalOpen}
        state={state}
      />
    </div>
  );
}

function CoachResourceCards({
  resources,
  onAttachToTask,
  onCreateTask,
}: {
  resources: CoachResource[];
  onAttachToTask: (res: CoachResource) => void;
  onCreateTask: (res: CoachResource) => void;
}) {
  if (!resources || resources.length === 0) return null;

  return (
    <div className="my-2.5 rounded-2xl border border-primary/25 bg-card/90 backdrop-blur-xs p-3 sm:p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          <Globe2 className="size-3.5 text-primary" />
          <span>Doğrulanmış Web Kaynakları ({resources.length})</span>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Canlı Doğrulandı
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {resources.map((res, idx) => {
          const typeConfig: Record<string, { label: string; icon: any; color: string; badge: string }> = {
            video: {
              label: "Video / Anlatım",
              icon: Play,
              color: "text-rose-500",
              badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
            },
            documentation: {
              label: "Dokümantasyon",
              icon: BookOpen,
              color: "text-sky-500",
              badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
            },
            course: {
              label: "Kurs / Eğitim",
              icon: GraduationCap,
              color: "text-purple-500",
              badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
            },
            practice: {
              label: "Pratik / Lab",
              icon: Code2,
              color: "text-emerald-500",
              badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
            },
            book: {
              label: "Kitap / Soru Bankası",
              icon: FileText,
              color: "text-amber-500",
              badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
            },
            tool: {
              label: "Araç / Repo",
              icon: Zap,
              color: "text-indigo-500",
              badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
            },
            article: {
              label: "Rehber / Makale",
              icon: Globe2,
              color: "text-blue-500",
              badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
            },
          };

          const config = typeConfig[res.type] || typeConfig.article;
          const Icon = config.icon;
          let displaySource = res.source;
          if (!displaySource) {
            try {
              displaySource = new URL(res.url).hostname.replace(/^www\./, "");
            } catch {
              displaySource = "web";
            }
          }

          return (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-xl border border-border bg-card/80 p-3 hover:border-primary/40 hover:shadow-xs transition-all gap-2"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1 text-[10px]">
                  <span className={cn("inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded-md border", config.badge)}>
                    <Icon className={cn("size-3", config.color)} />
                    {config.label}
                  </span>
                  <span className="font-mono text-muted-foreground truncate max-w-[120px]" title={displaySource}>
                    {displaySource}
                  </span>
                </div>

                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group font-semibold text-xs text-foreground hover:text-primary transition line-clamp-2 inline-flex items-start gap-1"
                >
                  <span className="group-hover:underline underline-offset-2 leading-snug">{res.title}</span>
                  <ExternalLink className="size-3 shrink-0 text-muted-foreground group-hover:text-primary mt-0.5" />
                </a>

                {res.description && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {res.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 pt-2 border-t border-border/50">
                <Button
                  asChild
                  variant="outline"
                  size="xs"
                  className="flex-1 text-[10px] h-7 gap-1"
                >
                  <a href={res.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3" />
                    <span>Kaynağı Aç</span>
                  </a>
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  className="text-[10px] h-7 gap-1 px-2"
                  title="Bu kaynağı doğrudan bugünün görevine bağla"
                  onClick={() => onAttachToTask(res)}
                >
                  <Plus className="size-3" />
                  <span>Göreve Bağla</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

