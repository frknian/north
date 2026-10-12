"use client";

import {
  BookOpen,
  Sparkles,
  Pin,
  BookMarked,
  Compass,
} from "lucide-react";
import {
  cn,
} from "@/lib/utils";
import type { ResourcesHubCtx } from "./use-resources-hub";

export function TopHeaderQuick({ ctx }: { ctx: ResourcesHubCtx }) {
  const {
    activeTab,
    setActiveTab,
    books,
    pageRanges,
    pinnedDocs,
  } = ctx;
  return (
    <>
      {/* 1. TOP HEADER & QUICK ACTION BAR */}
      <header className="flex flex-col gap-1 border-b border-border/60 pb-5">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-indigo-500/10 text-indigo-500">
            <BookOpen className="size-4" />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Kaynaklar &amp; Sanal Araştırma Merkezi
          </h1>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Kitaplar, canlı web araştırması, Google onaylı PDF kitap arama, sayfa aralıkları, pinli belgeler ve Google NotebookLM entegrasyonu.
        </p>
      </header>
    
      {/* 2. NAVIGATION TABS (4 RICH TABS) */}
      <div className="flex rounded-2xl border border-border/70 bg-muted/30 p-1 text-xs gap-1 overflow-x-auto focus-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("books")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-all shrink-0",
            activeTab === "books"
              ? "bg-background text-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BookMarked className="size-3.5 text-indigo-500" />
          <span>Kitaplık &amp; Okuma</span>
          <span className="rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.2 text-[10px] font-mono">
            {books.length}
          </span>
        </button>
    
        <button
          type="button"
          onClick={() => setActiveTab("web")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-all shrink-0",
            activeTab === "web"
              ? "bg-background text-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Compass className="size-3.5 text-emerald-500" />
          <span>Web &amp; Google PDF Arama</span>
        </button>
    
        <button
          type="button"
          onClick={() => setActiveTab("ranges_pins")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-all shrink-0",
            activeTab === "ranges_pins"
              ? "bg-background text-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Pin className="size-3.5 text-amber-500" />
          <span>Pinli Belgeler &amp; Sayfa Aralıkları</span>
          <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 text-[10px] font-mono">
            {pageRanges.length + pinnedDocs.length}
          </span>
        </button>
    
        <button
          type="button"
          onClick={() => setActiveTab("notebooklm")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-all shrink-0",
            activeTab === "notebooklm"
              ? "bg-background text-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="size-3.5 text-sky-500" />
          <span>NotebookLM &amp; AI Özetleyici</span>
        </button>
      </div>
    
    </>
  );
}
