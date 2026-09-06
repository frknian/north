"use client";

import { useState } from "react";
import { BatteryCharging, CheckCircle2, Clock3, TriangleAlert } from "lucide-react";
import { useWorkspace } from "@/components/features/workspace-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CheckinOutcome, EnergyLevel } from "@/lib/types";
import { dayKey } from "@/lib/north";

export function DailyCheckinCard() {
  const workspace = useWorkspace();
  const today = dayKey();
  const saved = workspace.coaching.checkins.find((item) => item.date === today);
  const [minutes, setMinutes] = useState<"30" | "45" | "60" | "90">(String(saved?.availableMinutes ?? 45) as "30" | "45" | "60" | "90");
  const [energy, setEnergy] = useState<EnergyLevel>(saved?.energy ?? "medium");
  const [outcome, setOutcome] = useState<CheckinOutcome>(saved?.outcome ?? "ready");
  const [blocker, setBlocker] = useState(saved?.blocker ?? "");
  const [note, setNote] = useState(saved?.note ?? "");

  return <Card className="border-primary/20"><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><BatteryCharging className="size-5 text-primary" /> Günlük check-in</CardTitle><CardDescription>Koç bugünkü görevi süre, enerji ve engeline göre ayarlar.</CardDescription></div>{saved ? <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="size-4" /> Kaydedildi</span> : null}</div></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><Field label="Süren"><Select value={minutes} onValueChange={(value) => setMinutes(value as typeof minutes)}><SelectTrigger><Clock3 /><SelectValue /></SelectTrigger><SelectContent>{[30,45,60,90].map((value) => <SelectItem key={value} value={String(value)}>{value} dk.</SelectItem>)}</SelectContent></Select></Field><Field label="Enerjin"><Select value={energy} onValueChange={(value) => setEnergy(value as EnergyLevel)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Düşük</SelectItem><SelectItem value="medium">Orta</SelectItem><SelectItem value="high">Yüksek</SelectItem></SelectContent></Select></Field><Field label="Bugünkü durum"><Select value={outcome} onValueChange={(value) => setOutcome(value as CheckinOutcome)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ready">Çalışmaya hazırım</SelectItem><SelectItem value="stuck">Bir yerde takıldım</SelectItem><SelectItem value="completed">Dünkü işi tamamladım</SelectItem><SelectItem value="rest">Bugün dinlenmem gerek</SelectItem></SelectContent></Select></Field><Field label="Ana engel"><Textarea className="min-h-9" value={blocker} onChange={(event) => setBlocker(event.target.value)} placeholder="Zaman, konu, teknik hata…" /></Field><div className="flex items-end"><Button className="w-full" onClick={() => workspace.saveCheckin({ availableMinutes: Number(minutes) as 30 | 45 | 60 | 90, energy, outcome, blocker: blocker.trim() || undefined, note: note.trim() || undefined })}><TriangleAlert /> Koça aktar</Button></div><div className="sm:col-span-2 lg:col-span-5"><Textarea className="min-h-16" value={note} onChange={(event) => setNote(event.target.value)} placeholder="İstersen dünden kalan kısa notunu buraya ekle." /></div></CardContent></Card>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
