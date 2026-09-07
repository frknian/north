"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, ShieldAlert, CheckCircle2, ArrowRight, Sparkles, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { type ActiveFocusLock, clearFocusLock, setFocusLock } from "@/lib/focus-lock";
import { useWorkspace } from "@/components/features/workspace-provider";
import { dayKey, type NorthActivity } from "@/lib/north";

export function FocusLockBarrier({
  lock,
  reason,
  onUnlocked,
}: {
  lock: ActiveFocusLock;
  reason: "other_tab" | "reopened_unanswered";
  onUnlocked?: () => void;
}) {
  const workspace = useWorkspace();
  const [currentReason, setCurrentReason] = useState(reason);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [abandonActive, setAbandonActive] = useState(false);
  const [abandonCountdown, setAbandonCountdown] = useState(5);

  useEffect(() => {
    setCurrentReason(reason);
  }, [reason]);

  useEffect(() => {
    if (!abandonActive || abandonCountdown <= 0) return;
    const t = setTimeout(() => setAbandonCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [abandonActive, abandonCountdown]);

  const handleResolveWithAnswer = () => {
    if (answer.trim().length < 15) {
      toast.error("Lütfen soruyu en az 15 karakterle açıklayıcı şekilde cevapla.");
      return;
    }

    setSubmitting(true);
    const elapsedMinutes = Math.max(1, Math.round((Date.now() - lock.startedAt) / 60000));

    // Log the resolved session
    if (workspace.north) {
      const activity: NorthActivity = {
        id: crypto.randomUUID(),
        taskId: lock.taskId,
        areaId: lock.areaId,
        date: dayKey(),
        minutes: elapsedMinutes,
        outcome: "done",
        difficulty: "Tam kararında",
        reflection: `Çıkış Sorusu Cevabı: ${answer.trim()}`,
        amount: 0,
        metric: "dk",
        endedAt: new Date().toISOString(),
        proofType: "output_text",
        proofContent: answer.trim(),
      };

      workspace.updateNorth((s) => ({
        ...s,
        activities: [...s.activities, activity],
        tasks: s.tasks.map((t) => (t.id === lock.taskId ? { ...t, status: "done" } : t)),
      }));
    }

    clearFocusLock();
    toast.success("Çıkış sorusu doğrulandı. Odak kilidi kaldırıldı!");
    onUnlocked?.();
  };

  const handleForfeit = () => {
    clearFocusLock();
    if (workspace.north) {
      const activity: NorthActivity = {
        id: crypto.randomUUID(),
        taskId: lock.taskId,
        areaId: lock.areaId,
        date: dayKey(),
        minutes: 0,
        outcome: "skipped",
        difficulty: "Zorlayıcı",
        reflection: "Oturum terk edildi (kapatılıp açıldı, kanıtsız vazgeçiş).",
        amount: 0,
        metric: "dk",
        endedAt: new Date().toISOString(),
        proofType: "abandoned",
      };
      workspace.updateNorth((s) => ({
        ...s,
        activities: [...s.activities, activity],
      }));
    }
    toast.info("Oturum iptal edildi, sahte süre yazılmadı. Kilit kaldırıldı.");
    onUnlocked?.();
  };

  return (
    <div className="fixed inset-0 z-9999 flex min-h-screen items-center justify-center bg-background/95 backdrop-blur-xl p-4 sm:p-6">
      {currentReason === "other_tab" ? (
        /* CASE 1: ACTIVE FOCUS RUNNING IN ANOTHER TAB */
        <div className="max-w-lg w-full rounded-3xl border border-primary/30 bg-card p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-primary/10 text-primary shadow-inner">
            <Lock className="size-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Odak Oturumu Devam Ediyor
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              North, dikkatinin dağılmasını engellemek için diğer sekmeleri kilitledi. Şu anda aktif bir odak oturumundasın:
            </p>
          </div>

          <div className="rounded-2xl border bg-muted/40 p-4 text-left space-y-1">
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {lock.areaName}
            </span>
            <h3 className="text-sm font-semibold text-foreground pt-1">{lock.taskTitle}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">Somut Çıktı: {lock.taskGoal}</p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <Button size="lg" className="rounded-2xl w-full" asChild>
              <Link href={`/focus/${lock.taskId}`}>
                Aktif Odak Sekmesine Git
                <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>

            <button
              type="button"
              onClick={() => setCurrentReason("reopened_unanswered")}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors pt-1"
            >
              Diğer sekme kapandıysa veya erişemiyorsan oturumu buradan çöz →
            </button>
          </div>
        </div>
      ) : (
        /* CASE 2: REOPENED UNANSWERED / INTERRUPTED SESSION LOCK */
        <div className="max-w-xl w-full rounded-3xl border border-red-500/40 bg-card p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3 border-b pb-4">
            <span className="grid size-10 place-items-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400">
              <ShieldAlert className="size-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Odak Çıkış Kilidi: Önceki Oturumu Doğrula
              </h2>
              <p className="text-xs text-muted-foreground">
                Önceki seans ({lock.taskTitle}) tamamlanmadan kapatıldı. Devam etmek için soruyu cevaplamalısın.
              </p>
            </div>
          </div>

          {/* EXIT QUESTION BOX */}
          <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              <span>Konu Doğrulama Sorusu ({lock.areaName}):</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed">
              {lock.exitQuestion}
            </p>
          </div>

          {/* ANSWER INPUT */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Cevabın &amp; Öğrenim Çıktın:
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Konudan aklında kalan formülü, kuralı, komutu veya vardığın çözümü buraya yaz..."
              className="h-28 w-full rounded-2xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden font-sans"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>En az 15 karakter gereklidir</span>
              <span className={answer.trim().length >= 15 ? "text-emerald-500 font-semibold" : ""}>
                {answer.trim().length} / 15 karakter
              </span>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="space-y-3 pt-2">
            <Button
              type="button"
              size="lg"
              className="w-full rounded-2xl"
              disabled={answer.trim().length < 15 || submitting}
              onClick={handleResolveWithAnswer}
            >
              <CheckCircle2 className="mr-2 size-4" />
              Cevabı Doğrula ve Kilidi Kaldır
            </Button>

            {/* FORFEIT ACCORDION */}
            {!abandonActive ? (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAbandonActive(true);
                    setAbandonCountdown(5);
                  }}
                  className="text-[11px] text-muted-foreground/70 hover:text-red-500 transition-colors"
                >
                  Çalışmadım / Kanıtım yok (Süre işlenmeden vazgeç)
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-3 flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground font-mono text-[11px]">
                  {abandonCountdown > 0 ? `Düşün... (${abandonCountdown} sn)` : "Vazgeçilebilir."}
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="rounded-xl text-xs"
                    disabled={abandonCountdown > 0}
                    onClick={handleForfeit}
                  >
                    Dürüstçe Vazgeç (0 dk)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs"
                    onClick={() => setAbandonActive(false)}
                  >
                    İptal
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
