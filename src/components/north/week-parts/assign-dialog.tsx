"use client";

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
import { cn } from "@/lib/utils";
import type { WeekPlan } from "./use-week-plan";

export function AssignDialog({ ctx }: { ctx: WeekPlan }) {
  const {
    activePlanDays,
    assignDayTarget,
    setAssignDayTarget,
    weekDays,
    handleAssignTaskToDay,
    openCreateTaskModal,
    state,
  } = ctx;
  return (
    <>
    {/* QUICK DAY ASSIGN POPOVER / DIALOG */}
    <Dialog open={Boolean(assignDayTarget)} onOpenChange={(open) => !open && setAssignDayTarget(null)}>
      <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-foreground">
            {assignDayTarget && assignDayTarget.includes("-") && assignDayTarget.length === 10
              ? `${weekDays.find((d) => d.date === assignDayTarget)?.dayName || "Seçili Gün"} İçin Görev Ata`
              : "Görevi Güne Ata"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Esnek havuzdaki bir görevi bu güne taşıyabilir veya hızlıca yeni bir görev oluşturabilirsin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* If target is a day (YYYY-MM-DD), show pool tasks that can be assigned */}
          {assignDayTarget && assignDayTarget.includes("-") && assignDayTarget.length === 10 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Havuzdaki Atanmamış Görevler:</span>
                <button
                  onClick={() => {
                    const day = assignDayTarget;
                    setAssignDayTarget(null);
                    openCreateTaskModal(day);
                  }}
                  className="text-blue-400 hover:text-blue-700 dark:text-blue-300 font-semibold"
                >
                  + Bu Güne Yeni Görev
                </button>
              </div>

              {state.tasks.filter((t) => !t.date && t.status !== "cancelled" && t.status !== "done").length === 0 ? (
                <p className="text-xs text-muted-foreground/80 italic py-3 text-center bg-muted/60 rounded-lg">
                  Havuzda atanmamış görev yok. Yukarıdan yeni görev ekleyebilirsin.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {state.tasks
                    .filter((t) => !t.date && t.status !== "cancelled" && t.status !== "done")
                    .map((poolT) => {
                      const area = state.areas.find((a) => a.id === poolT.areaId);
                      const styling = getAreaStyling(poolT.areaId, area?.name);
                      return (
                        <button
                          key={poolT.id}
                          onClick={() => handleAssignTaskToDay(poolT.id, assignDayTarget)}
                          className="w-full text-left p-2.5 rounded-lg bg-muted/40 hover:bg-muted border border-border flex items-center justify-between transition group"
                        >
                          <div>
                            <div className="text-xs font-semibold text-foreground group-hover:text-blue-700 dark:text-blue-300 transition">
                              {poolT.title}
                            </div>
                            <div className="text-[10px] text-muted-foreground/80 mt-0.5">
                              {area?.name} • {poolT.minutes} dk
                            </div>
                          </div>
                          <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition">
                            Ata →
                          </span>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          ) : (
            /* If target is a taskId, show days to assign to */
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Hangi güne atamak istersin?</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {weekDays.map((d) => (
                  <button
                    key={d.date}
                    onClick={() => handleAssignTaskToDay(assignDayTarget!, d.date)}
                    className={cn(
                      "p-2.5 rounded-lg border text-left transition",
                      !activePlanDays.includes(d.dayIndex)
                        ? "bg-muted/20 border-dashed border-border opacity-70 hover:opacity-100"
                        : "bg-muted/40 hover:bg-muted border-border"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{d.dayName}</span>
                      {!activePlanDays.includes(d.dayIndex) && (
                        <span className="text-[9px] font-semibold text-amber-500">Tatil</span>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {d.dayNum} {d.monthName} {d.isToday ? "• Bugün" : ""}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAssignDayTarget(null)}
            className="border-border text-xs text-foreground/90"
          >
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    </>
  );
}
