"use client";

import {
  Sliders,
} from "lucide-react";
import {
  Button,
} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Input,
} from "@/components/ui/input";
import {
  Label,
} from "@/components/ui/label";
import {
  cn,
} from "@/lib/utils";
import type { CalendarPlanCtx } from "./use-calendar-plan";

export function DaySettingsDialog({ ctx }: { ctx: CalendarPlanCtx }) {
  const {
    selectedDateFormatted,
    selectedTasks,
    selectedMinutes,
    daySettings,
    daySettingsOpen,
    setDaySettingsOpen,
    daySettingDraft,
    setDaySettingDraft,
    saveCurrentDaySetting,
    applySettingToAllWeekendsInMonth,
    resetCurrentDaySetting,
    shiftTasksToTomorrow,
    moveTasksToPool,
  } = ctx;
  return (
    <>
      {/* GÜN AYARLA (DAY SETTINGS) MODAL */}
      <Dialog open={daySettingsOpen} onOpenChange={setDaySettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Sliders className="size-4 text-primary" />
              <span>Günü Ayarla</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              <strong className="text-foreground">{selectedDateFormatted}</strong> için kapasite, dinlenme ve odak temasını belirle.
            </DialogDescription>
          </DialogHeader>
    
          <div className="space-y-4 py-2 text-xs">
            {/* GÜN TİPİ / MODU */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Gün Modu / Tipi</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { mode: "normal", label: "🌿 Normal Gün", desc: "Standart tempo (60-90 dk)" },
                  { mode: "rest", label: "🌴 Dinlenme Günü", desc: "Görev atanmaz, mola" },
                  { mode: "deep_work", label: "⚡ Yoğun Odak", desc: "Derin iş (120-180 dk)" },
                  { mode: "light", label: "🕯️ Hafif Gün", desc: "Tek küçük adım (30 dk)" },
                ].map((item) => (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => {
                      const maxM = item.mode === "rest" ? 0 : item.mode === "light" ? 30 : item.mode === "deep_work" ? 150 : 90;
                      setDaySettingDraft((prev) => ({ ...prev, mode: item.mode as any, maxMinutes: maxM }));
                    }}
                    className={cn(
                      "rounded-xl border p-2 text-left transition-all cursor-pointer flex flex-col gap-0.5",
                      daySettingDraft.mode === item.mode
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                        : "border-border/70 hover:bg-muted/40 text-foreground"
                    )}
                  >
                    <span className="text-xs">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
    
            {/* GÜNLÜK MAKSİMUM KAPASİTE */}
            {daySettingDraft.mode !== "rest" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Günlük Maksimum Odak Süresi</Label>
                  <span className="font-mono text-xs font-bold text-primary">
                    {daySettingDraft.maxMinutes ?? 90} dakika
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[30, 45, 60, 90, 120, 180].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDaySettingDraft((prev) => ({ ...prev, maxMinutes: m }))}
                      className={cn(
                        "px-2.5 py-1 rounded-lg border text-xs font-mono transition-all cursor-pointer",
                        (daySettingDraft.maxMinutes ?? 90) === m
                          ? "bg-primary text-primary-foreground border-primary font-bold"
                          : "border-border/70 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {m} dk
                    </button>
                  ))}
                </div>
              </div>
            )}
    
            {/* GÜNÜN NOTU / ODAK TEMASI */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Günün Notu veya Teması (İsteğe Bağlı)</Label>
              <Input
                value={daySettingDraft.themeNote || ""}
                onChange={(e) => setDaySettingDraft((prev) => ({ ...prev, themeNote: e.target.value }))}
                placeholder="Örn: Sadece Türev Soru Çözümü, Sınav Günü, Şehir Dışı vb."
                className="rounded-xl text-xs"
              />
            </div>
    
            {/* HAFTA SONU TOPLU UYGULAMA KISAYOLU */}
            {(new Date(`${daySettingDraft.date}T12:00:00`).getDay() === 0 || new Date(`${daySettingDraft.date}T12:00:00`).getDay() === 6) && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-2.5 flex items-center justify-between gap-2">
                <div className="text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground block">🌴 Hafta Sonu Kısayolu</span>
                  <span>Bu günün ayarlarını ({daySettingDraft.mode === "rest" ? "Tatil" : daySettingDraft.mode === "deep_work" ? "Derin Odak" : "Bu Mod"}) bu ayın tüm Cumartesi ve Pazar günlerine uygula.</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={applySettingToAllWeekendsInMonth}
                  className="text-[11px] h-7 rounded-lg border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 shrink-0 font-medium"
                >
                  Tüm Hafta Sonlarına Uygula
                </Button>
              </div>
            )}
    
            {/* HIZLI GÜN AKSİYONLARI */}
            {selectedTasks.length > 0 && (
              <div className="rounded-xl border border-border/80 bg-muted/20 p-2.5 space-y-2">
                <span className="text-[11px] font-semibold text-foreground block">
                  Bu Günün Görevleri ({selectedTasks.length} görev · {selectedMinutes} dk)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={shiftTasksToTomorrow}
                    className="text-[11px] h-7 rounded-lg"
                  >
                    ⏩ Yarına Kaydır
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={moveTasksToPool}
                    className="text-[11px] h-7 rounded-lg"
                  >
                    📥 Havuza Gönder
                  </Button>
                </div>
              </div>
            )}
          </div>
    
          <DialogFooter className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
            {daySettings[daySettingDraft.date] ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetCurrentDaySetting}
                className="text-muted-foreground hover:text-destructive text-xs"
              >
                Ayarları Sıfırla
              </Button>
            ) : <div />}
    
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDaySettingsOpen(false)}
                className="rounded-xl text-xs"
              >
                Vazgeç
              </Button>
              <Button
                size="sm"
                onClick={saveCurrentDaySetting}
                className="rounded-xl text-xs font-semibold"
              >
                Ayarları Kaydet
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    
    </>
  );
}
