"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  CirclePause,
  CirclePlay,
  Clock,
  Compass,
  ExternalLink,
  Flame,
  Layers,
  Layers3,
  ListTodo,
  Minus,
  MoveRight,
  ClipboardCheck,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { AreaModules } from "./area-modules";
import { AreaRoadmapTab, RoadmapAreaBadge, RoadmapAreaOverview } from "./area-roadmap";
import { AreaSprintHub } from "./area-sprint-hub";
import { DomainCoachingCockpit } from "./domain-coaching-cockpit";
import { useWorkspace } from "@/components/features/workspace-provider";
import { findDomain } from "@/lib/domain-catalog";
import {
  detectLanguage,
  getLanguageGoalSuggestions,
  getLanguageLevelLabel,
  supportedLanguages,
  type LanguageLevel,
} from "@/lib/language-learning";
import {
  allocation,
  areaAccents,
  areaStatus,
  createArea,
  dayKey,
  dropTask,
  isAreaActive,
  kindLabels,
  poolTask,
  postponeTask,
  shiftDay,
  shrinkTask,
  weekKey,
  type Area,
  type AreaKind,
  type NorthTask,
} from "@/lib/north";
import { useNorth } from "./shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { LevelTestDialog } from "./level-test-dialog";

const icons = ["◎", "∑", "⌘", "▤", "♞", "◇", "✦", "🇬🇧", "🇩🇪", "🇫🇷", "🇯🇵", "🇸🇦", "◌", "△", "□"];
const priorityLabels: Record<number, string> = { 3: "Yüksek", 2: "Orta", 1: "Düşük", 0: "Bakım" };

export function NorthAreas({ id }: { id?: string }) {
  const { state, update, ready, workspace } = useNorth();
  const [draft, setDraft] = useState<Area | null>(null);
  const [managing, setManaging] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [tab, setTab] = useState("tasks");
  const current = state.areas.find((area) => area.id === id);

  function saveArea() {
    if (!draft?.name.trim() || !draft.metric.trim()) return;
    const normalized = { ...draft, archived: draft.status === "archived" };
    update((workspace) => ({
      ...workspace,
      areas: workspace.areas.some((area) => area.id === normalized.id)
        ? workspace.areas.map((area) => (area.id === normalized.id ? normalized : area))
        : [...workspace.areas, normalized],
    }));
    setDraft(null);
  }

  function moveArea(areaId: string, direction: -1 | 1) {
    update((workspace) => {
      const areas = [...workspace.areas];
      const from = areas.findIndex((area) => area.id === areaId);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= areas.length) return workspace;
      [areas[from], areas[to]] = [areas[to], areas[from]];
      return { ...workspace, areas };
    });
  }

  function setStatus(areaId: string, status: Area["status"]) {
    update((workspace) => ({
      ...workspace,
      areas: workspace.areas.map((area) =>
        area.id === areaId ? { ...area, status, archived: status === "archived" } : area
      ),
    }));
  }

  function removeArea(area: Area) {
    const hasRecords = state.tasks.some((task) => task.areaId === area.id) || state.activities.some((activity) => activity.areaId === area.id) || state.events.some((event) => event.areaId === area.id) || (state.sprints ?? []).some((sprint) => sprint.areaId === area.id);
    if (hasRecords) {
      if (window.confirm(`“${area.name}” alanında çalışma kayıtları var. Kayıtları koruyup alanı aktif listeden kaldıralım mı?`)) workspace.removeNorthArea(area.id);
      return;
    }
    if (!window.confirm(`“${area.name}” alanı kaldırılsın mı? Yol haritasındaki görevler hesabında kalır.`)) return;
    workspace.removeNorthArea(area.id);
  }

  if (!ready) return <div className="page-content" aria-busy="true">Alanlar yükleniyor…</div>;
  if (id && !current) {
    return (
      <div className="page-content py-12 text-center space-y-3">
        <p className="text-muted-foreground">Hedef alanı bulunamadı.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/areas">Alanlara Dön</Link>
        </Button>
      </div>
    );
  }

  if (current) {
    return (
      <AreaWorkspace
        area={current}
        tab={tab}
        setTab={setTab}
        onEdit={() => setDraft({ ...current })}
        draft={draft}
        setDraft={setDraft}
        saveArea={saveArea}
      />
    );
  }

  const visibleAreas = state.areas.filter((area) => showInactive || isAreaActive(area));

  return (
    <div className="page-content space-y-6 pb-32 md:pb-20">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Hedef Alanların</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Zamanını, enerjini ve dikkatinizi nereye yatırdığını gör ve önceliklendir.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={managing ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              setManaging(!managing);
              setDraft(null);
            }}
            className="rounded-xl text-xs"
          >
            {managing ? "Yönetimi Bitir" : "Alanları Yönet"}
          </Button>
          <Button
            size="sm"
            onClick={() => setDraft(createArea("custom", crypto.randomUUID()))}
            className="rounded-xl text-xs shadow-xs"
          >
            <Plus className="size-3.5 mr-1.5" />
            Yeni Alan Ekle
          </Button>
        </div>
      </header>

      {managing ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-muted/20 p-4">
            <div>
              <h2 className="text-xs font-semibold text-foreground">Alan Yönetimi &amp; Sıralama</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Alanları yukarı-aşağı taşıyarak önceliklerini değiştir, duraklat veya arşivle.
              </p>
            </div>
            <Button size="xs" onClick={() => setDraft(createArea("custom", crypto.randomUUID()))}>
              <Plus className="size-3 mr-1" /> Yeni Alan
            </Button>
          </div>

          {draft && (
            <AreaEditor draft={draft} setDraft={setDraft} onSave={saveArea} onCancel={() => setDraft(null)} />
          )}

          <div className="rounded-2xl border bg-card/60 divide-y divide-border/40 overflow-hidden shadow-xs">
            {state.areas.map((area, index) => {
              const status = areaStatus(area);
              return (
                <div key={area.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid size-9 place-items-center rounded-xl border font-bold text-sm bg-background shadow-xs"
                      style={{ borderColor: area.accent ?? areaAccents[0] }}
                    >
                      {area.icon}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{area.name}</p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">
                        {priorityLabels[area.priority] ?? "Orta"} öncelik ·{" "}
                        {status === "active" ? "Aktif" : status === "paused" ? "Duraklatıldı" : "Arşivlendi"} ·{" "}
                        {area.weeklyMinutes} dk/hafta
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      disabled={index === 0}
                      onClick={() => moveArea(area.id, -1)}
                      title="Yukarı taşı"
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      disabled={index === state.areas.length - 1}
                      onClick={() => moveArea(area.id, 1)}
                      title="Aşağı taşı"
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button size="xs" variant="ghost" onClick={() => setDraft({ ...area })}>
                      <Pencil className="size-3 mr-1" /> Düzenle
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setStatus(area.id, status === "paused" ? "active" : "paused")}
                    >
                      {status === "paused" ? (
                        <>
                          <CirclePlay className="size-3 mr-1 text-emerald-500" /> Başlat
                        </>
                      ) : (
                        <>
                          <CirclePause className="size-3 mr-1 text-amber-500" /> Duraklat
                        </>
                      )}
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setStatus(area.id, status === "archived" ? "active" : "archived")}
                    >
                      <Archive className="size-3 mr-1 text-muted-foreground" />
                      {status === "archived" ? "Geri Al" : "Arşivle"}
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      title="Alanı kaldır"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeArea(area)}
                    >
                      <Trash2 className="size-3.5 mr-1" /> Alanı kaldır
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <>
          {draft && (
            <AreaEditor draft={draft} setDraft={setDraft} onSave={saveArea} onCancel={() => setDraft(null)} />
          )}

          <RoadmapAreaOverview areas={state.areas} />
          <div className="grid gap-4 md:grid-cols-2">
            {visibleAreas.map((area) => (
              <AreaCard key={area.id} area={area} areas={state.areas} onRemove={() => removeArea(area)} />
            ))}
          </div>

          <label className="flex w-fit items-center gap-2 text-xs text-muted-foreground cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(event) => setShowInactive(event.target.checked)}
              className="rounded"
            />
            Duraklatılan ve arşivlenen alanları göster
          </label>
        </>
      )}
    </div>
  );
}

