"use client";

import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  dayKey,
} from "@/lib/north";
import {
  Button,
} from "@/components/ui/button";
import {
  Badge,
} from "@/components/ui/badge";
import {
  Input,
} from "@/components/ui/input";
import {
  cn,
} from "@/lib/utils";
import type { CalendarPlanCtx } from "./use-calendar-plan";

export function CalendarHeader({ ctx }: { ctx: CalendarPlanCtx }) {
  const {
    state,
    exportCalendar,
    date,
    setDate,
    view,
    setView,
    activeAreas,
    monthName,
    navigateMonth,
    setDistributeModalOpen,
    handleRebalance,
    openNewTaskModal,
    openNewEventModal,
  } = ctx;
  return (
    <>
      {/* HEADER */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] font-bold tracking-wider uppercase text-primary">
              Aylık Takvim & Taksim
            </Badge>
            <span className="text-xs text-muted-foreground">· Haftalık Kapasite: {state.weeklyHours} saat</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Takvim & Zaman Blokları
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Derslerini, mesaini ve serbest zamanlarını gör; odak görevlerini günlere dengeli taksim et.
          </p>
        </div>
    
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCalendar}
            className="rounded-xl text-xs"
            title="Planlı görevlerini ve bloklarını .ics dosyası olarak indir"
          >
            <CalendarPlus className="size-3.5 mr-1.5 text-primary" /> Takvime aktar (.ics)
          </Button>
          <Button
            size="sm"
            onClick={() => setDistributeModalOpen(true)}
            className="rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
            title="Aylık Görev Dağıt: Havuzdaki ve plandaki görevleri ayın günlerine dengeli şekilde dağıtır"
          >
            <Sparkles className="size-3.5 mr-1.5" /> Aylık Görev Dağıt
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRebalance}
            className="rounded-xl text-xs hidden sm:inline-flex"
            title="Dengeli Dağıt: Kaçan veya ötelenen görevleri haftaya akıllıca paylaştırır"
          >
            <RefreshCw className="size-3.5 mr-1.5 text-primary" /> Dengeli Dağıt
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!activeAreas.length}
            onClick={() => openNewEventModal(date)}
            className="rounded-xl text-xs"
          >
            <CalendarPlus className="size-3.5 mr-1.5 text-sky-400" /> + Blok Ekle
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!activeAreas.length}
            onClick={() => openNewTaskModal(date)}
            className="rounded-xl text-xs shadow-xs"
          >
            <Plus className="size-3.5 mr-1.5" /> + Görev Planla
          </Button>
        </div>
      </header>
    
      {/* CONTROLS & NAVIGATION HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card/60 p-3 shadow-xs">
        {/* Month Navigator */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => navigateMonth(-1)}
            className="size-8 rounded-lg"
            title="Önceki Ay"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="font-bold text-sm sm:text-base text-foreground capitalize px-2 min-w-[130px] text-center">
            {monthName}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => navigateMonth(1)}
            className="size-8 rounded-lg"
            title="Sonraki Ay"
          >
            <ChevronRight className="size-4" />
          </Button>
    
          {date !== dayKey() && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => setDate(dayKey())}
              className="rounded-xl text-[11px] ml-2 h-7"
            >
              Bugün
            </Button>
          )}
        </div>
    
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border bg-muted/40 p-1 text-xs">
            {(["month", "week", "day"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={cn(
                  "rounded-lg px-3 py-1 font-medium transition-all cursor-pointer",
                  view === mode
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {mode === "month" ? "Aylık Taksim" : mode === "week" ? "Hafta" : "Gün"}
              </button>
            ))}
          </div>
    
          <Input
            type="date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="w-auto text-xs rounded-xl h-8 hidden sm:inline-flex"
          />
        </div>
      </div>
    
    </>
  );
}
