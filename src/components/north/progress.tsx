"use client";
import { useState } from "react";
import Link from "next/link";
import { allocation, areaStreak, dayKey, shiftDay, weeklyConsistency, weekKey } from "@/lib/north";
import { useNorth, Heading } from "./shared";
import { NorthIntelligencePanel } from "./intelligence-panel";
import { ProgressResetDialog } from "@/components/features/progress-reset-dialog";
import { Button } from "@/components/ui/button";
import { Award, BookOpen, GitBranch, Sparkles } from "lucide-react";
import { CertificateModal } from "./certificate-modal";
import { FlashcardsModal } from "./flashcards";
import { toast } from "sonner";

export function NorthProgress() {
  const { state, update, workspace } = useNorth();
  const [period, setPeriod] = useState("weekly");
  const [certOpen, setCertOpen] = useState(false);
  const [cardsOpen, setCardsOpen] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [githubLoading, setGithubLoading] = useState(false);
  const today = dayKey();
  const start = period === "weekly" ? weekKey(today) : today.slice(0, 7) + "-01";
  const sessions = state.activities.filter((a) => a.date >= start && a.date <= today);
  const areas = state.areas.filter((a) => !a.archived);
  const completedTaskIds = new Set([
    ...sessions.filter((a) => a.outcome === "done").map((a) => a.taskId),
    ...state.tasks
      .filter(
        (task) =>
          task.status === "done" &&
          task.completedAt &&
          task.completedAt.slice(0, 10) >= start &&
          task.completedAt.slice(0, 10) <= today
      )
      .map((task) => task.id),
  ]);

  const handleSyncGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;
    setGithubLoading(true);
    try {
      const res = await fetch("/api/github/repository", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: githubUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "GitHub bağlantısı başarısız.");

      const areaId = areas[0]?.id || "primary-goal";
      if (workspace.addDomainProof) {
        workspace.addDomainProof({
          id: crypto.randomUUID(),
          areaId,
          title: `GitHub: ${data.title}`,
          kind: "github_link",
          description: data.description || "Doğrulanmış GitHub deposu.",
          url: data.url,
          createdAt: new Date().toISOString(),
        });
      }
      toast.success(`GitHub reposu ve son commitler doğrulandı: ${data.title}`);
      setGithubUrl("");
    } catch (err: unknown) {
      toast.error((err as Error).message || "GitHub reposu okunamadı.");
    } finally {
      setGithubLoading(false);
    }
  };

  return (
    <div className="page-content north-progress space-y-6">
      <Heading
        title="Gerçek ilerleme"
        description="Süre ve çıktılar kayıtlarından gelir. Dinlenme, başarısızlık değildir."
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setCertOpen(true)} className="rounded-xl text-xs">
            <Award className="mr-1.5 size-3.5 text-amber-500" />
            Başarı Karnesi &amp; Portföy
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCardsOpen(true)} className="rounded-xl text-xs">
            <BookOpen className="mr-1.5 size-3.5 text-purple-400" />
            Akıllı Bilgi Kartları
          </Button>
          <Button asChild size="sm" className="rounded-xl text-xs">
            <Link href="/week">Sonraki haftayı planla →</Link>
          </Button>
        </div>
      </Heading>
      <div className="flex justify-end">
        <ProgressResetDialog />
      </div>
  <div className="north-internal-tabs"><Button variant={period==="weekly"?"secondary":"ghost"} aria-pressed={period==="weekly"} onClick={()=>setPeriod("weekly")}>Bu hafta</Button><Button variant={period==="monthly"?"secondary":"ghost"} aria-pressed={period==="monthly"} onClick={()=>setPeriod("monthly")}>Bu ay</Button></div>
  <section className="north-progress-summary"><div><p className="text-sm text-muted-foreground">Gerçek odak</p><p className="mt-2 text-3xl">{sessions.reduce((n,a)=>n+a.minutes,0)} dk</p></div><div><p className="text-sm text-muted-foreground">Tamamlanan görev</p><p className="mt-2 text-3xl">{completedTaskIds.size}</p></div><div><p className="text-sm text-muted-foreground">Etkin gün</p><p className="mt-2 text-3xl">{new Set(sessions.filter(a=>a.minutes>0).map(a=>a.date)).size}</p></div></section>
  <section className="divide-y border-y">{areas.map(area=>{const mine=sessions.filter(a=>a.areaId===area.id);const minutes=mine.reduce((n,a)=>n+a.minutes,0);const protection=state.protection.find(p=>p.areaId===area.id&&p.date===today);return <article key={area.id} className="space-y-3 py-5"><div className="flex flex-wrap justify-between gap-2"><Link href={`/areas/${area.id}`} className="font-medium">{area.icon} {area.name}</Link><span className="text-sm">{minutes} dk {period==="weekly"?`/ ${allocation(state,area)} dk`:"bu ay"}</span></div><p className="text-sm text-muted-foreground">{area.metric}: {mine.filter(a=>a.metric===area.metric).reduce((n,a)=>n+a.amount,0)} · {areaStreak(state,area)} etkin gün zinciri · Bu hafta %{weeklyConsistency(state,area)} tutarlılık</p><details><summary className="cursor-pointer text-xs text-muted-foreground">Zincir ve dinlenme</summary><p className="my-3 text-xs text-muted-foreground">En az {area.minimumMinutes} dakika gerçek odak gerekir. Korunan günler zinciri artırmaz ve tutarlılık hesabına katılmaz.</p>{protection?<Button size="sm" variant="ghost" onClick={()=>update(s=>({...s,protection:s.protection.filter(p=>!(p.areaId===area.id&&p.date===today))}))}>{protection.kind==="rest"?"Dinlenme günü":"Dondurulmuş gün"} · Geri al</Button>:<div className="flex gap-2"><Button size="sm" variant="outline" onClick={()=>update(s=>({...s,protection:[...s.protection,{areaId:area.id,date:today,kind:"rest"}]}))}>Bugün dinlen</Button><Button size="sm" variant="outline" disabled={state.protection.some(p=>p.areaId===area.id&&p.kind==="freeze"&&p.date>=weekKey(today))} onClick={()=>update(s=>({...s,protection:[...s.protection,{areaId:area.id,date:today,kind:"freeze"}]}))}>Bir gün dondur</Button></div>}</details></article>})}</section>
  <NorthIntelligencePanel/>
  <section className="north-insight block"><h2 className="font-medium">Döneme kısa bakış</h2><p className="mt-2 text-sm text-muted-foreground">{sessions.length?`${sessions.length} oturum kaydettin. ${areas.filter(a=>!sessions.some(s=>s.areaId===a.id&&s.minutes>0)).map(a=>a.name).join(", ") || "Hiçbir alan"} için bu dönemde odak kaydı yok. Bu bir zorunluluk değil; önceliklerinle karşılaştır.`:"Henüz bu döneme ait oturum yok. North veri olmadan performans yorumu üretmez."}</p><Link href="/north-ai" className="mt-3 inline-block text-sm text-primary">North AI ile değerlendir →</Link></section>
  {/* GITHUB AUTO-COMMIT SYNC CARD */}
  <section className="rounded-2xl border bg-card p-5 shadow-xs space-y-3">
    <div className="flex items-center gap-2">
      <GitBranch className="size-4 text-emerald-500" />
      <h3 className="text-sm font-semibold text-foreground">GitHub &amp; Git Otomatik Kanıt Eşitleme</h3>
    </div>
    <p className="text-xs text-muted-foreground">
      Geliştirdiğin açık kaynaklı projeyi bağla; son commit&apos;ler ve repo detayları otomatik çekilip kanıt dosyana işlenir.
    </p>
    <form onSubmit={handleSyncGithub} className="flex flex-wrap gap-2 max-w-md">
      <input
        type="url"
        value={githubUrl}
        onChange={(e) => setGithubUrl(e.target.value)}
        placeholder="https://github.com/kullanici/proje"
        className="flex-1 rounded-xl border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        required
      />
      <Button type="submit" size="sm" disabled={githubLoading} className="rounded-xl text-xs">
        {githubLoading ? "Eşitleniyor…" : "Commitleri Eşitle"}
      </Button>
    </form>
  </section>

  <details className="north-disclosure"><summary className="cursor-pointer">Oturum geçmişi</summary>{[...sessions].reverse().map(a=><div key={a.id} className="mt-3 border-t pt-3 text-sm"><p>{a.date} · {state.tasks.find(t=>t.id===a.taskId)?.title||"Önceki oturum"} · {a.minutes} dk</p><p className="mt-1 text-muted-foreground">{a.reflection||"Not eklenmedi"}{a.supportSources?.length ? ` · Yardım: ${a.supportSources.map(source=>({ai:"AI",documentation:"dokümantasyon",video:"video",course:"kurs",friend:"arkadaş",forum:"forum",walkthrough:"walkthrough",none:"yardım yok",other:"diğer"})[source]).join(", ")}` : ""}</p></div>)}</details>
  <p className="text-xs text-muted-foreground">Dönem: {start} – {today}. Haftalık hesap pazartesi başlar. Sonraki hafta {shiftDay(weekKey(today),7)}.</p>

  {/* MODALS */}
  <CertificateModal open={certOpen} onOpenChange={setCertOpen} workspace={workspace} north={state} />
  <FlashcardsModal open={cardsOpen} onOpenChange={setCardsOpen} />
    </div>
  );
}
