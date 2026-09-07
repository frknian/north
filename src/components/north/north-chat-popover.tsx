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
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-7 sm:right-7">
      {open ? (
        <section
          className="mb-3 w-[calc(100vw-2.5rem)] max-w-[29rem] overflow-hidden rounded-[26px] border bg-background shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-200"
          aria-label="North sohbeti"
        >
          <header className="flex items-center justify-between border-b px-4 py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                <Bot className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">North</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Bulut AI · kişisel koçun
                </p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              onClick={() => setOpen(false)}
              aria-label="Sohbeti kapat"
            >
              <X className="size-5" />
            </button>
          </header>
          <div className="max-h-[min(72dvh,720px)] overflow-y-auto px-3 py-2">
            <NorthAI embedded taskId={taskId} />
          </div>
        </section>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
        aria-label={open ? "North sohbetini kapat" : "North ile sohbet et"}
        aria-expanded={open}
      >
        <MessageCircle className="size-6" />
      </button>
    </div>
  );
}
