"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/report-error";

export function ClientErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => reportClientError(event.error ?? event.message, { source: "window.onerror" });
    const onRejection = (event: PromiseRejectionEvent) => reportClientError(event.reason, { source: "unhandledrejection" });
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => { window.removeEventListener("error", onError); window.removeEventListener("unhandledrejection", onRejection); };
  }, []);
  return null;
}
