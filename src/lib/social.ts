export interface ShareStats { weekKey: string; weeklyMinutes: number; weeklyDone: number; streak: number }
export interface PublicProfile extends ShareStats { uid: string; nickname: string; updatedAt: string }
export interface FriendRow extends PublicProfile { isMe?: boolean }
export interface ActivityLike { date: string; minutes: number; outcome: "done" | "partial" | "skipped" }

const DAY = 86_400_000;
const parse = (day: string) => Date.parse(`${day}T12:00:00Z`);
const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function mondayOf(day: string) {
  const weekday = new Date(parse(day)).getUTCDay();
  return fmt(parse(day) - ((weekday + 6) % 7) * DAY);
}

/** Weekly focus minutes, finished tasks and the current streak (a day counts when something was finished). */
export function computeShareStats(activities: ActivityLike[], today: string): ShareStats {
  const week = mondayOf(today);
  const weekEnd = fmt(parse(week) + 6 * DAY);
  const thisWeek = activities.filter((activity) => activity.date >= week && activity.date <= weekEnd && activity.outcome !== "skipped");
  const doneDays = new Set(activities.filter((activity) => activity.outcome === "done").map((activity) => activity.date));
  let cursor = doneDays.has(today) ? today : fmt(parse(today) - DAY);
  let streak = 0;
  while (doneDays.has(cursor)) { streak += 1; cursor = fmt(parse(cursor) - DAY); }
  return {
    weekKey: week,
    weeklyMinutes: thisWeek.reduce((sum, activity) => sum + Math.max(0, activity.minutes), 0),
    weeklyDone: thisWeek.filter((activity) => activity.outcome === "done").length,
    streak,
  };
}

/** Friends whose last published week is older than the current one count as zero this week. */
export function rankLeaderboard(entries: FriendRow[], currentWeek: string): (FriendRow & { rank: number })[] {
  const normalized = entries.map((entry) => entry.weekKey === currentWeek ? entry : { ...entry, weeklyMinutes: 0, weeklyDone: 0 });
  return normalized
    .sort((a, b) => b.weeklyMinutes - a.weeklyMinutes || b.streak - a.streak || a.nickname.localeCompare(b.nickname, "tr"))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateInviteCode(random: () => number = Math.random): string {
  return Array.from({ length: 8 }, () => CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)]).join("");
}
export function normalizeInviteCode(input: string): string | null {
  const code = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return code.length === 8 && [...code].every((char) => CODE_ALPHABET.includes(char)) ? code : null;
}
export function sanitizeNickname(input: string): string {
  return input.replace(/[<>\u0000-\u001f]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);
}
