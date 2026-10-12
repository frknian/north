"use client";

import {
  AlertCircle,
  Zap,
} from "lucide-react";
import {
  poolTask,
  rolloverUnfinishedTasks,
} from "@/lib/north";
import type { WeekPlan } from "./use-week-plan";

export function OverdueBanner({ ctx }: { ctx: WeekPlan }) {
  const {
    overdueTasks,
    showToast,
    state,
    update,
  } = ctx;
  return (
    <>

    {/* SARKAN GÖREVLER (OVERDUE ROLLOVER BANNER) */}
    {overdueTasks.length > 0 && (
      <aside className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3.5 text-xs text-amber-200 backdrop-blur-md shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="grid size-6 place-items-center rounded-lg bg-amber-500/20 text-amber-400">
            <AlertCircle className="size-4" />
          </div>
          <div>
            <span className="font-bold text-foreground">Önceki günlerden sarkan {overdueTasks.length} görev var.</span>
            <span className="text-amber-200/80 ml-1.5 hidden sm:inline">
              Planorth&apos;ta borç veya suçluluk birikmez; görevleri haftanın uygun günlerine dağıtabilirsin.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const result = rolloverUnfinishedTasks(state);
              update(() => result.state);
              showToast("⚡ Sarkan görevler haftanın müsait günlerine dağıtıldı.");
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] shadow-sm transition flex items-center gap-1"
          >
            <Zap className="size-3" />
            Haftaya Otomatik Yay
          </button>
          <button
            onClick={() => {
              update((curr) => ({
                ...curr,
                tasks: curr.tasks.map((t) => (overdueTasks.some((o) => o.id === t.id) ? poolTask(t) : t)),
              }));
              showToast("📦 Sarkan görevler esnek havuza alındı.");
            }}
            className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted text-foreground/90 font-medium text-[11px] border border-border transition"
          >
            Havuza Al
          </button>
        </div>
      </aside>
    )}

    </>
  );
}