function AreaCard({ area, areas, onRemove }: { area: Area; areas: Area[]; onRemove: () => void }) {
  const { state } = useNorth();
  const minutes = state.activities
    .filter((activity) => activity.areaId === area.id && activity.date >= weekKey() && activity.date <= dayKey())
    .reduce((total, activity) => total + activity.minutes, 0);
  const nextTask = state.tasks.find((task) => task.areaId === area.id && ["pending", "partial"].includes(task.status));
  const status = areaStatus(area);
  const targetAlloc = allocation(state, area);
  const percent = targetAlloc > 0 ? Math.min(100, Math.round((minutes / targetAlloc) * 100)) : 0;
  const activeSprint = (state.sprints || []).find((s) => s.areaId === area.id && s.status === "active");

  return (
    <div className="rounded-2xl border bg-card/60 p-5 shadow-xs flex flex-col justify-between gap-4 transition-all hover:border-border">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="grid size-10 place-items-center rounded-xl border text-lg bg-background shadow-xs font-bold"
              style={{ borderColor: area.accent ?? areaAccents[0] }}
            >
              {area.icon}
            </span>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link href={`/areas/${area.id}`} className="text-base font-semibold text-foreground hover:text-primary transition-colors">
                  {area.name}
                </Link>
                {area.level && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                    {area.level === "beginner" ? "Başlangıç" : area.level === "intermediate" ? "Orta Seviye" : area.level === "advanced" ? "İleri Seviye" : area.level}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {status === "paused" ? "Duraklatıldı" : status === "archived" ? "Arşivlendi" : `${priorityLabels[area.priority] ?? "Orta"} öncelik`}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {minutes} / {targetAlloc} dk
          </Badge>
        </div>

        {activeSprint && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary max-w-full">
            <Sparkles className="size-3 shrink-0" />
            <span className="truncate">Kamp: {activeSprint.title} ({activeSprint.level})</span>
          </div>
        )}

        <div className="mt-4 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ana Hedef</span>
          <p className="text-xs text-foreground leading-relaxed">
            {area.goal || "Bu alan için henüz bir ana hedef tanımlanmadı."}
          </p>
        </div>

        <RoadmapAreaBadge area={area} areas={areas} />

        <div className="mt-4 space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${percent}%`, backgroundColor: area.accent ?? areaAccents[0] }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
            <span>%{percent} haftalık hedef</span>
            <span>{area.weeklyMinutes} dk/hafta plan</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-3 text-xs">
        <p className="truncate text-muted-foreground text-[11px] max-w-[200px]">
          {nextTask ? `Sıradaki: ${nextTask.title}` : "Sıradaki adımı belirle"}
        </p>
        <Button size="xs" variant="ghost" title="Alanı kaldır" onClick={onRemove} className="shrink-0 text-muted-foreground hover:text-destructive"><Trash2 className="size-3 mr-1" /> Kaldır</Button>
        <Button size="xs" variant={nextTask ? "default" : "outline"} asChild className="rounded-xl text-[11px]">
          <Link href={nextTask ? `/focus/${nextTask.id}` : `/areas/${area.id}`}>
            {nextTask ? (
              <>
                <Play className="size-2.5 mr-1 fill-current" /> Başla
              </>
            ) : (
              <>
                Alanı Aç <ArrowRight className="size-2.5 ml-1" />
              </>
            )}
          </Link>
        </Button>
      </div>
    </div>
  );
}

