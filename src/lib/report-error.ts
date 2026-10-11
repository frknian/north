"use client";

let sent = 0;

/** Sends a client-side error to the server log (and optional webhook). Capped per page load. */
export function reportClientError(error: unknown, extra: { digest?: string; source?: string } = {}) {
  if (typeof window === "undefined" || sent >= 5) return;
  sent += 1;
  const err = error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unknown error");
  const body = JSON.stringify({
    message: err.message,
    stack: err.stack,
    digest: extra.digest,
    source: extra.source ?? "boundary",
    path: window.location.pathname,
  });
  try {
    if (navigator.sendBeacon) navigator.sendBeacon("/api/client-error", new Blob([body], { type: "application/json" }));
    else void fetch("/api/client-error", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
  } catch {}
}
