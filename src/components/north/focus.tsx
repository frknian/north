"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Check, ExternalLink, HelpCircle, Pause, Play, Sparkles, Square } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { dayKey, suggestDailyAdaptation, type NorthActivity, type SupportSource } from "@/lib/north";
import { inferTaskType, refreshIntelligence } from "@/lib/north-intelligence";
import { browserCompanion } from "@/lib/focus-companion";
import { useNorth, fieldClass } from "./shared";
import { Button } from "@/components/ui/button";
import { Companion } from "./shared";

const FocusCoach = dynamic(() => import("./ai").then((m) => m.NorthAI));

type Timer = {
  id: string;
  started: number;
  beganAt?: number;
  accumulated: number;
  running: boolean;
  pauses?: number;
};

export function NorthFocus({ id }: { id: string }) {
  const { state, update, ready } = useNorth();
  const router = useRouter();
  const task = state.tasks.find((t) => t.id === id);
  const area = state.areas.find((a) => a.id === task?.areaId);

  const [timer, setTimer] = useState<Timer | null>(null);
  const [now, setNow] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [exitAt, setExitAt] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [outcome, setOutcome] = useState<NorthActivity["outcome"]>("done");
  const [difficulty, setDifficulty] = useState("Tam kararında");
  const [reflection, setReflection] = useState("");
  const [saved, setSaved] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [supportSources, setSupportSources] = useState<SupportSource[]>(["none"]);

  const toggleDifficulty = (value: string) => setDifficulty((current) => (current === value ? "" : value));

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
    }, 0);
    const tick = setInterval(() => setNow(Date.now()), 250);
    return () => {
      clearTimeout(hydration);
      clearInterval(tick);
    };
  }, [id]);

  useEffect(() => {
    if (timer) sessionStorage.setItem(`north:focus:${id}`, JSON.stringify(timer));
  }, [id, timer]);

  useEffect(() => {
    if (!timer?.running) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [timer?.running]);

  const totalSeconds = (task?.minutes ?? 50) * 60;
  const elapsed = timer ? timer.accumulated + (timer.running ? Math.max(0, now - timer.started) : 0) : 0;
  const elapsedSeconds = Math.floor(elapsed / 1000);
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  const progressPercent = Math.min(100, Math.max(0, (elapsedSeconds / totalSeconds) * 100));

  function pause() {
    if (timer?.running) {
      setTimer({
        ...timer,
        accumulated: timer.accumulated + Math.max(0, Date.now() - timer.started),
        running: false,
        pauses: (timer.pauses ?? 0) + 1,
      });
    }
  }

  function start() {
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

  function resume() {
    if (!timer) return;
    setTimer({ ...timer, started: Date.now(), running: true });
  }

  function finish() {
    pause();
    setFinishing(true);
    setOutcome(remainingSeconds === 0 ? "done" : "partial");
  }

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

  // Circular timer constants
  const size = 260;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const minutesStr = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const secondsStr = String(remainingSeconds % 60).padStart(2, "0");

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:py-12">
      {/* TOPBAR NAVIGATION & AREA BADGE */}
      <div className="flex items-center justify-between gap-4 border-b pb-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Bugüne dön
        </Link>

        <div className="flex items-center gap-2.5">
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
                  stroke="var(--primary)"
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
                <span className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {!timer ? "Başlamaya Hazır" : timer.running ? "Derin Odak" : "Duraklatıldı"}
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
              <Button size="lg" className="rounded-full px-8 shadow-sm" onClick={start}>
                <Play className="mr-2 size-4" />
                Odaklanmayı Başlat
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  variant={timer.running ? "outline" : "default"}
                  className="rounded-full px-6"
                  onClick={() => (timer.running ? pause() : resume())}
                >
                  {timer.running ? <Pause className="mr-2 size-4" /> : <Play className="mr-2 size-4" />}
                  {timer.running ? "Duraklat" : "Devam Et"}
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-full px-6"
                  onClick={() => (remainingSeconds === 0 ? finish() : setExitAt(Date.now()))}
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

          {/* EARLY EXIT / REASON SELECTION */}
          {exitAt !== null && (
            <section className="mt-8 w-full max-w-md rounded-2xl border bg-card p-5 text-left shadow-sm">
              <h3 className="text-sm font-semibold text-foreground">Plan değişebilir, sorun değil.</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Erken bitirme nedenini seçerek North&apos;un bir sonraki planını gerçekçi tutmasına yardımcı ol:
              </p>
              <select
                aria-label="Erken bitirme nedeni"
                className={fieldClass + " mt-3"}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">Bir neden seç</option>
                {["Görev beklenenden erken tamamlandı", "Acil iş / Bölünme", "Düşük enerji / Yorgunluk", "Zorlandım / Takıldım", "Diğer"].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <div className="mt-4 flex gap-2">
                <Button disabled={!reason} onClick={finish}>
                  Erken Bitir
                </Button>
                <Button variant="ghost" onClick={() => setExitAt(null)}>
                  Odakta Kal
                </Button>
              </div>
            </section>
          )}

          <p className="mt-12 text-xs text-muted-foreground/60">
            North yalnızca oturum sürenizi ve girdiğiniz çıktıları kaydeder; arka planda cihaz etkinliği veya ekran izlemesi yapmaz.
          </p>
        </div>
      ) : (
        /* POST-SESSION FEEDBACK SCREEN */
        <section className="celebrate-pop mt-6 space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="size-4" />
              Odak Oturumu Tamamlandı
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {Math.floor(elapsed / 60000)} dakikalık oturum nasıl geçti?
            </h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Değerlendirmen, sonraki günlerdeki oturum sürelerini ve görev yoğunluğunu otomatik olarak optimize eder.
            </p>

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

            {/* SUBMIT OR NEXT STEPS */}
            <div className="mt-6 border-t pt-5">
              {!saved ? (
                <Button
                  size="lg"
                  className="w-full rounded-xl sm:w-auto"
                  onClick={() => {
                    if (!timer) return;
                    setSaved(true);
                    const actualMinutes = Math.max(0, Math.floor(elapsed / 60000));
                    const activity: NorthActivity = {
                      id: timer.id,
                      taskId: id,
                      areaId: area.id,
                      date: dayKey(),
                      minutes: actualMinutes,
                      outcome,
                      difficulty,
                      reflection: [reason, reflection].filter(Boolean).join(" · "),
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
                    };
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
                    void browserCompanion.stop();
                  }}
                >
                  <Check className="mr-2 size-4" />
                  Kaydet ve Sonucu İşle
                </Button>
              ) : (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs font-medium text-foreground">Oturum kaydedildi. Şimdi ne yapmak istersin?</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => router.push("/")}>
                      Günün Sıradaki Adımına Geç →
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => router.push("/north-ai")}>
                      North ile Planı Gözden Geçir
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* COACH DRAWER DIALOG */}
      <Dialog open={coachOpen} onOpenChange={setCoachOpen}>
        <DialogContent className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              North Koç
            </DialogTitle>
            <DialogDescription>
              Yalnızca şu anki görev için hızlı ipucu, yaklaşım ve sonraki adım tavsiyesi.
            </DialogDescription>
          </DialogHeader>
          {coachOpen && <FocusCoach taskId={id} embedded />}
        </DialogContent>
      </Dialog>
    </main>
  );
}
