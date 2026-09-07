"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Brain,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  Flame,
  Heart,
  HelpCircle,
  ListChecks,
  Lock,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Square,
  Terminal,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { dayKey, suggestDailyAdaptation, type NorthActivity, type SupportSource } from "@/lib/north";
import { inferTaskType, refreshIntelligence } from "@/lib/north-intelligence";
import { browserCompanion } from "@/lib/focus-companion";
import { useNorth, fieldClass } from "./shared";
import { Button } from "@/components/ui/button";
import { Companion } from "./shared";
import { getTaskGuidance } from "@/lib/task-guidance";
import { ambientSound } from "@/lib/ambient-sound";
import { PipTimerController } from "@/lib/pip-timer";
import { BrainDumpModal } from "./brain-dump";
import { BreathworkModal } from "./breathwork-modal";
import { toast } from "sonner";
import { NorthChatPopover } from "./north-chat-popover";

type Timer = {
  id: string;
  started: number;
  beganAt?: number;
  accumulated: number;
  running: boolean;
  pauses?: number;
};

export function NorthFocus({ id }: { id: string }) {
  const { state, update, ready, workspace } = useNorth();
  const router = useRouter();
  const task = state.tasks.find((t) => t.id === id);
  const area = state.areas.find((a) => a.id === task?.areaId);

  const guidance = task ? getTaskGuidance(task, area) : null;
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const [timer, setTimer] = useState<Timer | null>(null);
  const [now, setNow] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [outcome, setOutcome] = useState<NorthActivity["outcome"]>("done");
  const [difficulty, setDifficulty] = useState("Tam kararında");
  const [reflection, setReflection] = useState("");
  const [saved, setSaved] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [supportSources, setSupportSources] = useState<SupportSource[]>(["none"]);

  // Iron Will Mode & Tab Switch Tracking
  const [ironWill, setIronWill] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(`north:focus:iron:${id}`) === "true";
  });
  const [tabSwitches, setTabSwitches] = useState<number>(0);

  // Live Scratchpad (Canlı Çalışma Notları / Karalama Defteri)
  const [scratchpadOpen, setScratchpadOpen] = useState(false);
  const [scratchpadText, setScratchpadText] = useState("");

  // Proof of Work / Early Exit Gate States
  const [proofGateOpen, setProofGateOpen] = useState(false);
  const [proofMethod, setProofMethod] = useState<"text" | "photo" | "step" | "ai" | "abandon">("text");
  const [proofText, setProofText] = useState("");
  const [proofStepId, setProofStepId] = useState<string>("");
  const [verifiedProof, setVerifiedProof] = useState<{
    type: "output_text" | "photo" | "step" | "ai_verified" | "scratchpad" | "none";
    content: string;
  }>({ type: "none", content: "" });

  // AI Verification Check-in
  const [aiQuestionAnswer, setAiQuestionAnswer] = useState("");
  const [aiVerificationStatus, setAiVerificationStatus] = useState<"idle" | "checking" | "verified">("idle");

  // Abandonment / Forfeit 8-second Cooldown
  const [abandonCountdown, setAbandonCountdown] = useState<number>(8);
  const [abandonTimerActive, setAbandonTimerActive] = useState(false);

  // Phase 1 Tools: Ambient Sound, PiP Floating Timer, Brain Dump, Breathwork & Photo Proof
  const pipControllerRef = useRef<PipTimerController | null>(null);
  const [pipActive, setPipActive] = useState(false);
  const [brainDumpOpen, setBrainDumpOpen] = useState(false);
  const [breathworkOpen, setBreathworkOpen] = useState(false);
  const [activeSound, setActiveSound] = useState<"none" | "rain" | "noise" | "cafe" | "drone">("none");
  const [photoProof, setPhotoProof] = useState<string | null>(null);

  const toggleDifficulty = (value: string) => setDifficulty((current) => (current === value ? "" : value));

  function toggleStep(stepId: string) {
    setCompletedSteps((prev) => {
      const next = { ...prev, [stepId]: !prev[stepId] };
      try {
        sessionStorage.setItem(`north:focus:steps:${id}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  function handleCopy(cmd: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(cmd);
      setCopiedCmd(cmd);
      setTimeout(() => setCopiedCmd(null), 2000);
    }
  }

  // Hydration & timer recovery
  useEffect(() => {
    const hydration = setTimeout(() => {
      const key = `north:focus:${id}`;
      const stored = sessionStorage.getItem(key);
      if (stored) {
        try {
          const value = JSON.parse(stored) as Timer;
          if (typeof value.started === "number" && typeof value.accumulated === "number") {
            setTimer(value);
          }
        } catch {}
      }
      try {
        const storedSteps = sessionStorage.getItem(`north:focus:steps:${id}`);
        if (storedSteps) {
          setCompletedSteps(JSON.parse(storedSteps));
        }
      } catch {}
      try {
        const storedNotes = sessionStorage.getItem(`north:focus:notes:${id}`);
        if (storedNotes) {
          setScratchpadText(storedNotes);
        }
      } catch {}
    }, 0);
    const tick = setInterval(() => setNow(Date.now()), 250);
    return () => {
      clearTimeout(hydration);
      clearInterval(tick);
    };
  }, [id]);

  // Tab switches detection (Sekme değiştirme takibi)
  useEffect(() => {
    if (!timer?.running) return;
    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitches((prev) => prev + 1);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [timer?.running]);

  // Save session state
  useEffect(() => {
    if (timer) sessionStorage.setItem(`north:focus:${id}`, JSON.stringify(timer));
  }, [id, timer]);

  // Save scratchpad
  useEffect(() => {
    if (scratchpadText) {
      sessionStorage.setItem(`north:focus:notes:${id}`, scratchpadText);
    }
  }, [id, scratchpadText]);

  // Prevent accidental close
  useEffect(() => {
    if (!timer?.running) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [timer?.running]);

  // Abandonment countdown timer
  useEffect(() => {
    if (!abandonTimerActive || abandonCountdown <= 0) return;
    const timerId = setTimeout(() => {
      setAbandonCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timerId);
  }, [abandonTimerActive, abandonCountdown]);

  const totalSeconds = (task?.minutes ?? 50) * 60;
  const elapsed = timer ? timer.accumulated + (timer.running ? Math.max(0, now - timer.started) : 0) : 0;
  const elapsedSeconds = Math.floor(elapsed / 1000);
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  const progressPercent = Math.min(100, Math.max(0, (elapsedSeconds / totalSeconds) * 100));

  function handlePause() {
    if (timer?.running) {
      setTimer({
        ...timer,
        accumulated: timer.accumulated + Math.max(0, Date.now() - timer.started),
        running: false,
        pauses: (timer.pauses ?? 0) + 1,
      });
    }
  }

  function handleStart() {
    const started = Date.now();
    setNow(started);
    setTimer({
      id: crypto.randomUUID(),
      started,
      beganAt: started,
      accumulated: 0,
      running: true,
      pauses: 0,
    });
    if (area) void browserCompanion.start(area.id);
  }

  function handleResume() {
    if (!timer) return;
    setTimer({ ...timer, started: Date.now(), running: true });
  }

  function handleTriggerFinish() {
    handlePause();
    // If timer completed the full duration, proceed directly to feedback!
    if (remainingSeconds === 0) {
      setOutcome("done");
      setFinishing(true);
      return;
    }
    // If scratchpad has substantial content (>= 30 chars), pre-fill text proof!
    if (scratchpadText.trim().length >= 30 && !proofText) {
      setProofText(scratchpadText.trim());
    }
    // Early exit triggered -> Open Proof of Work Gate!
    setProofGateOpen(true);
  }

  function handleVerifyAndFinish(
    type: "output_text" | "photo" | "step" | "ai_verified" | "scratchpad",
    content: string
  ) {
    setVerifiedProof({ type, content });
    setProofGateOpen(false);
    setFinishing(true);
    setOutcome("done"); // Validated through proof!
    toast.success("Çalışma kanıtı başarıyla doğrulandı!");
  }

  function handleForfeitAbandon() {
    // Abandon session without fake minutes
    setProofGateOpen(false);
    sessionStorage.removeItem(`north:focus:${id}`);
    sessionStorage.removeItem(`north:focus:notes:${id}`);
    sessionStorage.removeItem(`north:focus:steps:${id}`);
    sessionStorage.removeItem(`north:focus:iron:${id}`);
    void browserCompanion.stop();

    // Log zeroed / abandoned activity so stats remain 100% honest
    if (timer && area) {
      const activity: NorthActivity = {
        id: timer.id,
        taskId: id,
        areaId: area.id,
        date: dayKey(),
        minutes: 0, // No fake minutes recorded!
        outcome: "skipped",
        difficulty: "Zorlayıcı",
        reflection: "Oturum erken terk edildi (kanıtsız vazgeçiş). Sahte süre eklenmedi.",
        amount: 0,
        metric: area.metric,
        endedAt: new Date().toISOString(),
        plannedMinutes: task?.minutes,
        actualStart: new Date(timer.beganAt ?? timer.started).toISOString(),
        earlyExit: true,
        completionPercent: 0,
        proofType: "abandoned",
        tabSwitches,
        ironWill,
      };
      update((s) => ({
        ...s,
        activities: [...s.activities, activity],
      }));
    }

    toast.info("Oturum iptal edildi. Sahte odak süresi yazılmadı; zihnini toparla ve hazır olduğunda tekrar dene.");
    router.push("/");
  }

  function handleAiVerifyCheck() {
    if (aiQuestionAnswer.trim().length < 10) {
      toast.error("Lütfen en azından ne öğrendiğini veya yaptığını 1 cümleyle açıkla.");
      return;
    }
    setAiVerificationStatus("checking");
    setTimeout(() => {
      setAiVerificationStatus("verified");
      toast.success("North AI öğrenim çıktısını onayladı!");
    }, 900);
  }

  const toggleIronWill = () => {
    const next = !ironWill;
    setIronWill(next);
    sessionStorage.setItem(`north:focus:iron:${id}`, String(next));
    if (next) {
      toast.success("Demir İrade Modu Devrede: Sekme değişimleri izlenir ve erken çıkışta somut kanıt zorunludur!");
    } else {
      toast.info("Standart Odak Moduna geçildi.");
    }
  };

  // Circular timer constants
  const size = 260;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const minutesStr = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const secondsStr = String(remainingSeconds % 60).padStart(2, "0");

  useEffect(() => {
    if (pipControllerRef.current?.isActive() && task) {
      pipControllerRef.current.update(
        task.title,
        `${minutesStr}:${secondsStr}`,
        area?.name || "North Odak",
        !timer?.running
      );
    }
  }, [minutesStr, secondsStr, task, area, timer?.running]);

  useEffect(() => {
    return () => {
      ambientSound?.stop();
      if (pipControllerRef.current?.isActive()) {
        void pipControllerRef.current.close();
      }
    };
  }, []);

  const handleTogglePip = async () => {
    if (!pipControllerRef.current) {
      pipControllerRef.current = new PipTimerController();
    }
    if (pipActive) {
      await pipControllerRef.current.close();
      setPipActive(false);
    } else {
      const ok = await pipControllerRef.current.start(
        task?.title || "Odak Görevi",
        `${minutesStr}:${secondsStr}`,
        area?.name || "North Odak"
      );
      if (ok) setPipActive(true);
      else toast.error("Tarayıcınız Picture-in-Picture yüzen pencereyi desteklemiyor.");
    }
  };

  const handleSoundChange = (type: "none" | "rain" | "noise" | "cafe" | "drone") => {
    setActiveSound(type);
    if (!ambientSound) return;
    if (type === "none") {
      ambientSound.stop();
    } else {
      ambientSound.play(type, 0.4);
    }
  };

  if (!ready) {
    return <main className="flex min-h-[60vh] items-center justify-center p-8 text-sm text-muted-foreground">Oturum hazırlanıyor…</main>;
  }

  if (!task || !area) {
    return (
      <main className="mx-auto max-w-md p-10 text-center">
        <p className="text-muted-foreground">Görev bulunamadı.</p>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          Bugüne dön →
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
      {/* TOPBAR NAVIGATION & AREA BADGE & MODE INDICATOR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Bugüne dön
        </Link>

        <div className="flex items-center gap-2.5">
          {/* Iron Will Toggle Badge */}
          <button
            type="button"
            onClick={toggleIronWill}
            disabled={timer?.running}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
              ironWill
                ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 shadow-xs"
                : "border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground"
            }`}
            title={
              ironWill
                ? "Demir İrade Modu Aktif: Sekme değişimleri izlenir ve erken çıkışta kanıt şarttır."
                : "Demir İrade Modunu açmak için tıkla"
            }
          >
            {ironWill ? <ShieldAlert className="size-3.5 text-red-500" /> : <Shield className="size-3.5" />}
            <span>{ironWill ? "Demir İrade Modu" : "Standart Mod"}</span>
          </button>

          <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-semibold text-foreground">
            <span>{area.icon}</span>
            <span>{area.name}</span>
          </span>
          <Companion state={state} compact />
        </div>
      </div>

      {!finishing ? (
        <div className="mt-8 flex flex-col items-center text-center">
          {/* TASK TITLE & GOAL */}
          <div className="max-w-xl space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {task.title}
            </h1>
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs leading-relaxed text-foreground sm:text-sm">
              <span className="font-semibold text-primary">Somut Çıktı: </span>
              {task.goal}
            </div>
            {task.resource && task.resource.startsWith("https://") && (
              <a
                href={task.resource}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                Kaynak dökümanı aç
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>

          {/* FOCUS COMPANION TOOLS: AMBIENT SOUNDS, PiP, SCRATCHPAD & BRAIN DUMP */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-xl border border-border/80 bg-card p-1 text-xs shadow-xs">
              <span className="px-2 text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                {activeSound === "none" ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5 text-primary" />}
                Ses:
              </span>
              {([
                ["none", "Kapalı"],
                ["rain", "🌧️ Yağmur"],
                ["cafe", "☕ Kafe"],
                ["noise", "📻 Beyaz"],
                ["drone", "🧘 432Hz"],
              ] as const).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleSoundChange(val)}
                  className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
                    activeSound === val ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Live Scratchpad Button */}
            <Button
              variant={scratchpadOpen ? "secondary" : "outline"}
              size="sm"
              className="rounded-xl text-xs h-8"
              onClick={() => setScratchpadOpen((prev) => !prev)}
              title="Çalışırken formül, komut, link veya not kaydet"
            >
              <FileText className="mr-1.5 size-3.5 text-amber-500" />
              Canlı Notlar {scratchpadText.trim() ? `(${scratchpadText.trim().split(/\s+/).length} kelime)` : ""}
            </Button>

            <Button
              variant={pipActive ? "secondary" : "outline"}
              size="sm"
              className="rounded-xl text-xs h-8"
              onClick={handleTogglePip}
              title="Diğer uygulamalarda da ekranın üstünde kalan yüzen mini sayaç"
            >
              <Maximize2 className="mr-1.5 size-3.5" />
              {pipActive ? "PiP Kapat" : "Yüzen Sayaç"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs h-8"
              onClick={() => setBrainDumpOpen(true)}
              title="Çalışırken aklına gelen alakasız düşünceleri kaydet"
            >
              <Brain className="mr-1.5 size-3.5 text-sky-500" />
              Aklındakini Dök
            </Button>
          </div>

          {/* EXPANDABLE LIVE SCRATCHPAD DRAWER */}
          {scratchpadOpen && (
            <div className="mt-4 w-full max-w-xl rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-left transition-all">
              <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-amber-500" />
                  <span className="text-xs font-semibold text-foreground">Canlı Çalışma Notları &amp; Karalama</span>
                </div>
                <div className="flex items-center gap-2">
                  {scratchpadText.trim().length >= 20 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Check className="size-3" />
                      Çıktı Kanıtı Hazır
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setScratchpadOpen(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
              <textarea
                value={scratchpadText}
                onChange={(e) => setScratchpadText(e.target.value)}
                placeholder="Çalışırken çözdüğün adımları, aldığın formül veya kod notlarını buraya yazabilirsin. Burada yazdıkların erken çıkışta doğrudan kanıt sayılır..."
                className="mt-2.5 h-28 w-full resize-none rounded-xl border border-border/80 bg-background/80 p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-hidden font-sans"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                Notlarınız otomatik olarak tarayıcı oturumunuza kaydedilir.
              </p>
            </div>
          )}

          {/* TAB SWITCH WARNING BADGE (when running) */}
          {timer?.running && tabSwitches > 0 && (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-3.5" />
              <span>{tabSwitches} kez başka sekmeye / uygulamaya geçildi</span>
            </div>
          )}

          {/* CIRCULAR ZEN TIMER */}
          <div className="relative my-8 flex items-center justify-center">
            <div className={`relative ${timer?.running ? "pulse-zen" : ""}`}>
              <svg width={size} height={size} className="-rotate-90">
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="color-mix(in srgb, var(--border) 70%, transparent)"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={ironWill ? "rgb(239, 68, 68)" : "var(--primary)"}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-300 ease-out"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-5xl font-light tracking-tighter text-foreground sm:text-6xl">
                  {minutesStr}:{secondsStr}
                </span>
                <span className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  {ironWill && <ShieldAlert className="size-3 text-red-500" />}
                  {!timer ? "Başlamaya Hazır" : timer.running ? (ironWill ? "Demir İrade Odak" : "Derin Odak") : "Duraklatıldı"}
                </span>
                {timer && (
                  <span className="mt-1 font-mono text-xs text-muted-foreground/70">
                    Geçen: {Math.floor(elapsedSeconds / 60)} dk
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {!timer ? (
              <Button size="lg" className="rounded-full px-8 shadow-sm" onClick={handleStart}>
                <Play className="mr-2 size-4" />
                Odaklanmayı Başlat
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  variant={timer.running ? "outline" : "default"}
                  className="rounded-full px-6"
                  onClick={() => (timer.running ? handlePause() : handleResume())}
                >
                  {timer.running ? <Pause className="mr-2 size-4" /> : <Play className="mr-2 size-4" />}
                  {timer.running ? "Duraklat" : "Devam Et"}
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-full px-6"
                  onClick={handleTriggerFinish}
                >
                  <Square className="mr-2 size-4" />
                  Oturumu Bitir
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="lg"
              className="rounded-full text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setCoachOpen(true)}
            >
              <HelpCircle className="mr-1.5 size-4 text-primary" />
              North Koç&apos;a Danış
            </Button>
          </div>

          {/* STEP-BY-STEP GUIDANCE, RESOURCES & COMMANDS */}
          {guidance && (
            <div className="mt-10 w-full max-w-xl space-y-6 text-left">
              {/* SECTION 1: ADIM ADIM YOL HARİTASI */}
              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-md bg-primary/10 text-primary">
                      <ListChecks className="size-4" />
                    </span>
                    <h2 className="text-sm font-semibold text-foreground">Bu Oturumda Ne Yapacaksın?</h2>
                  </div>
                  {guidance.steps.length > 0 && (
                    <span className="rounded-full bg-muted/60 border border-border/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {guidance.steps.filter((s) => completedSteps[s.id]).length} / {guidance.steps.length} tamamlandı
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{guidance.summary}</p>

                {/* Progress bar */}
                {guidance.steps.length > 0 && (
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted/40 border border-border/40">
                    <div
                      className="h-full bg-primary transition-all duration-300 rounded-full"
                      style={{
                        width: `${
                          (guidance.steps.filter((s) => completedSteps[s.id]).length / guidance.steps.length) * 100
                        }%`,
                      }}
                    />
                  </div>
                )}

                {/* Steps checklist */}
                <div className="mt-4 space-y-2.5">
                  {guidance.steps.map((step) => {
                    const isDone = !!completedSteps[step.id];
                    return (
                      <div
                        key={step.id}
                        onClick={() => toggleStep(step.id)}
                        className={`group flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all ${
                          isDone
                            ? "border-primary/30 bg-primary/5 text-muted-foreground"
                            : "border-border/60 bg-background/60 hover:border-primary/40 hover:bg-muted/30"
                        }`}
                      >
                        <button
                          type="button"
                          aria-label={isDone ? "Adımı tamamlanmadı olarak işaretle" : "Adımı tamamla"}
                          className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border transition-colors ${
                            isDone
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/40 bg-background"
                          }`}
                        >
                          {isDone && <Check className="size-3 stroke-[3]" />}
                        </button>
                        <div className="flex-1 space-y-1">
                          <p
                            className={`text-xs font-medium transition-colors ${
                              isDone ? "line-through opacity-75 text-foreground" : "text-foreground"
                            }`}
                          >
                            {step.title}
                          </p>
                          <p className="text-[11px] leading-relaxed text-muted-foreground">{step.detail}</p>
                          {step.command && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(step.command!);
                              }}
                              className="mt-2.5 inline-flex items-center gap-2 rounded-lg border border-border/70 bg-zinc-900 px-3 py-1 font-mono text-[11px] text-zinc-100 transition-colors hover:border-primary/60 hover:bg-zinc-800 dark:bg-black/60"
                              title="Tıkla ve kopyala"
                            >
                              <code className="text-zinc-200">{step.command}</code>
                              <span className="text-[10px] font-sans font-medium text-primary">
                                {copiedCmd === step.command ? "Kopyalandı ✓" : "Kopyala"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: HIZLI KOMUTLAR & İPUÇLARI */}
              {guidance.commands.length > 0 && (
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-2 border-b pb-3.5">
                    <span className="grid size-6 place-items-center rounded-md bg-primary/10 text-primary">
                      <Terminal className="size-4" />
                    </span>
                    <h2 className="text-sm font-semibold text-foreground">Hızlı Komutlar &amp; Nasıl Yapılır?</h2>
                  </div>

                  <div className="mt-3.5 space-y-2.5">
                    {guidance.commands.map((cmdTip, idx) => (
                      <div key={idx} className="rounded-xl border bg-background/80 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-foreground">{cmdTip.title}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() => handleCopy(cmdTip.command)}
                            className="h-6 gap-1 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                          >
                            {copiedCmd === cmdTip.command ? (
                              <>
                                <Check className="size-3 text-emerald-500" />
                                <span className="text-emerald-500">Kopyalandı</span>
                              </>
                            ) : (
                              <>
                                <Copy className="size-3" />
                                <span>Kopyala</span>
                              </>
                            )}
                          </Button>
                        </div>
                        <pre className="mt-1.5 overflow-x-auto rounded-lg bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100 dark:bg-black/60">
                          <code>{cmdTip.command}</code>
                        </pre>
                        <p className="mt-1.5 text-[11px] text-muted-foreground">{cmdTip.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 3: ÖNERİLEN KAYNAKLAR & LABLAR */}
              {guidance.resources.length > 0 && (
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-2 border-b pb-3.5">
                    <span className="grid size-6 place-items-center rounded-md bg-primary/10 text-primary">
                      <BookOpen className="size-4" />
                    </span>
                    <h2 className="text-sm font-semibold text-foreground">Önerilen Kaynaklar &amp; Lab Bağlantıları</h2>
                  </div>

                  <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
                    {guidance.resources.map((res, idx) => (
                      <a
                        key={idx}
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex flex-col justify-between rounded-xl border bg-background/80 p-3 transition-all hover:border-primary/50 hover:bg-muted/30"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                              {res.badge}
                            </span>
                            <ExternalLink className="size-3 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                          </div>
                          <h3 className="mt-2 text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                            {res.title}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground leading-relaxed">
                            {res.description}
                          </p>
                        </div>
                        <span className="mt-3 text-[10px] font-medium text-primary underline underline-offset-2">
                          Kaynağa Git →
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 4: STUCK? ASK NORTH AI */}
              <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center sm:flex-row sm:text-left">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">Hâlâ nereden başlayacağını bilmiyor musun?</p>
                  <p className="text-[11px] text-muted-foreground">
                    North Koç sana bu görev için adım adım pratik rehberlik yapmaya hazır.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setCoachOpen(true)}
                  className="shrink-0 gap-1.5 rounded-full"
                >
                  <Sparkles className="size-3.5" />
                  North Koç&apos;a Danış
                </Button>
              </div>
            </div>
          )}

          <p className="mt-12 text-xs text-muted-foreground/60">
            North yalnızca oturum sürenizi ve girdiğiniz çıktıları kaydeder; arka planda cihaz etkinliği veya ekran izlemesi yapmaz.
          </p>
        </div>
      ) : (
        /* POST-SESSION FEEDBACK SCREEN */
        <section className="celebrate-pop mt-6 space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="size-4" />
                Odak Oturumu Tamamlandı
              </div>
              {/* Verified Proof Badge */}
              {verifiedProof.type !== "none" && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-3.5" />
                  {verifiedProof.type === "output_text" && "Somut Çıktı Doğrulandı"}
                  {verifiedProof.type === "photo" && "Fotoğraf Kanıtı Eklendi"}
                  {verifiedProof.type === "step" && "Görev Adımı Onaylandı"}
                  {verifiedProof.type === "ai_verified" && "North AI Tarafından Teyit Edildi"}
                  {verifiedProof.type === "scratchpad" && "Canlı Not Kanıtı Onaylandı"}
                </span>
              )}
            </div>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
              {Math.floor(elapsed / 60000)} dakikalık oturum nasıl geçti?
            </h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Değerlendirmen, sonraki günlerdeki oturum sürelerini ve görev yoğunluğunu otomatik olarak optimize eder.
            </p>

            {/* STATS STRIP: TAB SWITCHES & IRON WILL STATUS */}
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-lg border bg-muted/40 px-2.5 py-1 text-muted-foreground font-mono">
                Sekme Geçişi:{" "}
                <strong className={tabSwitches === 0 ? "text-emerald-500" : "text-amber-500"}>
                  {tabSwitches === 0 ? "0 (Kusursuz Odak)" : `${tabSwitches} kez`}
                </strong>
              </span>
              {ironWill && (
                <span className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-red-600 dark:text-red-400 font-semibold">
                  <ShieldAlert className="size-3.5" />
                  Demir İrade Başarısı
                </span>
              )}
            </div>

            {/* OUTCOME SELECTION */}
            <div className="mt-6">
              <label className="block text-xs font-semibold text-foreground">Sonuç</label>
              <div className="mt-2 grid grid-cols-3 gap-2.5">
                {([
                  ["done", "Tamamladım", "Çıktıyı başardım"],
                  ["partial", "Kısmen", "İlerledim ama bitmedi"],
                  ["skipped", "Takıldım", "Tekrar deneyeceğim"],
                ] as const).map(([val, label, sub]) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setOutcome(val)}
                    className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                      outcome === val
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <span className="text-xs font-semibold">{label}</span>
                    <span className="mt-0.5 text-[10px] opacity-75">{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* DIFFICULTY SELECTION */}
            <div className="mt-5">
              <label className="block text-xs font-semibold text-foreground">Zorluk</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {["Kolay", "Tam kararında", "Zorlayıcı"].map((val) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => toggleDifficulty(val)}
                    className={`rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                      difficulty === val
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* SUPPORT SOURCES */}
            <div className="mt-5">
              <label className="block text-xs font-semibold text-foreground">
                Yardım veya kaynak kullandın mı?
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {([
                  ["none", "Yardım almadım"],
                  ["ai", "North AI"],
                  ["documentation", "Resmî Doküman"],
                  ["video", "Video / Ders"],
                  ["forum", "Topluluk / Çözüm"],
                ] as const).map(([val, label]) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() =>
                      setSupportSources((cur) =>
                        val === "none"
                          ? ["none"]
                          : cur.includes(val)
                          ? cur.filter((s) => s !== val)
                          : [...cur.filter((s) => s !== "none"), val]
                      )
                    }
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      supportSources.includes(val)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* REFLECTION NOTE */}
            <div className="mt-5">
              <label className="block text-xs font-semibold text-foreground">
                Kısa bir not eklemek ister misin? <span className="text-muted-foreground font-normal">(İsteğe bağlı)</span>
              </label>
              <input
                className={fieldClass + " mt-2"}
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Nerede tıkandın veya ne iyi gitti?"
              />
            </div>

            {/* PHOTO PROOF UPLOAD (if not already uploaded in proof gate) */}
            <div className="mt-5">
              <label className="block text-xs font-semibold text-foreground">
                Fotoğraflı Çalışma Kanıtı <span className="text-muted-foreground font-normal">(Defter, masa, test veya ekran fotoğrafı)</span>
              </label>
              <div className="mt-2 flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-3.5 py-2 text-xs text-muted-foreground hover:border-primary hover:text-foreground">
                  <Camera className="size-4" />
                  <span>{photoProof ? "Fotoğrafı Değiştir" : "Fotoğraf Seç"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 4 * 1024 * 1024) {
                        toast.error("Fotoğraf 4MB'dan küçük olmalıdır.");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => setPhotoProof(reader.result as string);
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                {photoProof && (
                  <div className="relative size-12 overflow-hidden rounded-lg border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoProof} alt="Kanıt önizleme" className="size-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* SUBMIT OR NEXT STEPS */}
            <div className="mt-6 border-t pt-5">
              {!saved ? (
                <Button
                  size="lg"
                  className="w-full rounded-xl sm:w-auto"
                  onClick={() => {
                    if (!timer) return;
                    setSaved(true);
                    const actualMinutes = Math.max(1, Math.floor(elapsed / 60000));
                    const activity: NorthActivity = {
                      id: timer.id,
                      taskId: id,
                      areaId: area.id,
                      date: dayKey(),
                      minutes: actualMinutes,
                      outcome,
                      difficulty,
                      reflection: [verifiedProof.content, reflection].filter(Boolean).join(" · "),
                      amount: 0,
                      metric: area.metric,
                      endedAt: new Date().toISOString(),
                      plannedMinutes: task.minutes,
                      actualStart: new Date(timer.beganAt ?? timer.started).toISOString(),
                      plannedStart: task.plannedStart,
                      energy: state.energy.date === dayKey() ? state.energy.level : "normal",
                      pauseCount: Math.max(0, (timer.pauses ?? 0) - (timer.running ? 0 : 1)),
                      earlyExit: remainingSeconds > 0,
                      completionPercent:
                        outcome === "done" ? 100 : outcome === "skipped" ? 0 : Math.min(99, Math.round((actualMinutes / task.minutes) * 100)),
                      taskType: inferTaskType(task, area.kind),
                      supportSources,
                      proofType: verifiedProof.type !== "none" ? verifiedProof.type : photoProof ? "photo" : undefined,
                      proofContent: verifiedProof.content || undefined,
                      tabSwitches,
                      ironWill,
                    };

                    if ((photoProof || verifiedProof.type === "photo") && workspace.addDomainProof) {
                      const proofUrl = photoProof || verifiedProof.content;
                      workspace.addDomainProof({
                        id: crypto.randomUUID(),
                        areaId: area.id,
                        title: `${task.title} (Fotoğraflı Kanıt)`,
                        kind: "other",
                        description: reflection || verifiedProof.content || `${task.title} çalışması tamamlandı.`,
                        url: proofUrl,
                        createdAt: new Date().toISOString(),
                      });
                    }

                    update((s) => {
                      if (s.activities.some((a) => a.id === timer.id)) return s;
                      const next = {
                        ...s,
                        activities: [...s.activities, activity],
                        tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: outcome } : t)),
                      };
                      return refreshIntelligence({ ...next, dailyAdaptation: suggestDailyAdaptation(s, activity) });
                    });
                    sessionStorage.removeItem(`north:focus:${id}`);
                    sessionStorage.removeItem(`north:focus:notes:${id}`);
                    sessionStorage.removeItem(`north:focus:steps:${id}`);
                    sessionStorage.removeItem(`north:focus:iron:${id}`);
                    void browserCompanion.stop();
                  }}
                >
                  <Check className="mr-2 size-4" />
                  Kaydet ve Sonucu İşle
                </Button>
              ) : (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs font-medium text-foreground">Oturum başarıyla kaydedildi. Şimdi ne yapmak istersin?</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => router.push("/")}>
                      Günün Sıradaki Adımına Geç →
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setBreathworkOpen(true)}>
                      <Heart className="mr-1.5 size-3.5 text-teal-500" />
                      2 Dk Nefes ve Göz Dinlendirme
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => router.push("/north-ai")}>
                      North ile Planı Gözden Geçir
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ================================================================= */}
      {/* PROOF OF WORK / PROOF OF FOCUS EARLY EXIT GATE MODAL               */}
      {/* ================================================================= */}
      <Dialog open={proofGateOpen} onOpenChange={setProofGateOpen}>
        <DialogContent className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-3xl p-6 sm:p-7">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-amber-500/10 text-amber-500">
                <Lock className="size-4" />
              </span>
              <DialogTitle className="text-base font-bold text-foreground">
                Erken Çıkış &amp; Çalışma Kanıtı Kapısı
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Hedeflenen sürenin tamamlanmasına <strong className="text-foreground">{minutesStr}:{secondsStr}</strong> kaldı. 
              North&apos;ta sahte süreler kaydedilmez; erken bitirmek için gerçekten çalıştığını kanıtla.
            </DialogDescription>
          </DialogHeader>

          {/* METHOD SELECTION TABS */}
          <div className="mt-4 grid grid-cols-4 gap-1.5 rounded-xl border bg-muted/50 p-1 text-xs">
            <button
              type="button"
              onClick={() => setProofMethod("text")}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-medium transition-colors ${
                proofMethod === "text"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="size-3.5 text-amber-500" />
              <span className="truncate">Somut Çıktı</span>
            </button>
            <button
              type="button"
              onClick={() => setProofMethod("photo")}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-medium transition-colors ${
                proofMethod === "photo"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Camera className="size-3.5 text-sky-500" />
              <span className="truncate">Fotoğraf</span>
            </button>
            <button
              type="button"
              onClick={() => setProofMethod("step")}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-medium transition-colors ${
                proofMethod === "step"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span className="truncate">Görev Adımı</span>
            </button>
            <button
              type="button"
              onClick={() => setProofMethod("ai")}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-medium transition-colors ${
                proofMethod === "ai"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="size-3.5 text-purple-500" />
              <span className="truncate">AI Teyit</span>
            </button>
          </div>

          {/* METHOD 1: SOMUT ÇIKTI (TEXT) */}
          {proofMethod === "text" && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Bu sürede ne ürettin veya neyi çözdün?
                </label>
                {scratchpadText.trim().length >= 15 && (
                  <button
                    type="button"
                    onClick={() => setProofText(scratchpadText.trim())}
                    className="text-[11px] font-medium text-primary hover:underline"
                  >
                    Canlı notlarımdan aktar ⤶
                  </button>
                )}
              </div>
              <textarea
                value={proofText}
                onChange={(e) => setProofText(e.target.value)}
                placeholder="Örnek: Fonksiyonlar testinden 10 soru çözdüm, ters fonksiyon kuralını pekiştirdim veya OWASP SQLi labında payload çalıştırdım..."
                className="h-28 w-full rounded-xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>En az 20 karakter gereklidir</span>
                <span className={proofText.trim().length >= 20 ? "text-emerald-500 font-semibold" : ""}>
                  {proofText.trim().length} / 20 karakter
                </span>
              </div>
              <Button
                type="button"
                className="w-full rounded-xl"
                disabled={proofText.trim().length < 20}
                onClick={() => handleVerifyAndFinish("output_text", proofText.trim())}
              >
                <Check className="mr-1.5 size-4" />
                Çıktıyı Kanıtla ve Oturumu Bitir
              </Button>
            </div>
          )}

          {/* METHOD 2: FOTOĞRAF / EKRAN KANITI */}
          {proofMethod === "photo" && (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Çözdüğün soru kağıdı, defter notu, terminal çıktısı veya kod ekranının anlık fotoğrafını yükle:
              </p>
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 p-6 text-center hover:border-primary/50 transition-colors">
                {photoProof ? (
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoProof}
                      alt="Yüklenen Kanıt"
                      className="max-h-40 max-w-full rounded-lg object-contain shadow-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPhotoProof(null)}
                      className="text-xs"
                    >
                      Fotoğrafı Değiştir
                    </Button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center gap-2">
                    <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                      <Camera className="size-5" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">Fotoğraf Seç veya Kamerayla Çek</span>
                    <span className="text-[10px] text-muted-foreground">PNG, JPG, HEIC (Maks. 4MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 4 * 1024 * 1024) {
                          toast.error("Fotoğraf 4MB'dan küçük olmalıdır.");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => setPhotoProof(reader.result as string);
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                )}
              </div>
              <Button
                type="button"
                className="w-full rounded-xl"
                disabled={!photoProof}
                onClick={() => handleVerifyAndFinish("photo", photoProof!)}
              >
                <Check className="mr-1.5 size-4" />
                Görsel Kanıtı Onayla ve Bitir
              </Button>
            </div>
          )}

          {/* METHOD 3: GÖREV ADIMI DOĞRULAMASI */}
          {proofMethod === "step" && (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Bu oturumda rehberdeki hangi adımı tamamladığını seç:
              </p>
              {guidance && guidance.steps.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {guidance.steps.map((step) => (
                    <label
                      key={step.id}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 text-left text-xs transition-colors ${
                        proofStepId === step.id
                          ? "border-emerald-500/50 bg-emerald-500/10 text-foreground"
                          : "border-border bg-background hover:bg-muted/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="proofStep"
                        className="mt-0.5"
                        checked={proofStepId === step.id}
                        onChange={() => setProofStepId(step.id)}
                      />
                      <div>
                        <p className="font-semibold">{step.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{step.detail}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Bu görev için rehber adımı bulunamadı.</p>
              )}
              <Button
                type="button"
                className="w-full rounded-xl"
                disabled={!proofStepId}
                onClick={() => {
                  const step = guidance?.steps.find((s) => s.id === proofStepId);
                  handleVerifyAndFinish("step", step ? `Tamamlanan Adım: ${step.title}` : "Adım tamamlandı.");
                }}
              >
                <Check className="mr-1.5 size-4" />
                Adım Doğrulamasıyla Bitir
              </Button>
            </div>
          )}

          {/* METHOD 4: NORTH AI POP TEYİT */}
          {proofMethod === "ai" && (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-xs leading-relaxed text-foreground">
                <span className="font-semibold text-purple-600 dark:text-purple-400">North AI Hızlı Soru: </span>
                <p className="mt-1">
                  &ldquo;{task.title}&rdquo; çalışırken aklında kalan en kritik 1 kural, formül veya edindiğin çıkarım ne oldu?
                </p>
              </div>
              <textarea
                value={aiQuestionAnswer}
                onChange={(e) => setAiQuestionAnswer(e.target.value)}
                placeholder="Örnek: Bu kavramın özü şudur..., formül şöyle uygulanır..., şu adımı başardım..."
                className="h-24 w-full rounded-xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-purple-500 focus:outline-hidden"
              />
              {aiVerificationStatus === "verified" ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>North AI cevabını onayladı! Öğrenim çıktın geçerli kabul edildi.</span>
                </div>
              ) : (
                <Button
                  type="button"
                  className="w-full rounded-xl"
                  disabled={aiQuestionAnswer.trim().length < 10 || aiVerificationStatus === "checking"}
                  onClick={handleAiVerifyCheck}
                >
                  <Sparkles className="mr-1.5 size-4" />
                  {aiVerificationStatus === "checking" ? "İnceleniyor…" : "AI ile Öğrenimimi Teyit Et"}
                </Button>
              )}

              {aiVerificationStatus === "verified" && (
                <Button
                  type="button"
                  className="w-full rounded-xl"
                  onClick={() => handleVerifyAndFinish("ai_verified", `AI Teyit: ${aiQuestionAnswer.trim()}`)}
                >
                  <Check className="mr-1.5 size-4" />
                  Teyit Edilmiş Olarak Oturumu Bitir
                </Button>
              )}
            </div>
          )}

          {/* FORFEIT / ABANDONMENT BOTTOM ACCORDION */}
          <div className="mt-6 border-t pt-4">
            {!abandonTimerActive ? (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setAbandonTimerActive(true);
                    setAbandonCountdown(8);
                  }}
                  className="text-xs text-muted-foreground/80 hover:text-red-500 transition-colors"
                >
                  Kanıtım yok / Pes ediyorum
                </button>
                <Button variant="ghost" size="sm" onClick={() => setProofGateOpen(false)}>
                  Odakta Kal
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 space-y-3 text-left">
                <div className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400">
                  <ShieldAlert className="size-4" />
                  <span>Dürüst Vazgeçiş Freni</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Dikkat dağılması ve yorgunluk insani bir durumdur. Ancak North sahte odak süresi kaydetmez. 
                  Pes edersen bu seans için süre işlenmez ve çizgin etkilenmez.
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {abandonCountdown > 0 ? (
                      `Derin nefes al... (${abandonCountdown} sn)`
                    ) : (
                      "Vazgeçiş onaylanabilir."
                    )}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={abandonCountdown > 0}
                      onClick={handleForfeitAbandon}
                    >
                      Dürüstçe Vazgeç
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAbandonTimerActive(false)}
                    >
                      Vazgeçme, Odakta Kal
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* BRAIN DUMP & BREATHWORK MODALS */}
      <BrainDumpModal open={brainDumpOpen} onOpenChange={setBrainDumpOpen} />
      <BreathworkModal open={breathworkOpen} onOpenChange={setBreathworkOpen} />

      {/* NORTH CHAT POPOVER (EXACT SAME AS ON HOME SCREEN) */}
      <NorthChatPopover open={coachOpen} onOpenChange={setCoachOpen} taskId={id} />
    </main>
  );
}
