export function nextRepetition(interval: number, remembered: boolean, now = new Date()) {
  const days = remembered ? Math.min(180, Math.max(1, interval * 2 || 1)) : 1;
  const next = new Date(now);
  next.setDate(next.getDate() + days);
  return { reviewIntervalDays: days, nextReviewAt: next.toISOString() };
}
