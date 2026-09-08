"use client";

import { useState } from "react";
import { Bot, MessageCircle, X } from "lucide-react";
import { NorthAI } from "./ai";

export function NorthChatPopover({
  open: controlledOpen,
  onOpenChange,
  taskId,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  taskId?: string;
} = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (val: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof val === "function" ? val(open) : val;
    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  return (
    <div className="fixed bottom-20 right-4 z-40 sm:bottom-7 sm:right-7">
      {open ? (
        <section
          className="mb-3 w-[calc(100vw-2rem)] max-w-[28rem] h-[620px] max-h-[82dvh] overflow-hidden rounded-[26px] border border-zinc-800 bg-[#0B101D] shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-200 flex flex-col"
          aria-label="North sohbeti"
        >
          <NorthAI embedded taskId={taskId} onClose={() => setOpen(false)} />
        </section>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="grid size-12 sm:size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label={open ? "North sohbetini kapat" : "North ile sohbet et"}
        aria-expanded={open}
      >
        <MessageCircle className="size-5 sm:size-6" />
      </button>
    </div>
  );
}
