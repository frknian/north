"use client";

import { useRef } from "react";
import Link from "next/link";
import { Download, Upload, LockKeyhole, RefreshCcw, ShieldCheck, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/features/workspace-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function DataControlsPage() {
  const workspace = useWorkspace();
  const restoreRef = useRef<HTMLInputElement>(null);
  const sizeKb = Math.round(new TextEncoder().encode(JSON.stringify({ north: workspace.north, tasks: workspace.tasks, notes: workspace.notes, coachMessages: workspace.coachMessages, coaching: workspace.coaching, labs: workspace.labs, learningRoadmap: workspace.learningRoadmap, focusSessions: workspace.focusSessions, profile: workspace.profile })).length / 1024);
  const sizePercent = Math.min(100, Math.round((sizeKb / 1000) * 100));

  async function restoreData(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw new Error("Dosya çok büyük.");
      const parsed: unknown = JSON.parse(await file.text());
      if (!window.confirm("Yedekteki veriler mevcut çalışma alanının üzerine yazılsın mı? Bu işlem geri alınamaz; önce güncel yedeğini indirmeni öneririz.")) return;
      if (!workspace.restoreSnapshot(parsed)) throw new Error("invalid");
      toast.success("Yedek geri yüklendi.");
    } catch {
      toast.error("Geçerli bir Planorth veri yedeği (JSON) seç.");
    } finally {
      if (restoreRef.current) restoreRef.current.value = "";
    }
  }

  function downloadData() {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      profile: workspace.profile,
      north: workspace.north,
      weeklyPlan: workspace.weeklyPlan,
      tasks: workspace.tasks,
      focusSessions: workspace.focusSessions,
      labs: workspace.labs,
      skills: workspace.skills,
      reviews: workspace.reviews,
      notes: workspace.notes,
      reports: workspace.reports,
      vocabulary: workspace.vocabulary,
      coachMessages: workspace.coachMessages,
      coaching: workspace.coaching,
      portfolio: workspace.portfolio,
      jobs: workspace.jobs,
      applications: workspace.applications,
      interviews: workspace.interviews,
      learningRoadmap: workspace.learningRoadmap,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `planorth-verilerim-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Verilerinin tam kopyası JSON olarak indirildi.");
  }

  return (
    <div className="page-content space-y-6 pb-32 md:pb-20">
      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Verilerim &amp; Güvenlik Merkezi
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Çalışma verilerini indir, Firebase bulut eşitleme durumunu denetle ve gizliliğini yönet.
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="rounded-xl text-xs">
          <Link href="/profile">Profil Ayarlarına Dön</Link>
        </Button>
      </header>

      {/* 2x2 CONTROL CARDS */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card/60 p-5 shadow-xs flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <Download className="size-4" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Tüm Verilerimi İndir</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Hedeflerin, haftalık planların, odak oturumların, kanıtların ve AI sohbet geçmişin tek bir yapılandırılmış JSON dosyası olarak cihazına aktarılır.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={downloadData} size="sm" className="rounded-xl text-xs shadow-xs">
              <Download className="size-3.5 mr-1.5" /> JSON Kopyayı İndir
            </Button>
            <Button onClick={() => restoreRef.current?.click()} size="sm" variant="outline" className="rounded-xl text-xs">
              <Upload className="size-3.5 mr-1.5" /> Yedekten Geri Yükle
            </Button>
            <input ref={restoreRef} type="file" accept=".json,application/json" className="hidden" onChange={(event) => void restoreData(event.target.files?.[0])} />
          </div>
          <div className="space-y-1.5" aria-label="Çalışma alanı boyutu">
            <div className="flex justify-between text-[11px] text-muted-foreground"><span>Bulut alanı kullanımı</span><span>{sizeKb} KB / 1000 KB</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", sizePercent > 80 ? "bg-amber-500" : "bg-primary")} style={{ width: `${sizePercent}%` }} /></div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card/60 p-5 shadow-xs flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <RefreshCcw className="size-4" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Bulut Eşitleme Durumu</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {workspace.syncMode === "firebase"
                ? `Firebase hesabınla bağlı${workspace.userEmail ? `: ${workspace.userEmail}` : ""}. Tüm seanslar ve veriler anlık buluta kaydediliyor.`
                : "Bu cihazda çevrimdışı yerel depolama (Local Workspace) kullanılıyor."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border",
                workspace.syncMode === "firebase"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              )}
            >
              <span className={cn("size-1.5 rounded-full", workspace.syncMode === "firebase" ? "bg-emerald-500" : "bg-amber-500")} />
              {workspace.syncMode === "firebase" ? "Bulut Eşitlemesi Aktif" : "Yerel Mod"}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border bg-card/60 p-5 shadow-xs flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="grid size-9 place-items-center rounded-xl bg-sky-500/10 text-sky-500">
              <ShieldCheck className="size-4" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Gizlilik &amp; Şeffaflık</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Planorth yalnızca uygulamaya eklediğin görev, hedef, check-in ve odak verilerini kullanır. Kamera, mikrofon, ekran veya cihaz etkinliğini izlemez.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-xl text-xs self-start">
            <Link href="/kvkk">
              <LockKeyhole className="size-3.5 mr-1.5" /> KVKK Aydınlatma Metni
            </Link>
          </Button>
        </div>

        <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.02] p-5 shadow-xs flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="grid size-9 place-items-center rounded-xl bg-destructive/10 text-destructive">
              <Trash2 className="size-4" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Hesabı &amp; Çalışma Alanını Sıfırla</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tüm hedefleri, görevleri, puanları ve konuşma geçmişini kalıcı olarak siler. Bu işlem geri alınamaz.
            </p>
          </div>
          <Button asChild variant="destructive" size="sm" className="rounded-xl text-xs self-start">
            <Link href="/account-reset">
              <Trash2 className="size-3.5 mr-1.5" /> Sıfırlama Ekranına Git
            </Link>
          </Button>
        </div>
      </div>

      {/* FOOTER CALLOUT */}
      <div className="rounded-2xl border border-border/80 bg-card/40 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-semibold text-foreground">Kontrol Her Zaman Sende</h3>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
            Planorth sana sadece öneriler üretir; plan değişikliklerini sen onaylamadan takvime veya hedeflerine uygulamaz.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-xl text-xs">
          <Link href="/progress">
            İlerleme Analizini Aç <ArrowRight className="size-3.5 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
