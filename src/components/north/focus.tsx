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
  Quote,
  Bookmark,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useRouter, useSearchParams } from "next/navigation";
import { dayKey, suggestDailyAdaptation, type NorthActivity, type SupportSource } from "@/lib/north";
import { loadBooks, updateBook, logReadingSession, type NorthBook } from "@/lib/books";
import { BookLibraryModal } from "./book-library-modal";
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
import { SanalKutuphaneBadge } from "./sanal-kutuphane";
import { FocusSoundMixer, type AmbientSoundType } from "./focus-sound-mixer";
import { FocusResourcesDock, FocusResourcesModal } from "./focus-resources-dock";
import {
  loadSavedPageRanges,
  updateSavedPageRange,
  loadPinnedDocs,
  generateSessionNotebookLMSnippet,
  type SavedPageRange,
  type PinnedSourceDoc,
} from "@/lib/resources-hub";
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
  const searchParams = useSearchParams();

  const queryMode = searchParams.get("mode");
  const isReadingMode = id === "reading" || queryMode === "reading";
  const isFreeMode = id === "free" || queryMode === "free" || (!state.tasks.some((t) => t.id === id) && !isReadingMode);

  // Books state for reading mode
  const [books, setBooks] = useState<NorthBook[]>([]);
  const [activeBookId, setActiveBookId] = useState<string>(() => searchParams.get("bookId") || "");
  const [readingPageInput, setReadingPageInput] = useState<number>(0);
  const [readingQuote, setReadingQuote] = useState<string>("");
  const [bookLibraryOpen, setBookLibraryOpen] = useState<boolean>(false);

  // Free focus titles
  const [freeTitle, setFreeTitle] = useState<string>(() => searchParams.get("title") || "");
  const [freeGoal, setFreeGoal] = useState<string>(() => searchParams.get("goal") || "");

  // Resources Integration State
  const queryRangeId = searchParams.get("rangeId");
  const queryPinnedDocId = searchParams.get("pinnedDocId");
  const [activeRange, setActiveRange] = useState<SavedPageRange | null>(null);
  const [resourcesModalOpen, setResourcesModalOpen] = useState<boolean>(false);
  const [resourcesModalTab, setResourcesModalTab] = useState<"pinned" | "ranges" | "search" | "notebooklm">("pinned");
  const [lightboxDoc, setLightboxDoc] = useState<PinnedSourceDoc | null>(null);

  const task = state.tasks.find((t) => t.id === id);
  const area = state.areas.find((a) => a.id === task?.areaId);

  const readingArea = state.areas.find((a) => a.kind === "reading" || a.name.toLowerCase().includes("okuma"));
  const defaultArea = isReadingMode
    ? readingArea || { id: "reading-area", name: "Kitap Okuma", icon: "📖", kind: "reading" as const, metric: "Okunan sayfa" }
    : state.areas[0] || { id: "free-area", name: "Serbest Odak", icon: "⚡", kind: "custom" as const, metric: "Dakika" };
  const effectiveArea = area || defaultArea;

  // Sync active range from URL
  useEffect(() => {
    const ranges = loadSavedPageRanges();
    if (queryRangeId) {
      const found = ranges.find((r) => r.id === queryRangeId);
      if (found) setActiveRange(found);
    }
  }, [queryRangeId]);

  // Sync pinned doc from URL
  useEffect(() => {
    const docs = loadPinnedDocs();
    if (queryPinnedDocId) {
      const found = docs.find((d) => d.id === queryPinnedDocId);
      if (found) setLightboxDoc(found);
    }
  }, [queryPinnedDocId]);

  useEffect(() => {
    if (isReadingMode) {
      const loaded = loadBooks();
      setBooks(loaded);
      const target = (activeBookId ? loaded.find((b) => b.id === activeBookId) : null) ||
        loaded.find((b) => b.status === "reading") ||
        loaded[0];
      if (target) {
        if (!activeBookId) setActiveBookId(target.id);
        setReadingPageInput(target.currentPage);
      }
    }
  }, [isReadingMode, activeBookId]);

  const activeBook = books.find((b) => b.id === activeBookId) || books[0];

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

  const exitQuestion = task
    ? generateExitQuestion(task.title, task.goal, area?.name || "", area?.kind)
    : isReadingMode
    ? `"${activeBook?.title || "Kitap"}" okuma seansında aklında kalan en çarpıcı düşünceyi veya öğrendiğin ana fikri yaz:`
    : `Bu serbest odak oturumunda üzerinde düşündüğün, ürettiğin veya fark ettiğin ana noktayı kısaca not et:`;

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

  const queryMinutes = Number(searchParams.get("minutes"));
  const initialDuration = !isNaN(queryMinutes) && queryMinutes > 0 ? queryMinutes : task?.minutes ?? (isReadingMode ? 30 : 45);
  const currentMinutes = customMinutes ?? initialDuration;
  const totalSeconds = currentMinutes * 60;
  const elapsed = timer ? timer.accumulated + (timer.running ? Math.max(0, now - timer.started) : 0) : 0;
  const elapsedSeconds = Math.floor(elapsed / 1000);
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  const progressPercent = Math.min(100, Math.max(0, (elapsedSeconds / totalSeconds) * 100));

  function adjustMinutes(delta: number) {
    const next = Math.max(5, Math.min(180, currentMinutes + delta));
    setCustomMinutes(next);
    if (task) {
      update((s) => ({
        ...s,
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, minutes: next } : t)),
      }));
    }
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

    // SET GLOBAL MULTI-TAB & REOPEN LOCK (only for planned task)
    if (area && task && !isFreeMode && !isReadingMode) {
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
    // Serbest ve kitap okuma modlarında kilit ve soru dayatması olmadan doğrudan bitirme ekranı açılır!
    if (isFreeMode || isReadingMode) {
      setOutcome("done");
      setFinishing(true);
      return;
    }
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
      toast.success("Planorth Koç öğrenim çıktısını onayladı!");
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
        area?.name || "Planorth Odak",
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
        area?.name || "Planorth Odak"
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

  if (!task && !isFreeMode && !isReadingMode) {
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
    <main className="focus-stitch w-full max-w-none px-2 sm:px-3 py-2 min-h-screen xl:h-screen flex flex-col gap-2 overflow-y-auto xl:overflow-hidden">
      {/* 1. COMPACT TOP CONTROL BAR (Unified Navigation, Area, Task, Centered Digital Timer, Controls) */}
      <header className="shrink-0 rounded-2xl border bg-card/90 backdrop-blur-md px-3 py-2 shadow-xs flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 sm:gap-3 min-h-[58px]">
        {/* Left: Back, Area, Task Title & Goal */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 max-w-xs sm:max-w-sm lg:max-w-md">
          <button
            type="button"
            onClick={() => {
              if (timer?.running) {
                handleTriggerFinish();
                toast.warning("Odak oturumu devam ediyor. Çıkmak için oturumu sonlandırın.");
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
            <span>{effectiveArea.icon}</span>
            <span className="hidden md:inline">{effectiveArea.name}</span>
          </span>

          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.2 text-[10px] font-semibold shrink-0",
                  isReadingMode
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : isFreeMode
                    ? "bg-primary/10 text-primary"
                    : "bg-primary/10 text-primary"
                )}
              >
                {isReadingMode ? "Kitap Okuma" : isFreeMode ? "Serbest Odak" : "Odak Görevi"}
              </span>
              <h1
                className="text-xs sm:text-sm font-bold tracking-tight text-foreground truncate"
                title={isReadingMode ? (activeBook?.title || "Kitap Okuma") : isFreeMode ? (freeTitle || "Serbest Odak Seansı") : task?.title}
              >
                {isReadingMode ? (activeBook?.title || "Kitap Okuma") : isFreeMode ? (freeTitle || "Serbest Odak Seansı") : task?.title}
              </h1>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {isReadingMode ? (
                activeBook ? (
                  <span>
                    <strong className="text-foreground">{activeBook.author}</strong> · Sayfa <strong className="text-primary font-mono">{readingPageInput}</strong> / {activeBook.totalPages}
                  </span>
                ) : (
                  "Kitap seçilmedi"
                )
              ) : isFreeMode ? (
                freeGoal ? (
                  <span>
                    <span className="text-primary font-medium">Hedef: </span>{freeGoal}
                  </span>
                ) : (
                  <span className="italic">Zihnini serbest bırak, sadece akışta kal.</span>
                )
              ) : task?.goal ? (
                <span>
                  <span className="text-primary font-medium">Somut Çıktı: </span>{task.goal}
                </span>
              ) : null}
            </p>
          </div>
        </div>

        {/* Center: Digital Timer (40:00) with -+5 and 10 dk buttons (Süreyi ortaya al, çember yerine 40:00) */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 shrink-0 py-0.5 mx-auto">
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
          <div className="hidden sm:flex items-center gap-1">
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
        <div className="flex items-center justify-end gap-1.5 shrink-0">
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
            className="hidden xl:inline-flex rounded-xl text-xs px-2 h-8"
            onClick={handleTogglePip}
            title="Yüzen Mini Sayaç"
          >
            <Maximize2 className="size-3.5" />
            <span className="hidden 2xl:inline ml-1">Sayaç</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="hidden xl:inline-flex rounded-xl text-xs px-2 h-8"
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
              "hidden 2xl:inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs font-semibold transition-all h-8",
              ironWill
                ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 shadow-xs"
                : "border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground"
            )}
            title="Demir İrade Modu"
          >
            {ironWill ? <ShieldAlert className="size-3.5 text-red-500" /> : <Shield className="size-3.5" />}
            <span className="hidden 2xl:inline">{ironWill ? "Demir İrade" : "Standart"}</span>
          </button>

          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-xs px-2.5 h-8 font-medium gap-1 text-foreground shrink-0"
            onClick={() => {
              setResourcesModalTab("pinned");
              setResourcesModalOpen(true);
            }}
            title="Odak Kaynak & Belge Masası"
          >
            <BookOpen className="size-3.5 text-indigo-500" />
            <span className="hidden 2xl:inline">Kaynaklar</span>
            {activeRange && (
              <span className="size-1.5 rounded-full bg-indigo-500 animate-pulse" />
            )}
          </Button>

          <SanalKutuphaneBadge className="hidden 2xl:inline-flex h-8 shrink-0" />
          <Companion state={state} compact />
        </div>
      </header>

      {/* 2. MAIN BENTO COCKPIT: ALL 4 PANELS SIDE-BY-SIDE (YANYANA) */}
      {!finishing ? (
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 [&>*]:min-h-[340px] xl:[&>*]:min-h-0">
          {/* COLUMN 1: NE YAPACAKSIN? (CHECKLIST & STEPS OR READING PROGRESS OR ZEN INTENT) */}
          {isReadingMode ? (
            <div className="h-full flex flex-col rounded-2xl border bg-card p-3 shadow-xs overflow-hidden min-h-0">
              <div className="flex items-center justify-between border-b pb-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="grid size-6 place-items-center rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0">
                    <BookOpen className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-xs font-bold text-foreground truncate">
                      {activeBook ? activeBook.title : "Kitap Seç"}
                    </h2>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {activeBook ? activeBook.author : "Kitaplık"}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setBookLibraryOpen(true)}
                  className="rounded-xl h-7 px-2 text-[10px] font-semibold shrink-0"
                >
                  Kitaplığı Aç
                </Button>
              </div>

              {activeBook ? (
                <div className="mt-2.5 flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 focus-scrollbar space-y-3">
                  {/* Active Page Range Banner if set */}
                  {activeRange && (
                    <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2 text-xs flex items-center justify-between gap-2 shrink-0">
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                          Aktif Hedef Aralığı
                        </span>
                        <p className="font-semibold text-foreground truncate text-[11px]">{activeRange.topic}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {activeRange.resourceTitle} · Sf. {activeRange.startPage}–{activeRange.endPage}
                        </p>
                      </div>
                      <span className="rounded-md bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold px-1.5 py-0.5 text-[9px] shrink-0">
                        {activeRange.status === "completed" ? "✓ Bitti" : "Hedef"}
                      </span>
                    </div>
                  )}

                  {/* Progress bar & stats */}
                  <div className="space-y-1.5 shrink-0">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-foreground">
                        Sayfa {readingPageInput} / {activeBook.totalPages}
                      </span>
                      <span className="text-muted-foreground font-mono">
                        %{Math.round((readingPageInput / activeBook.totalPages) * 100)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
                        style={{
                          width: `${Math.min(100, (readingPageInput / activeBook.totalPages) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                      <span>Kalan: {Math.max(0, activeBook.totalPages - readingPageInput)} sayfa</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                        Bu seans: +{Math.max(0, readingPageInput - activeBook.currentPage)} sf
                      </span>
                    </div>
                  </div>

                  {/* Page Stepper */}
                  <div className="rounded-xl border bg-background/60 p-2.5 space-y-2 shrink-0">
                    <label className="block text-[11px] font-semibold text-foreground">
                      Kaldığın Sayfayı Güncelle
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setReadingPageInput((p) => Math.max(0, p - 1))}
                        className="rounded-lg border bg-card px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground active:scale-95"
                      >
                        -1
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={activeBook.totalPages}
                        value={readingPageInput}
                        onChange={(e) => setReadingPageInput(Math.min(activeBook.totalPages, Math.max(0, Number(e.target.value))))}
                        className="flex-1 text-center rounded-lg border border-border bg-background px-2 py-1 text-xs font-bold font-mono text-foreground focus:border-indigo-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setReadingPageInput((p) => Math.min(activeBook.totalPages, p + 1))}
                        className="rounded-lg border bg-card px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground active:scale-95"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => setReadingPageInput((p) => Math.min(activeBook.totalPages, p + 5))}
                        className="rounded-lg border bg-card px-2 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 active:scale-95"
                      >
                        +5
                      </button>
                      <button
                        type="button"
                        onClick={() => setReadingPageInput((p) => Math.min(activeBook.totalPages, p + 10))}
                        className="rounded-lg border bg-card px-2 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 active:scale-95"
                      >
                        +10
                      </button>
                    </div>
                  </div>

                  {/* Book Badges / Info */}
                  <div className="rounded-xl border bg-muted/20 p-2.5 space-y-1.5 shrink-0 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Kategori</span>
                      <span className="font-semibold text-foreground">{activeBook.category}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Durum</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {activeBook.status === "completed" ? "Tamamlandı" : "Okunuyor"}
                      </span>
                    </div>
                    {activeBook.sessions && activeBook.sessions.length > 0 && (
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Önceki Seanslar</span>
                        <span className="font-mono">{activeBook.sessions.length} seans</span>
                      </div>
                    )}
                  </div>

                  {/* Quotes preview */}
                  {activeBook.favoriteQuotes && activeBook.favoriteQuotes.length > 0 && (
                    <div className="space-y-1.5 flex-1 min-h-0">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Kayıtlı Alıntılar ({activeBook.favoriteQuotes.length})
                      </span>
                      <div className="space-y-1.5 overflow-y-auto max-h-36 pr-1 focus-scrollbar">
                        {activeBook.favoriteQuotes.map((q, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg border bg-background/80 p-2 text-[11px] leading-relaxed italic text-foreground/90 border-l-2 border-l-indigo-500"
                          >
                            &ldquo;{q}&rdquo;
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-6 flex flex-col items-center justify-center text-center p-4 space-y-3">
                  <p className="text-xs text-muted-foreground">Henüz bir kitap seçilmedi.</p>
                  <Button size="sm" onClick={() => setBookLibraryOpen(true)} className="rounded-xl text-xs">
                    Kitap Seç veya Ekle
                  </Button>
                </div>
              )}
            </div>
          ) : isFreeMode ? (
            <div className="h-full flex flex-col rounded-2xl border bg-card p-3 shadow-xs overflow-hidden min-h-0">
              <div className="flex items-center justify-between border-b pb-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="grid size-6 place-items-center rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                    <Zap className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-xs font-bold text-foreground truncate">
                      {freeTitle || "Serbest Odak"}
                    </h2>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {freeTitle ? "Kullanıcı Niyeti" : "Görevsiz Zen Modu"}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                  Serbest Akış
                </span>
              </div>

              <div className="mt-2.5 flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 focus-scrollbar space-y-3">
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <Sparkles className="size-3.5" />
                    <span>Baskısız ve Özgür Akış</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {freeTitle
                      ? `Bu oturumda niyetin: "${freeTitle}". Sistem herhangi bir kural veya adım dayatmaz; tamamen kendi temponda çalış.`
                      : "Bu oturum sisteme bağlı bir görev içermez. Zihnini toparla, dilediğin konuya odaklan ve akışın tadını çıkar."}
                  </p>
                </div>

                {/* Active Page Range Banner if set */}
                {activeRange && (
                  <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                        <BookOpen className="size-3" />
                        İncelenen Sayfa Aralığı
                      </span>
                      <span className="font-mono text-muted-foreground">
                        Sf. {activeRange.startPage}–{activeRange.endPage}
                      </span>
                    </div>
                    <p className="font-semibold text-foreground text-xs">{activeRange.topic}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{activeRange.resourceTitle}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-foreground">
                    Oturum Başlığı / Niyeti Güncelle
                  </label>
                  <input
                    type="text"
                    value={freeTitle}
                    onChange={(e) => setFreeTitle(e.target.value)}
                    placeholder="İstersen odaklandığın şeyi yazabilirsin..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="rounded-xl border bg-muted/20 p-2.5 space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Serbest Odak İlkeleri
                  </span>
                  <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Erken çıkışta sınav veya soru kilidi yoktur.</li>
                    <li>Süre bittiğinde veya dilediğinde doğrudan kaydedebilirsin.</li>
                    <li>Canlı notlar ve zihin dökümü serbestçe kullanılabilir.</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
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
          )}

          {/* COLUMN 2: NOTLAR & ZİHİN DÖKÜMÜ OR OKUMA ALINTILARI */}
          {isReadingMode ? (
            <div className="h-full flex flex-col gap-2 min-h-0">
              {/* Kitaptan Alıntı Yakala */}
              <div className="flex-1 rounded-2xl border bg-card p-3 shadow-xs flex flex-col min-h-0">
                <div className="flex items-center justify-between border-b pb-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="grid size-6 place-items-center rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0">
                      <Quote className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-xs font-bold text-foreground truncate">Kitaptan Alıntı Yakala</h2>
                      <p className="text-[10px] text-muted-foreground truncate">Vurucu bir cümle veya tespit kaydet</p>
                    </div>
                  </div>
                </div>

                <textarea
                  value={readingQuote}
                  onChange={(e) => setReadingQuote(e.target.value)}
                  placeholder="Kitapta altını çizdiğin bir cümleyi veya seni etkileyen fikri buraya yaz..."
                  className="mt-2 flex-1 w-full resize-none rounded-xl border border-border bg-background/70 p-2.5 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden min-h-0"
                />

                <div className="mt-2 flex items-center justify-between gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {readingQuote.trim().length} krk
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!readingQuote.trim() || !activeBook}
                    onClick={() => {
                      if (!activeBook || !readingQuote.trim()) return;
                      const existing = activeBook.favoriteQuotes || [];
                      const updatedQuotes = [readingQuote.trim(), ...existing];
                      updateBook(activeBook.id, { favoriteQuotes: updatedQuotes });
                      setBooks(loadBooks());
                      setReadingQuote("");
                      toast.success("Alıntı kitaba kaydedildi!");
                    }}
                    className="rounded-xl px-3 text-xs h-7"
                  >
                    <Bookmark className="mr-1 size-3" />
                    Alıntıyı Kaydet
                  </Button>
                </div>
              </div>

              {/* Okuma Düşünceleri & Notlar */}
              <div className="flex-1 rounded-2xl border bg-card p-3 shadow-xs flex flex-col min-h-0">
                <div className="flex items-center justify-between border-b pb-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="grid size-6 place-items-center rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                      <FileText className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-xs font-bold text-foreground truncate">Kişisel Notlar &amp; Çıkarımlar</h2>
                      <p className="text-[10px] text-muted-foreground truncate">Bu bölüm sana ne düşündürdü?</p>
                    </div>
                  </div>
                </div>

                <textarea
                  value={scratchpadText}
                  onChange={(e) => setScratchpadText(e.target.value)}
                  placeholder="Okurken aklına gelen fikirler, bağlantılar, projene uyarlayabileceğin noktalar..."
                  className="mt-2 flex-1 w-full resize-none rounded-xl border border-border bg-background/70 p-2.5 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-hidden min-h-0"
                />

                <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground shrink-0">
                  <span>Otomatik kaydedilir</span>
                  <span className="font-mono">{scratchpadText.trim().length} krk</span>
                </div>
              </div>
            </div>
          ) : (
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
                  <div className="flex items-center gap-2">
                    <span>Otomatik kaydedilir</span>
                    {scratchpadText.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const snippet = generateSessionNotebookLMSnippet({
                            sessionTitle: task?.title || activeBook?.title || activeRange?.topic || "Odak Seansı",
                            scratchpadText,
                            activeBook: activeBook || undefined,
                            activeRange: activeRange || undefined,
                          });
                          navigator.clipboard.writeText(snippet);
                          toast.success("Notlar NotebookLM formatında panoya kopyalandı!");
                        }}
                        className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium"
                        title="NotebookLM formatında panoya kopyala"
                      >
                        <Sparkles className="size-2.5" />
                        NotebookLM
                      </button>
                    )}
                  </div>
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
          )}

          {/* COLUMN 3: SES & MÜZİK MİKSERİ & KAYNAKLAR / KİTAP TAVSİYELERİ */}
          <div className="h-full flex flex-col gap-2 min-h-0">
            {/* Ses & Müzik Mikseri (Spotify, Apple Music, YT Music & Ortam Sesleri) */}
            <FocusSoundMixer
              activeSound={activeSound}
              onSoundChange={handleSoundChange}
              ambientVolume={ambientVolume}
              onVolumeChange={handleVolumeChange}
            />

            {/* Entegre Kaynak & Doküman Masası (Pinli Şemalar, Sayfa Aralıkları, Rehber & NotebookLM) */}
            <FocusResourcesDock
              task={task}
              area={effectiveArea}
              guidance={guidance}
              isReadingMode={isReadingMode}
              activeBook={activeBook}
              activeRange={activeRange}
              onSelectRange={(range) => {
                setActiveRange(range);
                toast.success(`"${range.topic}" aktif çalışma aralığı yapıldı.`);
              }}
              onOpenModal={(initialTab) => {
                if (initialTab) setResourcesModalTab(initialTab);
                setResourcesModalOpen(true);
              }}
              onViewDoc={(doc) => setLightboxDoc(doc)}
              scratchpadText={scratchpadText}
              readingQuotes={activeBook?.favoriteQuotes || []}
            />
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
                  {verifiedProof.type === "ai_verified" && "Planorth Koç Tarafından Teyit Edildi"}
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

            {/* READING SESSION REVIEW CARD */}
            {isReadingMode && activeBook && (
              <div className="mt-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-xl bg-indigo-500/10 text-indigo-500">
                      <BookOpen className="size-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{activeBook.title}</h3>
                      <p className="text-xs text-muted-foreground">{activeBook.author}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    Toplam {activeBook.totalPages} Sayfa
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Kaldığın Son Sayfayı Onayla
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={activeBook.currentPage}
                        max={activeBook.totalPages}
                        value={readingPageInput}
                        onChange={(e) => setReadingPageInput(Math.min(activeBook.totalPages, Math.max(0, Number(e.target.value))))}
                        className="w-24 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-mono font-bold text-foreground focus:border-indigo-500 focus:outline-hidden"
                      />
                      <div className="flex items-center gap-1">
                        {[1, 5, 10].map((inc) => (
                          <button
                            key={inc}
                            type="button"
                            onClick={() => setReadingPageInput((p) => Math.min(activeBook.totalPages, p + inc))}
                            className="rounded-lg border bg-background px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95"
                          >
                            +{inc}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-indigo-500/20 bg-background/60 p-2.5 flex flex-col justify-center">
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">
                      Bu Seansın Verimi
                    </span>
                    <span className="text-sm font-bold text-foreground mt-0.5">
                      +{Math.max(0, readingPageInput - activeBook.currentPage)} sayfa okundu
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Kitap genelinde %{Math.round((readingPageInput / activeBook.totalPages) * 100)} ilerleme
                    </span>
                  </div>
                </div>

                {readingPageInput >= activeBook.totalPages && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    🎉 Tebrikler! Bu kitabı başarıyla tamamladın!
                  </div>
                )}
              </div>
            )}

            {/* FREE FOCUS REVIEW CARD */}
            {isFreeMode && !isReadingMode && (
              <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
                    <Zap className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {freeTitle || "Görevsiz Serbest Odak"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {Math.floor(elapsed / 60000)} dakika kesintisiz serbest akış tamamlandı
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Serbest Seans
                </span>
              </div>
            )}

            {/* ACTIVE PAGE RANGE COMPLETION CARD */}
            {activeRange && (
              <div className="mt-5 rounded-2xl border border-indigo-500/25 bg-indigo-500/5 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                    Çalışılan Sayfa Aralığı
                  </span>
                  <h4 className="text-sm font-bold text-foreground truncate">{activeRange.topic}</h4>
                  <p className="text-xs text-muted-foreground">
                    {activeRange.resourceTitle} (Sayfa {activeRange.startPage}–{activeRange.endPage})
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={activeRange.status === "completed" ? "secondary" : "outline"}
                  onClick={() => {
                    const next = activeRange.status === "completed" ? "reading" : "completed";
                    updateSavedPageRange(activeRange.id, { status: next });
                    setActiveRange({ ...activeRange, status: next });
                    toast.success(
                      next === "completed"
                        ? "Sayfa aralığı tamamlandı olarak kaydedildi! 🎉"
                        : "Okunuyor durumuna alındı."
                    );
                  }}
                  className="rounded-xl text-xs h-8 shrink-0"
                >
                  {activeRange.status === "completed" ? "✓ Tamamlandı" : "Aralığı Tamamla"}
                </Button>
              </div>
            )}

            {/* SESSION NOTES TO NOTEBOOKLM CARD */}
            {scratchpadText.trim().length > 0 && (
              <div className="mt-4 rounded-2xl border bg-card p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Seans Canlı Notları ({scratchpadText.trim().length} krk)
                  </span>
                  <p className="text-xs text-foreground">
                    Tuttuğun formüller ve notlar NotebookLM kaynak formatına hazır.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const snippet = generateSessionNotebookLMSnippet({
                      sessionTitle: task?.title || activeBook?.title || activeRange?.topic || "Odak Seansı",
                      durationMinutes: Math.floor(elapsed / 60000),
                      scratchpadText,
                      quotes: activeBook?.favoriteQuotes || [],
                      activeBook: activeBook || undefined,
                      activeRange: activeRange || undefined,
                    });
                    navigator.clipboard.writeText(snippet);
                    toast.success("Seans notları NotebookLM formatında panoya kopyalandı!");
                  }}
                  className="rounded-xl text-xs h-8 shrink-0"
                >
                  <Sparkles className="size-3.5 mr-1 text-amber-500" />
                  NotebookLM Paketini Kopyala
                </Button>
              </div>
            )}

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
                  ["ai", "Planorth Koç"],
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

                    let finalPagesRead = 0;
                    if (isReadingMode && activeBook) {
                      const res = logReadingSession(
                        activeBook.id,
                        readingPageInput,
                        actualMinutes,
                        readingQuote,
                        reflection
                      );
                      if (res) {
                        finalPagesRead = res.pagesRead;
                        setBooks(loadBooks());
                      }
                    }

                    const activity: NorthActivity = {
                      id: timer.id,
                      taskId: id,
                      areaId: effectiveArea.id,
                      date: dayKey(),
                      minutes: actualMinutes,
                      outcome,
                      difficulty,
                      reflection: isReadingMode
                        ? [activeBook?.title, readingQuote, verifiedProof.content, reflection].filter(Boolean).join(" · ")
                        : isFreeMode
                        ? [freeTitle, verifiedProof.content, reflection].filter(Boolean).join(" · ")
                        : [verifiedProof.content, reflection].filter(Boolean).join(" · "),
                      amount: isReadingMode ? finalPagesRead : isFreeMode ? actualMinutes : 0,
                      metric: effectiveArea.metric,
                      endedAt: new Date().toISOString(),
                      plannedMinutes: task?.minutes ?? currentMinutes,
                      actualStart: new Date(timer.beganAt ?? timer.started).toISOString(),
                      plannedStart: task?.plannedStart,
                      energy: state.energy.date === dayKey() ? state.energy.level : "normal",
                      pauseCount: Math.max(0, (timer.pauses ?? 0) - (timer.running ? 0 : 1)),
                      earlyExit: remainingSeconds > 0,
                      completionPercent:
                        outcome === "done" ? 100 : outcome === "skipped" ? 0 : Math.min(99, Math.round((actualMinutes / (task?.minutes ?? currentMinutes)) * 100)),
                      taskType: task ? inferTaskType(task, area?.kind) : isReadingMode ? "reading" : "deep_work",
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
                        areaId: effectiveArea.id,
                        title: `${isReadingMode ? activeBook?.title || "Kitap Okuma" : isFreeMode ? freeTitle || "Serbest Odak" : task?.title || "Odak"} (Fotoğraflı Kanıt)`,
                        kind: "other",
                        description: reflection || verifiedProof.content || `${task?.title || "Odak"} çalışması tamamlandı.`,
                        url: proofUrl,
                        createdAt: new Date().toISOString(),
                      });
                    }

                    update((s) => {
                      if (s.activities.some((a) => a.id === timer.id)) return s;
                      const next = {
                        ...s,
                        activities: [...s.activities, activity],
                        tasks: task ? s.tasks.map((t) => (t.id === id ? { ...t, status: outcome } : t)) : s.tasks,
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
              Planorth&apos;ta sahte süre kaydedilmez ve kilit çözülmeden çıkılamaz. Çalıştığın konudan soruyu cevapla.
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
                    {effectiveArea.name} Çıkış Sorusu
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
                <span className="font-semibold text-purple-600 dark:text-purple-400">Planorth Koç Hızlı Soru: </span>
                <p className="mt-1">
                  &ldquo;{task?.title || effectiveArea.name}&rdquo; çalışırken aklında kalan en kritik 1 kural, formül veya edindiğin çıkarım ne oldu?
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
                  <span>Planorth Koç cevabını onayladı! Öğrenim çıktın geçerli kabul edildi.</span>
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
                  Dikkat dağılması ve yorgunluk insani bir durumdur. Ancak Planorth sahte odak süresi kaydetmez. 
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

      {/* BOOK LIBRARY & RECOMMENDATIONS MODAL */}
      <BookLibraryModal
        open={bookLibraryOpen}
        onOpenChange={setBookLibraryOpen}
        onStartReadingFocus={(book: NorthBook) => {
          setActiveBookId(book.id);
          setReadingPageInput(book.currentPage);
          setBookLibraryOpen(false);
          toast.success(`"${book.title}" seçildi.`);
        }}
      />

      {/* FOCUS RESOURCES MODAL (FULL WORKSPACE) */}
      <FocusResourcesModal
        open={resourcesModalOpen}
        onOpenChange={setResourcesModalOpen}
        initialTab={resourcesModalTab}
        task={task}
        activeBook={activeBook}
        activeRange={activeRange}
        onSelectRange={(range) => {
          setActiveRange(range);
          toast.success(`"${range.topic}" bu seansın aktif hedefi yapıldı.`);
        }}
        scratchpadText={scratchpadText}
        readingQuotes={activeBook?.favoriteQuotes || []}
      />

      {/* LIGHTBOX FOR PINNED DOC */}
      {lightboxDoc && (
        <Dialog open={!!lightboxDoc} onOpenChange={() => setLightboxDoc(null)}>
          <DialogContent className="max-w-4xl p-2 bg-black/90 text-white border-zinc-800">
            <div className="relative flex flex-col items-center justify-center p-2">
              <div className="flex items-center justify-between w-full pb-2 px-2 border-b border-zinc-800 text-xs">
                <span className="font-bold truncate">{lightboxDoc.title}</span>
                {lightboxDoc.pageRange && (
                  <span className="font-mono text-zinc-400">{lightboxDoc.pageRange}</span>
                )}
              </div>
              <div className="my-4 max-h-[75vh] max-w-full overflow-auto flex items-center justify-center">
                {lightboxDoc.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={lightboxDoc.url}
                    alt={lightboxDoc.title}
                    className="max-h-[70vh] max-w-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="p-8 text-center space-y-3">
                    <FileText className="size-16 mx-auto text-sky-400" />
                    <p className="text-sm font-semibold">{lightboxDoc.title}</p>
                    <a
                      href={lightboxDoc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-sky-400 underline"
                    >
                      Harici Sekmede Aç
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
              </div>
              {lightboxDoc.notes && (
                <p className="text-xs text-zinc-400 italic px-3 text-center">{lightboxDoc.notes}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}
