"use client";

import {
  Clock,
} from "lucide-react";
import Link from "next/link";
import type { WeekPlan } from "./use-week-plan";

export function Deadlines({ ctx }: { ctx: WeekPlan }) {
  const {
    openCreateTaskModal,
  } = ctx;
  return (
    <>
    {/* BEGIN: DeadlinesBannerSection */}
    <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Yaklaşan Kritik Kilometre Taşları &amp; Teslimler</h2>
            <p className="text-xs text-muted-foreground">Dönem hedeflerine giden yoldaki kritik kontrol noktaları ve ara teslimler</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openCreateTaskModal()}
            className="text-xs font-semibold text-foreground/90 hover:text-foreground px-2.5 py-1 rounded-lg bg-muted hover:bg-muted border border-border transition"
          >
            + Tarih Ekle
          </button>
          <Link
            href="/calendar"
            className="text-xs font-semibold text-blue-400 hover:text-blue-700 dark:text-blue-300 inline-flex items-center gap-1 transition group"
          >
            Takvim Görünümü <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Milestone 1 */}
        <div className="bg-muted/40 border border-border rounded-xl p-4 flex flex-col justify-between min-h-[105px] hover:border-border transition">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                1. Aşama Temel Harita Onayı
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground/80">1. Aşama</span>
            </div>
            <p className="text-xs text-muted-foreground">11 Eylül Cuma • Planorth ile değerlendirme oturumu</p>
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
            <span className="text-amber-400/90 font-medium">⏳ 2 gün kaldı</span>
            <span className="text-muted-foreground/80 text-[10px]">Kritik Kontrol</span>
          </div>
        </div>

        {/* Milestone 2 */}
        <div className="bg-muted/40 border border-border rounded-xl p-4 flex flex-col justify-between min-h-[105px] hover:border-border transition">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                İlk Laboratuvar Raporu Çıktısı
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground/80">2. Aşama</span>
            </div>
            <p className="text-xs text-muted-foreground">14 Eylül Pazartesi • Siber güvenlik lab bulguları</p>
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
            <span className="text-blue-400/90 font-medium">⏳ 5 gün kaldı</span>
            <span className="text-muted-foreground/80 text-[10px]">İlk Kanıt</span>
          </div>
        </div>

        {/* Milestone 3 */}
        <div className="bg-muted/40 border border-border rounded-xl p-4 flex flex-col justify-between min-h-[105px] hover:border-border transition">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                Dönem 1 Ara Kontrol Validasyonu
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground/80">Sprint 1</span>
            </div>
            <p className="text-xs text-muted-foreground">18 Eylül Cuma • Tüm alanlarda ilk sprint çıktısı</p>
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
            <span className="text-indigo-400/90 font-medium">⏳ 10 gün kaldı</span>
            <span className="text-muted-foreground/80 text-[10px]">Sprint İnceleme</span>
          </div>
        </div>
      </div>
    </section>
    {/* END: DeadlinesBannerSection */}
    </>
  );
}
