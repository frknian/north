"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Heart, Play, Pause, RotateCcw } from "lucide-react";

type BreathingPhase = "inhale" | "hold1" | "exhale" | "hold2";

const PHASES: Record<BreathingPhase, { label: string; instruction: string; next: BreathingPhase }> = {
  inhale: { label: "Nefes Al", instruction: "Burnundan yavaşça ve derin bir nefes al (4 sn)", next: "hold1" },
  hold1: { label: "Nefesi Tut", instruction: "Ciğerlerini dolu tut, sakin kal (4 sn)", next: "exhale" },
  exhale: { label: "Nefes Ver", instruction: "Ağzından sakince tüm nefesi bırak (4 sn)", next: "hold2" },
  hold2: { label: "Boşlukta Kal", instruction: "Ciğerlerin boşken rahatla ve bekle (4 sn)", next: "inhale" },
};

export function BreathworkModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [phase, setPhase] = useState<BreathingPhase>("inhale");
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [active, setActive] = useState(true);
  const [cycleCount, setCycleCount] = useState(0);

  useEffect(() => {
    if (!open || !active) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setPhase((currentPhase) => {
            const next = PHASES[currentPhase].next;
            if (next === "inhale") {
              setCycleCount((c) => c + 1);
            }
            return next;
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, active]);

  const current = PHASES[phase];
  const isExpanding = phase === "inhale";
  const isHolding = phase === "hold1" || phase === "hold2";
  const isContracting = phase === "exhale";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6 bg-card text-card-foreground border border-border shadow-2xl text-center">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto grid size-10 place-items-center rounded-xl bg-teal-500/15 text-teal-500 mb-1">
            <Heart className="size-5" />
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">Kutu Nefesi & Göz Dinlendirme</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Zihnini yatıştırmak ve kalp atışını dengelemek için 4-4-4-4 ritmini takip et.
          </DialogDescription>
        </DialogHeader>

        {/* BREATHING CIRCLE ANIMATION */}
        <div className="my-6 relative flex flex-col items-center justify-center">
          <div
            className="size-44 rounded-full border-2 border-teal-500/30 flex items-center justify-center transition-all duration-1000 ease-in-out"
            style={{
              transform: isExpanding ? "scale(1.2)" : isContracting ? "scale(0.85)" : "scale(1.1)",
              backgroundColor: isHolding ? "rgba(20, 184, 166, 0.12)" : "rgba(20, 184, 166, 0.06)",
              boxShadow: "0 0 35px rgba(20, 184, 166, 0.2)",
            }}
          >
            <div className="flex flex-col items-center">
              <span className="text-4xl font-bold font-mono text-teal-500">{secondsLeft}</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground mt-1">
                {current.label}
              </span>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground max-w-xs">{current.instruction}</p>
        </div>

        {/* 20-20-20 EYE REST TIP */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-left flex items-start gap-2.5 text-xs">
          <Eye className="size-4 text-sky-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-foreground">20-20-20 Göz Kuralı:</span>
            <p className="text-muted-foreground text-[11px] mt-0.5">
              Ekrana bakmayı bırak; en az 6 metre (20 feet) uzaktaki bir nesneye 20 saniye boyunca odaklan. Göz kaslarını dinlendirir.
            </p>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl text-xs"
            onClick={() => setActive(!active)}
          >
            {active ? <Pause className="mr-1.5 size-3.5" /> : <Play className="mr-1.5 size-3.5" />}
            {active ? "Duraklat" : "Devam Et"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="rounded-xl text-xs"
            onClick={() => {
              setPhase("inhale");
              setSecondsLeft(4);
              setCycleCount(0);
            }}
          >
            <RotateCcw className="mr-1.5 size-3.5" />
            Sıfırla
          </Button>
          <Button size="sm" className="rounded-xl text-xs" onClick={() => onOpenChange(false)}>
            Oturumu Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
