"use client";

import {
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import {
  toast,
} from "sonner";
import {
  Button,
} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ResourcesHubCtx } from "./use-resources-hub";

export function ModalKaynakOzeti({ ctx }: { ctx: ResourcesHubCtx }) {
  const {
    summaryModalOpen,
    setSummaryModalOpen,
    summaryLoading,
    summaryOutput,
  } = ctx;
  return (
    <>
      {/* ===================================================================== */}
      {/* MODAL 4: AI KAYNAK ÖZETİ LIGHTBOX / DETAY                             */}
      {/* ===================================================================== */}
      <Dialog open={summaryModalOpen} onOpenChange={setSummaryModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90dvh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-indigo-500/10 text-indigo-500">
                <Sparkles className="size-4" />
              </span>
              <DialogTitle className="text-base font-bold">
                {summaryOutput?.title || "AI Kaynak Özeti"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Planorth Koç tarafından çıkarılmış yönetici özeti ve NotebookLM soruları.
            </DialogDescription>
          </DialogHeader>
    
          {summaryLoading ? (
            <div className="py-12 text-center space-y-2">
              <Sparkles className="size-8 text-indigo-500 animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground">Kaynak analiz ediliyor ve çıkarımlar derleniyor...</p>
            </div>
          ) : summaryOutput ? (
            <div className="space-y-4 pt-2">
              {/* Core summary */}
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Temel Fikir &amp; Bağlam
                </span>
                <p className="text-xs leading-relaxed text-foreground">{summaryOutput.summary}</p>
              </div>
    
              {/* Key Takeaways */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-foreground">Kritik Çıkarımlar</h4>
                <div className="space-y-1.5">
                  {summaryOutput.keyTakeaways.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 rounded-xl border bg-background p-2.5 text-xs text-muted-foreground">
                      <span className="grid size-4 place-items-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
    
              {/* Action steps */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-foreground">Eyleme Dönük Adımlar</h4>
                <div className="space-y-1.5">
                  {summaryOutput.actionSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 rounded-xl border bg-muted/20 p-2.5 text-xs text-foreground">
                      <Check className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
    
              {/* NotebookLM Question */}
              <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  NotebookLM İçin Önerilen Araştırma Sorusu
                </span>
                <p className="text-xs italic text-foreground">&ldquo;{summaryOutput.notebookLmPrompt}&rdquo;</p>
              </div>
    
              <div className="pt-2 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const text = `# ${summaryOutput.title}\n\n## Özet\n${summaryOutput.summary}\n\n## Çıkarımlar\n${summaryOutput.keyTakeaways.map((k) => `- ${k}`).join("\n")}\n\n## Eylemler\n${summaryOutput.actionSteps.map((a) => `- ${a}`).join("\n")}`;
                    void navigator.clipboard.writeText(text);
                    toast.success("Özet panoya kopyalandı!");
                  }}
                  className="rounded-xl text-xs"
                >
                  <Copy className="mr-1 size-3" />
                  Özeti Kopyala
                </Button>
                <Button size="sm" onClick={() => setSummaryModalOpen(false)} className="rounded-xl text-xs">
                  Tamam
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    
    </>
  );
}
