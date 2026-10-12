"use client";

import {
  Check,
  Layers,
  SlidersHorizontal,
} from "lucide-react";
import {
} from "@/lib/north";
import { getAreaStyling } from "./area-styling";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { WeekPlan } from "./use-week-plan";

export function ReplanDialog({ ctx }: { ctx: WeekPlan }) {
  const {
    replanModalOpen,
    setReplanModalOpen,
    tempPlanDays,
    setTempPlanDays,
    tempExcludedAreas,
    setTempExcludedAreas,
    replanForceAll,
    setReplanForceAll,
    activeAreas,
    handleExecuteReplan,
  } = ctx;
  return (
    <>
    {/* REPLAN / DAY SELECTION MODAL */}
    <Dialog open={replanModalOpen} onOpenChange={setReplanModalOpen}>
      <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            Haftalık Planlama &amp; Gün Seçimi
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Görevlerin hangi günlere dağıtılacağını seç. Çalışmadığın günleri tatil / dinlenme olarak ayarlayabilirsin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setTempPlanDays([0, 1, 2, 3, 4, 5, 6])}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold border transition",
                tempPlanDays.length === 7
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground hover:text-foreground border-border"
              )}
            >
              Tüm Hafta (7 Gün - Varsayılan)
            </button>
            <button
              type="button"
              onClick={() => setTempPlanDays([0, 1, 2, 3, 4])}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold border transition",
                JSON.stringify([...tempPlanDays].sort()) === JSON.stringify([0, 1, 2, 3, 4])
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground hover:text-foreground border-border"
              )}
            >
              Hafta İçi (Hafta Sonu Tatil)
            </button>
            <button
              type="button"
              onClick={() => setTempPlanDays([0, 1, 2, 3, 4, 5])}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold border transition",
                JSON.stringify([...tempPlanDays].sort()) === JSON.stringify([0, 1, 2, 3, 4, 5])
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground hover:text-foreground border-border"
              )}
            >
              6 Gün (Pazar Tatil)
            </button>
            <button
              type="button"
              onClick={() => setTempPlanDays([0, 2, 4])}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold border transition",
                JSON.stringify([...tempPlanDays].sort()) === JSON.stringify([0, 2, 4])
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground hover:text-foreground border-border"
              )}
            >
              Pzt, Çar, Cum (3 Gün)
            </button>
          </div>

          {/* Day Toggle Buttons */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground font-semibold">Aktif Dağıtım Günleri</Label>
            <div className="grid grid-cols-7 gap-1.5">
              {[
                { idx: 0, label: "Pzt", full: "Pazartesi" },
                { idx: 1, label: "Sal", full: "Salı" },
                { idx: 2, label: "Çar", full: "Çarşamba" },
                { idx: 3, label: "Per", full: "Perşembe" },
                { idx: 4, label: "Cum", full: "Cuma" },
                { idx: 5, label: "Cmt", full: "Cumartesi", weekend: true },
                { idx: 6, label: "Paz", full: "Pazar", weekend: true },
              ].map((d) => {
                const isSelected = tempPlanDays.includes(d.idx);
                return (
                  <button
                    key={d.idx}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        if (tempPlanDays.length > 1) {
                          setTempPlanDays(tempPlanDays.filter((x) => x !== d.idx));
                        }
                      } else {
                        setTempPlanDays([...tempPlanDays, d.idx].sort((a, b) => a - b));
                      }
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer",
                      isSelected
                        ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                        : "bg-muted/40 border-border text-muted-foreground hover:border-muted-foreground/30"
                    )}
                    title={d.full}
                  >
                    <span className="text-xs">{d.label}</span>
                    <span className="text-[9px] mt-0.5 font-medium">
                      {isSelected ? "Çalışma" : "Tatil"}
                    </span>
                  </button>
                );
              })}
            </div>
            {!tempPlanDays.includes(5) && !tempPlanDays.includes(6) ? (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                <Check className="w-3 h-3" />
                Hafta sonu (Cumartesi ve Pazar) tatil modunda — görev yerleştirilmeyecek.
              </p>
            ) : tempPlanDays.length === 7 ? (
              <p className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1 font-medium">
                <Check className="w-3 h-3" />
                Tüm 7 gün aktif çalışma — görevler tüm haftaya dengeli dağıtılır.
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                Seçilen gün sayısı: {tempPlanDays.length} gün ({7 - tempPlanDays.length} gün tatil/dinlenme)
              </p>
            )}
          </div>

          {/* Area Inclusion / Exclusion for this Week */}
          <div className="space-y-2 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" />
                Bu Haftaya Dahil Edilecek Alanlar
              </Label>
              <span className="text-[11px] font-semibold text-foreground bg-muted px-2 py-0.5 rounded-md">
                {activeAreas.length - tempExcludedAreas.length} / {activeAreas.length} Alan Aktif
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              İstediğin alanı bu hafta mola moduna alabilirsin. Kapattığın alanın görevleri silinmez, havuzda bekler ve diğer haftalarda planında yer almaya devam eder.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto pr-0.5">
              {activeAreas.map((area) => {
                const styling = getAreaStyling(area.id, area.name);
                const isExcluded = tempExcludedAreas.includes(area.id);
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => {
                      if (isExcluded) {
                        setTempExcludedAreas(tempExcludedAreas.filter((id) => id !== area.id));
                      } else {
                        setTempExcludedAreas([...tempExcludedAreas, area.id]);
                      }
                    }}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition cursor-pointer",
                      !isExcluded
                        ? "bg-primary/10 border-primary/40 text-foreground font-semibold shadow-xs"
                        : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50 opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: styling.color }} />
                      <span className="truncate">{area.name}</span>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ml-1.5",
                      !isExcluded
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground border border-border"
                    )}>
                      {!isExcluded ? "Bu Hafta Açık" : "Mola (Kapalı)"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Distribution Mode Options */}
          <div className="space-y-2 pt-2 border-t border-border">
            <Label className="text-xs text-muted-foreground font-semibold">Dağıtım Modu</Label>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2.5 p-2 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="replanScope"
                  checked={replanForceAll}
                  onChange={() => setReplanForceAll(true)}
                  className="text-primary accent-primary"
                />
                <div>
                  <span className="font-semibold text-foreground">Tüm haftayı sıfırdan dengeli dağıt</span>
                  <p className="text-[10px] text-muted-foreground">Tüm açık görevler seçilen günlere eşit ve alan dengesiyle paylaştırılır.</p>
                </div>
              </label>
              <label className="flex items-center gap-2.5 p-2 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="replanScope"
                  checked={!replanForceAll}
                  onChange={() => setReplanForceAll(false)}
                  className="text-primary accent-primary"
                />
                <div>
                  <span className="font-semibold text-foreground">Sadece tarihsiz / havuzdaki görevleri dağıt</span>
                  <p className="text-[10px] text-muted-foreground">Mevcut atanmış günlerdeki görevler yerinde kalır.</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReplanModalOpen(false)}
            className="text-xs"
          >
            Vazgeç
          </Button>
          <Button
            size="sm"
            onClick={() => handleExecuteReplan(tempPlanDays, replanForceAll, tempExcludedAreas)}
            disabled={tempPlanDays.length === 0}
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold"
          >
            Seçilen Gün ve Alanlara Dağıt ({activeAreas.length - tempExcludedAreas.length} Alan, {tempPlanDays.length} Gün)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
