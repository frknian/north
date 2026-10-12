"use client";

import {
  weekKey,
} from "@/lib/north";
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
import type { CalendarPlanCtx } from "./use-calendar-plan";

export function TaskModal({ ctx }: { ctx: CalendarPlanCtx }) {
  const {
    state,
    update,
    taskDraft,
    setTaskDraft,
    activeAreas,
  } = ctx;
  return (
    <>
      {/* TASK MODAL */}
      <Dialog open={Boolean(taskDraft)} onOpenChange={(open) => !open && setTaskDraft(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {taskDraft && state.tasks.some((t) => t.id === taskDraft.id) ? "Görevi Düzenle" : "Yeni Görev Planla"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Günün odak akışına bir çalışma adımı yerleştir.
            </DialogDescription>
          </DialogHeader>
    
          {taskDraft && (
            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <Label className="text-xs">Hedef Alanı</Label>
                <select
                  value={taskDraft.areaId}
                  onChange={(e) => setTaskDraft({ ...taskDraft, areaId: e.target.value })}
                  className="w-full rounded-xl border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {activeAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>
    
              <div className="space-y-1">
                <Label className="text-xs">Görev Başlığı</Label>
                <Input
                  value={taskDraft.title}
                  onChange={(e) => setTaskDraft({ ...taskDraft, title: e.target.value })}
                  placeholder="Örn: SQL Join Alıştırmaları"
                  className="rounded-xl text-xs"
                />
              </div>
    
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Süre (Dk)</Label>
                  <Input
                    type="number"
                    min="5"
                    max="240"
                    value={taskDraft.minutes}
                    onChange={(e) => setTaskDraft({ ...taskDraft, minutes: Number(e.target.value) })}
                    className="rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tarih</Label>
                  <Input
                    type="date"
                    value={taskDraft.date}
                    onChange={(e) =>
                      setTaskDraft({
                        ...taskDraft,
                        date: e.target.value,
                        week: e.target.value ? weekKey(e.target.value) : taskDraft.week,
                      })
                    }
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          )}
    
          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setTaskDraft(null)} className="rounded-xl text-xs">
              Vazgeç
            </Button>
            <Button
              size="sm"
              disabled={!taskDraft?.title.trim()}
              onClick={() => {
                if (!taskDraft) return;
                update((curr) => ({
                  ...curr,
                  tasks: curr.tasks.some((t) => t.id === taskDraft.id)
                    ? curr.tasks.map((t) => (t.id === taskDraft.id ? taskDraft : t))
                    : [...curr.tasks, taskDraft],
                }));
                setTaskDraft(null);
              }}
              className="rounded-xl text-xs"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    
    </>
  );
}
