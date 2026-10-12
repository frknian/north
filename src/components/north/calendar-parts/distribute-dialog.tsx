"use client";

import {
  Sparkles,
} from "lucide-react";
import {
  Button,
} from "@/components/ui/button";
import {
  Badge,
} from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Label,
} from "@/components/ui/label";
import {
  cn,
} from "@/lib/utils";
import {
  CALENDAR_DAYS_OF_WEEK,
} from "./module-level";
import type { CalendarPlanCtx } from "./use-calendar-plan";

export function DistributeDialog({ ctx }: { ctx: CalendarPlanCtx }) {
  const {
    state,
    activeAreas,
    monthName,
    optionalPool,
    distributeModalOpen,
    setDistributeModalOpen,
    distributeStrategy,
    setDistributeStrategy,
    distributeAreaId,
    setDistributeAreaId,
    distAllowedDays,
    setDistAllowedDays,
    distRespectRest,
    setDistRespectRest,
    distRespectBlocks,
    setDistRespectBlocks,
    distMaxDailyTasks,
    setDistMaxDailyTasks,
    distMaxDailyMinutes,
    setDistMaxDailyMinutes,
    isAllDays,
    isWeekdaysOnly,
    isWeekendsOnly,
    toggleAllowedDay,
    handleMonthlyDistribution,
  } = ctx;
  return (
    <>
      {/* AYLIK GÖREV DAĞIT MODAL */}
      <Dialog open={distributeModalOpen} onOpenChange={setDistributeModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span>Aylık Görev Dağıtımı & Akıllı Planlama</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Havuzdaki ve plandaki görevleri <strong className="text-foreground capitalize">{monthName}</strong> ayının günlerine kapasite ve gün tercihlerine göre dengeli dağıt.
            </DialogDescription>
          </DialogHeader>
    
          <div className="space-y-4 py-2 text-xs">
            {/* BİLGİ ÖZET KARTI */}
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground block">
                  {distributeStrategy === "all_pool"
                    ? `${optionalPool.length} Havuz Görevi Dağıtılacak`
                    : distributeStrategy === "rebalance_month"
                    ? `${state.tasks.filter((t) => t.status !== "done" && t.status !== "cancelled").length} Görev Baştan Dengelenecek`
                    : `${state.tasks.filter((t) => t.areaId === distributeAreaId && t.status !== "done").length} Alan Görevi Dağıtılacak`}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {monthName} ayı için dinlenme ve blok kurallarına göre dağıtım yapılır.
                </span>
              </div>
              <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
                {distributeStrategy === "all_pool" ? `${optionalPool.length} Görev` : "Akıllı Dağıtım"}
              </Badge>
            </div>
    
            {/* DAĞITIM STRATEJİSİ */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Dağıtım Kapsamı</Label>
              <div className="space-y-1.5">
                {[
                  {
                    id: "all_pool",
                    title: "Sadece Havuzdaki Görevleri Dağıt (Tavsiye Edilen)",
                    desc: "Tarihsiz ve bekleyen görevleri ayın boş günlerine yerleştirir; mevcut planlı günlere dokunmaz.",
                  },
                  {
                    id: "rebalance_month",
                    title: "Tüm Ayı Baştan Sıfırla & Dengeli Dağıt",
                    desc: "Bu aydaki tüm bekleyen görevleri ve havuzu sıfırdan tüm aya eşit paylaştırır.",
                  },
                  {
                    id: "area_specific",
                    title: "Belirli Bir Alanın Görevlerini Dağıt",
                    desc: "Sadece seçeceğin hedefin görevlerini ay günlerine dağıtır.",
                  },
                ].map((s) => (
                  <label
                    key={s.id}
                    className={cn(
                      "flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors",
                      distributeStrategy === s.id
                        ? "border-primary bg-primary/5"
                        : "border-border/60 hover:bg-muted/30"
                    )}
                  >
                    <input
                      type="radio"
                      name="distribute_strategy"
                      checked={distributeStrategy === s.id}
                      onChange={() => setDistributeStrategy(s.id as any)}
                      className="mt-0.5 accent-primary"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-semibold text-foreground block">{s.title}</span>
                      <span className="text-[11px] text-muted-foreground block">{s.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
    
            {/* ALAN SEÇİMİ (EĞER AREA_SPECIFIC İSE) */}
            {distributeStrategy === "area_specific" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Hedef Alan</Label>
                <select
                  value={distributeAreaId}
                  onChange={(e) => setDistributeAreaId(e.target.value)}
                  className="w-full rounded-xl border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Tüm Alanlar</option>
                  {activeAreas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({state.tasks.filter((t) => t.areaId === a.id && t.status !== "done").length} bekleyen görev)
                    </option>
                  ))}
                </select>
              </div>
            )}
    
            {/* GÖREV DAĞITILACAK GÜNLER (HAFTA İÇİ / HAFTA SONU / SEÇİM) */}
            <div className="space-y-2 border-t border-border/60 pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <span>📅 Dağıtılacak Günler</span>
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setDistAllowedDays([1, 2, 3, 4, 5, 6, 0])}
                    className={cn(
                      "text-[10.5px] h-6 px-2 rounded-md font-medium",
                      isAllDays
                        ? "bg-primary/15 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Tüm Günler
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setDistAllowedDays([1, 2, 3, 4, 5])}
                    className={cn(
                      "text-[10.5px] h-6 px-2 rounded-md font-medium",
                      isWeekdaysOnly
                        ? "bg-primary/15 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Hafta İçi
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setDistAllowedDays([6, 0])}
                    className={cn(
                      "text-[10.5px] h-6 px-2 rounded-md font-medium",
                      isWeekendsOnly
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    🌴 Hafta Sonu
                  </Button>
                </div>
              </div>
    
              {/* Gün Seçim Butonları (Pzt, Sal, Çar, Per, Cum, Cmt, Paz) */}
              <div className="grid grid-cols-7 gap-1 pt-0.5">
                {CALENDAR_DAYS_OF_WEEK.map((d) => {
                  const isSelected = distAllowedDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleAllowedDay(d.id)}
                      className={cn(
                        "py-1.5 text-xs font-semibold rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-0.5",
                        isSelected
                          ? d.isWeekend
                            ? "bg-amber-500/20 border-amber-500/60 text-amber-600 dark:text-amber-400 font-bold shadow-2xs"
                            : "bg-primary border-primary text-primary-foreground font-bold shadow-2xs"
                          : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                      title={d.full}
                    >
                      <span>{d.label}</span>
                      <span className="text-[9px] opacity-75 leading-none">
                        {d.isWeekend ? "H.Sonu" : "H.İçi"}
                      </span>
                    </button>
                  );
                })}
              </div>
    
              {/* Dinamik Durum Bilgisi */}
              <p className="text-[11px] text-muted-foreground">
                {isWeekendsOnly ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    🌴 Görevler yalnızca <strong>Cumartesi ve Pazar</strong> günlerine planlanacak. Hafta içi boş bırakılacak.
                  </span>
                ) : isWeekdaysOnly ? (
                  <span>
                    💼 Görevler yalnızca <strong>Pazartesi - Cuma</strong> günlerine planlanacak. Hafta sonu boş kalacak.
                  </span>
                ) : isAllDays ? (
                  <span>
                    🗓️ Görevler haftanın <strong>7 gününe</strong> dengeli şekilde paylaştırılacak.
                  </span>
                ) : (
                  <span>
                    🎯 Görevler seçtiğiniz <strong>{distAllowedDays.length} güne</strong> dağıtılacak.
                  </span>
                )}
              </p>
            </div>
    
            {/* DAĞITIM KURALLARI & KISITLAR */}
            <div className="space-y-2 border-t border-border/60 pt-3">
              <Label className="text-xs font-semibold">Koruma ve Limitler</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2 rounded-lg border border-border/60 cursor-pointer hover:bg-muted/30">
                  <input
                    type="checkbox"
                    checked={distRespectRest}
                    onChange={(e) => setDistRespectRest(e.target.checked)}
                    className="accent-primary rounded"
                  />
                  <span className="text-xs text-foreground">🌴 Dinlenme günlerini koru</span>
                </label>
    
                <label className="flex items-center gap-2 p-2 rounded-lg border border-border/60 cursor-pointer hover:bg-muted/30">
                  <input
                    type="checkbox"
                    checked={distRespectBlocks}
                    onChange={(e) => setDistRespectBlocks(e.target.checked)}
                    className="accent-primary rounded"
                  />
                  <span className="text-xs text-foreground">💼 Sabit bloklara saygı göster</span>
                </label>
              </div>
    
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Maksimum Günlük Görev</Label>
                  <select
                    value={distMaxDailyTasks}
                    onChange={(e) => setDistMaxDailyTasks(Number(e.target.value))}
                    className="w-full rounded-xl border bg-background px-2.5 py-1 text-xs"
                  >
                    <option value={1}>Günde en fazla 1 görev</option>
                    <option value={2}>Günde en fazla 2 görev</option>
                    <option value={3}>Günde en fazla 3 görev</option>
                    <option value={4}>Günde en fazla 4 görev</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Maksimum Günlük Süre</Label>
                  <select
                    value={distMaxDailyMinutes}
                    onChange={(e) => setDistMaxDailyMinutes(Number(e.target.value))}
                    className="w-full rounded-xl border bg-background px-2.5 py-1 text-xs"
                  >
                    <option value={45}>Maksimum 45 dakika</option>
                    <option value={60}>Maksimum 60 dakika</option>
                    <option value={90}>Maksimum 90 dakika</option>
                    <option value={120}>Maksimum 120 dakika</option>
                    <option value={180}>Maksimum 180 dakika</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
    
          <DialogFooter className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDistributeModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Vazgeç
            </Button>
            <Button
              size="sm"
              disabled={distAllowedDays.length === 0}
              onClick={handleMonthlyDistribution}
              className="rounded-xl text-xs font-semibold shadow-xs"
            >
              <Sparkles className="size-3.5 mr-1.5" /> Dağıtımı Başlat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
