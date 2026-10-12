"use client";

import { Sparkles, X } from "lucide-react";
import { useWeekPlan } from "./week-parts/use-week-plan";
import { WeekHeader } from "./week-parts/week-header";
import { OverdueBanner } from "./week-parts/overdue-banner";
import { WeekStats } from "./week-parts/week-stats";
import { DayFlow } from "./week-parts/day-flow";
import { TaskPool } from "./week-parts/task-pool";
import { PeriodStages } from "./week-parts/period-stages";
import { Deadlines } from "./week-parts/deadlines";
import { TaskDialog } from "./week-parts/task-dialog";
import { AssignDialog } from "./week-parts/assign-dialog";
import { ReplanDialog } from "./week-parts/replan-dialog";

export function NorthWeek() {
  const ctx = useWeekPlan();
  const { notification, setNotification } = ctx;
  return (
    <div className="relative text-foreground font-sans selection:bg-primary/20 selection:text-primary pb-32 md:pb-24">
      {/* Subtle Background Glows (dark mode only) */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl pointer-events-none -z-0 opacity-0 dark:opacity-100" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-0 opacity-0 dark:opacity-100" />


      {/* Main Container */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
        {/* TOAST / NOTIFICATION */}
        {notification && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-card/95 border border-primary/40 text-xs font-medium text-foreground shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{notification}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <WeekHeader ctx={ctx} />
        <OverdueBanner ctx={ctx} />
        <WeekStats ctx={ctx} />
        <DayFlow ctx={ctx} />
        <TaskPool ctx={ctx} />
        <PeriodStages ctx={ctx} />
        <Deadlines ctx={ctx} />
      </div>

      <TaskDialog ctx={ctx} />
      <AssignDialog ctx={ctx} />
      <ReplanDialog ctx={ctx} />
    </div>
  );
}
