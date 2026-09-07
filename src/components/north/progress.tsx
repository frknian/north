"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  GitBranch,
  Moon,
  RotateCcw,
  ShieldAlert,
  Snowflake,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  allocation,
  areaStreak,
  dayKey,
  shiftDay,
  weeklyConsistency,
  weekKey,
} from "@/lib/north";
import { useNorth } from "./shared";
import { NorthIntelligencePanel } from "./intelligence-panel";
import { ProgressResetDialog } from "@/components/features/progress-reset-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CertificateModal } from "./certificate-modal";
import { FlashcardsModal } from "./flashcards";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function NorthProgress() {
  const { state, update, workspace } = useNorth();
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [certOpen, setCertOpen] = useState(false);
  const [cardsOpen, setCardsOpen] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [githubLoading, setGithubLoading] = useState(false);

  const today = dayKey();
  const start = period === "weekly" ? weekKey(today) : today.slice(0, 7) + "-01";
  const sessions = state.activities.filter((a) => a.date >= start && a.date <= today);
  const areas = state.areas.filter((a) => !a.archived);

  const totalFocusMinutes = sessions.reduce((n, a) => n + a.minutes, 0);
  const activeDaysCount = new Set(sessions.filter((a) => a.minutes > 0).map((a) => a.date)).size;

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
    <div className="page-content space-y-6 pb-20">
      {/* HEADER & ACTION BUTTONS */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Gerçek İlerleme</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Süreler ve çıktılar gerçek kayıtlarından gelir. Dinlenme başarısızlık değildir; sürdürülebilirliktir.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCertOpen(true)} className="rounded-xl text-xs">
            <Award className="mr-1.5 size-3.5 text-amber-500" />
            Başarı Karnesi &amp; Portföy
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCardsOpen(true)} className="rounded-xl text-xs">
            <BookOpen className="mr-1.5 size-3.5 text-purple-400" />
            Akıllı Bilgi Kartları
          </Button>
          <ProgressResetDialog />
        </div>
      </header>

      {/* PERIOD SWITCHER */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-xl border border-border/70 bg-muted/40 p-1 text-xs">
          <button
            type="button"
            onClick={() => setPeriod("weekly")}
            className={cn(
              "rounded-lg px-3 py-1 font-medium transition-all",
              period === "weekly"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Bu Hafta
          </button>
          <button
            type="button"
            onClick={() => setPeriod("monthly")}
            className={cn(
              "rounded-lg px-3 py-1 font-medium transition-all",
              period === "monthly"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Bu Ay
          </button>
        </div>

        <span className="text-[11px] text-muted-foreground font-mono">
          Dönem: {start} – {today}
        </span>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card/60 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-muted-foreground">Gerçek Odak Süresi</span>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground font-mono">
              {Math.floor(totalFocusMinutes / 60)} <span className="text-sm font-normal text-muted-foreground">sa</span> {totalFocusMinutes % 60} <span className="text-sm font-normal text-muted-foreground">dk</span>
            </p>
          </div>
          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Clock className="size-5" />
          </div>
        </div>

        <div className="rounded-2xl border bg-card/60 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-muted-foreground">Tamamlanan Görevler</span>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground font-mono">
              {completedTaskIds.size} <span className="text-sm font-normal text-muted-foreground">görev</span>
            </p>
          </div>
          <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="size-5" />
          </div>
        </div>

        <div className="rounded-2xl border bg-card/60 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-muted-foreground">Etkin Gün / Odak Zinciri</span>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground font-mono">
              {activeDaysCount} <span className="text-sm font-normal text-muted-foreground">gün aktif</span>
            </p>
          </div>
          <div className="grid size-10 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
            <Flame className="size-5" />
          </div>
        </div>
      </div>

      {/* HIGHLIGHTED FEATURE BANNER (CERTIFICATE & FLASHCARDS PROMO) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent p-5 shadow-xs flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Award className="size-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-foreground">Dönem Başarı Karnesi &amp; Portföy İhracı</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Tamamladığın lablar, odak kayıtları ve kanıtlarla hazırlanmış resmi PDF/baskı sertifikanı al veya LinkedIn/GitHub portföy özetini tek tıkla kopyala.
            </p>
          </div>
          <Button size="sm" onClick={() => setCertOpen(true)} className="rounded-xl text-xs self-start">
            Karneni Görüntüle
          </Button>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-transparent p-5 shadow-xs flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-foreground">Aralıklı Tekrar &amp; Akıllı Yanlış Defteri</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Zorlandığın konular ve formüller 1, 3, 7 ve 21 gün kuralına göre destelenir. Hafızada kalıcı hale gelene kadar aralıklarla tekrar et.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setCardsOpen(true)} className="rounded-xl text-xs self-start">
            Kart Destesini Aç
          </Button>
        </div>
      </div>

      {/* AREA PROGRESS CARDS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Alan Bazında İlerleme &amp; Koruma</h2>
          <span className="text-xs text-muted-foreground">{areas.length} Aktif Alan</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {areas.map((area) => {
            const mine = sessions.filter((a) => a.areaId === area.id);
            const minutes = mine.reduce((n, a) => n + a.minutes, 0);
            const targetMinutes = period === "weekly" ? allocation(state, area) : allocation(state, area) * 4;
            const percent = targetMinutes > 0 ? Math.min(100, Math.round((minutes / targetMinutes) * 100)) : 0;
            const protection = state.protection.find((p) => p.areaId === area.id && p.date === today);
            const streak = areaStreak(state, area);
            const consistency = weeklyConsistency(state, area);

            return (
              <div key={area.id} className="rounded-2xl border bg-card/60 p-4 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/areas/${area.id}`} className="font-semibold text-sm text-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5">
                      <span>{area.icon || "◎"}</span>
                      <span>{area.name}</span>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {area.metric}: {mine.filter((a) => a.metric === area.metric).reduce((n, a) => n + a.amount, 0)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">
                    {minutes} / {targetMinutes} dk
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>%{percent} tamamlandı</span>
                    <span>{streak} gün zincir · %{consistency} tutarlılık</span>
                  </div>
                </div>

                {/* Protection / Rest controls */}
                <div className="flex items-center justify-between border-t border-border/40 pt-2 text-xs">
                  <span className="text-[11px] text-muted-foreground">Bugün durumu:</span>
                  {protection ? (
                    <Button
                      size="xs"
                      variant="ghost"
                      className="rounded-lg text-[11px] text-amber-500"
                      onClick={() =>
                        update((s) => ({
                          ...s,
                          protection: s.protection.filter((p) => !(p.areaId === area.id && p.date === today)),
                        }))
                      }
                    >
                      {protection.kind === "rest" ? "Dinlenme Günü" : "Dondurulmuş"} (Geri Al)
                    </Button>
                  ) : (
                    <div className="flex gap-1.5">
                      <Button
                        size="xs"
                        variant="outline"
                        className="rounded-lg text-[10px] h-6 px-2"
                        onClick={() =>
                          update((s) => ({
                            ...s,
                            protection: [...s.protection, { areaId: area.id, date: today, kind: "rest" }],
                          }))
                        }
                      >
                        <Moon className="size-2.5 mr-1 text-indigo-400" /> Bugün Dinlen
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        className="rounded-lg text-[10px] h-6 px-2"
                        disabled={state.protection.some(
                          (p) => p.areaId === area.id && p.kind === "freeze" && p.date >= weekKey(today)
                        )}
                        onClick={() =>
                          update((s) => ({
                            ...s,
                            protection: [...s.protection, { areaId: area.id, date: today, kind: "freeze" }],
                          }))
                        }
                      >
                        <Snowflake className="size-2.5 mr-1 text-sky-400" /> Dondur
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* NORTH INTELLIGENCE PANEL */}
      <NorthIntelligencePanel />

      {/* GITHUB AUTO-COMMIT SYNC CARD */}
      <section className="rounded-2xl border bg-card/60 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <GitBranch className="size-4 text-emerald-500" />
          <h2 className="text-sm font-semibold text-foreground">GitHub &amp; Git Otomatik Kanıt Eşitleme</h2>
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

      {/* SESSIONS HISTORY DETAILS */}
      <details className="rounded-2xl border bg-card/40 p-4 shadow-xs group">
        <summary className="cursor-pointer text-xs font-semibold text-foreground flex items-center justify-between">
          <span>Oturum Geçmişi ({sessions.length} seans)</span>
          <span className="text-muted-foreground text-[10px] group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="mt-3 divide-y divide-border/40 text-xs">
          {[...sessions].reverse().map((a) => (
            <div key={a.id} className="py-2.5 flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">
                  {state.tasks.find((t) => t.id === a.taskId)?.title || "Odak Oturumu"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {a.reflection || "Not eklenmedi"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono text-xs font-semibold">{a.minutes} dk</span>
                <span className="block text-[10px] text-muted-foreground">{a.date}</span>
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">Bu dönem için kayıtlı seans yok.</p>
          )}
        </div>
      </details>

      {/* MODALS */}
      <CertificateModal open={certOpen} onOpenChange={setCertOpen} workspace={workspace} north={state} />
      <FlashcardsModal open={cardsOpen} onOpenChange={setCardsOpen} />
    </div>
  );
}
