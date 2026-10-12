"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WeekPlan } from "./use-week-plan";

export function TaskDialog({ ctx }: { ctx: WeekPlan }) {
  const {
    taskModalOpen,
    setTaskModalOpen,
    editingTask,
    setEditingTask,
    activeAreas,
    weekDays,
    handleSaveTaskModal,
    state,
  } = ctx;
  return (
    <>
    {/* TASK EDIT / CREATE MODAL */}
    <Dialog open={taskModalOpen} onOpenChange={setTaskModalOpen}>
      <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-foreground">
            {editingTask?.id && state.tasks.some((t) => t.id === editingTask.id)
              ? "Görevi Düzenle"
              : "Yeni Görev Ekle"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Bu sprint için net, odaklı ve ölçülebilir bir çalışma adımı tanımla.
          </DialogDescription>
        </DialogHeader>

        {editingTask && (
          <div className="space-y-3.5 py-2">
            <div className="space-y-1">
              <Label className="text-xs text-foreground/90">Görev Başlığı</Label>
              <Input
                value={editingTask.title}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                placeholder="Örn: Temel ağ ve Linux ortamını doğrula"
                className="bg-background border-input text-xs text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-foreground/90">Alan</Label>
                <select
                  value={editingTask.areaId}
                  onChange={(e) => setEditingTask({ ...editingTask, areaId: e.target.value })}
                  className="w-full bg-background border border-input rounded-md py-2 px-2.5 text-xs text-foreground"
                >
                  {activeAreas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-foreground/90">Süre (Dakika)</Label>
                <Input
                  type="number"
                  min={10}
                  max={240}
                  step={5}
                  value={editingTask.minutes}
                  onChange={(e) => setEditingTask({ ...editingTask, minutes: Number(e.target.value) || 30 })}
                  className="bg-background border-input text-xs text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-foreground/90">Güne Ata (İsteğe Bağlı)</Label>
              <select
                value={editingTask.date || ""}
                onChange={(e) => setEditingTask({ ...editingTask, date: e.target.value })}
                className="w-full bg-background border border-input rounded-md py-2 px-2.5 text-xs text-foreground"
              >
                <option value="">Esnek Havuz (Güne kilitlenmemiş)</option>
                {weekDays.map((d) => (
                  <option key={d.date} value={d.date}>
                    {d.dayName} {d.dayNum} {d.monthName} {d.isToday ? "(Bugün)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="mandatoryCheck"
                checked={editingTask.mandatory}
                onChange={(e) => setEditingTask({ ...editingTask, mandatory: e.target.checked })}
                className="w-4 h-4 rounded bg-muted border-border text-blue-600 focus:ring-0"
              />
              <label htmlFor="mandatoryCheck" className="text-xs text-foreground/90 cursor-pointer">
                Bu görev sprint için <strong className="text-amber-700 dark:text-amber-300">Öncelikli</strong> sayılsın
              </label>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTaskModalOpen(false)}
            className="border-border text-xs text-foreground/90"
          >
            İptal
          </Button>
          <Button
            size="sm"
            onClick={handleSaveTaskModal}
            disabled={!editingTask?.title.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-xs text-white font-semibold"
          >
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    </>
  );
}
