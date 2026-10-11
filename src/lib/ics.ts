export type IcsTask = { id: string; title: string; goal?: string; minutes: number; date: string; status: string; plannedStart?: string };
export type IcsEvent = { id: string; title: string; date: string; time: string; kind: string; minutes: number };

const pad = (value: number) => String(value).padStart(2, "0");
const escapeText = (value: string) => value.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const compactDate = (date: string) => date.replace(/-/g, "");
const validDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date);
const validTime = (time?: string) => (time && /^\d{1,2}:\d{2}$/.test(time) ? time.padStart(5, "0") : "");

function fold(line: string) {
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 74) { parts.push(rest.slice(0, 74)); rest = " " + rest.slice(74); }
  parts.push(rest);
  return parts.join("\r\n");
}

function endOf(date: string, time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + Math.max(5, minutes);
  const dayShift = Math.floor(total / 1440);
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + dayShift);
  const day = `${next.getUTCFullYear()}${pad(next.getUTCMonth() + 1)}${pad(next.getUTCDate())}`;
  const rest = total % 1440;
  return `${day}T${pad(Math.floor(rest / 60))}${pad(rest % 60)}00`;
}

function nextDay(date: string) {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return `${next.getUTCFullYear()}${pad(next.getUTCMonth() + 1)}${pad(next.getUTCDate())}`;
}

/** Builds an iCalendar file for planned (not finished) tasks and calendar events. Times are floating (device local). */
export function buildIcs(input: { tasks: IcsTask[]; events: IcsEvent[]; name?: string; now?: Date }): string {
  const stamp = (input.now ?? new Date()).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Planorth//TR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${escapeText(input.name ?? "Planorth")}`];
  for (const task of input.tasks) {
    if (!validDate(task.date) || ["done", "cancelled", "skipped"].includes(task.status)) continue;
    const time = validTime(task.plannedStart);
    lines.push("BEGIN:VEVENT", `UID:task-${task.id}@planorth`, `DTSTAMP:${stamp}`);
    if (time) lines.push(`DTSTART:${compactDate(task.date)}T${time.replace(":", "")}00`, `DTEND:${endOf(task.date, time, task.minutes)}`);
    else lines.push(`DTSTART;VALUE=DATE:${compactDate(task.date)}`, `DTEND;VALUE=DATE:${nextDay(task.date)}`);
    lines.push(`SUMMARY:${escapeText(task.title)} (${task.minutes} dk)`);
    if (task.goal) lines.push(`DESCRIPTION:${escapeText(task.goal)}`);
    lines.push("END:VEVENT");
  }
  for (const event of input.events) {
    const time = validTime(event.time);
    if (!validDate(event.date) || !time) continue;
    lines.push("BEGIN:VEVENT", `UID:event-${event.id}@planorth`, `DTSTAMP:${stamp}`, `DTSTART:${compactDate(event.date)}T${time.replace(":", "")}00`, `DTEND:${endOf(event.date, time, event.minutes || 60)}`, `SUMMARY:${escapeText(event.title)}`, `CATEGORIES:${escapeText(event.kind)}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
