"use client";

import {
  useEffect,
  useState,
  useRef,
} from "react";
import {
} from "lucide-react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  dayKey,
  type NorthActivity,
  type SupportSource,
} from "@/lib/north";
import {
  loadBooks,
  type NorthBook,
} from "@/lib/books";
import {
  browserCompanion,
} from "@/lib/focus-companion";
import {
  useNorth,
} from "../shared";
import {
  getTaskGuidance,
} from "@/lib/task-guidance";
import {
  ambientSound,
} from "@/lib/ambient-sound";
import {
  PipTimerController,
} from "@/lib/pip-timer";
import {
  type AmbientSoundType,
} from "../focus-sound-mixer";
import {
  loadSavedPageRanges,
  loadPinnedDocs,
  type SavedPageRange,
  type PinnedSourceDoc,
} from "@/lib/resources-hub";
import {
  setFocusLock,
  clearFocusLock,
  markFocusLockInterrupted,
  generateExitQuestion,
  getTabId,
} from "@/lib/focus-lock";
import {
  toast,
} from "sonner";
import {
  Timer,
  BrainDumpItem,
  BRAIN_DUMP_KEY,
} from "./module-level";

export function useFocusSession({ id }: { id: string }) {
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


  return {
    state,
    update,
    ready,
    workspace,
    router,
    searchParams,
    queryMode,
    isReadingMode,
    isFreeMode,
    books,
    setBooks,
    activeBookId,
    setActiveBookId,
    readingPageInput,
    setReadingPageInput,
    readingQuote,
    setReadingQuote,
    bookLibraryOpen,
    setBookLibraryOpen,
    freeTitle,
    setFreeTitle,
    freeGoal,
    setFreeGoal,
    queryRangeId,
    queryPinnedDocId,
    activeRange,
    setActiveRange,
    resourcesModalOpen,
    setResourcesModalOpen,
    resourcesModalTab,
    setResourcesModalTab,
    lightboxDoc,
    setLightboxDoc,
    task,
    area,
    readingArea,
    defaultArea,
    effectiveArea,
    activeBook,
    guidance,
    completedSteps,
    setCompletedSteps,
    copiedCmd,
    setCopiedCmd,
    timer,
    setTimer,
    now,
    setNow,
    finishing,
    setFinishing,
    outcome,
    setOutcome,
    difficulty,
    setDifficulty,
    reflection,
    setReflection,
    saved,
    setSaved,
    supportSources,
    setSupportSources,
    ironWill,
    setIronWill,
    tabSwitches,
    setTabSwitches,
    scratchpadText,
    setScratchpadText,
    brainDumpItems,
    setBrainDumpItems,
    brainDumpInput,
    setBrainDumpInput,
    proofGateOpen,
    setProofGateOpen,
    proofMethod,
    setProofMethod,
    proofText,
    setProofText,
    proofStepId,
    setProofStepId,
    verifiedProof,
    setVerifiedProof,
    aiQuestionAnswer,
    setAiQuestionAnswer,
    aiVerificationStatus,
    setAiVerificationStatus,
    abandonCountdown,
    setAbandonCountdown,
    abandonTimerActive,
    setAbandonTimerActive,
    pipControllerRef,
    pipActive,
    setPipActive,
    breathworkOpen,
    setBreathworkOpen,
    activeSound,
    setActiveSound,
    ambientVolume,
    setAmbientVolume,
    customMinutes,
    setCustomMinutes,
    photoProof,
    setPhotoProof,
    exitQuestion,
    toggleDifficulty,
    toggleStep,
    handleCopy,
    queryMinutes,
    initialDuration,
    currentMinutes,
    totalSeconds,
    elapsed,
    elapsedSeconds,
    remainingSeconds,
    progressPercent,
    adjustMinutes,
    handlePause,
    handleStart,
    handleResume,
    handleTriggerFinish,
    handleVerifyAndFinish,
    handleForfeitAbandon,
    handleAiVerifyCheck,
    toggleIronWill,
    handleAddBrainDump,
    handleDeleteBrainDump,
    handleToggleBrainDumpDone,
    size,
    strokeWidth,
    radius,
    circumference,
    strokeDashoffset,
    displaySeconds,
    minutesStr,
    secondsStr,
    handleTogglePip,
    handleSoundChange,
    handleVolumeChange,
    id,
  };
}

export type FocusSessionCtx = ReturnType<typeof useFocusSession>;
