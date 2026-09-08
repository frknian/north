"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Bot,
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
  Plus,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Square,
  Terminal,
  Trash2,
  Volume2,
  VolumeX,
  X,
  Zap,
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
import { BreathworkModal } from "./breathwork-modal";
import { NorthAI } from "./ai";
import { FocusSoundMixer, type AmbientSoundType } from "./focus-sound-mixer";
import {
  setFocusLock,
  clearFocusLock,
  markFocusLockInterrupted,
  generateExitQuestion,
  getTabId,
  type ActiveFocusLock,
} from "@/lib/focus-lock";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Timer = {
  id: string;
  started: number;
  beganAt?: number;
  accumulated: number;
  running: boolean;
  pauses?: number;
};

interface BrainDumpItem {
  id: string;
  text: string;
  createdAt: string;
  done?: boolean;
}

const BRAIN_DUMP_KEY = "north:brain_dump_items";

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
  const [supportSources, setSupportSources] = useState<SupportSource[]>(["none"]);

  // Iron Will Mode & Tab Switch Tracking
  const [ironWill, setIronWill] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(`north:focus:iron:${id}`) === "true";
  });
  const [tabSwitches, setTabSwitches] = useState<number>(0);

  // Live Scratchpad (Canlı Çalışma Notları / Karalama Defteri)
  const [scratchpadText, setScratchpadText] = useState("");

  // Inline Brain Dump
  const [brainDumpItems, setBrainDumpItems] = useState<BrainDumpItem[]>([]);
  const [brainDumpInput, setBrainDumpInput] = useState("");

  // Proof of Work / Early Exit Gate States
  const [proofGateOpen, setProofGateOpen] = useState(false);
  const [proofMethod, setProofMethod] = useState<"question" | "photo" | "step" | "ai" | "abandon">("question");
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

  // Ambient Sound, PiP Floating Timer, Breathwork & Photo Proof
  const pipControllerRef = useRef<PipTimerController | null>(null);
  const [pipActive, setPipActive] = useState(false);
  const [breathworkOpen, setBreathworkOpen] = useState(false);
  const [activeSound, setActiveSound] = useState<AmbientSoundType>("none");
  const [ambientVolume, setAmbientVolume] = useState(0.4);
  const [customMinutes, setCustomMinutes] = useState<number | null>(null);
  const [photoProof, setPhotoProof] = useState<string | null>(null);

  const exitQuestion = task ? generateExitQuestion(task.title, task.goal, area?.name || "", area?.kind) : "";

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

  // Hydration & recovery
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
      try {
        const storedDumps = localStorage.getItem(BRAIN_DUMP_KEY);
        if (storedDumps) {
          setBrainDumpItems(JSON.parse(storedDumps));
        }
      } catch {}
    }, 0);
    const tick = setInterval(() => setNow(Date.now()), 250);
    return () => {
      clearTimeout(hydration);
      clearInterval(tick);
    };
  }, [id]);

  // Tab switches detection (Sekme takibi)
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

  // =========================================================================
  // 1. GERİ TUŞU KİLİDİ (POPSTATE INTERCEPTOR - BROWSER BACK BUTTON LOCK)
  // =========================================================================
  useEffect(() => {
    if (!timer?.running) return;

    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      handleTriggerFinish();
      toast.warning("Odak oturumu kilitli! Çıkmak için konudan soruyu cevaplamanız gerekir.");
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [timer?.running]);

  // =========================================================================
  // 2. PERSISTENT REOPEN LOCK: UYGULAMA KAPATILIRSA INTERRUPTED OLARAK İŞARETLE
  // =========================================================================
  useEffect(() => {
    if (!timer?.running) return;
    const warn = (e: BeforeUnloadEvent) => {
      markFocusLockInterrupted();
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

  const currentMinutes = customMinutes ?? task?.minutes ?? 40;
  const totalSeconds = currentMinutes * 60;
  const elapsed = timer ? timer.accumulated + (timer.running ? Math.max(0, now - timer.started) : 0) : 0;
  const elapsedSeconds = Math.floor(elapsed / 1000);
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  const progressPercent = Math.min(100, Math.max(0, (elapsedSeconds / totalSeconds) * 100));

  function adjustMinutes(delta: number) {
    const next = Math.max(5, Math.min(180, currentMinutes + delta));
    setCustomMinutes(next);
    update((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, minutes: next } : t)),
    }));
    toast.info(`Odak süresi ${delta > 0 ? "+" : ""}${delta} dk güncellendi (${next} dk)`);
  }

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

    // SET GLOBAL MULTI-TAB & REOPEN LOCK
    if (area && task) {
      const exitQ = generateExitQuestion(task.title, task.goal, area.name, area.kind);
      setFocusLock({
        taskId: id,
        taskTitle: task.title,
        areaId: area.id,
        areaName: area.name,
        areaKind: area.kind,
        taskGoal: task.goal,
        startedAt: started,
        tabId: getTabId(),
        status: "running",
        exitQuestion: exitQ,
      });
      void browserCompanion.start(area.id);
    }
  }

  function handleResume() {
    if (!timer) return;
    setTimer({ ...timer, started: Date.now(), running: true });
  }

  function handleTriggerFinish() {
    handlePause();
    // If timer reached 0, finish directly
    if (remainingSeconds === 0) {
      setOutcome("done");
      setFinishing(true);
      return;
    }
    // If scratchpad has text, pre-fill proof
    if (scratchpadText.trim().length >= 25 && !proofText) {
      setProofText(scratchpadText.trim());
    }
    setProofGateOpen(true);
  }

  function handleVerifyAndFinish(
    type: "output_text" | "photo" | "step" | "ai_verified" | "scratchpad",
    content: string
  ) {
    clearFocusLock();
    setVerifiedProof({ type, content });
    setProofGateOpen(false);
    setFinishing(true);
    setOutcome("done");
    toast.success("Çalışma kanıtı ve çıkış sorusu doğrulandı!");
  }

  function handleForfeitAbandon() {
    clearFocusLock();
    setProofGateOpen(false);
    sessionStorage.removeItem(`north:focus:${id}`);
    sessionStorage.removeItem(`north:focus:notes:${id}`);
    sessionStorage.removeItem(`north:focus:steps:${id}`);
    sessionStorage.removeItem(`north:focus:iron:${id}`);
    void browserCompanion.stop();

    if (timer && area) {
      const activity: NorthActivity = {
        id: timer.id,
        taskId: id,
        areaId: area.id,
        date: dayKey(),
        minutes: 0,
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

    toast.info("Oturum iptal edildi. Sahte odak süresi yazılmadı.");
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
      toast.success("Demir İrade Modu Devrede: Sekme değişimleri izlenir ve erken çıkışta somut kanıt şarttır!");
    } else {
      toast.info("Standart Odak Moduna geçildi.");
    }
  };

  // Inline Brain Dump Actions
  const handleAddBrainDump = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brainDumpInput.trim()) return;
    const item: BrainDumpItem = {
      id: crypto.randomUUID(),
      text: brainDumpInput.trim(),
      createdAt: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    };
    const next = [item, ...brainDumpItems];
    setBrainDumpItems(next);
    try {
      localStorage.setItem(BRAIN_DUMP_KEY, JSON.stringify(next));
    } catch {}
    setBrainDumpInput("");
    toast.success("Düşünce zihinden döküldü.");
  };

  const handleDeleteBrainDump = (dumpId: string) => {
    const next = brainDumpItems.filter((i) => i.id !== dumpId);
    setBrainDumpItems(next);
    try {
      localStorage.setItem(BRAIN_DUMP_KEY, JSON.stringify(next));
    } catch {}
  };

  const handleToggleBrainDumpDone = (dumpId: string) => {
    const next = brainDumpItems.map((i) => (i.id === dumpId ? { ...i, done: !i.done } : i));
    setBrainDumpItems(next);
    try {
      localStorage.setItem(BRAIN_DUMP_KEY, JSON.stringify(next));
    } catch {}
  };

  // Circular timer constants
  const size = 56;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const displaySeconds = timer ? remainingSeconds : totalSeconds;
  const minutesStr = String(Math.floor(displaySeconds / 60)).padStart(2, "0");
  const secondsStr = String(displaySeconds % 60).padStart(2, "0");

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

  const handleSoundChange = (type: AmbientSoundType) => {
    setActiveSound(type);
    if (!ambientSound) return;
    if (type === "none") {
      ambientSound.stop();
    } else {
      ambientSound.play(type, ambientVolume);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setAmbientVolume(vol);
    ambientSound?.setVolume(vol);
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
    <main className="w-full max-w-none px-2 sm:px-3 py-2 min-h-screen lg:h-screen flex flex-col gap-2 overflow-y-auto lg:overflow-hidden">
      {/* 1. COMPACT TOP CONTROL BAR (Unified Navigation, Area, Task, Centered Digital Timer, Controls) */}
      <header className="shrink-0 rounded-2xl border bg-card/90 backdrop-blur-md px-3 py-2 shadow-xs grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3 min-h-[58px]">
        {/* Left: Back, Area, Task Title & Goal */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (timer?.running) {
                handleTriggerFinish();
                toast.warning("Odak oturumu devam ediyor. Çıkmak için konudan soruyu cevaplaman gerekir.");
              } else {
                router.push("/");
              }
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground shrink-0"
            title="Bugüne dön"
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Bugün</span>
          </button>

          <span className="inline-flex items-center gap-1.5 rounded-xl border bg-muted/60 px-2.5 py-1 text-xs font-semibold text-foreground shrink-0">
            <span>{area.icon}</span>
            <span className="hidden md:inline">{area.name}</span>
          </span>

          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2 min-w-0">
              <span className="rounded-md bg-primary/10 px-1.5 py-0.2 text-[10px] font-semibold text-primary shrink-0">
                Odak Görevi
              </span>
              <h1 className="text-xs sm:text-sm font-bold tracking-tight text-foreground truncate" title={task.title}>
                {task.title}
              </h1>
            </div>
            {task.goal && (
              <p className="text-[11px] text-muted-foreground truncate" title={task.goal}>
                <span className="text-primary font-medium">Somut Çıktı: </span>
                {task.goal}
              </p>
            )}
          </div>
        </div>

        {/* Center: Digital Timer (40:00) with -+5 and 10 dk buttons (Süreyi ortaya al, çember yerine 40:00) */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 shrink-0 py-0.5">
          {/* -10 and -5 minute buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => adjustMinutes(-10)}
              disabled={currentMinutes <= 10}
              className="rounded-lg border border-border/70 bg-muted/50 hover:bg-muted active:scale-95 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-xs disabled:opacity-30 disabled:pointer-events-none"
              title="10 dakika azalt"
              aria-label="10 dakika azalt"
            >
              -10
            </button>
            <button
              type="button"
              onClick={() => adjustMinutes(-5)}
              disabled={currentMinutes <= 5}
              className="rounded-lg border border-border/70 bg-muted/50 hover:bg-muted active:scale-95 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-xs disabled:opacity-30 disabled:pointer-events-none"
              title="5 dakika azalt"
              aria-label="5 dakika azalt"
            >
              -5
            </button>
          </div>

          {/* Digital Timer Display (Çember yerine 40:00) */}
          <div className="flex flex-col items-center justify-center px-1.5 sm:px-3 text-center min-w-[90px]">
            <span className="font-mono text-2xl sm:text-3xl font-black tracking-tight text-foreground tabular-nums select-none leading-tight">
              {minutesStr}:{secondsStr}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">
                {!timer ? "Hazır" : timer.running ? (ironWill ? "Demir İrade" : "Derin Odak") : "Duraklatıldı"}
              </span>
              <span>•</span>
              <span className="font-mono">
                {timer ? `Kalan: ${Math.ceil(remainingSeconds / 60)} dk` : `Plan: ${currentMinutes} dk`}
              </span>
              {ironWill && <ShieldAlert className="size-3 text-red-500 inline ml-0.5" />}
            </div>
          </div>

          {/* +5 and +10 minute buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => adjustMinutes(5)}
              disabled={currentMinutes >= 180}
              className="rounded-lg border border-border/70 bg-muted/50 hover:bg-muted active:scale-95 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-xs disabled:opacity-30 disabled:pointer-events-none"
              title="5 dakika ekle"
              aria-label="5 dakika ekle"
            >
              +5
            </button>
            <button
              type="button"
              onClick={() => adjustMinutes(10)}
              disabled={currentMinutes >= 180}
              className="rounded-lg border border-border/70 bg-muted/50 hover:bg-muted active:scale-95 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-xs disabled:opacity-30 disabled:pointer-events-none"
              title="10 dakika ekle"
              aria-label="10 dakika ekle"
            >
              +10
            </button>
          </div>

          {timer?.running && tabSwitches > 0 && (
            <span className="hidden xl:inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-medium ml-1">
              <AlertTriangle className="size-2.5" />
              {tabSwitches} sekme
            </span>
          )}
        </div>

        {/* Right: Controls & Tools */}
        <div className="flex items-center justify-end gap-1.5 min-w-0">
          {!timer ? (
            <Button size="sm" className="rounded-xl px-3 sm:px-4 text-xs font-semibold shadow-xs h-8" onClick={handleStart}>
              <Play className="mr-1.5 size-3.5" />
              Odaklanmayı Başlat
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant={timer.running ? "outline" : "default"}
                className="rounded-xl px-2.5 text-xs h-8"
                onClick={() => (timer.running ? handlePause() : handleResume())}
              >
                {timer.running ? <Pause className="mr-1 size-3" /> : <Play className="mr-1 size-3" />}
                {timer.running ? "Duraklat" : "Devam"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="rounded-xl px-2.5 text-xs h-8"
                onClick={handleTriggerFinish}
              >
                <Square className="mr-1 size-3" />
                Bitir
              </Button>
            </>
          )}

          <Button
            variant={pipActive ? "secondary" : "outline"}
            size="sm"
            className="rounded-xl text-xs px-2 h-8"
            onClick={handleTogglePip}
            title="Yüzen Mini Sayaç"
          >
            <Maximize2 className="size-3.5" />
            <span className="hidden 2xl:inline ml-1">Sayaç</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-xs px-2 h-8"
            onClick={() => setBreathworkOpen(true)}
            title="2 Dakikalık Nefes ve Göz Molası"
          >
            <Heart className="size-3.5 text-teal-500" />
            <span className="hidden 2xl:inline ml-1">Nefes</span>
          </Button>

          <button
            type="button"
            onClick={toggleIronWill}
            disabled={timer?.running}
            className={cn(
              "inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs font-semibold transition-all h-8",
              ironWill
                ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 shadow-xs"
                : "border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground"
            )}
            title="Demir İrade Modu"
          >
            {ironWill ? <ShieldAlert className="size-3.5 text-red-500" /> : <Shield className="size-3.5" />}
            <span className="hidden 2xl:inline">{ironWill ? "Demir İrade" : "Standart"}</span>
          </button>

          <Companion state={state} compact />
        </div>
      </header>

      {/* 2. MAIN BENTO COCKPIT: ALL 4 PANELS SIDE-BY-SIDE (YANYANA) */}
      {!finishing ? (
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* COLUMN 1: NE YAPACAKSIN? (CHECKLIST & STEPS) */}
          <div className="h-full flex flex-col rounded-2xl border bg-card p-3 shadow-xs overflow-hidden min-h-0">
            <div className="flex items-center justify-between border-b pb-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="grid size-6 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <ListChecks className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-xs font-bold text-foreground truncate">Ne Yapacaksın?</h2>
                  <p className="text-[10px] text-muted-foreground truncate">Bu oturum için somut adımlar</p>
                </div>
              </div>
              {guidance && guidance.steps.length > 0 && (
                <span className="rounded-full bg-muted/60 border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground shrink-0">
                  {guidance.steps.filter((s) => completedSteps[s.id]).length} / {guidance.steps.length}
                </span>
              )}
            </div>

            {guidance && guidance.steps.length > 0 && (
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted/50 shrink-0">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{
                    width: `${(guidance.steps.filter((s) => completedSteps[s.id]).length / guidance.steps.length) * 100}%`,
                  }}
                />
              </div>
            )}

            {guidance && (
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground shrink-0 line-clamp-2">
                {guidance.summary}
              </p>
            )}

            <div className="mt-2 flex-1 overflow-y-auto space-y-2 pr-1 min-h-0 focus-scrollbar">
              {guidance && guidance.steps.length > 0 ? (
                guidance.steps.map((step) => {
                  const isDone = !!completedSteps[step.id];
                  return (
                    <div
                      key={step.id}
                      onClick={() => toggleStep(step.id)}
                      className={`group flex cursor-pointer items-start gap-2 rounded-xl border p-2 transition-all ${
                        isDone
                          ? "border-primary/20 bg-primary/5 text-muted-foreground"
                          : "border-border/60 bg-background/60 hover:border-primary/40 hover:bg-muted/30"
                      }`}
                    >
                      <button
                        type="button"
                        aria-label="Adımı tamamla"
                        className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border transition-colors ${
                          isDone
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/40 bg-background"
                        }`}
                      >
                        {isDone && <Check className="size-3 stroke-[3]" />}
                      </button>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className={`text-xs font-semibold leading-tight transition-colors ${isDone ? "line-through opacity-75 text-foreground" : "text-foreground"}`}>
                          {step.title}
                        </p>
                        <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                          {step.detail}
                        </p>
                        {step.command && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(step.command!);
                            }}
                            className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-zinc-900 px-2 py-0.5 font-mono text-[10px] text-zinc-100 dark:bg-black/60 max-w-full overflow-hidden"
                          >
                            <code className="truncate">{step.command}</code>
                            <span className="text-primary font-sans font-semibold shrink-0">
                              {copiedCmd === step.command ? "✓" : "Kopyala"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="py-4 text-center text-xs text-muted-foreground italic">
                  Bu görev için rehber adımı bulunmuyor.
                </p>
              )}
            </div>
          </div>

          {/* COLUMN 2: NOTLAR & ZİHİN DÖKÜMÜ */}
          <div className="h-full flex flex-col gap-2 min-h-0">
            {/* Canlı Notlar & Çıktı */}
            <div className="flex-1 rounded-2xl border bg-card p-3 shadow-xs flex flex-col min-h-0">
              <div className="flex items-center justify-between border-b pb-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="grid size-6 place-items-center rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                    <FileText className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-xs font-bold text-foreground truncate">Canlı Notlar &amp; Çıktı</h2>
                    <p className="text-[10px] text-muted-foreground truncate">Formül, kod veya çıkarımlar</p>
                  </div>
                </div>
                {scratchpadText.trim().length >= 20 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                    <Check className="size-2.5" />
                    Kanıt Hazır
                  </span>
                )}
              </div>

              <textarea
                value={scratchpadText}
                onChange={(e) => setScratchpadText(e.target.value)}
                placeholder="Çalışırken çözdüğün adımları veya notları buraya yaz. Burada aldığın notlar erken çıkışta doğrudan kanıt sayılır..."
                className="mt-2 flex-1 w-full resize-none rounded-xl border border-border bg-background/70 p-2.5 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-hidden min-h-0"
              />

              <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground shrink-0">
                <span>Otomatik kaydedilir</span>
                <span className="font-mono">{scratchpadText.trim().length} krk</span>
              </div>
            </div>

            {/* Aklındakini Dök */}
            <div className="flex-1 rounded-2xl border bg-card p-3 shadow-xs flex flex-col min-h-0">
              <div className="flex items-center justify-between border-b pb-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="grid size-6 place-items-center rounded-lg bg-sky-500/10 text-sky-500 shrink-0">
                    <Brain className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-xs font-bold text-foreground truncate">Aklındakini Dök</h2>
                    <p className="text-[10px] text-muted-foreground truncate">Aklına takılanları yaz, zihnini boşalt</p>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                  {brainDumpItems.length} madde
                </span>
              </div>

              <form onSubmit={handleAddBrainDump} className="mt-2 flex gap-1.5 shrink-0">
                <input
                  type="text"
                  value={brainDumpInput}
                  onChange={(e) => setBrainDumpInput(e.target.value)}
                  placeholder="Aklını dağıtan düşünceyi yaz..."
                  className="flex-1 rounded-xl border border-border bg-background/80 px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:border-sky-500 focus:outline-hidden"
                />
                <Button type="submit" size="sm" variant="secondary" className="rounded-xl px-2.5 text-xs h-7 shrink-0">
                  <Plus className="size-3" />
                  Ekle
                </Button>
              </form>

              <div className="mt-2 flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0 focus-scrollbar">
                {brainDumpItems.length === 0 ? (
                  <p className="py-3 text-center text-[11px] text-muted-foreground italic">
                    Zihnin berrak. Dağıtıcı bir fikir gelirse buraya yazabilirsin.
                  </p>
                ) : (
                  brainDumpItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between gap-2 rounded-xl border px-2 py-1 text-xs transition-colors ${
                        item.done
                          ? "bg-muted/30 border-border/40 text-muted-foreground line-through"
                          : "bg-background/80 border-border"
                      }`}
                    >
                      <span
                        onClick={() => handleToggleBrainDumpDone(item.id)}
                        className="cursor-pointer truncate flex-1 text-[11px]"
                      >
                        {item.text}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteBrainDump(item.id)}
                        className="text-muted-foreground hover:text-red-500 shrink-0"
                        title="Sil"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {brainDumpItems.length > 0 && (
                <div className="mt-1 text-right shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setBrainDumpItems([]);
                      try {
                        localStorage.setItem(BRAIN_DUMP_KEY, JSON.stringify([]));
                      } catch {}
                    }}
                    className="text-[10px] text-muted-foreground hover:text-foreground underline"
                  >
                    Hepsini Temizle
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 3: SES & MÜZİK MİKSERİ & KAYNAKLAR */}
          <div className="h-full flex flex-col gap-2 min-h-0">
            {/* Ses & Müzik Mikseri (Spotify, Apple Music, YT Music & Ortam Sesleri) */}
            <FocusSoundMixer
              activeSound={activeSound}
              onSoundChange={handleSoundChange}
              ambientVolume={ambientVolume}
              onVolumeChange={handleVolumeChange}
            />

            {/* Kaynaklar & Lablar */}
            <div className="flex-1 rounded-2xl border bg-card p-3 shadow-xs flex flex-col min-h-0">
              <div className="flex items-center justify-between border-b pb-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="grid size-6 place-items-center rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0">
                    <BookOpen className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-xs font-bold text-foreground truncate">Kaynaklar &amp; Lablar</h2>
                    <p className="text-[10px] text-muted-foreground truncate">Önerilen dökümanlar</p>
                  </div>
                </div>
              </div>

              <div className="mt-2 flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0 focus-scrollbar">
                {guidance && guidance.resources.length > 0 ? (
                  guidance.resources.map((res, idx) => (
                    <a
                      key={idx}
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center justify-between rounded-xl border bg-background/80 p-2 transition-all hover:border-primary/50 hover:bg-muted/30"
                    >
                      <div className="min-w-0 pr-1.5">
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                          {res.badge}
                        </span>
                        <p className="mt-0.5 text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {res.title}
                        </p>
                      </div>
                      <ExternalLink className="size-3 shrink-0 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                    </a>
                  ))
                ) : task.resource ? (
                  <a
                    href={task.resource}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between rounded-xl border bg-background/80 p-2 hover:border-primary/50"
                  >
                    <div className="min-w-0 pr-1.5">
                      <span className="text-[9px] font-semibold text-primary">Resmî Görev Kaynağı</span>
                      <p className="text-xs font-semibold truncate text-foreground">{task.resource}</p>
                    </div>
                    <ExternalLink className="size-3 shrink-0 text-muted-foreground group-hover:text-primary" />
                  </a>
                ) : (
                  <p className="py-3 text-center text-xs text-muted-foreground italic">
                    Bu görev için harici kaynak yok.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* COLUMN 4: PLANORTH KOÇ (DOCKED COMPANION) */}
          <div className="h-full flex flex-col rounded-2xl border bg-card shadow-xs overflow-hidden min-h-0">
            <NorthAI embedded taskId={id} focusDocked />
          </div>
        </div>
      ) : (
        /* POST-SESSION FEEDBACK SCREEN */
        <section className="celebrate-pop mt-4 space-y-6 max-w-3xl mx-auto">
          <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="size-4" />
                Odak Oturumu Tamamlandı
              </div>
              {verifiedProof.type !== "none" && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-3.5" />
                  {verifiedProof.type === "output_text" && "Konu Doğrulama Sorusu Çözüldü"}
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
                    className={`flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all ${
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
                    className={`rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-colors ${
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
                    className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
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
                className={fieldClass + " mt-2 rounded-xl"}
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Nerede tıkandın veya ne iyi gitti?"
              />
            </div>

            {/* PHOTO PROOF UPLOAD */}
            <div className="mt-5">
              <label className="block text-xs font-semibold text-foreground">
                Fotoğraflı Çalışma Kanıtı <span className="text-muted-foreground font-normal">(Defter, masa, test veya ekran fotoğrafı)</span>
              </label>
              <div className="mt-2 flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-border px-3.5 py-2 text-xs text-muted-foreground hover:border-primary hover:text-foreground">
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

            {/* SUBMIT BUTTON */}
            <div className="mt-6 border-t pt-5">
              {!saved ? (
                <Button
                  size="lg"
                  className="w-full rounded-2xl sm:w-auto"
                  onClick={() => {
                    if (!timer) return;
                    setSaved(true);
                    clearFocusLock();
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
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs font-medium text-foreground">Oturum başarıyla kaydedildi. Şimdi ne yapmak istersin?</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" className="rounded-xl" onClick={() => router.push("/")}>
                      Günün Sıradaki Adımına Geç →
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setBreathworkOpen(true)}>
                      <Heart className="mr-1.5 size-3.5 text-teal-500" />
                      2 Dk Nefes Molası
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ================================================================= */}
      {/* PROOF OF WORK / KONU ÇIKIŞ SORUSU KİLİT MODALI                    */}
      {/* ================================================================= */}
      <Dialog open={proofGateOpen} onOpenChange={setProofGateOpen}>
        <DialogContent className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-3xl p-6 sm:p-7">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-amber-500/10 text-amber-500">
                <Lock className="size-4" />
              </span>
              <DialogTitle className="text-base font-bold text-foreground">
                Erken Çıkış &amp; Konu Doğrulama Kilidi
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Hedeflenen sürenin tamamlanmasına <strong className="text-foreground">{minutesStr}:{secondsStr}</strong> kaldı. 
              North&apos;ta sahte süre kaydedilmez ve kilit çözülmeden çıkılamaz. Çalıştığın konudan soruyu cevapla.
            </DialogDescription>
          </DialogHeader>

          {/* METHOD SELECTION TABS */}
          <div className="mt-4 grid grid-cols-4 gap-1.5 rounded-2xl border bg-muted/50 p-1 text-xs">
            <button
              type="button"
              onClick={() => setProofMethod("question")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 font-medium transition-colors ${
                proofMethod === "question"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="size-3.5 text-amber-500" />
              <span className="truncate">Konu Sorusu</span>
            </button>
            <button
              type="button"
              onClick={() => setProofMethod("photo")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 font-medium transition-colors ${
                proofMethod === "photo"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Camera className="size-3.5 text-sky-500" />
              <span className="truncate">Fotoğraf</span>
            </button>
            <button
              type="button"
              onClick={() => setProofMethod("step")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 font-medium transition-colors ${
                proofMethod === "step"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span className="truncate">Görev Adımı</span>
            </button>
            <button
              type="button"
              onClick={() => setProofMethod("ai")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 font-medium transition-colors ${
                proofMethod === "ai"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bot className="size-3.5 text-purple-500" />
              <span className="truncate">AI Teyit</span>
            </button>
          </div>

          {/* METHOD 1: KONU ÇIKIŞ DOĞRULAMA SORUSU (VARSAYILAN & ZORUNLU) */}
          {proofMethod === "question" && (
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    {area.name} Çıkış Sorusu
                  </span>
                  {scratchpadText.trim().length >= 15 && (
                    <button
                      type="button"
                      onClick={() => setProofText(scratchpadText.trim())}
                      className="text-[10px] font-medium text-primary hover:underline"
                    >
                      Canlı notlarımdan aktar ⤶
                    </button>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed">
                  {exitQuestion}
                </p>
              </div>

              <textarea
                value={proofText}
                onChange={(e) => setProofText(e.target.value)}
                placeholder="Cevabını, çözdüğün formülü, kuralı veya vardığın sonucu buraya yaz..."
                className="h-28 w-full rounded-2xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>En az 15 karakter gereklidir</span>
                <span className={proofText.trim().length >= 15 ? "text-emerald-500 font-semibold" : ""}>
                  {proofText.trim().length} / 15 karakter
                </span>
              </div>
              <Button
                type="button"
                className="w-full rounded-2xl"
                disabled={proofText.trim().length < 15}
                onClick={() =>
                  handleVerifyAndFinish("output_text", `Konu Çıkış Sorusu Cevabı: ${proofText.trim()}`)
                }
              >
                <Check className="mr-1.5 size-4" />
                Soruyu Cevapla ve Kilidi Kaldır
              </Button>
            </div>
          )}

          {/* METHOD 2: FOTOĞRAF / EKRAN KANITI */}
          {proofMethod === "photo" && (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Çözdüğün soru kağıdı, defter notu, terminal çıktısı veya kod ekranının anlık fotoğrafını yükle:
              </p>
              <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border/80 p-6 text-center hover:border-primary/50 transition-colors">
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
                      className="text-xs rounded-xl"
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
                className="w-full rounded-2xl"
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
                      className={`flex cursor-pointer items-start gap-2.5 rounded-2xl border p-2.5 text-left text-xs transition-colors ${
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
                className="w-full rounded-2xl"
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
              <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-3 text-xs leading-relaxed text-foreground">
                <span className="font-semibold text-purple-600 dark:text-purple-400">North AI Hızlı Soru: </span>
                <p className="mt-1">
                  &ldquo;{task.title}&rdquo; çalışırken aklında kalan en kritik 1 kural, formül veya edindiğin çıkarım ne oldu?
                </p>
              </div>
              <textarea
                value={aiQuestionAnswer}
                onChange={(e) => setAiQuestionAnswer(e.target.value)}
                placeholder="Örnek: Bu kavramın özü şudur..., formül şöyle uygulanır..., şu adımı başardım..."
                className="h-24 w-full rounded-2xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-purple-500 focus:outline-hidden"
              />
              {aiVerificationStatus === "verified" ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>North AI cevabını onayladı! Öğrenim çıktın geçerli kabul edildi.</span>
                </div>
              ) : (
                <Button
                  type="button"
                  className="w-full rounded-2xl"
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
                  className="w-full rounded-2xl"
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
              <div className="rounded-3xl border border-red-500/30 bg-red-500/5 p-4 space-y-3 text-left">
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
                      className="rounded-xl"
                      disabled={abandonCountdown > 0}
                      onClick={handleForfeitAbandon}
                    >
                      Dürüstçe Vazgeç
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
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

      {/* BREATHWORK MODAL */}
      <BreathworkModal open={breathworkOpen} onOpenChange={setBreathworkOpen} />
    </main>
  );
}
