"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace } from "@/components/features/workspace-provider";
import type { Reflection, ResourceRating, Task, TaskStatus } from "@/lib/types";

export function FocusSessionDialog({ task, trigger }: { task: Task; trigger?: React.ReactNode }) {
  const { profile, addFocusSession, updateTask, rateResource } = useWorkspace();
  const [open, setOpen] = useState(false); const [duration, setDuration] = useState(profile.preferredSessionMinutes); const [remaining, setRemaining] = useState(duration * 60); const [running, setRunning] = useState(false); const [stage, setStage] = useState<"timer" | "result">("timer");
  const [status, setStatus] = useState<TaskStatus>("completed"); const [notes, setNotes] = useState(""); const [reflection, setReflection] = useState<Reflection>({ completed: "", struggled: "", usedAi: false, aiLevel: 0, walkthroughUsed: false, learned: "" });
  const [resourceRating, setResourceRating] = useState<ResourceRating | "">("");
  useEffect(() => {
    if (!running) return;
    const tick = window.setInterval(() => setRemaining((value) => {
      if (value > 1) return value - 1;
      window.setTimeout(() => { setRunning(false); setStage("result"); }, 0);
      return 0;
    }), 1000);
    return () => window.clearInterval(tick);
  }, [running]);
  const elapsed = Math.max(1, Math.round((duration * 60 - remaining) / 60));
  function changeDuration(value: string) { const next = Number(value) as 45 | 50 | 60; setDuration(next); setRemaining(next * 60); }
  function reset() { setRunning(false); setRemaining(duration * 60); }
  function save() {
    const completedAt = new Date().toISOString();
    addFocusSession({ id: crypto.randomUUID(), taskId: task.id, durationMinutes: elapsed, status, notes, completedAt });
    updateTask(task.id, { status, completedAt: status === "completed" ? completedAt : undefined, reflection: status === "completed" || status === "partial" || status === "failed" ? reflection : undefined });
    if (resourceRating) [task.theoryResourceId, task.practicalResourceId].filter((id): id is string => Boolean(id)).forEach((id) => rateResource(id, task.id, resourceRating));
    toast.success("Odak oturumu kaydedildi."); setOpen(false); reset(); setStage("timer");
  }
  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0"); const seconds = String(remaining % 60).padStart(2, "0");
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild>{trigger ?? <Button>Oturumu başlat</Button>}</DialogTrigger><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{stage === "timer" ? task.title : "Oturumu tamamla"}</DialogTitle><DialogDescription>{stage === "timer" ? "Tek görev, tek odak bloğu. Durduğunda sonucu kaydet." : "Kanıtlar tazeyken sonucu ve kısa değerlendirmeni kaydet."}</DialogDescription></DialogHeader>{stage === "timer" ? <div className="space-y-6 py-4"><div className="text-center"><p className="metric-number text-6xl font-semibold tracking-tighter">{minutes}:{seconds}</p><p className="mt-2 text-sm text-muted-foreground">{running ? "Göreve odaklan" : "Hazır olduğunda başla"}</p></div><div className="mx-auto max-w-48"><Select value={String(duration)} onValueChange={changeDuration} disabled={running}><SelectTrigger aria-label="Oturum süresi"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="45">45 dakika</SelectItem><SelectItem value="50">50 dakika</SelectItem><SelectItem value="60">60 dakika</SelectItem></SelectContent></Select></div><div className="flex justify-center gap-2"><Button variant="outline" size="icon-lg" onClick={reset} aria-label="Sayacı sıfırla"><RotateCcw /></Button><Button size="icon-lg" onClick={() => setRunning((value) => !value)} aria-label={running ? "Sayacı duraklat" : "Sayacı başlat"}>{running ? <Pause /> : <Play />}</Button><Button variant="secondary" size="icon-lg" onClick={() => { setRunning(false); setStage("result"); }} aria-label="Oturumu bitir"><Square /></Button></div></div> : <div className="space-y-4 py-2"><div className="grid gap-2 sm:grid-cols-2"><div className="space-y-2"><Label>Görev sonucu</Label><Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="completed">Tamamlandı</SelectItem><SelectItem value="partial">Kısmen tamamlandı</SelectItem><SelectItem value="failed">Başarısız</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Kaydedilen süre</Label><div className="flex h-9 items-center rounded-lg border px-3 font-mono text-sm">{elapsed} dk.</div></div></div><Field label="Neyi tamamladın?" value={reflection.completed} onChange={(completed) => setReflection((v) => ({ ...v, completed }))} /><Field label="Nerede zorlandın?" value={reflection.struggled} onChange={(struggled) => setReflection((v) => ({ ...v, struggled }))} /><Field label="Ne öğrendin?" value={reflection.learned} onChange={(learned) => setReflection((v) => ({ ...v, learned }))} /><div className="space-y-2"><Label htmlFor="session-notes">Oturum notları</Label><Textarea id="session-notes" value={notes} onChange={(event) => setNotes(event.target.value)} /></div><div className="space-y-2 rounded-lg border p-3"><Label>Bu kaynaklar işine yaradı mı? (isteğe bağlı)</Label><Select value={resourceRating} onValueChange={(value) => setResourceRating(value as ResourceRating)}><SelectTrigger><SelectValue placeholder="Değerlendirme seç" /></SelectTrigger><SelectContent><SelectItem value="very_useful">Çok faydalı</SelectItem><SelectItem value="useful">Faydalı</SelectItem><SelectItem value="neutral">Nötr</SelectItem><SelectItem value="not_useful">Faydasız</SelectItem></SelectContent></Select></div><div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2"><Check label="Yapay zekâ kullandım" checked={reflection.usedAi} onChange={(usedAi) => setReflection((v) => ({ ...v, usedAi }))} /><Check label="Walkthrough kullandım" checked={reflection.walkthroughUsed} onChange={(walkthroughUsed) => setReflection((v) => ({ ...v, walkthroughUsed }))} />{reflection.usedAi ? <div className="space-y-2 sm:col-span-2"><Label>Yapay zekâ yardım seviyesi</Label><Select value={String(reflection.aiLevel)} onValueChange={(value) => setReflection((v) => ({ ...v, aiLevel: Number(value) as Reflection["aiLevel"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[0,1,2,3,4].map((level) => <SelectItem key={level} value={String(level)}>Seviye {level}</SelectItem>)}</SelectContent></Select></div> : null}</div><Button className="w-full" size="lg" onClick={save}>Oturumu kaydet</Button></div>}</DialogContent></Dialog>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { const id = label.toLowerCase().replaceAll(" ", "-"); return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} /></div>; }
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { const id = label.toLowerCase().replaceAll(" ", "-"); return <div className="flex items-center gap-2"><Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(value === true)} /><Label htmlFor={id}>{label}</Label></div>; }
