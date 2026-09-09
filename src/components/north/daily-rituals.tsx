"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Check, Sparkles, CheckCircle2, Circle } from "lucide-react";
import { dayKey, rolloverUnfinishedTasks, type NorthState } from "@/lib/north";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Habit {
  id: string;
  title: string;
  icon: string;
  completedDate?: string;
  streak: number;
}

const DEFAULT_HABITS: Habit[] = [
  { id: "read", title: "20 Sayfa Kitap Oku", icon: "📖", streak: 3 },
  { id: "water", title: "2 Litre Su İç", icon: "💧", streak: 5 },
  { id: "walk", title: "15 Dk Yürüyüş / Esneme", icon: "🚶", streak: 2 },
];

const HABITS_KEY = "north:daily_micro_habits";

export function MicroHabitsWidget({ compact = false }: { compact?: boolean }) {
  const today = dayKey();
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(HABITS_KEY);
        if (stored) {
          setHabits(JSON.parse(stored));
        }
      } catch {}
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const toggleHabit = (id: string) => {
    const next = habits.map((h) => {
      if (h.id === id) {
        const isCompleted = h.completedDate === today;
        return {
          ...h,
          completedDate: isCompleted ? undefined : today,
          streak: isCompleted ? Math.max(0, h.streak - 1) : h.streak + 1,
        };
      }
      return h;
    });
    setHabits(next);
    try {
      localStorage.setItem(HABITS_KEY, JSON.stringify(next));
    } catch {}
  };

  return (
    <section className={cn("rounded-2xl border bg-card/60 backdrop-blur-xs transition-all", compact ? "p-3 sm:p-3.5" : "p-4")}>
      <div className={cn("flex items-center justify-between gap-2 border-b border-border/40", compact ? "pb-2" : "pb-2.5")}>
        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <span>🎯</span> Günlük Mikro Alışkanlıklar
        </span>
        <span className="text-[11px] text-muted-foreground">
          {habits.filter((h) => h.completedDate === today).length} / {habits.length} tamamlandı
        </span>
      </div>
      <div className={cn("grid gap-2 sm:grid-cols-3", compact ? "mt-2" : "mt-3")}>
        {habits.map((h) => {
          const isDone = h.completedDate === today;
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => toggleHabit(h.id)}
              className={cn(
                "flex items-center justify-between rounded-xl border text-left text-xs transition-all",
                compact ? "p-2 sm:p-2.5" : "p-2.5",
                isDone
                  ? "border-emerald-500/30 bg-emerald-500/10 text-foreground"
                  : "border-border/60 bg-background/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0">{h.icon}</span>
                <div className="min-w-0">
                  <p className="font-medium text-xs leading-tight text-foreground truncate">{h.title}</p>
                  <span className="text-[10px] text-muted-foreground">{h.streak} gün zincir</span>
                </div>
              </div>
              <div className={cn("grid place-items-center rounded-full border shrink-0", compact ? "size-4.5" : "size-5", isDone ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground/30")}>
                {isDone && <Check className="size-2.5 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function MorningCompassModal({
  open,
  onOpenChange,
  state,
  onSelectPrimary,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: NorthState;
  onSelectPrimary: (taskId: string) => void;
}) {
  const pendingTasks = state.tasks.filter((t) => ["pending", "partial"].includes(t.status) && t.title);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6 bg-card text-card-foreground border border-border shadow-2xl">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto grid size-10 place-items-center rounded-xl bg-amber-500/15 text-amber-500 mb-1">
            <Sun className="size-5" />
          </div>
          <DialogTitle className="text-base font-bold text-foreground">Sabah Pusulası (30 Saniye)</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Bugün yalnızca tek bir şeyi bitirecek olsan hangisi gününü başarılı kılardı?
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-1">
          {pendingTasks.slice(0, 5).map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => {
                onSelectPrimary(task.id);
                toast.success(`Bugünün ana önceliği kilitlendi: ${task.title}`);
                onOpenChange(false);
              }}
              className="w-full flex items-center justify-between rounded-xl border border-border/60 bg-background/80 p-3 text-left hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <div>
                <p className="text-xs font-semibold text-foreground">{task.title}</p>
                <p className="text-[11px] text-muted-foreground">{task.minutes} dk · {task.goal || "Hedef çalışması"}</p>
              </div>
              <Sparkles className="size-4 text-primary shrink-0 opacity-70" />
            </button>
          ))}
        </div>

        <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)} className="mt-3 text-xs">
          Seçim Yapmadan Devam Et
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function EveningWinddownModal({
  open,
  onOpenChange,
  state,
  onApplyRollover,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: NorthState;
  onApplyRollover: () => void;
}) {
  const today = dayKey();
  const completedToday = state.activities.filter((a) => a.date === today && a.outcome === "done");
  const totalMinutes = completedToday.reduce((sum, a) => sum + a.minutes, 0);
  const remainingToday = state.tasks.filter((t) => t.date === today && !["done", "cancelled"].includes(t.status));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6 bg-card text-card-foreground border border-border shadow-2xl text-center">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto grid size-10 place-items-center rounded-xl bg-indigo-500/15 text-indigo-400 mb-1">
            <Moon className="size-5" />
          </div>
          <DialogTitle className="text-base font-bold text-foreground">Akşam Kapanış Ritüeli</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Günün emeğini onurlandır, yarım kalanları suçluluk hissetmeden yarına devret ve zihnini dinlendir.
          </DialogDescription>
        </DialogHeader>

        {/* SUMMARY CARD */}
        <div className="my-4 rounded-xl border border-border/60 bg-muted/30 p-4 text-left space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Bugün Tamamlanan:</span>
            <strong className="text-foreground">{completedToday.length} odak oturumu</strong>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Toplam Derin Odak:</span>
            <strong className="text-foreground">{totalMinutes} dakika</strong>
          </div>
          {remainingToday.length > 0 && (
            <div className="pt-2 border-t border-border/40 text-xs">
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                ⚡ Tamamlanamayan {remainingToday.length} görev var.
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                North bu görevleri haftanın uygun günlerine aktarabilir; hiçbir ceza veya borç birikmez.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {remainingToday.length > 0 && (
            <Button
              size="sm"
              onClick={() => {
                onApplyRollover();
                toast.success("Kalan görevler bu haftanın sonraki günlerine aktarıldı. İyi dinlenmeler!");
                onOpenChange(false);
              }}
              className="rounded-xl text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Kalanları Bu Haftaya Devret ve Günü Kapat
            </Button>
          )}
          <Button size="sm" variant={remainingToday.length > 0 ? "outline" : "default"} onClick={() => onOpenChange(false)} className="rounded-xl text-xs">
            Günü Huzurla Kapat ✨
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
