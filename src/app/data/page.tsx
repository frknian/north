"use client";

import Link from "next/link";
import { Download, LockKeyhole, RefreshCcw, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/features/workspace-provider";
import { Heading } from "@/components/north/shared";
import { Button } from "@/components/ui/button";

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
    toast.success("North verilerinin bir kopyası indirildi.");
  }

  return <div className="page-content space-y-6">
    <Heading title="Verilerim ve güvenlik" description="Çalışma verilerini indir, eşitleme durumunu gör veya hesabını yönet." />
    <section className="grid gap-4 md:grid-cols-2">
      <article className="surface space-y-4 p-6"><Download className="size-5 text-primary"/><div><h2 className="font-medium">Verilerimi indir</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Hedeflerin, görevlerin, odak oturumların, kanıtların ve koç konuşmaların JSON dosyası olarak hazırlanır.</p></div><Button onClick={downloadData}><Download/>Kopyayı indir</Button></article>
      <article className="surface space-y-4 p-6"><RefreshCcw className="size-5 text-primary"/><div><h2 className="font-medium">Eşitleme durumu</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{workspace.syncMode === "firebase" ? `Firebase hesabınla bağlı${workspace.userEmail ? `: ${workspace.userEmail}` : ""}. Değişikliklerin çalışma alanına kaydediliyor.` : "Bu cihazda yerel çalışma alanı kullanılıyor."}</p></div><span className="inline-flex items-center gap-2 text-sm"><span className={`size-2 rounded-full ${workspace.syncMode === "firebase" ? "bg-emerald-400" : "bg-amber-400"}`}/>{workspace.syncMode === "firebase" ? "Bulut eşitlemesi açık" : "Yerel kayıt"}</span></article>
      <article className="surface space-y-4 p-6"><ShieldCheck className="size-5 text-primary"/><div><h2 className="font-medium">Gizlilik</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">North yalnızca uygulamaya eklediğin hedef, görev, check-in ve çalışma kayıtlarını kullanır. Cihaz etkinliğini, kamerayı veya mikrofonu izlemez.</p></div><Button asChild variant="outline"><Link href="/kvkk"><LockKeyhole/>Aydınlatma metnini aç</Link></Button></article>
      <article className="surface space-y-4 border-destructive/30 p-6"><Trash2 className="size-5 text-destructive"/><div><h2 className="font-medium">Hesabı ve verileri sil</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Silmeden önce Google veya şifre ile yeniden doğrulama istenir. Bu işlem geri alınamaz.</p></div><Button asChild variant="destructive"><Link href="/account-reset"><Trash2/>Silme ekranına git</Link></Button></article>
    </section>
    <section className="north-insight block"><h2 className="font-medium">Kontrol sende</h2><p className="mt-2 text-sm text-muted-foreground">North öneri üretir; plan değişikliklerini sen onaylamadan uygulamaz. Davranışsal çıkarımları İlerleme ekranından reddedebilir veya yeniden başlatabilirsin.</p><div className="mt-4 flex flex-wrap gap-3"><Button asChild variant="outline"><Link href="/progress">Davranış analizini yönet</Link></Button><Button asChild variant="outline"><Link href="/profile">Profil ayarlarına dön</Link></Button></div></section>
  </div>;
}
