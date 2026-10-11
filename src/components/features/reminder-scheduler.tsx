"use client";

import { useEffect, useRef } from "react";
import { useWorkspace } from "@/components/features/workspace-provider";
import { dailySelection, dayKey, initializeNorth } from "@/lib/north";
import { readReminder, reminderDue, REMINDER_SENT_KEY } from "@/lib/reminders";

/** Shows the daily focus reminder while Planorth is open (tab or installed app running in the background). */
export function ReminderScheduler() {
  const workspace = useWorkspace();
  const latest = useRef(workspace);
  useEffect(() => { latest.current = workspace; }, [workspace]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const tick = async () => {
      if (Notification.permission !== "granted") return;
      const current = latest.current;
      if (!current.ready || !current.north) return;
      const today = dayKey();
      const pending = dailySelection(current.north ?? initializeNorth(current), today);
      let lastSent: string | null = null;
      try { lastSent = window.localStorage.getItem(REMINDER_SENT_KEY); } catch {}
      if (!reminderDue({ settings: readReminder(), now: new Date(), today, lastSent, pendingCount: pending.length })) return;
      try { window.localStorage.setItem(REMINDER_SENT_KEY, today); } catch {}
      const body = pending[0] ? `Bugünün odağı: ${pending[0].title} (${pending[0].minutes} dk)` : "Bugünün planı seni bekliyor.";
      const options: NotificationOptions = { body, icon: "/planorth-192.png", badge: "/planorth-192.png", tag: `planorth-${today}`, data: { url: "/" } };
      try {
        const registration = await navigator.serviceWorker?.getRegistration();
        if (registration) await registration.showNotification("Planorth", options); else new Notification("Planorth", options);
      } catch {}
    };
    const interval = window.setInterval(tick, 30_000);
    const onVisible = () => { if (document.visibilityState === "visible") void tick(); };
    document.addEventListener("visibilitychange", onVisible);
    void tick();
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, []);
  return null;
}
