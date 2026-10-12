"use client";

import {
  Compass,
} from "lucide-react";
import type { WeekPlan } from "./use-week-plan";

export function PeriodStages({ ctx }: { ctx: WeekPlan }) {
  const {
    periodMilestones,
  } = ctx;
  return (
    <>
    {/* BEGIN: PeriodStagesSection */}
    <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">Dönem Planı &amp; Aşamalar</h2>
              <span className="px-2 py-0.5 text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full">
                DÖNEM 1
              </span>
            </div>
            <p className="text-xs text-muted-foreground">5 yapılandırılmış aşamadan oluşan uzun vadeli stratejik yol haritası</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-semibold text-foreground/90">
          <span className="px-3 py-1 bg-muted border border-border rounded-full shadow-inner">
            5 Aşama Toplamı
          </span>
          <span className="text-muted-foreground/60 hidden sm:inline">|</span>
          <span className="text-blue-400 font-mono">%12 genel ilerleme</span>
        </div>
      </div>

      {/* 5 Stages Progression Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {periodMilestones.map((m) => {
          if (m.active) {
            return (
              <div
                key={m.step}
                className="relative bg-gradient-to-b from-primary/15 to-primary/5 border-2 border-primary/80 rounded-xl p-4 shadow-[0_0_20px_-3px_rgba(37,99,235,0.25)] flex flex-col justify-between min-h-[142px] group"
              >
                <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-blue-600 text-[10px] font-extrabold tracking-wider uppercase rounded-full text-white shadow-sm border border-blue-400/30">
                  Şu Anda
                </div>
                <div>
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-blue-400 font-bold tracking-wider uppercase text-[11px]">{m.phase}</span>
                    <span className="text-muted-foreground font-medium text-[11px]">{m.weekLabel}</span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1 group-hover:text-blue-200 transition">{m.title}</h3>
                  <p className="text-xs text-foreground/90/80 line-clamp-2">{m.desc}</p>
                </div>
                <div className="mt-4 pt-2.5 border-t border-blue-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">Aktif Aşama</span>
                  </div>
                  <span className="text-[11px] font-mono text-blue-400/90 font-bold">{m.progressText}</span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={m.step}
              className="bg-muted/30 border border-border rounded-xl p-4 flex flex-col justify-between min-h-[142px] hover:border-border hover:bg-muted/50 transition"
            >
              <div>
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-muted-foreground font-semibold tracking-wider uppercase text-[11px]">{m.phase}</span>
                  <span className="text-muted-foreground/80 font-medium text-[11px]">{m.weekLabel}</span>
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{m.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{m.desc}</p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground/80">
                <span className="flex items-center gap-1">
                  <span className="text-muted-foreground/60">🔒</span> Planlandı
                </span>
                <span className="text-muted-foreground/60 font-mono">0%</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
    {/* END: PeriodStagesSection */}
    </>
  );
}
