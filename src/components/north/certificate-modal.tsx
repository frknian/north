"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award, Copy, Check, Printer, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { WorkspaceState } from "@/lib/types";
import type { NorthState } from "@/lib/north";

export function CertificateModal({
  open,
  onOpenChange,
  workspace,
  north,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: WorkspaceState;
  north: NorthState;
}) {
  const [copied, setCopied] = useState(false);

  const name = workspace.profile.fullName || "Gelişimci";
  const goal = workspace.profile.goal || workspace.profile.primaryFocus || "Kişisel Gelişim";
  const totalMinutes = north.activities.filter((a) => a.outcome === "done").reduce((s, a) => s + a.minutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const completedTasks = north.tasks.filter((t) => t.status === "done").length;
  const milestones = workspace.coaching.milestones.length;
  const verifiedProofs = (workspace.domainProofs?.length ?? 0) + (workspace.labs?.filter((l) => l.status === "completed").length ?? 0);
  const issueDate = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

  const markdownSummary = `# 📜 Planorth Gelişim Raporu & Portföy Özeti
**Kullanıcı:** ${name}
**Hedef:** ${goal}
**Tarih:** ${issueDate}

## 🎯 Başarı Metrikleri
- **Toplam Derin Odak Süresi:** ${totalHours} saat (${totalMinutes} dakika)
- **Tamamlanan Görevler:** ${completedTasks} görev
- **Doğrulanmış Kanıtlar & Çıktılar:** ${verifiedProofs} adet
- **Hedef Aşamaları:** ${milestones} aşama

## 🛠️ Odaklanılan Alanlar
${north.areas.map((a) => `- **${a.name}:** ${a.goal || a.description || "Aktif Alan"}`).join("\n")}

---
*Bu rapor Planorth Bilişsel İşletim Sistemi tarafından doğrulanmış gerçek çalışma verileriyle üretilmiştir.*
`;

  const handleCopyMarkdown = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(markdownSummary);
      setCopied(true);
      toast.success("Portföy özeti (Markdown) panoya kopyalandı!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 bg-card text-card-foreground border border-border shadow-2xl">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-500/15 text-amber-500 mb-1">
            <Award className="size-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">Başarı Karnesi &amp; Kanıt Raporu</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Tamamladığın odak seansları, kanıtlar ve hedeflerine ait doğrulanmış resmi rapor.
          </DialogDescription>
        </DialogHeader>

        {/* PRINTABLE CERTIFICATE CARD */}
        <div
          id="north-certificate-print"
          className="my-4 rounded-2xl border-2 border-amber-500/30 bg-linear-to-b from-amber-500/5 via-background to-background p-6 sm:p-8 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 left-0 h-1 bg-linear-to-r from-amber-500 via-sky-500 to-emerald-500" />
          <p className="text-[10px] uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400">
            NORTH GELİŞİM SERTİFİKASI
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-foreground">{name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Aşağıdaki hedef doğrultusunda tutarlı çaba ve somut kanıtlarla ilerlemiştir:
          </p>
          <p className="mt-2 inline-block rounded-lg bg-muted/60 border px-3 py-1 text-sm font-semibold text-foreground">
            &ldquo;{goal}&rdquo;
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 text-left">
            <div className="rounded-xl border bg-background/60 p-3">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Derin Odak</span>
              <p className="text-lg font-bold text-foreground font-mono">{totalHours} Saat</p>
            </div>
            <div className="rounded-xl border bg-background/60 p-3">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Görev Çıktısı</span>
              <p className="text-lg font-bold text-foreground font-mono">{completedTasks}</p>
            </div>
            <div className="rounded-xl border bg-background/60 p-3">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Kanıt &amp; Rapor</span>
              <p className="text-lg font-bold text-foreground font-mono">{verifiedProofs}</p>
            </div>
            <div className="rounded-xl border bg-background/60 p-3">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Aşama</span>
              <p className="text-lg font-bold text-foreground font-mono">{milestones} Faz</p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4 text-[11px] text-muted-foreground">
            <span>Düzenlenme Tarihi: {issueDate}</span>
            <span className="font-semibold text-primary">Planorth Kanıt Motoru ✓</span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
          <Button variant="outline" size="sm" onClick={handleCopyMarkdown} className="rounded-xl text-xs">
            {copied ? <Check className="mr-1.5 size-3.5 text-emerald-500" /> : <Copy className="mr-1.5 size-3.5" />}
            {copied ? "Kopyalandı!" : "Markdown Portföy Kopyala"}
          </Button>
          <Button size="sm" onClick={handlePrint} className="rounded-xl text-xs">
            <Printer className="mr-1.5 size-3.5" />
            Yazdır / PDF Kaydet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
