"use client";

import {
  ExternalLink,
  Sparkles,
  Copy,
  Download,
  Check,
} from "lucide-react";
import {
  toast,
} from "sonner";
import {
  Button,
} from "@/components/ui/button";
import {
  setNotebookLMSavedUrl,
} from "@/lib/resources-hub";
import type { ResourcesHubCtx } from "./use-resources-hub";

export function TabNotebooklmOzetleyici({ ctx }: { ctx: ResourcesHubCtx }) {
  const {
    activeTab,
    books,
    pageRanges,
    pinnedDocs,
    notebookLmUrl,
    setNotebookLmUrlState,
    summaryInputTitle,
    setSummaryInputTitle,
    summaryInputContent,
    setSummaryInputContent,
    summaryLoading,
    copiedBundle,
    handleGenerateSummary,
    handleCopyNotebookBundle,
    handleDownloadNotebookBundle,
  } = ctx;
  return (
    <>
      {/* ===================================================================== */}
      {/* TAB 4: NOTEBOOKLM & AI ÖZETLEYİCİ                                    */}
      {/* ===================================================================== */}
      {activeTab === "notebooklm" && (
        <div className="space-y-6">
          {/* NotebookLM Workspace Integration Card */}
          <div className="rounded-3xl border bg-card/60 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-xl bg-sky-500/10 text-sky-500">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-foreground">Google NotebookLM Bağlantısı</h2>
                  <p className="text-xs text-muted-foreground">
                    Tüm kitapların, alıntıların ve sayfa aralıkların için NotebookLM kaynak paketi üret.
                  </p>
                </div>
              </div>
    
              <a
                href={notebookLmUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 text-white px-3.5 py-1.5 text-xs font-semibold hover:bg-sky-500 transition-colors"
              >
                <span>NotebookLM&apos;i Aç</span>
                <ExternalLink className="size-3.5" />
              </a>
            </div>
    
            {/* Custom Workspace URL Input */}
            <div className="rounded-2xl border bg-background/80 p-4 space-y-2">
              <label className="block text-xs font-semibold text-foreground">
                Özel NotebookLM Not Defteri URL&apos;si
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={notebookLmUrl}
                  onChange={(e) => {
                    setNotebookLmUrlState(e.target.value);
                    setNotebookLMSavedUrl(e.target.value);
                  }}
                  placeholder="https://notebooklm.google.com/notebook/your-id"
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-sky-500 focus:outline-hidden"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => toast.success("NotebookLM URL'si kaydedildi.")}
                  className="rounded-xl text-xs"
                >
                  Kaydet
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Google NotebookLM&apos;de oluşturduğun not defterinin linkini buraya yapıştırarak tek tıkla doğrudan içine girebilirsin.
              </p>
            </div>
    
            {/* Bundle Actions */}
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-foreground">Hazır NotebookLM Çalışma Paketi</h3>
                  <p className="text-[11px] text-muted-foreground">
                    {books.length} kitap, {pageRanges.length} sayfa aralığı ve {pinnedDocs.length} pinli kaynak tek belgede birleştirildi.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyNotebookBundle}
                    className="rounded-xl text-xs h-8"
                  >
                    {copiedBundle ? <Check className="mr-1 size-3.5 text-emerald-500" /> : <Copy className="mr-1 size-3.5" />}
                    Panoya Kopyala
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDownloadNotebookBundle}
                    className="rounded-xl text-xs h-8 shadow-xs"
                  >
                    <Download className="mr-1 size-3.5" />
                    Markdown (.md) İndir
                  </Button>
                </div>
              </div>
    
              {/* Guided steps */}
              <div className="grid gap-2 sm:grid-cols-3 pt-2 text-xs">
                <div className="rounded-xl border bg-background/60 p-2.5 space-y-1">
                  <span className="font-bold text-sky-600 dark:text-sky-400 font-mono">1. Adım</span>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Yukarıdaki butona tıklayarak paketi kopyala veya .md dosyasını indir.
                  </p>
                </div>
                <div className="rounded-xl border bg-background/60 p-2.5 space-y-1">
                  <span className="font-bold text-sky-600 dark:text-sky-400 font-mono">2. Adım</span>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    NotebookLM&apos;e git ve &ldquo;Add Source (Kaynak Ekle)&rdquo; &gt; &ldquo;Copied Text / File&rdquo; seçeneğini seç.
                  </p>
                </div>
                <div className="rounded-xl border bg-background/60 p-2.5 space-y-1">
                  <span className="font-bold text-sky-600 dark:text-sky-400 font-mono">3. Adım</span>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    NotebookLM&apos;in Audio Overview (Sesli Podcast) ve soru-cevap gücünü kullan!
                  </p>
                </div>
              </div>
            </div>
          </div>
    
          {/* Instant AI Resource Summarizer Card */}
          <div className="rounded-3xl border bg-card/60 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="space-y-1 border-b border-border/40 pb-3">
              <h2 className="text-base font-bold text-foreground">Anlık AI Kaynak Özetleyici</h2>
              <p className="text-xs text-muted-foreground">
                Herhangi bir kaynak veya kitap içeriğini yapıştır; ana fikirleri, pratik adımları ve NotebookLM sorularını anında çıkar.
              </p>
            </div>
    
            <div className="space-y-3">
              <input
                type="text"
                value={summaryInputTitle}
                onChange={(e) => setSummaryInputTitle(e.target.value)}
                placeholder="Kaynak Başlığı (Örn: Active Directory Kerberoasting Savunma Rehberi)"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden"
              />
    
              <textarea
                value={summaryInputContent}
                onChange={(e) => setSummaryInputContent(e.target.value)}
                placeholder="Özetlemek istediğin metin, notlar veya kaynak linkini buraya yapıştır..."
                className="w-full h-32 rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden resize-none"
              />
    
              <Button
                onClick={() => handleGenerateSummary()}
                disabled={summaryLoading}
                className="rounded-xl text-xs px-4"
              >
                <Sparkles className="mr-1.5 size-3.5" />
                {summaryLoading ? "Özet Çıkarılıyor..." : "AI ile Yönetici Özeti Çıkar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    
    </>
  );
}
