"use client";

import { useSyncExternalStore } from "react";
import { Toaster } from "sonner";

function subscribe(callback: () => void) {
  window.addEventListener("north-theme-change", callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener("north-theme-change", callback); window.removeEventListener("storage", callback); };
}
const isDark = () => document.documentElement.classList.contains("dark");

export function ThemedToaster() {
  const dark = useSyncExternalStore(subscribe, isDark, () => true);
  return <Toaster theme={dark ? "dark" : "light"} richColors position="top-center" />;
}
