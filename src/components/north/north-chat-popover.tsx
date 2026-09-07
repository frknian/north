"use client";

import { useState } from "react";
import { Bot, MessageCircle, X } from "lucide-react";
import { NorthAI } from "./ai";

export function NorthChatPopover() {
  const [open, setOpen] = useState(false);
  return <div className="fixed bottom-5 right-5 z-50 sm:bottom-7 sm:right-7">
    {open ? <section className="mb-3 w-[calc(100vw-2.5rem)] max-w-lg overflow-hidden rounded-2xl border bg-background shadow-2xl" aria-label="North sohbeti">
      <header className="flex items-center justify-between border-b px-4 py-3"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Bot className="size-4"/></span><div><p className="text-sm font-semibold">North</p><p className="text-xs text-muted-foreground">Kişisel koçun</p></div></div><button type="button" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setOpen(false)} aria-label="Sohbeti kapat"><X className="size-4"/></button></header>
      <div className="max-h-[min(72dvh,720px)] overflow-y-auto p-3"><NorthAI embedded/></div>
    </section> : null}
    <button type="button" onClick={() => setOpen((value) => !value)} className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105" aria-label={open ? "North sohbetini kapat" : "North ile sohbet et"} aria-expanded={open}><MessageCircle className="size-6"/></button>
  </div>;
}
