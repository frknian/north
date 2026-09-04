"use client";

import { useState } from "react";
import { Bot, Send, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace } from "@/components/features/workspace-provider";
import type { Lab } from "@/lib/types";
import { authenticatedAiFetch } from "@/lib/ai/client";

const fields: { key: keyof Lab; label: string; placeholder: string }[] = [
  { key: "target", label: "Target", placeholder: "Authorized target and scope" }, { key: "recon", label: "Recon", placeholder: "Reachability, initial ports, environment" },
  { key: "enumeration", label: "Enumeration", placeholder: "Services, versions, users, shares, endpoints" }, { key: "attackSurface", label: "Attack surface", placeholder: "Evidence-backed entry points" },
  { key: "attempts", label: "Attempts", placeholder: "Hypotheses tested and exact results" }, { key: "exploitation", label: "Exploitation", placeholder: "Authorized exploit path, if completed" },
  { key: "privilegeEscalation", label: "Privilege escalation", placeholder: "Local enumeration and path" }, { key: "result", label: "Result", placeholder: "Completed, partial, or failed outcome" },
  { key: "stuck", label: "Where I got stuck", placeholder: "The exact reasoning gap" }, { key: "learned", label: "What I learned", placeholder: "Reusable mental model" },
  { key: "notes", label: "Notes", placeholder: "Commands, references, follow-up" },
];

export function LabJournalDialog({ lab, trigger }: { lab: Lab; trigger: React.ReactNode }) {
  const { updateLab } = useWorkspace(); const [draft, setDraft] = useState(lab); const [question, setQuestion] = useState(""); const [answer, setAnswer] = useState(""); const [asking, setAsking] = useState(false);
  async function save() {
    let next = draft;
    if (draft.status === "completed") {
      try { const response = await authenticatedAiFetch("/api/ai/lab-summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: draft.name, recon: draft.recon, enumeration: draft.enumeration, attempts: draft.attempts, result: draft.result, stuck: draft.stuck, learned: draft.learned }) }); if (response.ok) { const data = await response.json() as { keyLearnings: string[] }; next = { ...draft, keyLearnings: data.keyLearnings.slice(0,3) }; setDraft(next); } } catch { /* Journal still saves when summary generation is unavailable. */ }
    }
    updateLab(lab.id, next); toast.success("Lab journal saved.");
  }
  async function askMentor() {
    setAsking(true); setAnswer("");
    try { const response = await authenticatedAiFetch("/api/ai/mentor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestedLevel: draft.aiAssistanceLevel, question, lab: { name: draft.name, platform: draft.platform, target: draft.target, recon: draft.recon, enumeration: draft.enumeration, attempts: draft.attempts, stuck: draft.stuck } }) }); const data = await response.json() as { answer?: string; error?: string }; if (!response.ok) throw new Error(data.error); setAnswer(data.answer ?? "No response"); }
    catch { toast.error("Mentor could not respond."); } finally { setAsking(false); }
  }
  return <Dialog><DialogTrigger asChild>{trigger}</DialogTrigger><DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl"><DialogHeader><div className="flex flex-wrap items-center gap-2"><DialogTitle>{lab.name}</DialogTitle><Badge variant="outline">{lab.platform}</Badge></div><DialogDescription>Capture evidence as you work. The mentor sees only this journal and your selected help level.</DialogDescription></DialogHeader><Tabs defaultValue="journal"><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="journal">Lab journal</TabsTrigger><TabsTrigger value="mentor">AI mentor</TabsTrigger></TabsList><TabsContent value="journal" className="mt-5 space-y-5">{draft.keyLearnings.length ? <div className="rounded-lg border border-primary/20 bg-primary/5 p-4"><p className="mb-2 text-xs font-medium uppercase tracking-wide text-primary">Key learnings</p><ul className="space-y-1 text-sm">{draft.keyLearnings.map((item) => <li key={item}>• {item}</li>)}</ul></div> : null}<div className="grid gap-4 sm:grid-cols-2">{fields.map((field) => <div className={field.key === "notes" ? "space-y-2 sm:col-span-2" : "space-y-2"} key={field.key}><Label htmlFor={`${lab.id}-${field.key}`}>{field.label}</Label><Textarea id={`${lab.id}-${field.key}`} placeholder={field.placeholder} value={String(draft[field.key] ?? "")} onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))} /></div>)}</div><div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-3"><div className="space-y-2"><Label>Status</Label><Select value={draft.status} onValueChange={(value) => setDraft((current) => ({ ...current, status: value as Lab["status"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="planned">Planned</SelectItem><SelectItem value="attempted">Attempted</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>AI assistance</Label><Select value={String(draft.aiAssistanceLevel)} onValueChange={(value) => setDraft((current) => ({ ...current, aiAssistanceLevel: Number(value) as Lab["aiAssistanceLevel"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[0,1,2,3,4].map((level) => <SelectItem key={level} value={String(level)}>Level {level}</SelectItem>)}</SelectContent></Select></div><div className="flex items-end"><div className="flex h-9 items-center gap-2"><Checkbox id={`walkthrough-${lab.id}`} checked={draft.walkthroughUsed} onCheckedChange={(value) => setDraft((current) => ({ ...current, walkthroughUsed: value === true }))} /><Label htmlFor={`walkthrough-${lab.id}`}>Walkthrough used</Label></div></div></div><Button onClick={() => void save()} className="w-full sm:w-auto">Save journal</Button></TabsContent><TabsContent value="mentor" className="mt-5 space-y-4"><div className="flex gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4"><ShieldAlert className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="text-sm font-medium">Authorized environments only</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Mentor guidance is limited to legal labs, CTFs, sandboxes and systems you own or are explicitly authorized to test.</p></div></div><div className="space-y-2"><Label>Help level</Label><Select value={String(draft.aiAssistanceLevel)} onValueChange={(value) => setDraft((current) => ({ ...current, aiAssistanceLevel: Number(value) as Lab["aiAssistanceLevel"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">Level 0 · No help</SelectItem><SelectItem value="1">Level 1 · Small hint</SelectItem><SelectItem value="2">Level 2 · Direction</SelectItem><SelectItem value="3">Level 3 · Guided steps</SelectItem><SelectItem value="4">Level 4 · Full explanation</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label htmlFor={`mentor-${lab.id}`}>What have you tried?</Label><Textarea id={`mentor-${lab.id}`} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="I found ports 139/445 and listed shares, but I do not know what evidence to collect next…" /></div><Button onClick={() => void askMentor()} disabled={asking || question.trim().length < 2}><Send />{asking ? "Evaluating…" : "Ask for next step"}</Button>{answer ? <div className="flex gap-3 rounded-lg border bg-muted/25 p-4"><Bot className="mt-0.5 size-5 shrink-0 text-primary" /><p className="text-sm leading-6">{answer}</p></div> : null}</TabsContent></Tabs></DialogContent></Dialog>;
}
