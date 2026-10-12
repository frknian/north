"use client";


import { useCalendarPlan } from "./calendar-parts/use-calendar-plan";
import { CalendarHeader } from "./calendar-parts/header";
import { MonthBoard } from "./calendar-parts/month-board";
import { EventModal } from "./calendar-parts/event-modal";
import { TaskModal } from "./calendar-parts/task-modal";
import { DaySettingsDialog } from "./calendar-parts/day-settings-dialog";
import { DistributeDialog } from "./calendar-parts/distribute-dialog";
export * from "./calendar-parts/module-level";

export function NorthCalendar() {
  const ctx = useCalendarPlan();

  return (
    <div className="page-content space-y-5 pb-32 md:pb-10">
      <CalendarHeader ctx={ctx} />
      <MonthBoard ctx={ctx} />
      <EventModal ctx={ctx} />
      <TaskModal ctx={ctx} />
      <DaySettingsDialog ctx={ctx} />
      <DistributeDialog ctx={ctx} />
    </div>
  );
}
