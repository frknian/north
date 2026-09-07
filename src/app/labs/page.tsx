"use client";

import { useMemo, useState } from "react";
import { Bot, Filter, FlaskConical, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { LabJournalDialog } from "@/components/features/lab-journal-dialog";
import { useWorkspace } from "@/components/features/workspace-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Difficulty, Lab } from "@/lib/types";
import { cn } from "@/lib/utils";

const labLabels: Record<string, string> = {
  planned: "Planlandı",
  attempted: "Deneniyor",
  completed: "Tamamlandı",
  easy: "Kolay",
  medium: "Orta",
  hard: "Zor",
  independent: "Bağımsız",
  assisted: "Yardımlı",
};

const emptyLab = (): Lab => ({
  id: crypto.randomUUID(),
  name: "",
  platform: "Local Lab",
  difficulty: "easy",
  category: "Network",
  date: new Date().toISOString().slice(0, 10),
  duration: 0,
  status: "planned",
  target: "",
  recon: "",
  enumeration: "",
  attackSurface: "",
  attempts: "",
  exploitation: "",
  privilegeEscalation: "",
  result: "",
  stuck: "",
  learned: "",
  aiAssistanceLevel: 0,
  walkthroughUsed: false,
  notes: "",
  keyLearnings: [],
});

export default function LabsPage() {
  const { labs, addLab } = useWorkspace();
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [independence, setIndependence] = useState("all");
  const [newLab, setNewLab] = useState<Lab | null>(null);

  const completed = labs.filter((lab) => lab.status === "completed");
  const independent = completed.filter((lab) => lab.aiAssistanceLevel <= 1 && !lab.walkthroughUsed).length;
  const rate = completed.length ? Math.round((independent / completed.length) * 100) : 0;

  const categories = useMemo(() => ["all", ...new Set(labs.map((l) => l.category))], [labs]);

  const visible = useMemo(
    () =>
      labs.filter(
        (lab) =>
          (category === "all" || lab.category === category) &&
          (status === "all" || lab.status === status) &&
          (difficulty === "all" || lab.difficulty === difficulty) &&
          (independence === "all" ||
            (independence === "independent"
              ? lab.aiAssistanceLevel <= 1 && !lab.walkthroughUsed
              : lab.aiAssistanceLevel > 1 || lab.walkthroughUsed))
      ),
    [category, difficulty, independence, labs, status]
  );

  function saveNewLab() {
    if (!newLab?.name.trim()) return;
    addLab(newLab);
    setNewLab(null);
  }

  return (
    <div className="page-content space-y-6 pb-20">
      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Pratik &amp; Lab Günlüğü</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Zorlu problemleri, çözümleri, takıldığın yerleri ve bağımsızlık gelişimini kaydet.
          </p>
        </div>

        <Dialog open={Boolean(newLab)} onOpenChange={(open) => setNewLab(open ? emptyLab() : null)}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl text-xs shadow-xs">
              <Plus className="size-3.5 mr-1.5" /> Yeni Lab Ekle
            </Button>
          </DialogTrigger>
          {newLab && (
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Yeni Lab Kaydı Oluştur</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Çalıştığın ortamın veya platformun temel bilgilerini belirle.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2 text-xs">
                <div className="space-y-1">
                  <Label className="text-xs">Lab / Problem Adı</Label>
                  <Input
                    value={newLab.name}
                    onChange={(e) => setNewLab({ ...newLab, name: e.target.value })}
                    placeholder="Örn: PortSwigger SQLi Lab #2"
                    className="rounded-xl text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Platform</Label>
                    <Input
                      value={newLab.platform}
                      onChange={(e) => setNewLab({ ...newLab, platform: e.target.value })}
                      placeholder="TryHackMe, PortSwigger vb."
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Kategori</Label>
                    <Input
                      value={newLab.category}
                      onChange={(e) => setNewLab({ ...newLab, category: e.target.value })}
                      placeholder="Web, Network, SQL"
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Zorluk Seviyesi</Label>
                  <Select
                    value={newLab.difficulty}
                    onValueChange={(val) => setNewLab({ ...newLab, difficulty: val as Difficulty })}
                  >
                    <SelectTrigger className="rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Kolay</SelectItem>
                      <SelectItem value="medium">Orta</SelectItem>
                      <SelectItem value="hard">Zor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setNewLab(null)} className="rounded-xl text-xs">
                  Vazgeç
                </Button>
                <Button
                  size="sm"
                  onClick={saveNewLab}
                  disabled={!newLab.name.trim()}
                  className="rounded-xl text-xs"
                >
                  Oluştur
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </header>

      {/* KPI STATS */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card/60 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-muted-foreground">Tamamlanan Lablar</span>
            <p className="mt-1 text-2xl font-bold font-mono tracking-tight text-foreground">
              {completed.length} <span className="text-xs font-normal text-muted-foreground">/ {labs.length} toplam</span>
            </p>
          </div>
          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <FlaskConical className="size-5" />
          </div>
        </div>

        <div className="rounded-2xl border bg-card/60 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-muted-foreground">Bağımsız Çözümler</span>
            <p className="mt-1 text-2xl font-bold font-mono tracking-tight text-foreground">
              {independent} <span className="text-xs font-normal text-muted-foreground">lab</span>
            </p>
          </div>
          <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <ShieldCheck className="size-5" />
          </div>
        </div>

        <div className="rounded-2xl border bg-card/60 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-muted-foreground">Bağımsızlık Oranı</span>
            <p className="mt-1 text-2xl font-bold font-mono tracking-tight text-foreground">
              %{rate}
            </p>
          </div>
          <div className="grid size-10 place-items-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <Bot className="size-5" />
          </div>
        </div>
      </div>

      {/* FILTER PILLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card/40 p-3 shadow-xs text-xs">
        {/* Categories */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-muted-foreground mr-1">Kategori:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors",
                category === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {cat === "all" ? "Tümü" : cat}
            </button>
          ))}
        </div>

        {/* Status / Independence */}
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="planned">Planlandı</option>
            <option value="attempted">Deneniyor</option>
            <option value="completed">Tamamlandı</option>
          </select>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="rounded-xl border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tüm Zorluklar</option>
            <option value="easy">Kolay</option>
            <option value="medium">Orta</option>
            <option value="hard">Zor</option>
          </select>
        </div>
      </div>

      {/* LAB CARDS LIST */}
      <div className="space-y-3">
        {visible.map((lab) => {
          const isDone = lab.status === "completed";
          return (
            <div
              key={lab.id}
              className="rounded-2xl border bg-card/60 p-4 shadow-xs transition-all hover:border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={isDone ? "default" : "secondary"}
                    className="text-[10px] px-2 py-0.5 rounded-md"
                  >
                    {labLabels[lab.status] || lab.status}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-md">
                    {labLabels[lab.difficulty] || lab.difficulty}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-md text-muted-foreground">
                    {lab.category}
                  </Badge>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {lab.platform} · {lab.duration} dk
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-foreground">{lab.name}</h3>

                <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                  {lab.learned || lab.stuck || "İlk gözlem veya writeup notunu kaydetmek için günlüğü aç."}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <span
                  className={cn(
                    "text-[10px] font-medium px-2 py-1 rounded-lg border",
                    lab.walkthroughUsed
                      ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : lab.aiAssistanceLevel <= 1
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-indigo-500/20 bg-indigo-500/10 text-indigo-400"
                  )}
                >
                  {lab.walkthroughUsed ? "Walkthrough" : lab.aiAssistanceLevel <= 1 ? "Bağımsız" : `AI L${lab.aiAssistanceLevel}`}
                </span>

                <LabJournalDialog lab={lab} trigger={<Button variant="outline" size="sm" className="rounded-xl text-xs">Günlüğü Aç</Button>} />
              </div>
            </div>
          );
        })}

        {visible.length === 0 && (
          <div className="rounded-2xl border border-dashed p-10 text-center space-y-2">
            <p className="text-sm font-medium text-foreground">Filtrelere uygun lab bulunamadı</p>
            <p className="text-xs text-muted-foreground">Filtreleri sıfırlayabilir veya yeni bir lab ekleyebilirsin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
