"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useWorkspace } from "@/components/features/workspace-provider";
import { initializeNorth, type NorthState, type NorthTask } from "@/lib/north";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  Play,
  Pause,
  RotateCcw,
  Palette,
  Trophy,
  Check,
  Crown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  CompanionAvatar,
  COMPANION_COLORS,
  COMPANION_OUTFITS,
  GROWTH_STAGES,
} from "./companion-avatar";

export function useNorth() {
  const workspace = useWorkspace();
  return { state: workspace.north ?? initializeNorth(workspace), update: workspace.updateNorth, ready: workspace.ready, workspace };
}

export function Heading({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return <header className="north-page-header"><div><h1>{title}</h1><p>{description}</p></div>{children}</header>;
}

export function TaskRow({ task, primary = false }: { task: NorthTask; primary?: boolean }) {
  const { state } = useNorth();
  const area = state.areas.find(a => a.id === task.areaId);
  return (
    <article className={primary ? "north-focus-card" : "north-task-row"}>
      <div className="north-task-copy">
        <p className="north-task-meta">
          <span>{area?.icon} {area?.name}</span>
          <span>{task.minutes} dk</span>
          {task.mandatory && <span>Öncelikli</span>}
        </p>
        <h2>{task.title}</h2>
        <p className="north-task-goal">{task.goal}</p>
      </div>
      <div className="north-task-actions">
        <Button asChild variant={primary ? "default" : "ghost"}>
          <Link href={`/focus/${task.id}`}>
            {primary ? <><Play size={15} />Odaklanmaya başla</> : <>Odaklan<ArrowUpRight size={15} /></>}
          </Link>
        </Button>
        {task.why && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer">Neden bu görev?</summary>
            <p className="mt-2 max-w-lg leading-6">{task.why}</p>
          </details>
        )}
      </div>
    </article>
  );
}