function AreaEditor({
  draft,
  setDraft,
  onSave,
  onCancel,
}: {
  draft: Area;
  setDraft: (area: Area) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <section className="rounded-2xl border border-primary/30 bg-card p-5 shadow-xs space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Alan Detayları &amp; Hedef Ayarları</h3>

      {/* Dil Seçimi Kısayolları */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground font-medium">Hızlı Yabancı Dil Seçimi</Label>
          <span className="text-[10px] text-muted-foreground">Tıkladığında alan adı, simge, kaynaklar ve seviye hazır gelir</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Object.values(supportedLanguages).map((lang) => {
            const isSelected = draft.name.toLocaleLowerCase("tr").trim() === lang.name.toLocaleLowerCase("tr").trim();
            return (
              <button
                type="button"
                key={lang.code}
                onClick={() => {
                  const currentLvl: LanguageLevel = (draft.level as LanguageLevel) || "beginner";
                  const goals = getLanguageGoalSuggestions(lang.name, currentLvl);
                  setDraft({
                    ...draft,
                    name: lang.name,
                    kind: "reading",
                    icon: lang.flag,
                    metric: "Aktif kelime, dinleme ve konuşma",
                    level: currentLvl,
                    domainId: lang.id,
                    goal: goals[0] ?? draft.goal,
                    resources: lang.resources.map((r) => `${r.title} — ${r.url}`).join("\n"),
                  });
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs transition-all",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs ring-1 ring-primary"
                    : "border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 text-xs">
        {(() => {
          const lang = detectLanguage(draft.name);
          if (!lang) return null;
          const currentLevel = (draft.level as LanguageLevel) || "beginner";
          return (
            <div className="space-y-2 sm:col-span-2 rounded-xl border bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">Dil Seviyesi</Label>
                <span className="text-[10px] text-muted-foreground">Bu seviyeye göre 3-4 soruluk teşhis testi ve görevler sunulur</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {(["beginner", "intermediate", "advanced"] as LanguageLevel[]).map((lvl) => {
                  const meta = lang.levels[lvl];
                  const isSelected = currentLevel === lvl;
                  return (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => {
                        const goals = getLanguageGoalSuggestions(draft.name, lvl);
                        setDraft({
                          ...draft,
                          level: lvl,
                          goal: goals[0] ?? draft.goal,
                        });
                      }}
                      className={cn(
                        "rounded-xl border p-2 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary"
                          : "border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      <div className="text-xs font-semibold">{meta.label}</div>
                      <div className="mt-0.5 text-[10px] leading-tight opacity-80">{meta.description}</div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 space-y-1">
                <Label className="text-[11px] text-muted-foreground">Önerilen Seviye Hedefleri (Tıkla ve seç):</Label>
                <div className="flex flex-wrap gap-1.5">
                  {getLanguageGoalSuggestions(draft.name, currentLevel).map((g) => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => setDraft({ ...draft, goal: g })}
                      className="rounded-full border bg-background px-2.5 py-0.5 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary"
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        <div className="space-y-1">
          <Label className="text-xs">Alan Adı</Label>
          <input
            className="w-full rounded-xl border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Alan Türü</Label>
          <select
            className="w-full rounded-xl border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={draft.kind}
            onChange={(event) => {
              const base = createArea(event.target.value as AreaKind, draft.id);
              setDraft({ ...draft, kind: base.kind, metric: base.metric, icon: base.icon });
            }}
          >
            {Object.entries(kindLabels).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Simge</Label>
          <select
            className="w-full rounded-xl border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={draft.icon}
            onChange={(event) => setDraft({ ...draft, icon: event.target.value })}
          >
            {icons.map((icon) => (
              <option key={icon}>{icon}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Öncelik</Label>
          <select
            className="w-full rounded-xl border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={draft.priority}
            onChange={(event) => setDraft({ ...draft, priority: Number(event.target.value) })}
          >
            <option value="3">Yüksek</option>
            <option value="2">Orta</option>
            <option value="1">Düşük</option>
            <option value="0">Bakım</option>
          </select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Ana Hedef</Label>
          <input
            className="w-full rounded-xl border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={draft.goal}
            onChange={(event) => setDraft({ ...draft, goal: event.target.value })}
            placeholder="Bu alanda ulaşmak istediğin nihai sonuç"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Haftalık Süre Hedefi (Dk)</Label>
          <input
            type="number"
            min="0"
            max="10080"
            className="w-full rounded-xl border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={draft.weeklyMinutes}
            onChange={(event) =>
              setDraft({ ...draft, weeklyMinutes: Math.max(0, Math.min(10080, Number(event.target.value))) })
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tercih Edilen Oturum</Label>
          <select
            className="w-full rounded-xl border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={draft.preferredSessionMinutes ?? 50}
            onChange={(event) => setDraft({ ...draft, preferredSessionMinutes: Number(event.target.value) })}
          >
            <option value="25">25 dakika</option>
            <option value="45">45 dakika</option>
            <option value="50">50 dakika</option>
            <option value="60">60 dakika</option>
            <option value="90">90 dakika</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 border-t border-border/40 pt-3 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel} className="rounded-xl text-xs">
          Vazgeç
        </Button>
        <Button
          size="sm"
          disabled={!draft.name.trim() || !draft.metric.trim()}
          onClick={onSave}
          className="rounded-xl text-xs"
        >
          Kaydet
        </Button>
      </div>
    </section>
  );
}

// Domain Skills Resolver
function getAreaSkills(area: Area, workspaceSkills: import("@/lib/types").Skill[]) {
  const matched = workspaceSkills.filter(
    (s) =>
      s.category?.toLowerCase() === area.name.toLowerCase() ||
      s.category?.toLowerCase() === area.kind.toLowerCase()
  );
  if (matched.length > 0) return matched;

  const name = area.name.toLowerCase();
  if (name.includes("matematik") || area.kind === "math") {
    return [
      { id: "math-1", name: "Temel Matematik & Sayılar Teorisi", score: 7, previousScore: 6, evidence: "Problem setleri ve temel kavram testleri çözüldü." },
      { id: "math-2", name: "Fonksiyonlar, Polinomlar & Eşitsizlikler", score: 6, previousScore: 5, evidence: "Grafik çizimi ve fonksiyon modelleme pratikleri tamamlandı." },
      { id: "math-3", name: "Türev, İntegral & Limit", score: 5, previousScore: 4, evidence: "Geometrik yorum ve alan hesaplama çalışmaları devam ediyor." },
      { id: "math-4", name: "Problemler & Sayısal Mantık", score: 8, previousScore: 7, evidence: "Yeni nesil kurgusal soru çözümlerinde %80 başarı." },
      { id: "math-5", name: "Geometri & Analitik Düşünme", score: 6, previousScore: 6, evidence: "Üçgenler ve analitik dönüşüm formülleri tekrar edildi." },
    ];
  }
  if (name.includes("siber") || area.kind === "cyber") {
    return [
      { id: "cyber-1", name: "Ağ Protokolleri & Trafik Analizi", score: 8, previousScore: 7, evidence: "Wireshark pcap analizi ve nmap keşif çıktıları doğrulandı." },
      { id: "cyber-2", name: "Web Zafiyetleri (OWASP Top 10)", score: 7, previousScore: 6, evidence: "SQLi, XSS ve CSRF pratik labları bağımsız çözüldü." },
      { id: "cyber-3", name: "Linux Sistem Yönetimi & Bash", score: 7, previousScore: 6, evidence: "Dosya yetkileri, servis yönetimi ve otomasyon scriptleri yazıldı." },
      { id: "cyber-4", name: "Yetki Yükseltme & Active Directory", score: 5, previousScore: 4, evidence: "Kerberoasting ve Linux SUID lab senaryoları çalışıldı." },
      { id: "cyber-5", name: "Teknik Raporlama & Writeup", score: 8, previousScore: 7, evidence: "Çözülen labların metodoloji notları GitHub'a aktarıldı." },
    ];
  }
  if (name.includes("satranç") || area.kind === "chess") {
    return [
      { id: "chess-1", name: "Taktik Görüş & Kombinezonlar", score: 8, previousScore: 7, evidence: "Açmaz, çatal ve boğmaca matı taktiklerinde %85 doğruluk." },
      { id: "chess-2", name: "Açılış İlkeleri & Alan Hakimiyeti", score: 7, previousScore: 6, evidence: "Merkez kontrolü ve gelişim prensipleri usta oyunlarında incelendi." },
      { id: "chess-3", name: "Oyun Sonu Prensipleri (Piyon/Kale)", score: 6, previousScore: 5, evidence: "Lucena ve Philidor konumları pratik tahtasında tekrar edildi." },
      { id: "chess-4", name: "Zaman Yönetimi & Hızlı Düşünme", score: 7, previousScore: 6, evidence: "Blitz ve rapid seanslarında zaman sıkışması analizi yapıldı." },
    ];
  }
  const lang = detectLanguage(area.name);
  if (lang || area.kind === "reading") {
    return [
      { id: "lang-1", name: "Aktif Kelime Hazinesi & Kalıplar", score: 7, previousScore: 6, evidence: "İlk 500 kelime aralıklı tekrar kartlarıyla pekiştirildi." },
      { id: "lang-2", name: "Dinleme Anlama & Shadowing", score: 6, previousScore: 5, evidence: "Hedef dilde podcast ve diyalog taklit çalışmaları yapıldı." },
      { id: "lang-3", name: "Gramer Yapıları & Cümle Kurma", score: 7, previousScore: 6, evidence: "Zaman yapıları ve bağlaç kullanımı metin üretiminde uygulandı." },
      { id: "lang-4", name: "Konuşma Akıcılığı & Telaffuz", score: 5, previousScore: 4, evidence: "Ses kaydı alınarak telaffuz hataları gözden geçirildi." },
    ];
  }
  return [
    { id: "gen-1", name: "Temel Bilgi & Kavramlar", score: 7, previousScore: 6, evidence: "Konu haritası ve ön koşul kavramlar netleştirildi." },
    { id: "gen-2", name: "Uygulama & Problem Çözme", score: 6, previousScore: 5, evidence: "Bağımsız pratik adımları tamamlandı." },
    { id: "gen-3", name: "Kanıt & Çıktı Üretme", score: 7, previousScore: 6, evidence: "Öğrenilenlerin somut özeti belgelendi." },
    { id: "gen-4", name: "Süreklilik & Ritim", score: 8, previousScore: 7, evidence: "Haftalık planlanan oturumlar düzenli tamamlandı." },
  ];
}

// -------------------------------------------------------------
// ENHANCED AREA WORKSPACE (AREA COMMAND CENTER)
// -------------------------------------------------------------
function AreaWorkspace({
  area,
  tab,
  setTab,
  onEdit,
  draft,
  setDraft,
  saveArea,
}: {
  area: Area;
  tab: string;
  setTab: (tab: string) => void;
  onEdit: () => void;
  draft: Area | null;
  setDraft: (area: Area | null) => void;
  saveArea: () => void;
}) {
  const { state, update } = useNorth();
  const workspace = useWorkspace();

  useEffect(() => {
    const selectHash = () => { if (window.location.hash === "#roadmap") setTab("roadmap"); };
    selectHash();
    window.addEventListener("hashchange", selectHash);
    return () => window.removeEventListener("hashchange", selectHash);
  }, [setTab]);

  // Task Hub States
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "done">("all");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickMinutes, setQuickMinutes] = useState(area.preferredSessionMinutes ?? 45);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [levelTestOpen, setLevelTestOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<NorthTask | null>(null);

  // All tasks for this area
  const areaTasks = useMemo(() => state.tasks.filter((t) => t.areaId === area.id), [state.tasks, area.id]);
  const pendingTasks = useMemo(() => areaTasks.filter((t) => !["done", "cancelled"].includes(t.status)), [areaTasks]);
  const completedTasks = useMemo(() => areaTasks.filter((t) => t.status === "done"), [areaTasks]);

  // Durations
  const totalMinutesCompleted = useMemo(
    () => completedTasks.reduce((sum, t) => sum + t.minutes, 0),
    [completedTasks]
  );
  const totalPendingMinutes = useMemo(
    () => pendingTasks.reduce((sum, t) => sum + t.minutes, 0),
    [pendingTasks]
  );

  // This week's progress for this area
  const currentWeek = weekKey();
  const thisWeekTasks = useMemo(
    () => areaTasks.filter((t) => t.week === currentWeek || (t.date && t.date >= currentWeek && t.date <= shiftDay(currentWeek, 6))),
    [areaTasks, currentWeek]
  );
  const thisWeekMinutes = useMemo(
    () => thisWeekTasks.filter((t) => t.status === "done").reduce((sum, t) => sum + t.minutes, 0),
    [thisWeekTasks]
  );
  const thisWeekTarget = area.weeklyMinutes || 120;
  const thisWeekPct = thisWeekTarget > 0 ? Math.min(100, Math.round((thisWeekMinutes / thisWeekTarget) * 100)) : 0;

  // Next task in line
  const nextTask = pendingTasks[0];
  const lastDoneTask = completedTasks[completedTasks.length - 1];

  // Skills for this area
  const areaSkills = useMemo(() => getAreaSkills(area, workspace.skills), [area, workspace.skills]);

  // Deadlines & milestones for this area
  const deadlines = useMemo(() => {
    return [
      ...state.events
        .filter((event) => event.areaId === area.id && ["deadline", "exam"].includes(event.kind))
        .map((e) => ({ id: e.id, title: e.title, date: e.date, kind: e.kind })),
      ...areaTasks
        .filter((task) => task.deadline)
        .map((task) => ({ id: task.id, title: task.title, date: task.deadline!, kind: "deadline" as const })),
    ].toSorted((a, b) => a.date.localeCompare(b.date));
  }, [state.events, areaTasks, area.id]);

  // Quick Inline Add Task
  const handleQuickAddTask = () => {
    if (!quickTitle.trim()) return;
    const newTask: NorthTask = {
      id: crypto.randomUUID(),
      areaId: area.id,
      title: quickTitle.trim(),
      goal: `${area.name} kapsamında pratik adım.`,
      minutes: Number(quickMinutes) || 45,
      intensity: "normal",
      mandatory: false,
      status: "pending",
      date: "",
      deadline: "",
      resource: "",
      why: "Alan detayından hızlı eklendi.",
      week: currentWeek,
    };
    update((curr) => ({
      ...curr,
      tasks: [newTask, ...curr.tasks],
    }));
    setQuickTitle("");
  };

  const handleToggleTask = (task: NorthTask) => {
    const nextStatus = task.status === "done" ? "pending" : "done";
    const completedAt = nextStatus === "done" ? new Date().toISOString() : undefined;
    update((curr) => ({
      ...curr,
      tasks: curr.tasks.map((t) => (t.id === task.id ? { ...t, status: nextStatus, completedAt } : t)),
    }));
  };

  const handleRepeatTask = (task: NorthTask) => {
    const clone: NorthTask = {
      ...task,
      id: crypto.randomUUID(),
      status: "pending",
      date: "",
      completedAt: undefined,
      why: `"${task.title}" görevinin tekrarı.`,
    };
    update((curr) => ({
      ...curr,
      tasks: [clone, ...curr.tasks],
    }));
  };

  const openEditModal = (task: NorthTask) => {
    setEditingTask({ ...task });
    setTaskModalOpen(true);
  };

  const handleSaveModal = () => {
    if (!editingTask || !editingTask.title.trim()) return;
    update((curr) => {
      const exists = curr.tasks.some((t) => t.id === editingTask.id);
      if (exists) {
        return {
          ...curr,
          tasks: curr.tasks.map((t) => (t.id === editingTask.id ? editingTask : t)),
        };
      }
      return {
        ...curr,
        tasks: [editingTask, ...curr.tasks],
      };
    });
    setTaskModalOpen(false);
    setEditingTask(null);
  };

  const tabList = [
    ["tasks", "1. Eylemler & Rutinler"],
    ["roadmap", "2. Yol Haritası"],
    ["coach", "3. Koçluk & Konu Analizi"],
    ["records", "4. Sonuçlar & Kanıtlar"],
  ];

  return (
    <div className="page-content space-y-6 pb-32 md:pb-24">
      {/* BREADCRUMB / BACK LINK */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <Link href="/areas" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors group">
          <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Tüm Alanlara Dön</span>
        </Link>
        <span className="font-mono text-[11px]">{area.kind.toUpperCase()} MODÜLÜ</span>
      </div>

      {/* HEADER COMMAND STRIP */}
      <header className="rounded-2xl border bg-card/60 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <span
            className="grid size-14 place-items-center rounded-2xl border text-2xl bg-background shadow-xs font-bold shrink-0"
            style={{ borderColor: area.accent ?? areaAccents[0] }}
          >
            {area.icon}
          </span>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black tracking-tight text-foreground">{area.name}</h1>
              {area.level && (
                <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">
                  {area.level === "beginner"
                    ? "Başlangıç"
                    : area.level === "intermediate"
                    ? "Orta Seviye"
                    : area.level === "advanced"
                    ? "İleri Seviye"
                    : area.level}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs font-medium">
                {priorityLabels[area.priority] ?? "Orta"} Öncelik
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
              {area.goal || area.description || "Bu alandaki hedeflerini, haftalık çalışma ritmini ve çıktılarını yönet."}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {nextTask ? (
            <Button asChild size="sm" className="rounded-xl text-xs font-semibold shadow-xs">
              <Link href={`/focus/${nextTask.id}`}>
                <Play className="size-3.5 mr-1.5 fill-current" />
                Odak Seansı Başlat
              </Link>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                setEditingTask({
                  id: crypto.randomUUID(),
                  areaId: area.id,
                  title: "",
                  goal: "",
                  minutes: area.preferredSessionMinutes ?? 45,
                  intensity: "normal",
                  mandatory: true,
                  status: "pending",
                  date: dayKey(),
                  deadline: "",
                  resource: "",
                  why: `${area.name} için yeni odak adımı.`,
                  week: currentWeek,
                });
                setTaskModalOpen(true);
              }}
              className="rounded-xl text-xs font-semibold shadow-xs"
            >
              <Plus className="size-3.5 mr-1.5" />
              Görev Ekle
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={() => setLevelTestOpen(true)} className="rounded-xl text-xs">
            <ClipboardCheck className="size-3.5 mr-1.5" />
            Seviye Testi
          </Button>

          <Button variant="outline" size="sm" onClick={onEdit} className="rounded-xl text-xs">
            <Pencil className="size-3.5 mr-1.5" />
            Alanı Düzenle
          </Button>
        </div>
      </header>

      <LevelTestDialog area={area} open={levelTestOpen} onOpenChange={setLevelTestOpen} />

      {draft && (
        <AreaEditor draft={draft} setDraft={setDraft} onSave={saveArea} onCancel={() => setDraft(null)} />
      )}

      {/* 4 KPI SUMMARY STATS STRIP */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Toplam Odak Süresi */}
        <div className="rounded-2xl border bg-card/60 p-4 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Toplam Odak Süresi</span>
            <Clock className="size-3.5 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-foreground">
              {totalMinutesCompleted} <span className="text-xs font-medium text-muted-foreground">dk ({Math.round(totalMinutesCompleted / 60 * 10) / 10} sa)</span>
            </div>
            {/* This week's progress */}
            <div className="mt-2 space-y-1">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${thisWeekPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>Bu hafta: {thisWeekMinutes} dk</span>
                <span>Hedef: {thisWeekTarget} dk (%{thisWeekPct})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Yaptığım Görevler */}
        <div className="rounded-2xl border bg-card/60 p-4 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Yaptığım Görevler</span>
            <CheckCircle2 className="size-3.5 text-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-foreground">
              {completedTasks.length} <span className="text-xs font-medium text-muted-foreground">/ {areaTasks.length} Görev Bitti</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">
              {lastDoneTask ? `Son: ${lastDoneTask.title}` : "Henüz tamamlanan görev yok"}
            </p>
          </div>
        </div>

        {/* Card 3: Yapacağım Görevler */}
        <div className="rounded-2xl border bg-card/60 p-4 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Yapacağım Görevler</span>
            <Target className="size-3.5 text-blue-500" />
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-foreground">
              {pendingTasks.length} <span className="text-xs font-medium text-muted-foreground">Görev Sırada ({totalPendingMinutes} dk)</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">
              {nextTask ? `Sıradaki: ${nextTask.title} (${nextTask.date || "Havuz"})` : "Tüm görevler tamamlandı"}
            </p>
          </div>
        </div>

        {/* Card 4: Ritim & Oturum */}
        <div className="rounded-2xl border bg-card/60 p-4 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Oturum &amp; Ritim</span>
            <Flame className="size-3.5 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-foreground">
              {area.preferredSessionMinutes ?? 45} <span className="text-xs font-medium text-muted-foreground">dk/oturum</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Metrik: <strong className="text-foreground">{area.metric}</strong>
            </p>
          </div>
        </div>
      </section>

      {/* PILL TABS */}
      <div className="area-tabs flex flex-wrap gap-1 rounded-2xl border bg-muted/40 p-1 text-xs max-w-fit">
        {tabList.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "rounded-xl px-3.5 py-1.5 font-medium transition-all",
              tab === key
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "tasks" && (
        <>
      {/* HEDEF ALT KONU & SINAV KAMPI (TOPIC SPRINT & EXAM HUB) */}
      <AreaSprintHub area={area} />
        </>
      )}

      {tab === "roadmap" && <AreaRoadmapTab key={workspace.learningRoadmap?.plan?.id ?? "empty"} area={area} areas={state.areas} />}

      {/* ----------------------------------------------------------- */}
      {/* TAB 1: TASKS (YAPACAĞIM VE YAPTIĞIM GÖREVLER)                */}
      {/* ----------------------------------------------------------- */}
      {tab === "tasks" && (
        <div className="space-y-6">
          {/* Quick Task Bar */}
          <div className="rounded-2xl border bg-card/60 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Plus className="size-3.5 text-primary" />
                Bu Alana Hızlı Görev Ekle
              </span>
              <span className="text-[11px] text-muted-foreground">Girer girmez planla veya havuza bırak</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuickAddTask()}
                placeholder="Örn: 2. Derece Denklemler & Polinomlar 30 soru çöz..."
                className="flex-1 rounded-xl border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex items-center gap-2">
                <select
                  value={quickMinutes}
                  onChange={(e) => setQuickMinutes(Number(e.target.value))}
                  className="rounded-xl border bg-background px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                >
                  <option value="25">25 dk</option>
                  <option value="40">40 dk</option>
                  <option value="50">50 dk</option>
                  <option value="60">60 dk</option>
                  <option value="90">90 dk</option>
                </select>
                <Button size="sm" onClick={handleQuickAddTask} disabled={!quickTitle.trim()} className="rounded-xl text-xs">
                  Ekle
                </Button>
              </div>
            </div>
          </div>

          {/* Sub Filter (All, Pending, Done) */}
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-border/40 pb-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTaskFilter("all")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                  taskFilter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Tümü ({areaTasks.length})
              </button>
              <button
                onClick={() => setTaskFilter("pending")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                  taskFilter === "pending" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Yapacağım Görevler ({pendingTasks.length})
              </button>
              <button
                onClick={() => setTaskFilter("done")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                  taskFilter === "done" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Yaptığım Görevler ({completedTasks.length})
              </button>
            </div>

            <span className="text-xs text-muted-foreground font-mono">
              Toplam: {areaTasks.length} Görev · {totalMinutesCompleted + totalPendingMinutes} dk
            </span>
          </div>

          {/* 1. YAPACAĞIM GÖREVLER (PENDING & SCHEDULED) */}
          {(taskFilter === "all" || taskFilter === "pending") && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Target className="size-4 text-blue-500" />
                  Yapacağım Görevler &amp; Plan
                  <span className="text-xs font-normal text-muted-foreground">({pendingTasks.length} görev · {totalPendingMinutes} dk)</span>
                </h3>
              </div>

              {pendingTasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                  Bu alanda bekleyen görev kalmadı. Yeni bir adım ekleyebilirsin.
                </div>
              ) : (
                <div className="rounded-2xl border bg-card/60 divide-y divide-border/40 overflow-hidden shadow-xs">
                  {pendingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors group"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          onClick={() => handleToggleTask(task)}
                          className="mt-0.5 size-4 rounded border border-muted-foreground/50 hover:border-primary flex items-center justify-center transition shrink-0"
                          title="Tamamlandı olarak işaretle"
                        >
                          <Check className="size-2.5 text-transparent" />
                        </button>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              onClick={() => openEditModal(task)}
                              className="font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer truncate"
                            >
                              {task.title}
                            </span>
                            {task.mandatory ? (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/30 text-amber-500">
                                Öncelikli
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                                İsteğe Bağlı
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{task.goal || task.why}</p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1 font-mono">
                              <Clock className="size-3" /> {task.minutes} dk
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="size-3" />
                              {task.date ? task.date : "Esnek Havuz"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                        <Button size="xs" asChild className="rounded-lg text-[11px]">
                          <Link href={`/focus/${task.id}`}>
                            <Play className="size-2.5 mr-1 fill-current" /> Başla
                          </Link>
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() =>
                            update((curr) => ({
                              ...curr,
                              tasks: curr.tasks.map((t) => (t.id === task.id ? shrinkTask(t) : t)),
                            }))
                          }
                          title="Süreyi yarıya indir"
                          className="rounded-lg text-[11px]"
                        >
                          Küçült
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() =>
                            update((curr) => ({
                              ...curr,
                              tasks: curr.tasks.map((t) =>
                                t.id === task.id ? postponeTask(t, shiftDay(t.date || dayKey(), 1)) : t
                              ),
                            }))
                          }
                          title="Sonraki güne ertele"
                          className="rounded-lg text-[11px]"
                        >
                          +1G
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => openEditModal(task)}
                          className="rounded-lg text-[11px]"
                        >
                          <Pencil className="size-3" />
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() =>
                            update((curr) => ({
                              ...curr,
                              tasks: curr.tasks.map((t) => (t.id === task.id ? dropTask(t) : t)),
                            }))
                          }
                          title="Görevi sil / bırak"
                          className="rounded-lg text-[11px] text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. YAPTIĞIM GÖREVLER (COMPLETED HISTORY & OUTPUTS) */}
          {(taskFilter === "all" || taskFilter === "done") && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  Yaptığım Görevler Geçmişi &amp; Çıktılar
                  <span className="text-xs font-normal text-muted-foreground">({completedTasks.length} görev · {totalMinutesCompleted} dk tamamlandı)</span>
                </h3>
              </div>

              {completedTasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                  Bu alanda henüz tamamlanmış bir görev bulunmuyor. İlk adımı tamamladığında burada listelenecek!
                </div>
              ) : (
                <div className="rounded-2xl border bg-card/60 divide-y divide-border/40 overflow-hidden shadow-xs">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/10 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          onClick={() => handleToggleTask(task)}
                          className="mt-0.5 size-4 rounded bg-emerald-500 border border-emerald-600 flex items-center justify-center text-white shrink-0"
                          title="Görevi geri aç (tamamlanmadı yap)"
                        >
                          <Check className="size-2.5 stroke-[3]" />
                        </button>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-foreground line-through opacity-85">
                              {task.title}
                            </span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Tamamlandı
                            </Badge>
                          </div>
                          {task.goal && (
                            <p className="text-xs text-muted-foreground">
                              🎯 Çıktı: <span className="text-foreground/90 font-medium">{task.goal}</span>
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1 font-mono">
                              <Clock className="size-3" /> {task.minutes} dk odaklanıldı
                            </span>
                            <span>•</span>
                            <span>{task.completedAt ? new Date(task.completedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : (task.date || "Tamamlandı")}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleRepeatTask(task)}
                          className="rounded-lg text-[11px]"
                          title="Bu görevi havuza kopyalayarak tekrarla"
                        >
                          <RotateCcw className="size-3 mr-1" />
                          Tekrarla
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleToggleTask(task)}
                          className="rounded-lg text-[11px]"
                        >
                          Geri Al
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* TAB 2: KOÇLUK & KONU ANALİZİ (COACH, SKILLS & ROADMAP)       */}
      {/* ----------------------------------------------------------- */}
      {tab === "coach" && (
        <div className="space-y-6">
          {/* Real Background Domain Coaching Cockpit */}
          <DomainCoachingCockpit area={area} />

          {/* Domain Coach Guidance Card */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <Sparkles className="size-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {area.name} Koçluk Rehberi &amp; Tavsiyeler
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-xl">
                  {/yks|tyt|ayt|kpss|ales|dgs|sınav|tus/i.test(`${area.name} ${area.goal}`)
                    ? "Altın Üçlü Stratejisi: Yanlış yaptığın konuları tespit et, her hafta 1 deneme analizi yap ve günlük 30-40 soru ile eksikleri kapat."
                    : /kod|yazılım|cyber|siber|programlama|developer|web|flutter/i.test(`${area.name} ${area.goal}`)
                    ? "Build & Ship İlkesi: Sadece video izleme; çalışan küçük bir kod modülü yaz, GitHub'a commit at ve hata ayıklama (debug) notu tut."
                    : /ingilizce|almanca|fransızca|dil|satranç/i.test(`${area.name} ${area.goal}`)
                    ? "Aktif Maruziyet: Günde 20 dk gölgeleme (shadowing), Anki aralıklı tekrar ve refleks geliştiren taktik alıştırmaları yap."
                    : "Feynman Tekniği: Yeni öğrendiğin kavramları basitleştirerek açıkla, eksik kaldığın noktaları tespit et ve vaka analizleriyle pekiştir."}
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="shrink-0 text-xs rounded-xl shadow-xs">
              <Link href="/coach">
                <Sparkles className="size-3.5 mr-1.5" />
                Koç ile Konuş
              </Link>
            </Button>
          </div>

          {/* Konu ve Beceri Haritası */}
          <div className="rounded-2xl border bg-card/60 p-5 shadow-xs space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Award className="size-4 text-primary" />
                {area.name} Konu ve Beceri Haritası
              </h4>
              <p className="text-xs text-muted-foreground">
                Bu alanda ustalaşırken kat ettiğin somut seviyeler ve doğrulanabilir beceri puanları (1-10 skalası).
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {areaSkills.map((skill) => {
                const score = skill.score ?? 5;
                const pct = score * 10;
                return (
                  <div key={skill.id} className="rounded-xl border bg-background/50 p-3.5 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{skill.name}</span>
                      <span className="text-xs font-mono font-bold text-primary">{score} / 10</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {skill.evidence || "Düzenli pratikler ve çözülen problemlerle beceri puanı artırılır."}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stratejik Dönem Yol Haritası */}
          <div className="rounded-2xl border bg-card/60 p-5 shadow-xs space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Compass className="size-4 text-primary" />
                {area.name} Stratejik Yol Haritası
              </h4>
              <p className="text-xs text-muted-foreground">
                Sıfırdan zirveye giden 5 aşamalı gelişim mimarisi ve başarı kriterleri.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-5">
              {[
                { step: 1, title: "1. Başlangıç & Harita", desc: "Ön koşullar, kaynaklar ve temel çalışma rutini.", status: "Aktif Aşama", active: true },
                { step: 2, title: "2. Ara Kontrol & Ritim", desc: "İlk pratik çıktıları ve çalışma ritminin doğrulanması.", status: "Planlandı", active: false },
                { step: 3, title: "3. Yoğun Uygulama", desc: "Bağımsız problem çözme, lablar ve derin odak.", status: "Planlandı", active: false },
                { step: 4, title: "4. Tekrar & Pekiştirme", desc: "Zayıf halkalar, aralıklı tekrar ve hata analizi.", status: "Planlandı", active: false },
                { step: 5, title: "5. Final Zirve & Kanıt", desc: "Nihai portföy çıktısı, deneme veya sertifikasyon.", status: "Planlandı", active: false },
              ].map((phase) => (
                <div
                  key={phase.step}
                  className={cn(
                    "rounded-xl border p-3.5 flex flex-col justify-between min-h-[130px] shadow-2xs",
                    phase.active
                      ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30"
                      : "bg-background/40"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-primary">{phase.step}. Aşama</span>
                      {phase.active && (
                        <span className="px-1.5 py-0.2 bg-primary/20 text-primary rounded text-[9px] font-bold">
                          ŞU ANDA
                        </span>
                      )}
                    </div>
                    <h5 className="text-xs font-bold text-foreground mb-1">{phase.title}</h5>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{phase.desc}</p>
                  </div>
                  <div className="pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
                    {phase.status}
                  </div>
                </div>
              ))}
            </div>

            {deadlines.length > 0 && (
              <div className="pt-3 border-t border-border/40 space-y-2">
                <h5 className="text-xs font-bold text-foreground">Kritik Tarihler &amp; Teslimler</h5>
                <div className="grid gap-2 sm:grid-cols-2">
                  {deadlines.map((dl) => (
                    <div key={dl.id} className="p-2.5 rounded-xl border bg-background/50 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-foreground">{dl.title}</span>
                        <span className="text-[10px] text-muted-foreground block">{dl.date}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {dl.kind}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* TAB 3: SONUÇLAR, KANITLAR & NOTLAR                           */}
      {/* ----------------------------------------------------------- */}
      {tab === "records" && (
        <div className="space-y-6">
          <AreaModules key={area.id + area.kind} area={area} />

          <div className="rounded-2xl border bg-card/60 p-5 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-foreground">
              Notlar &amp; Kaynaklar
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              <AreaText
                key={"notes" + area.id}
                area={area}
                field="notes"
                onSave={(text) =>
                  update((workspaceState) => ({
                    ...workspaceState,
                    areas: workspaceState.areas.map((item) => (item.id === area.id ? { ...item, notes: text } : item)),
                  }))
                }
              />
              <AreaText
                key={"resources" + area.id}
                area={area}
                field="resources"
                onSave={(text) =>
                  update((workspaceState) => ({
                    ...workspaceState,
                    areas: workspaceState.areas.map((item) => (item.id === area.id ? { ...item, resources: text } : item)),
                  }))
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* TASK EDIT / CREATE MODAL */}
      <Dialog open={taskModalOpen} onOpenChange={setTaskModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingTask?.id && state.tasks.some((t) => t.id === editingTask.id)
                ? "Görevi Düzenle"
                : `${area.name} İçin Yeni Görev Ekle`}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Bu alanda tamamlayacağın odak adımını tanımla.
            </DialogDescription>
          </DialogHeader>

          {editingTask && (
            <div className="space-y-3.5 py-2">
              <div className="space-y-1">
                <Label className="text-xs">Görev Başlığı</Label>
                <Input
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  placeholder="Örn: 20 soru pratik seti çöz..."
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Süre (Dakika)</Label>
                  <Input
                    type="number"
                    min={10}
                    max={240}
                    step={5}
                    value={editingTask.minutes}
                    onChange={(e) => setEditingTask({ ...editingTask, minutes: Number(e.target.value) || 30 })}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Planlanan Gün</Label>
                  <Input
                    type="date"
                    value={editingTask.date || ""}
                    onChange={(e) => setEditingTask({ ...editingTask, date: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Çıktı / Öğrenme Hedefi</Label>
                <Input
                  value={editingTask.goal}
                  onChange={(e) => setEditingTask({ ...editingTask, goal: e.target.value })}
                  placeholder="Bu çalışma bitince elinde ne olacak?"
                  className="text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="mandatoryAreaTask"
                  checked={editingTask.mandatory}
                  onChange={(e) => setEditingTask({ ...editingTask, mandatory: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-0"
                />
                <label htmlFor="mandatoryAreaTask" className="text-xs text-muted-foreground cursor-pointer">
                  Bu görev <strong className="text-foreground">Öncelikli</strong> olarak işaretlensin
                </label>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setTaskModalOpen(false)} className="text-xs">
              İptal
            </Button>
            <Button size="sm" onClick={handleSaveModal} disabled={!editingTask?.title.trim()} className="text-xs">
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AreaText({
  area,
  field,
  onSave,
}: {
  area: Area;
  field: "notes" | "resources";
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(area[field] || "");
  const [saved, setSaved] = useState(false);
  const recommendations = field === "resources" ? resourceRecommendations(area) : [];

  return (
    <div className="rounded-2xl border bg-card/60 p-5 shadow-xs space-y-4">
      {recommendations.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
          <h3 className="text-xs font-semibold text-foreground">Önerilen Başlangıç Kaynakları</h3>
          <p className="text-[11px] text-muted-foreground">
            Bu alan için özenle seçilmiş güvenilir dokümanlar ve pratik ortamları.
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {recommendations.map((item) => (
              <button
                type="button"
                key={item.url}
                onClick={() => {
                  setText((curr) => `${curr}${curr ? "\n" : ""}${item.title} — ${item.url}`);
                  setSaved(false);
                }}
                className="rounded-full border border-border/80 bg-background px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                + {item.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-semibold text-foreground">
          {field === "notes" ? "Alan Notları" : "Kaynak Bağlantıları"}
        </label>
        <textarea
          className="w-full min-h-60 rounded-xl border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono leading-relaxed"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setSaved(false);
          }}
          placeholder={field === "resources" ? "Kendi kaynaklarını veya bağlantılarını ekle…" : "Öğrendiklerini, formülleri veya stratejilerini not al…"}
        />
      </div>

      <div className="flex items-center justify-between border-t border-border/40 pt-3">
        <span className="text-[11px] text-muted-foreground">{saved ? "✓ Değişiklikler kaydedildi" : ""}</span>
        <Button
          size="sm"
          onClick={() => {
            onSave(text);
            setSaved(true);
          }}
          className="rounded-xl text-xs"
        >
          {saved ? "Kaydedildi" : "Kaydet"}
        </Button>
      </div>
    </div>
  );
}

function resourceRecommendations(area: Area) {
  const matched = findDomain(area.name) || findDomain(area.kind);
  if (matched && matched.resources && matched.resources.length > 0) {
    return matched.resources.map((r) => {
      const parts = r.split(" — ");
      return {
        title: parts[0]?.trim() || r,
        url: parts[1]?.trim() || "",
      };
    });
  }
  if (area.kind === "math")
    return [
      { title: "Khan Academy Matematik", url: "https://www.khanacademy.org/math" },
      { title: "MIT OpenCourseWare", url: "https://ocw.mit.edu/" },
    ];
  if (area.kind === "cyber")
    return [
      { title: "OWASP Web Security Testing Guide", url: "https://owasp.org/www-project-web-security-testing-guide/" },
      { title: "PortSwigger Web Security Academy", url: "https://portswigger.net/web-security" },
    ];
  if (area.kind === "projects")
    return [
      { title: "MDN Web Docs", url: "https://developer.mozilla.org/" },
      { title: "The Odin Project", url: "https://www.theodinproject.com/" },
    ];
  if (area.kind === "reading") return [{ title: "Goodreads", url: "https://www.goodreads.com/" }];
  return [];
}
