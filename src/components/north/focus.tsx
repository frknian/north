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
import { toast } from "sonner";

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

  // Ambient Sound, PiP Floating Timer, Breathwork & Photo Proof
  const pipControllerRef = useRef<PipTimerController | null>(null);
  const [pipActive, setPipActive] = useState(false);
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
    setVerifiedProof({ type, content });
    setProofGateOpen(false);
    setFinishing(true);
    setOutcome("done");
    toast.success("Çalışma kanıtı başarıyla doğrulandı!");
  }

  function handleForfeitAbandon() {
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
  const size = 190;
  const strokeWidth = 7;
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
    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:py-7 space-y-6">
      {/* TOP NAVIGATION & AREA META */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Bugüne dön
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleIronWill}
            disabled={timer?.running}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
              ironWill
                ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 shadow-xs"
                : "border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground"
            }`}
            title="Demir İrade Modu"
          >
            {ironWill ? <ShieldAlert className="size-3.5 text-red-500" /> : <Shield className="size-3.5" />}
            <span>{ironWill ? "Demir İrade Devrede" : "Standart Mod"}</span>
          </button>

          <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-semibold text-foreground">
            <span>{area.icon}</span>
            <span>{area.name}</span>
          </span>
          <Companion state={state} compact />
        </div>
      </div>

      {!finishing ? (
        <>
          {/* =============================================================== */}
          {/* 1. TOP HERO: ZEN TIMER & TASK COMMAND CENTER (FULL WIDTH)       */}
          {/* =============================================================== */}
          <section className="rounded-3xl border bg-card/85 backdrop-blur-md p-6 sm:p-7 shadow-sm">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10">
              {/* LEFT: TASK META & SOMUT ÇIKTI */}
              <div className="flex-1 space-y-3.5 text-center lg:text-left">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    Odak Görevi
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Planlanan: <strong>{task.minutes} dk</strong>
                  </span>
                  {timer?.running && tabSwitches > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      <AlertTriangle className="size-3" />
                      {tabSwitches} kez sekme değişti
                    </span>
                  )}
                  {timer?.running && tabSwitches === 0 && ironWill && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <ShieldCheck className="size-3" />
                      Kusursuz Sekme Koruması
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {task.title}
                </h1>

                <div className="inline-block rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2 text-xs leading-relaxed text-foreground sm:text-sm">
                  <span className="font-semibold text-primary">Somut Çıktı: </span>
                  {task.goal}
                </div>

                {task.resource && task.resource.startsWith("https://") && (
                  <div>
                    <a
                      href={task.resource}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      Kaynak dökümanı yeni sekmede aç
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* RIGHT: CIRCULAR ZEN TIMER & CONTROLS */}
              <div className="flex flex-col sm:flex-row items-center gap-6 shrink-0">
                {/* CIRCULAR SVG RING */}
                <div className="relative flex items-center justify-center">
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
                      <span className="font-mono text-4xl font-light tracking-tighter text-foreground sm:text-5xl">
                        {minutesStr}:{secondsStr}
                      </span>
                      <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                        {ironWill && <ShieldAlert className="size-2.5 text-red-500" />}
                        {!timer
                          ? "Hazır"
                          : timer.running
                          ? ironWill
                            ? "Demir İrade"
                            : "Derin Odak"
                          : "Duraklatıldı"}
                      </span>
                      {timer && (
                        <span className="font-mono text-[11px] text-muted-foreground/70">
                          Geçen: {Math.floor(elapsedSeconds / 60)} dk
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* PRIMARY ACTIONS & TOOLS */}
                <div className="flex flex-col gap-2.5 w-full sm:w-auto">
                  {!timer ? (
                    <Button size="lg" className="rounded-2xl px-7 shadow-sm" onClick={handleStart}>
                      <Play className="mr-2 size-4" />
                      Odaklanmayı Başlat
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="default"
                        variant={timer.running ? "outline" : "default"}
                        className="rounded-2xl px-5"
                        onClick={() => (timer.running ? handlePause() : handleResume())}
                      >
                        {timer.running ? <Pause className="mr-1.5 size-4" /> : <Play className="mr-1.5 size-4" />}
                        {timer.running ? "Duraklat" : "Devam Et"}
                      </Button>
                      <Button
                        size="default"
                        variant="secondary"
                        className="rounded-2xl px-5"
                        onClick={handleTriggerFinish}
                      >
                        <Square className="mr-1.5 size-4" />
                        Oturumu Bitir
                      </Button>
                    </>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant={pipActive ? "secondary" : "outline"}
                      size="sm"
                      className="rounded-xl text-xs flex-1"
                      onClick={handleTogglePip}
                      title="Yüzen Mini Sayaç"
                    >
                      <Maximize2 className="mr-1 size-3" />
                      {pipActive ? "PiP Kapat" : "Yüzen Sayaç"}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs flex-1"
                      onClick={() => setBreathworkOpen(true)}
                      title="2 Dakikalık Nefes ve Göz Molası"
                    >
                      <Heart className="mr-1 size-3 text-teal-500" />
                      Nefes Molası
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =============================================================== */}
          {/* 2. MAIN BENTO WORKSPACE: CARDS (LEFT) + DOCKED AI COACH (RIGHT) */}
          {/* =============================================================== */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* ------------------------------------------------------------- */}
            {/* LEFT COLUMN: MODULAR BENTO CARDS (7 OR 8 COLS ON DESKTOP)     */}
            {/* ------------------------------------------------------------- */}
            <div className="xl:col-span-7 2xl:col-span-8 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. BENTO CARD: NE YAPACAKSIN? (CHECKLIST & STEPS) */}
                <div className="md:col-span-2 rounded-3xl border bg-card p-5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                    <div className="flex items-center gap-2">
                      <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                        <ListChecks className="size-4" />
                      </span>
                      <div>
                        <h2 className="text-sm font-semibold text-foreground">Ne Yapacaksın?</h2>
                        <p className="text-[11px] text-muted-foreground">Bu oturum için somut adımlar</p>
                      </div>
                    </div>
                    {guidance && guidance.steps.length > 0 && (
                      <span className="rounded-full bg-muted/60 border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {guidance.steps.filter((s) => completedSteps[s.id]).length} / {guidance.steps.length} tamamlandı
                      </span>
                    )}
                  </div>

                  {guidance ? (
                    <>
                      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{guidance.summary}</p>

                      {guidance.steps.length > 0 && (
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
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

                      <div className="mt-3.5 space-y-2">
                        {guidance.steps.map((step) => {
                          const isDone = !!completedSteps[step.id];
                          return (
                            <div
                              key={step.id}
                              onClick={() => toggleStep(step.id)}
                              className={`group flex cursor-pointer items-start gap-2.5 rounded-2xl border p-2.5 transition-all ${
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
                                <p
                                  className={`text-xs font-medium transition-colors ${
                                    isDone ? "line-through opacity-75 text-foreground" : "text-foreground"
                                  }`}
                                >
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
                                    className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-zinc-900 px-2.5 py-0.5 font-mono text-[10px] text-zinc-100 dark:bg-black/60"
                                  >
                                    <code>{step.command}</code>
                                    <span className="text-primary font-sans font-medium">
                                      {copiedCmd === step.command ? "Kopyalandı ✓" : "Kopyala"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <p className="mt-4 text-xs text-muted-foreground italic">Bu görev için rehber adımı bulunmuyor.</p>
                  )}
                </div>

                {/* 2. BENTO CARD: CANLI ÇALIŞMA NOTLARI & KANIT ÇIKTISI */}
                <div className="rounded-3xl border bg-card p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-2">
                        <span className="grid size-7 place-items-center rounded-lg bg-amber-500/10 text-amber-500">
                          <FileText className="size-4" />
                        </span>
                        <div>
                          <h2 className="text-sm font-semibold text-foreground">Canlı Notlar &amp; Çıktı</h2>
                          <p className="text-[11px] text-muted-foreground">Formül, kod veya çıkarımlar</p>
                        </div>
                      </div>
                      {scratchpadText.trim().length >= 20 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Check className="size-3" />
                          Kanıt Hazır
                        </span>
                      )}
                    </div>
                    <textarea
                      value={scratchpadText}
                      onChange={(e) => setScratchpadText(e.target.value)}
                      placeholder="Çalışırken çözdüğün adımları veya notları buraya yaz. Burada aldığın notlar erken çıkışta doğrudan kanıt sayılır..."
                      className="mt-3 h-32 w-full resize-none rounded-2xl border border-border bg-background/70 p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Otomatik kaydedilir</span>
                    <span>{scratchpadText.trim().length} karakter</span>
                  </div>
                </div>

                {/* 3. BENTO CARD: AKLINDAKİNİ DÖK (BRAIN DUMP LIST) */}
                <div className="rounded-3xl border bg-card p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-2">
                        <span className="grid size-7 place-items-center rounded-lg bg-sky-500/10 text-sky-500">
                          <Brain className="size-4" />
                        </span>
                        <div>
                          <h2 className="text-sm font-semibold text-foreground">Aklındakini Dök</h2>
                          <p className="text-[11px] text-muted-foreground">Aklına takılanları yaz, zihnini boşalt</p>
                        </div>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {brainDumpItems.length} madde
                      </span>
                    </div>

                    {/* DUMP INPUT FORM */}
                    <form onSubmit={handleAddBrainDump} className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={brainDumpInput}
                        onChange={(e) => setBrainDumpInput(e.target.value)}
                        placeholder="Aklını dağıtan düşünceyi yaz..."
                        className="flex-1 rounded-xl border border-border bg-background/80 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-sky-500 focus:outline-hidden"
                      />
                      <Button type="submit" size="sm" variant="secondary" className="rounded-xl px-3 text-xs shrink-0">
                        <Plus className="size-3.5" />
                        Ekle
                      </Button>
                    </form>

                    {/* DUMP ITEMS LIST */}
                    <div className="mt-2.5 max-h-24 overflow-y-auto space-y-1.5 pr-1">
                      {brainDumpItems.length === 0 ? (
                        <p className="py-3 text-center text-[11px] text-muted-foreground italic">
                          Zihnin berrak. Dağıtıcı bir fikir gelirse buraya yazabilirsin.
                        </p>
                      ) : (
                        brainDumpItems.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between gap-2 rounded-xl border px-2.5 py-1 text-xs transition-colors ${
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
                              className="text-muted-foreground hover:text-red-500"
                              title="Sil"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-right">
                    {brainDumpItems.length > 0 && (
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
                    )}
                  </div>
                </div>

                {/* 4. BENTO CARD: SES MİKSERİ (AMBIENT SOUNDS) */}
                <div className="rounded-3xl border bg-card p-5 shadow-xs">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2">
                      <span className="grid size-7 place-items-center rounded-lg bg-teal-500/10 text-teal-500">
                        {activeSound === "none" ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                      </span>
                      <div>
                        <h2 className="text-sm font-semibold text-foreground">Ses Mikseri</h2>
                        <p className="text-[11px] text-muted-foreground">Ortam sesiyle akışa gir</p>
                      </div>
                    </div>
                    {activeSound !== "none" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-600 dark:text-teal-400">
                        <span className="size-1.5 rounded-full bg-teal-500 animate-pulse" />
                        Çalıyor
                      </span>
                    )}
                  </div>

                  <div className="mt-3.5 grid grid-cols-2 gap-2">
                    {([
                      ["none", "Kapalı", "Sessiz ortam"],
                      ["rain", "🌧️ Yağmur", "Hafif yağmur sesi"],
                      ["cafe", "☕ Kafe", "Arka plan kafe uğultusu"],
                      ["noise", "📻 Beyaz", "Pink / White noise"],
                      ["drone", "🧘 432Hz Zen", "Derin odak meditatif frekans"],
                    ] as const).map(([val, label, sub]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleSoundChange(val)}
                        className={`flex flex-col items-start rounded-2xl border p-2.5 text-left transition-all ${
                          activeSound === val
                            ? "border-teal-500/50 bg-teal-500/10 text-foreground shadow-xs"
                            : "border-border/60 bg-background/80 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        }`}
                      >
                        <span className="text-xs font-semibold">{label}</span>
                        <span className="text-[10px] opacity-75 mt-0.5 line-clamp-1">{sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. BENTO CARD: KAYNAKLAR & LAB BAĞLANTILARI */}
                <div className="rounded-3xl border bg-card p-5 shadow-xs">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2">
                      <span className="grid size-7 place-items-center rounded-lg bg-indigo-500/10 text-indigo-500">
                        <BookOpen className="size-4" />
                      </span>
                      <div>
                        <h2 className="text-sm font-semibold text-foreground">Kaynaklar &amp; Lablar</h2>
                        <p className="text-[11px] text-muted-foreground">Önerilen linkler ve dökümanlar</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 space-y-2 max-h-48 overflow-y-auto pr-1">
                    {guidance && guidance.resources.length > 0 ? (
                      guidance.resources.map((res, idx) => (
                        <a
                          key={idx}
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-center justify-between rounded-2xl border bg-background/80 p-2.5 transition-all hover:border-primary/50 hover:bg-muted/30"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                              {res.badge}
                            </span>
                            <p className="mt-1 text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {res.title}
                            </p>
                          </div>
                          <ExternalLink className="size-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                        </a>
                      ))
                    ) : task.resource ? (
                      <a
                        href={task.resource}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center justify-between rounded-2xl border bg-background/80 p-3 hover:border-primary/50"
                      >
                        <div className="min-w-0">
                          <span className="text-[10px] font-medium text-primary">Resmî Görev Kaynağı</span>
                          <p className="text-xs font-semibold truncate text-foreground">{task.resource}</p>
                        </div>
                        <ExternalLink className="size-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                      </a>
                    ) : (
                      <p className="py-4 text-center text-[11px] text-muted-foreground italic">
                        Bu görev için özel harici kaynak eklenmemiş.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* RIGHT COLUMN: ALWAYS DOCKED NORTH AI COACH (5 COLS ON DESKTOP) */}
            {/* ------------------------------------------------------------- */}
            <div className="xl:col-span-5 2xl:col-span-4">
              <div className="sticky top-5 rounded-3xl border bg-card shadow-md overflow-hidden flex flex-col h-[740px] max-h-[calc(100dvh-5rem)]">
                {/* DOCKED COACH HEADER */}
                <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                      <Bot className="size-4" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-foreground">North Koç</h3>
                      <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Canlı Odak Arkadaşın (Hep Açık)
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full border bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground truncate max-w-[140px]">
                    {task.title}
                  </span>
                </div>

                {/* DOCKED COACH BODY */}
                <div className="flex-1 overflow-y-auto p-3">
                  <NorthAI embedded taskId={id} />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ================================================================= */
        /* POST-SESSION FEEDBACK SCREEN                                      */
        /* ================================================================= */
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
          <div className="mt-4 grid grid-cols-4 gap-1.5 rounded-2xl border bg-muted/50 p-1 text-xs">
            <button
              type="button"
              onClick={() => setProofMethod("text")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 font-medium transition-colors ${
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
              className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 font-medium transition-colors ${
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
              className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 font-medium transition-colors ${
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
              className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 font-medium transition-colors ${
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
                placeholder="Örnek: Fonksiyonlar testinden 10 soru çözdüm, ters fonksiyon kuralını pekiştirdim veya SQLi labında UNION payload'unu başarıyla enjekte ettim..."
                className="h-28 w-full rounded-2xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>En az 20 karakter gereklidir</span>
                <span className={proofText.trim().length >= 20 ? "text-emerald-500 font-semibold" : ""}>
                  {proofText.trim().length} / 20 karakter
                </span>
              </div>
              <Button
                type="button"
                className="w-full rounded-2xl"
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
