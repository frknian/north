"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

function subscribe(callback: () => void) {
  window.addEventListener("north-theme-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("north-theme-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot() {
  if (typeof document === "undefined") return true;
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return true;
}

export function ThemeToggle({ className }: { className?: string }) {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = !isDark;
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("north_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("north_theme", "light");
    }
    window.dispatchEvent(new CustomEvent("north-theme-change"));
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      onClick={toggle}
      className={`size-8 rounded-lg text-muted-foreground hover:text-foreground transition-colors ${className ?? ""}`}
      title={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
      aria-label={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
    >
      {isDark ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-slate-700" />}
    </Button>
  );
}
