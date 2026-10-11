import "server-only";

type Report = { kind: "client-error" | "server-error" | "feedback"; [key: string]: unknown };

/** Writes a structured log line (visible in Vercel logs) and forwards to an optional webhook. */
export async function reportEvent(report: Report) {
  const line = JSON.stringify({ ...report, at: new Date().toISOString() });
  if (report.kind === "feedback") console.info(line); else console.error(line);
  const url = report.kind === "feedback" ? process.env.FEEDBACK_WEBHOOK_URL : process.env.ERROR_WEBHOOK_URL;
  if (!url || !/^https:\/\//.test(url)) return;
  try {
    const text = `[Planorth ${report.kind}] ${JSON.stringify(report).slice(0, 1500)}`;
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, content: text }), signal: AbortSignal.timeout(4000) });
  } catch {}
}
