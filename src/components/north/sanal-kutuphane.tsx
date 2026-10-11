"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Users, Clock, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function getLibraryCount(): number {
  if (typeof window === "undefined") return 64;
  const hour = new Date().getHours();
  return hour < 6 ? 18 : hour < 10 ? 42 : hour < 15 ? 74 : hour < 19 ? 96 : hour < 23 ? 68 : 28;
}

const STUDY_DESKS = [
  { id: 1, name: "Masa 1", topic: "AYT Matematik · Türev Fasikülü", duration: "42 dk", badge: "Sınav" },
  { id: 2, name: "Masa 2", topic: "Next.js 15 · Server Actions & Cache", duration: "30 dk", badge: "Yazılım" },
  { id: 3, name: "Masa 3", topic: "İngilizce C1 · Gölgeleme & Makale", duration: "55 dk", badge: "Dil" },
  { id: 4, name: "Masa 4", topic: "TryHackMe · Web Pentesting Lab", duration: "25 dk", badge: "Siber" },
  { id: 5, name: "Masa 5", topic: "KPSS · Genel Kültür & Tarih Tekrarı", duration: "48 dk", badge: "Sınav" },
  { id: 6, name: "Masa 6", topic: "Derin Öğrenme · PyTorch Optimizasyonu", duration: "18 dk", badge: "AI/Veri" },
];

export function SanalKutuphaneBadge({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  // Same value as before; the server snapshot keeps hydration consistent.
  const count = useSyncExternalStore(() => () => {}, getLibraryCount, () => 64);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer",
          className
        )}
        title="Sanal Kütüphane: Çalışma salonunu gör"
        aria-label={`${count} kişi odakta`}
      >
        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <Users className="size-3 shrink-0 opacity-70" />
        <span className="font-mono font-semibold">{count}</span>
        {!compact && (
          <span className="text-[10px] text-muted-foreground font-normal hidden sm:inline">odakta</span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6 bg-card text-card-foreground border border-border shadow-2xl">
          <DialogHeader className="text-left pb-2 border-b border-border/60">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Canlı Sanal Kütüphane
            </div>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center justify-between">
              <span>Planorth Çalışma Salonu</span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {count} Kişi Odakta
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              Yalnız değilsin. Şu anda hedefleri için sessizce odaklanan diğer yol arkadaşlarınla aynı salondasın.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-2 py-2 text-center text-xs">
            <div className="rounded-xl border border-border/60 bg-muted/40 p-2 space-y-0.5">
              <span className="text-[10px] text-muted-foreground block">Ortam</span>
              <strong className="text-foreground text-xs font-semibold">🤫 %100 Sessiz</strong>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/40 p-2 space-y-0.5">
              <span className="text-[10px] text-muted-foreground block">Ort. Seans</span>
              <strong className="text-foreground text-xs font-semibold font-mono">45 dk</strong>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/40 p-2 space-y-0.5">
              <span className="text-[10px] text-muted-foreground block">Ritim</span>
              <strong className="text-emerald-500 text-xs font-semibold">🔥 Kesintisiz</strong>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Aktif Masalar
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {STUDY_DESKS.map((desk) => (
                <div
                  key={desk.id}
                  className="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-xs shadow-2xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">{desk.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-medium">
                        {desk.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{desk.topic}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 font-mono text-[11px] text-primary font-semibold">
                    <Clock className="size-3" />
                    <span>{desk.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-border/60 flex items-center gap-2">
            <Button asChild className="flex-1 text-xs h-9 rounded-xl font-semibold shadow-xs">
              <Link href="/" onClick={() => setOpen(false)}>
                <Play className="size-3.5 mr-1.5 fill-current" />
                Masama Otur & Odaklan
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs h-9 rounded-xl"
            >
              Kapat
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
