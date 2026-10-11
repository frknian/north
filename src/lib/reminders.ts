export type ReminderSettings = { enabled: boolean; time: string };

export const REMINDER_KEY = "planorth_reminder_v1";
export const REMINDER_SENT_KEY = "planorth_reminder_sent";
export const defaultReminder: ReminderSettings = { enabled: false, time: "09:00" };

export function readReminder(): ReminderSettings {
  try {
    const raw = JSON.parse(window.localStorage.getItem(REMINDER_KEY) ?? "null") as Partial<ReminderSettings> | null;
    return { enabled: Boolean(raw?.enabled), time: raw?.time && /^\d{2}:\d{2}$/.test(raw.time) ? raw.time : defaultReminder.time };
  } catch { return defaultReminder; }
}

export function writeReminder(settings: ReminderSettings) {
  try { window.localStorage.setItem(REMINDER_KEY, JSON.stringify(settings)); } catch {}
  window.dispatchEvent(new Event("planorth-reminder-change"));
}

/** True when the daily reminder is due: enabled, past the chosen time, not yet sent today, and something is left to do. */
export function reminderDue(input: { settings: ReminderSettings; now: Date; today: string; lastSent: string | null; pendingCount: number }): boolean {
  const { settings, now, today, lastSent, pendingCount } = input;
  if (!settings.enabled || pendingCount <= 0 || lastSent === today) return false;
  const [hours, minutes] = settings.time.split(":").map(Number);
  return now.getHours() * 60 + now.getMinutes() >= hours * 60 + minutes;
}
