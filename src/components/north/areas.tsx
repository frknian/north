"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  CirclePause,
  CirclePlay,
  Clock,
  Layers3,
  Pencil,
  Play,
  Plus,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { AreaModules } from "./area-modules";
import { findDomain } from "@/lib/domain-catalog";
import {
  allocation,
  areaAccents,
  areaStatus,
  createArea,
  dayKey,
  isAreaActive,
  kindLabels,
  weekKey,
  type Area,
  type AreaKind,
} from "@/lib/north";
import { useNorth } from "./shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const icons = ["◎", "∑", "⌘", "▤", "♞", "◇", "✦", "◌", "△", "□"];
const priorityLabels: Record<number, string> = { 3: "Yüksek", 2: "Orta", 1: "Düşük", 0: "Bakım" };

export function NorthAreas({ id }: { id?: string }) {
  const { state, update, ready } = useNorth();
  const [draft, setDraft] = useState<Area | null>(null);
  const [managing, setManaging] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [tab, setTab] = useState("overview");
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
    <div className="page-content space-y-6 pb-20">
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
              const hasRecords =
                state.tasks.some((task) => task.areaId === area.id) ||
                state.activities.some((activity) => activity.areaId === area.id) ||
                state.events.some((event) => event.areaId === area.id);

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
                      size="icon-xs"
                      variant="ghost"
                      disabled={hasRecords}
                      title={hasRecords ? "Kayıt içeren alan silinemez; arşivleyebilirsin." : "Alanı sil"}
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        update((workspace) => ({
                          ...workspace,
                          areas: workspace.areas.filter((item) => item.id !== area.id),
                        }))
                      }
                    >
                      <Trash2 className="size-3.5" />
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

          <div className="grid gap-4 md:grid-cols-2">
            {visibleAreas.map((area) => (
              <AreaCard key={area.id} area={area} />
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

function AreaCard({ area }: { area: Area }) {
  const { state } = useNorth();
  const minutes = state.activities
    .filter((activity) => activity.areaId === area.id && activity.date >= weekKey() && activity.date <= dayKey())
    .reduce((total, activity) => total + activity.minutes, 0);
  const nextTask = state.tasks.find((task) => task.areaId === area.id && ["pending", "partial"].includes(task.status));
  const status = areaStatus(area);
  const targetAlloc = allocation(state, area);
  const percent = targetAlloc > 0 ? Math.min(100, Math.round((minutes / targetAlloc) * 100)) : 0;

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
              <Link href={`/areas/${area.id}`} className="text-base font-semibold text-foreground hover:text-primary transition-colors">
                {area.name}
              </Link>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {status === "paused" ? "Duraklatıldı" : status === "archived" ? "Arşivlendi" : `${priorityLabels[area.priority] ?? "Orta"} öncelik`}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {minutes} / {targetAlloc} dk
          </Badge>
        </div>

        <div className="mt-4 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ana Hedef</span>
          <p className="text-xs text-foreground leading-relaxed">
            {area.goal || "Bu alan için henüz bir ana hedef tanımlanmadı."}
          </p>
        </div>

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

      <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs">
        <p className="truncate text-muted-foreground text-[11px] max-w-[200px]">
          {nextTask ? `Sıradaki: ${nextTask.title}` : "Sıradaki adımı belirle"}
        </p>
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
      <div className="grid gap-3 sm:grid-cols-2 text-xs">
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
  const tasks = state.tasks.filter((task) => task.areaId === area.id);
  const deadlines = [
    ...state.events
      .filter((event) => event.areaId === area.id && ["deadline", "exam"].includes(event.kind))
      .map((e) => ({ id: e.id, title: e.title, date: e.date })),
    ...tasks
      .filter((task) => task.deadline)
      .map((task) => ({ id: task.id, title: task.title, date: task.deadline! })),
  ].toSorted((a, b) => a.date.localeCompare(b.date));

  const tabList = [
    ["overview", "Genel Bakış"],
    ["plan", "Plan"],
    ["records", /yks|tyt|kpss|banka|sınav|ayt|ales|dgs/i.test(`${area.name} ${area.goal}`) ? "Sınav & Kanıtlar" : "Kayıt & Kanıtlar"],
    ["progress", "İlerleme"],
    ["resources", "Kaynaklar"],
    ["notes", "Notlar"],
  ];

  return (
    <div className="page-content space-y-6 pb-20">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <span
            className="grid size-10 place-items-center rounded-xl border text-xl bg-background shadow-xs font-bold"
            style={{ borderColor: area.accent ?? areaAccents[0] }}
          >
            {area.icon}
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{area.name}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {area.description || area.goal || "Bu alanın yönünü ve planını yönet."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} className="rounded-xl text-xs">
            <Pencil className="size-3.5 mr-1" /> Alanı Düzenle
          </Button>
          <Button asChild size="sm" className="rounded-xl text-xs">
            <Link href="/week">Haftayı Planla</Link>
          </Button>
        </div>
      </header>

      {draft && (
        <AreaEditor draft={draft} setDraft={setDraft} onSave={saveArea} onCancel={() => setDraft(null)} />
      )}

      {/* Pill tabs */}
      <div className="flex flex-wrap gap-1 rounded-2xl border bg-muted/40 p-1 text-xs max-w-fit">
        {tabList.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "rounded-xl px-3.5 py-1.5 font-medium transition-all",
              tab === key
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border bg-card/60 p-5 shadow-xs space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ana Hedef</span>
              <h2 className="text-base font-semibold text-foreground">{area.goal || "Henüz hedef tanımlanmadı"}</h2>
              <p className="text-xs text-muted-foreground">
                {priorityLabels[area.priority] ?? "Orta"} öncelik · {area.weeklyMinutes} dk/hafta hedef · {area.preferredSessionMinutes ?? 50} dk oturum
              </p>
              <Button asChild size="sm" className="rounded-xl text-xs mt-2">
                <Link href="/week">Bu Alanı Planla →</Link>
              </Button>
            </div>

            <div className="rounded-2xl border bg-card/60 p-5 shadow-xs space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Aktif Görevler &amp; Kritik Tarihler</span>
              <p className="text-xl font-bold font-mono">
                {tasks.filter((task) => ["pending", "partial"].includes(task.status)).length} <span className="text-xs font-normal text-muted-foreground">bekleyen görev</span>
              </p>
              <div className="space-y-1">
                {deadlines.slice(0, 3).map((deadline) => (
                  <p key={deadline.id} className="text-xs text-muted-foreground">
                    📅 {deadline.date} · {deadline.title}
                  </p>
                ))}
                {!deadlines.length && <p className="text-xs text-muted-foreground">Yaklaşan son tarih yok.</p>}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <AreaModules key={area.id + area.kind} area={area} />
          </div>
        </div>
      )}

      {tab === "records" && (
        <div className="mt-2">
          <AreaModules key={area.id + area.kind} area={area} />
        </div>
      )}

      {tab === "plan" && (
        <div className="rounded-2xl border bg-card/60 divide-y divide-border/40 overflow-hidden shadow-xs">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between gap-4 p-4 text-xs">
              <div>
                <p className="font-semibold text-foreground text-sm">{task.title}</p>
                <p className="text-muted-foreground mt-0.5">{task.goal} · {task.minutes} dk</p>
              </div>
              <Button size="xs" variant={task.status === "done" ? "outline" : "default"} asChild className="rounded-xl text-[11px]">
                <Link href={task.status === "done" ? "/week" : `/focus/${task.id}`}>
                  {task.status === "done" ? "Tamamlandı" : "Başla →"}
                </Link>
              </Button>
            </div>
          ))}
          {tasks.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">Bu alan için atanmış görev yok.</p>
          )}
        </div>
      )}

      {(tab === "notes" || tab === "resources") && (
        <AreaText
          key={tab + area.id}
          area={area}
          field={tab}
          onSave={(text) =>
            update((workspace) => ({
              ...workspace,
              areas: workspace.areas.map((item) => (item.id === area.id ? { ...item, [tab]: text } : item)),
            }))
          }
        />
      )}

      {tab === "progress" && (
        <div className="rounded-2xl border bg-card/60 p-6 shadow-xs space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">İlerleme Ölçütü</span>
          <h2 className="text-xl font-bold font-mono text-foreground">
            {state.activities
              .filter((activity) => activity.areaId === area.id && activity.metric === area.metric)
              .reduce((total, activity) => total + activity.amount, 0)}{" "}
            {area.target > 0 ? `/ ${area.target}` : ""} {area.metric}
          </h2>
          <p className="text-xs text-muted-foreground">
            Haftalık {allocation(state, area)} dakika gerçek çalışma üzerinden otomatik hesaplanır.
          </p>
          <Button asChild variant="outline" size="sm" className="rounded-xl text-xs">
            <Link href="/progress">Genel İlerleme Raporunu Aç →</Link>
          </Button>
        </div>
      )}
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
