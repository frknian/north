"use client";
import Link from "next/link";
import { useWorkspace } from "@/components/features/workspace-provider";
import { initializeNorth, type NorthState, type NorthTask } from "@/lib/north";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Play } from "lucide-react";
export function useNorth() {
  const workspace=useWorkspace();
  return { state:workspace.north ?? initializeNorth(workspace), update:workspace.updateNorth, ready:workspace.ready, workspace };
}
export function Heading({title,description,children}:{title:string;description:string;children?:React.ReactNode}) {
  return <header className="north-page-header"><div><h1>{title}</h1><p>{description}</p></div>{children}</header>;
}
export function TaskRow({task,primary=false}:{task:NorthTask;primary?:boolean}) {
  const {state}=useNorth();const area=state.areas.find(a=>a.id===task.areaId);
  return <article className={primary?"north-focus-card":"north-task-row"}><div className="north-task-copy"><p className="north-task-meta"><span>{area?.icon} {area?.name}</span><span>{task.minutes} dk</span>{task.mandatory&&<span>Öncelikli</span>}</p><h2>{task.title}</h2><p className="north-task-goal">{task.goal}</p></div><div className="north-task-actions"><Button asChild variant={primary?"default":"ghost"}><Link href={`/focus/${task.id}`}>{primary?<><Play size={15}/>Odaklanmaya başla</>:<>Odaklan<ArrowUpRight size={15}/></>}</Link></Button>{task.why&&<details className="text-xs text-muted-foreground"><summary className="cursor-pointer">Neden bu görev?</summary><p className="mt-2 max-w-lg leading-6">{task.why}</p></details>}</div></article>;
}
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Palette, Trophy } from "lucide-react";
import { Input } from "@/components/ui/input";

const COMPANION_COLORS = [
  { id: "blue", label: "Mavi", bg: "bg-blue-500", glow: "rgba(59, 130, 246, 0.7)", border: "border-blue-500" },
  { id: "purple", label: "Mor", bg: "bg-purple-500", glow: "rgba(168, 85, 247, 0.7)", border: "border-purple-500" },
  { id: "emerald", label: "Yeşil", bg: "bg-emerald-500", glow: "rgba(16, 185, 129, 0.7)", border: "border-emerald-500" },
  { id: "amber", label: "Altın", bg: "bg-amber-500", glow: "rgba(245, 158, 11, 0.7)", border: "border-amber-500" },
  { id: "rose", label: "Gül", bg: "bg-rose-500", glow: "rgba(244, 63, 94, 0.7)", border: "border-rose-500" },
  { id: "cyan", label: "Turkuaz", bg: "bg-cyan-500", glow: "rgba(6, 182, 212, 0.7)", border: "border-cyan-500" },
] as const;

