"use client";

import Link from "next/link";
import { Download, LockKeyhole, RefreshCcw, ShieldCheck, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/features/workspace-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function DataControlsPage() {
  const workspace = useWorkspace();

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
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `north-verilerim-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("North verilerinin tam kopyası JSON olarak indirildi.");
  }

  return (
    <div className="page-content space-y-6 pb-20">
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
          <Button onClick={downloadData} size="sm" className="rounded-xl text-xs self-start shadow-xs">
            <Download className="size-3.5 mr-1.5" /> JSON Kopyayı İndir
          </Button>
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
              North yalnızca uygulamaya eklediğin görev, hedef, check-in ve odak verilerini kullanır. Kamera, mikrofon, ekran veya cihaz etkinliğini izlemez.
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
            North sana sadece öneriler üretir; plan değişikliklerini sen onaylamadan takvime veya hedeflerine uygulamaz.
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
