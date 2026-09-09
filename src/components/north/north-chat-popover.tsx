"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { NorthAI } from "./ai";
import { NorthCoachSymbol } from "./north-coach-symbol";

export function NorthChatPopover({
  open: controlledOpen,
  onOpenChange,
  taskId,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  taskId?: string;
} = {}) {
  const pathname = usePathname();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  if (pathname === "/coach" || pathname === "/north-ai") {
    return null;
  }

  const setOpen = (val: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof val === "function" ? val(open) : val;
    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  return (
    <div className="fixed bottom-[calc(76px+env(safe-area-inset-bottom,8px))] right-3.5 z-40 sm:bottom-7 sm:right-7">
      {open ? (
        <section
          className="mb-3 w-[calc(100vw-1.75rem)] max-w-[420px] h-[620px] max-h-[80dvh] overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-200 flex flex-col p-3 sm:p-4"
          aria-label="Planorth Koç sohbeti"
        >
          <NorthAI embedded taskId={taskId} onClose={() => setOpen(false)} />
        </section>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative grid size-12 sm:size-14 place-items-center rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-xl shadow-blue-950/50 transition-all hover:scale-105 active:scale-95 border border-blue-400/30"
        aria-label={open ? "Planorth sohbetini kapat" : "Planorth Koç ile sohbet et"}
        aria-expanded={open}
      >
        {open ? (
          <X className="size-5 sm:size-6" />
        ) : (
          <NorthCoachSymbol size={34} variant="symbol" className="size-7.5 sm:size-8.5 drop-shadow-xs" />
        )}
      </button>
    </div>
  );
}