export function Companion({ state, compact = false }: { state: NorthState; compact?: boolean }) {
  const workspace = useWorkspace();
  const [open, setOpen] = useState(false);
  const settings = workspace.companionSettings ?? { name: "Yol Arkadaşı", color: "blue" };
  const [nameInput, setNameInput] = useState(settings.name || "Yol Arkadaşı");

  const completed = state.activities.filter(activity => activity.outcome === "done").length;
  const milestones = state.areas.filter(area => area.goal.trim()).length;
  const level = Math.max(1, Math.min(5, 1 + Math.floor((completed + milestones * 2) / 6)));
  const progress = completed + milestones * 2;
  const targetForNext = level * 6;
  const nextLevel = level === 5 ? 0 : Math.max(0, targetForNext - progress);
  const levelTitle = level === 1 ? "Pusula" : level === 2 ? "Yol Arkadaşı" : level === 3 ? "Keşifçi" : level === 4 ? "Rehber" : "Kutup Yıldızı";
  const displayName = settings.name?.trim() || levelTitle;
  const currentColor = COMPANION_COLORS.find(c => c.id === settings.color) || COMPANION_COLORS[0];

  function handleSaveName() {
    const trimmed = nameInput.trim() || levelTitle;
    workspace.updateCompanionSettings({ name: trimmed });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setNameInput(settings.name || levelTitle);
          setOpen(true);
        }}
        className={compact ? "north-companion is-compact cursor-pointer transition-transform hover:scale-105 active:scale-95 text-left" : "north-companion cursor-pointer transition-transform hover:scale-102 active:scale-98 text-left"}
        aria-label={`North yol arkadaşın: ${displayName}, seviye ${level}`}
        title="Yol arkadaşını özelleştir ve büyüme hedeflerini gör"
      >
        <span
          className="north-companion-orb"
          style={{ filter: `drop-shadow(0 0 7px ${currentColor.glow})` }}
          aria-hidden="true"
        >
          <i style={{ background: currentColor.glow }} />
          <i style={{ background: currentColor.glow }} />
          <i style={{ background: currentColor.glow }} />
        </span>
        {!compact && (
          <span>
            <b>{displayName}</b>
            <small>Seviye {level}{nextLevel ? ` · ${nextLevel} adım sonra büyür` : " · Tam gelişti"}</small>
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 sm:p-7">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-lg font-bold">
              {displayName}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Seviye {level} · {levelTitle}
            </DialogDescription>
          </DialogHeader>

          {/* GLOWING ORB SHOWCASE */}
          <div className="my-3 flex flex-col items-center justify-center">
            <div
              className="relative grid size-20 place-items-center rounded-full transition-all duration-300"
              style={{
                background: `radial-gradient(circle, ${currentColor.glow} 0%, rgba(0,0,0,0) 70%)`,
                boxShadow: `0 0 30px ${currentColor.glow}`,
              }}
            >
              <span
                className="north-companion-orb scale-150"
                style={{ filter: `drop-shadow(0 0 10px ${currentColor.glow})` }}
                aria-hidden="true"
              >
                <i style={{ background: currentColor.glow }} />
                <i style={{ background: currentColor.glow }} />
                <i style={{ background: currentColor.glow }} />
              </span>
            </div>
            <p className="mt-3 text-xs font-medium text-foreground">
              {level === 5
                ? "🌟 Yol arkadaşın maksimum gelişim seviyesine ulaştı!"
                : `✨ Bir sonraki aşama için ${nextLevel} adım gerekiyor`}
            </p>
          </div>

          {/* GROWTH REQUIREMENTS */}
          <div className="space-y-2 rounded-xl border bg-muted/20 p-4 text-xs">
            <div className="flex items-center justify-between font-semibold">
              <span className="flex items-center gap-1.5 text-foreground">
                <Trophy className="size-3.5 text-primary" />
                Büyümesi İçin Gerekenler
              </span>
              <span className="text-primary font-mono font-bold">
                {progress} / {targetForNext} Puan
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (progress / targetForNext) * 100)}%`,
                  backgroundColor: currentColor.glow,
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-muted-foreground">
              <div className="rounded-lg border bg-background/60 p-2 text-center">
                <span className="font-semibold text-foreground">{completed} Seans</span>
                <p className="text-[10px] text-muted-foreground">Tamamlanan odak (+1 puan)</p>
              </div>
              <div className="rounded-lg border bg-background/60 p-2 text-center">
                <span className="font-semibold text-foreground">{milestones} Hedef</span>
                <p className="text-[10px] text-muted-foreground">Belirlenen hedef alan (+2 puan)</p>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
              💡 Odak seansı tamamladıkça ve yeni hedef alanlar oluşturdukça yol arkadaşın büyür, küresi parıldar ve unvanı gelişir.
            </p>
          </div>

          {/* RENAME SECTION */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-foreground">
              Yol Arkadaşına İsim Ver
            </label>
            <div className="flex gap-2">
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Örn: Pusulam, Atlas, Sirius, Nova..."
                className="text-xs"
                maxLength={24}
              />
              <Button size="sm" onClick={handleSaveName} className="shrink-0 text-xs">
                Kaydet
              </Button>
            </div>
          </div>

          {/* COLOR PICKER SECTION */}
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Palette className="size-3.5 text-primary" />
              Küre Rengini Seç
            </label>
            <div className="grid grid-cols-6 gap-2">
              {COMPANION_COLORS.map((c) => {
                const isSelected = (settings.color || "blue") === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => workspace.updateCompanionSettings({ color: c.id })}
                    className={`group relative flex flex-col items-center justify-center rounded-xl border p-2.5 transition-all hover:scale-105 ${
                      isSelected ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                    title={c.label}
                  >
                    <span
                      className={`size-5 rounded-full ${c.bg} shadow-sm transition-transform group-hover:scale-110 flex items-center justify-center`}
                      style={{ boxShadow: `0 0 10px ${c.glow}` }}
                    >
                      {isSelected && <Check className="size-3 text-white stroke-[3]" />}
                    </span>
                    <span className="mt-1 text-[9px] font-medium text-muted-foreground group-hover:text-foreground">
                      {c.label.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const fieldClass="north-field";
export function Field({label,children}:{label:string;children:React.ReactNode}) {return <label className="block space-y-1.5 text-sm"><span className="text-muted-foreground">{label}</span>{children}</label>;}

