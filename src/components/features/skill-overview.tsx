"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Layers,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/features/workspace-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { skillEvidence, subskills } from "@/lib/skill-evidence";
import { cn } from "@/lib/utils";

export function SkillOverview({ evidence = false }: { evidence?: boolean }) {
  const w = useWorkspace();
  const [openModal, setOpenModal] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    url: "",
    skill: w.skills[0]?.name ?? "",
  });

  const totalScore = w.skills.reduce((acc, s) => acc + s.score, 0);
  const avgScore = w.skills.length ? (totalScore / w.skills.length).toFixed(1) : "0.0";
  const totalProjects = w.portfolio.length;

  function addEvidence() {
    if (!draft.title.trim() || !draft.description.trim()) return;
    w.addPortfolioProject({
      id: crypto.randomUUID(),
      title: draft.title.trim(),
      description: draft.description.trim(),
      url: draft.url.trim() || undefined,
      skills: draft.skill ? [draft.skill] : [],
      readmeQuality: 0,
      securityRelevance: 0,
      status: "published",
      lastCommitAt: new Date().toISOString(),
    });
    setDraft({ title: "", description: "", url: "", skill: w.skills[0]?.name ?? "" });
    setOpenModal(false);
    toast.success("Kanıt ve proje portföyüne eklendi.");
  }

  return (
    <div className="page-content space-y-6 pb-20">
      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {evidence ? "Portföy & Çalışma Çıktılarım" : "Gelişen Becerilerim"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hedefine yaklaşırken ürettiğin doğrulanabilir projeleri, yazıları ve gelişen pratik yetkinliklerini takip et.
          </p>
        </div>

        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl text-xs shadow-xs">
              <Plus className="size-3.5 mr-1.5" /> Yeni Çıktı / Proje Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">Yeni Proje &amp; Çıktı Kaydet</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Proje, lab çözümü, sertifika veya doğrulanabilir bir GitHub / web bağlantısı ekle.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <Label className="text-xs">Proje / Çıktı Başlığı</Label>
                <Input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Örn: E-Ticaret REST API veya TryHackMe OWASP Writeup"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">İlişkili Beceri</Label>
                <select
                  value={draft.skill}
                  onChange={(e) => setDraft({ ...draft, skill: e.target.value })}
                  className="w-full rounded-xl border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {w.skills.map((skill) => (
                    <option key={skill.id} value={skill.name}>
                      {skill.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Ne Yaptın? Neyi Kanıtlıyor?</Label>
                <Textarea
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Örn: SQL Injection ve XSS açıklarını giderdim, Docker ile yayına aldım."
                  className="rounded-xl text-xs min-h-20"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Bağlantı (İsteğe Bağlı)</Label>
                <Input
                  type="url"
                  value={draft.url}
                  onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                  placeholder="https://github.com/… veya https://…"
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setOpenModal(false)} className="rounded-xl text-xs">
                Vazgeç
              </Button>
              <Button
                size="sm"
                onClick={addEvidence}
                disabled={!draft.title.trim() || !draft.description.trim()}
                className="rounded-xl text-xs"
              >
                Projeyi Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {/* KPI METRIC CARDS */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card/60 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-muted-foreground">Doğrulanmış Beceriler</span>
            <p className="mt-1 text-2xl font-bold font-mono tracking-tight text-foreground">
              {w.skills.length} <span className="text-xs font-normal text-muted-foreground">beceri alanı</span>
            </p>
          </div>
          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>
        </div>

        <div className="rounded-2xl border bg-card/60 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-muted-foreground">Ortalama Yetkinlik</span>
            <p className="mt-1 text-2xl font-bold font-mono tracking-tight text-foreground">
              {avgScore} <span className="text-xs font-normal text-muted-foreground">/ 10 puan</span>
            </p>
          </div>
          <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <TrendingUp className="size-5" />
          </div>
        </div>

        <div className="rounded-2xl border bg-card/60 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-muted-foreground">Kayıtlı Portföy &amp; Çıktılar</span>
            <p className="mt-1 text-2xl font-bold font-mono tracking-tight text-foreground">
              {totalProjects} <span className="text-xs font-normal text-muted-foreground">çıktı</span>
            </p>
          </div>
          <div className="grid size-10 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
            <Award className="size-5" />
          </div>
        </div>
      </div>

      {/* SKILLS & EVIDENCE LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Beceri Gelişimi &amp; Çıktı Geçmişi</h2>
          <span className="text-xs text-muted-foreground">Kanıt kalitesi puanı şekillendirir</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {w.skills.map((s) => {
            const e = skillEvidence(w, s);
            const delta = (s.score - s.previousScore).toFixed(1);
            const scorePercent = Math.min(100, Math.round((s.score / 10) * 100));

            return (
              <details
                key={s.id}
                className="group rounded-2xl border bg-card/60 p-5 shadow-xs transition-all hover:border-border"
              >
                <summary className="cursor-pointer list-none flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {s.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {e.count} kanıt · Son pratik: {e.lastPracticed ? new Date(e.lastPracticed).toLocaleDateString("tr-TR") : "Henüz yok"}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-base font-bold text-foreground">{s.score.toFixed(1)}/10</span>
                      {Number(delta) !== 0 && (
                        <span className={cn("block text-[10px] font-mono", Number(delta) > 0 ? "text-emerald-500" : "text-amber-500")}>
                          {Number(delta) > 0 ? `+${delta}` : delta}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${scorePercent}%` }}
                    />
                  </div>
                </summary>

                {/* Expanded Details */}
                <div className="mt-4 pt-4 border-t border-border/40 space-y-3 text-xs">
                  <p className="text-muted-foreground leading-relaxed">{s.evidence}</p>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-foreground">İlişkili Pratik &amp; Kayıtlar:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {e.labs.map((lab) => (
                        <Badge key={lab.id} variant="secondary" className="text-[10px] px-2 py-0.5 rounded-md">
                          ⚗️ {lab.name}
                        </Badge>
                      ))}
                      {e.projects.map((p) => (
                        <Badge key={p.id} variant="outline" className="text-[10px] px-2 py-0.5 rounded-md">
                          🏆 {p.title}
                        </Badge>
                      ))}
                      {e.labs.length === 0 && e.projects.length === 0 && (
                        <span className="text-[11px] text-muted-foreground italic">Henüz bu beceriye özel kayıt yok.</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/20">
                    <Button asChild variant="ghost" size="xs" className="text-[11px] text-primary">
                      <Link href="/labs">Lab Çalışması Yap →</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-[11px]"
                      onClick={() => {
                        setDraft({ ...draft, skill: s.name });
                        setOpenModal(true);
                      }}
                    >
                      + Çıktı Ekle
                    </Button>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </div>
  );
}