export function CompanionModal({
  open,
  onOpenChange,
  state,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: NorthState;
}) {
  const workspace = useWorkspace();
  const settings = workspace.companionSettings ?? { name: "Yol Arkadaşı", color: "blue", outfit: "none" };
  const [nameInput, setNameInput] = useState(settings.name || "Yol Arkadaşı");

  const completed = state.activities.filter(activity => activity.outcome === "done").length;
  const milestones = state.areas.filter(area => area.goal.trim()).length;
  const actualLevel = Math.max(1, Math.min(5, 1 + Math.floor((completed + milestones * 2) / 6)));
  const progress = completed + milestones * 2;
  const targetForNext = actualLevel * 6;

  const [previewLevel, setPreviewLevel] = useState<number>(actualLevel);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!isSimulating) setPreviewLevel(actualLevel);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [actualLevel, isSimulating]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (open) {
        setNameInput(settings.name || "Yol Arkadaşı");
        setPreviewLevel(actualLevel);
        setIsSimulating(false);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open, settings.name, actualLevel]);

  useEffect(() => {
    if (isSimulating) {
      simTimerRef.current = setInterval(() => {
        setPreviewLevel((prev) => {
          if (prev >= 5) {
            setIsSimulating(false);
            return 5;
          }
          return prev + 1;
        });
      }, 950);
    } else if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isSimulating]);

  const activeStage = GROWTH_STAGES.find(s => s.level === previewLevel) || GROWTH_STAGES[0];
  const actualStage = GROWTH_STAGES.find(s => s.level === actualLevel) || GROWTH_STAGES[0];
  const levelTitle = actualStage.title;
  const displayName = settings.name?.trim() || levelTitle;
  const currentColor = COMPANION_COLORS.find(c => c.id === settings.color) || COMPANION_COLORS[0];
  const currentOutfit = settings.outfit ?? "none";

  function handleSaveName() {
    const trimmed = nameInput.trim() || levelTitle;
    workspace.updateCompanionSettings({ name: trimmed });
  }

  function startSimulation() {
    if (isSimulating) {
      setIsSimulating(false);
      return;
    }
    setPreviewLevel(1);
    setIsSimulating(true);
  }

  function selectStage(lvl: number) {
    setIsSimulating(false);
    setPreviewLevel(lvl);
  }

  function resetToActual() {
    setIsSimulating(false);
    setPreviewLevel(actualLevel);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-5 sm:p-6 bg-card text-card-foreground border border-border shadow-2xl">
          <DialogHeader className="text-center sm:text-center pb-1">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
              <span>{displayName}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                Seviye {actualLevel} · {levelTitle}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Yol arkadaşının gövde rengini değiştir, kıyafet giydir ve gelişim aşamalarını simüle et.
            </DialogDescription>
          </DialogHeader>

          {/* INTERACTIVE 3D AVATAR SHOWCASE & SIMULATION PREVIEW */}
          <div className="relative my-1 flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-b from-primary/10 via-primary/5 to-transparent border border-border/60">
            <div className="relative flex items-center justify-center py-2">
              <CompanionAvatar
                color={settings.color || "blue"}
                outfit={currentOutfit}
                level={previewLevel}
                size={96}
                animate
              />
            </div>

            {/* Current Stage Indicator */}
            <div className="mt-2 flex flex-col items-center text-center">
              <div className="flex items-center gap-2">
                <span className="text-sm">{activeStage.badge}</span>
                <span className="text-xs font-bold text-foreground">
                  Seviye {previewLevel}: {activeStage.title}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  ({activeStage.subtitle})
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground max-w-sm leading-relaxed">
                {activeStage.description}
              </p>
            </div>

            {/* SIMULATION CONTROLS */}
            <div className="mt-3.5 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={isSimulating ? "destructive" : "default"}
                onClick={startSimulation}
                className="h-8 text-xs font-semibold gap-1.5 shadow-sm"
              >
                {isSimulating ? (
                  <>
                    <Pause className="size-3.5" />
                    Simülasyonu Durdur
                  </>
                ) : (
                  <>
                    <Play className="size-3.5 fill-current" />
                    Büyümeyi Simüle Et
                  </>
                )}
              </Button>

              {previewLevel !== actualLevel && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={resetToActual}
                  className="h-8 text-xs gap-1.5 border-border text-muted-foreground hover:text-foreground"
                  title="Gerçek seviyene geri dön"
                >
                  <RotateCcw className="size-3" />
                  Gerçek Seviyem ({actualLevel})
                </Button>
              )}
            </div>

            {/* STAGE SELECTOR BUTTONS (1 - 5) */}
            <div className="mt-3 flex items-center gap-1.5">
              {GROWTH_STAGES.map((s) => {
                const isActive = previewLevel === s.level;
                const isReal = actualLevel === s.level;
                return (
                  <button
                    key={s.level}
                    type="button"
                    onClick={() => selectStage(s.level)}
                    className={`relative flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm scale-105"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50"
                    }`}
                  >
                    <span>{s.badge}</span>
                    <span>L{s.level}</span>
                    {isReal && (
                      <span
                        className={`size-1.5 rounded-full ${isActive ? "bg-white" : "bg-primary"}`}
                        title="Mevcut gerçek seviyen"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* OUTFIT WARDROBE (BASİT KIYAFETLER & AKSESUARLAR) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Crown className="size-3.5 text-primary" />
                Kıyafet & Aksesuar Dolabı
              </label>
              <span className="text-[11px] text-muted-foreground font-medium">
                {COMPANION_OUTFITS.find(o => o.id === currentOutfit)?.label}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {COMPANION_OUTFITS.map((o) => {
                const isEquipped = currentOutfit === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => workspace.updateCompanionSettings({ outfit: o.id })}
                    className={`group relative flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all hover:scale-102 active:scale-98 ${
                      isEquipped
                        ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                        : "border-border/70 hover:border-primary/40 bg-card hover:bg-muted/20"
                    }`}
                    title={o.description}
                  >
                    <span className="text-xl mb-1 transition-transform group-hover:scale-110">
                      {o.icon}
                    </span>
                    <span className="text-[10px] font-semibold text-foreground line-clamp-1">
                      {o.label}
                    </span>
                    {isEquipped && (
                      <span className="absolute top-1 right-1 size-3.5 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                        <Check className="size-2.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* COLOR PICKER (GÖVDE & KÜRE RENGİ) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Palette className="size-3.5 text-primary" />
                Gövde & Küre Rengi
              </label>
              <span className="text-[11px] text-muted-foreground font-medium">
                {currentColor.label}
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {COMPANION_COLORS.map((c) => {
                const isSelected = (settings.color || "blue") === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => workspace.updateCompanionSettings({ color: c.id })}
                    className={`group relative flex flex-col items-center justify-center rounded-xl border p-2 transition-all hover:scale-105 ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/25 bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                    title={c.label}
                  >
                    {/* Circle preview with actual body radial gradient */}
                    <span
                      className="size-6 rounded-full shadow-sm transition-transform group-hover:scale-110 flex items-center justify-center border border-white/20"
                      style={{
                        background: `radial-gradient(circle at 35% 30%, ${c.gradientStart} 0%, ${c.gradientMid} 50%, ${c.gradientEnd} 100%)`,
                        boxShadow: `0 0 10px ${c.glow}`,
                      }}
                    >
                      {isSelected && <Check className="size-3 text-white stroke-[3] drop-shadow" />}
                    </span>
                    <span className="mt-1 text-[9px] font-medium text-muted-foreground group-hover:text-foreground line-clamp-1">
                      {c.label.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* REAL GROWTH PROGRESS & REQUIREMENTS */}
          <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3.5 text-xs">
            <div className="flex items-center justify-between font-semibold">
              <span className="flex items-center gap-1.5 text-foreground">
                <Trophy className="size-3.5 text-primary" />
                Büyüme İlerlemen (Gerçek Seviye {actualLevel})
              </span>
              <span className="text-primary font-mono font-bold">
                {progress} / {targetForNext} Puan
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40 border border-border/40">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (progress / targetForNext) * 100)}%`,
                  backgroundColor: currentColor.glow,
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-0.5 text-[11px] text-muted-foreground">
              <div className="rounded-lg border border-border/60 bg-background/80 p-2 text-center">
                <span className="font-semibold text-foreground">{completed} Seans</span>
                <p className="text-[10px] text-muted-foreground">Tamamlanan odak (+1 puan)</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/80 p-2 text-center">
                <span className="font-semibold text-foreground">{milestones} Hedef</span>
                <p className="text-[10px] text-muted-foreground">Belirlenen hedef alan (+2 puan)</p>
              </div>
            </div>

            <p className="text-[10.5px] text-muted-foreground leading-relaxed">
              💡 Odak seansı tamamladıkça ve yeni hedef alanlar oluşturdukça yol arkadaşın büyür, yeni auralar kazanır ve unvanı gelişir.
            </p>
          </div>

          {/* RENAME SECTION */}
          <div className="space-y-1.5 pt-0.5">
            <label className="text-xs font-semibold text-foreground">
              Yol Arkadaşına İsim Ver
            </label>
            <div className="flex gap-2">
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Örn: Pusulam, Atlas, Sirius, Nova..."
                className="text-xs bg-background border-border"
                maxLength={24}
              />
              <Button size="sm" onClick={handleSaveName} className="shrink-0 text-xs">
                Kaydet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  );
}

export function Companion({ state, compact = false }: { state: NorthState; compact?: boolean }) {
  const workspace = useWorkspace();
  const [open, setOpen] = useState(false);
  const settings = workspace.companionSettings ?? { name: "Yol Arkadaşı", color: "blue", outfit: "none" };
  const completed = state.activities.filter(activity => activity.outcome === "done").length;
  const milestones = state.areas.filter(area => area.goal.trim()).length;
  const actualLevel = Math.max(1, Math.min(5, 1 + Math.floor((completed + milestones * 2) / 6)));
  const progress = completed + milestones * 2;
  const targetForNext = actualLevel * 6;
  const nextLevelSteps = actualLevel === 5 ? 0 : Math.max(0, targetForNext - progress);
  const actualStage = GROWTH_STAGES.find(s => s.level === actualLevel) || GROWTH_STAGES[0];
  const displayName = settings.name?.trim() || actualStage.title;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={compact ? "north-companion is-compact cursor-pointer transition-transform hover:scale-105 active:scale-95 text-left" : "north-companion cursor-pointer transition-transform hover:scale-102 active:scale-98 text-left"}
        aria-label={`North yol arkadaşın: ${displayName}, seviye ${actualLevel}`}
        title="Yol arkadaşını özelleştir, kıyafet giydir ve büyüme simülasyonunu gör"
      >
        <CompanionAvatar
          color={settings.color || "blue"}
          outfit={settings.outfit ?? "none"}
          level={actualLevel}
          size={compact ? 32 : 36}
          animate
        />
        {!compact && (
          <span>
            <b>{displayName}</b>
            <small>Seviye {actualLevel}{nextLevelSteps ? ` · ${nextLevelSteps} adım sonra büyür` : " · Tam gelişti"}</small>
          </span>
        )}
      </button>

      <CompanionModal open={open} onOpenChange={setOpen} state={state} />
    </>
  );
}

export const fieldClass = "north-field";
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
