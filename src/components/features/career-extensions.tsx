"use client";
import { useState } from "react";
import { useWorkspace } from "@/components/features/workspace-provider";
import { authenticatedAiFetch } from "@/lib/ai/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { JobApplication } from "@/lib/types";

export function CareerExtensions({ section }: { section: "portfolio" | "applications" }) {
  const w = useWorkspace();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [readme, setReadme] = useState("");
  const [draft, setDraft] = useState<JobApplication | null>(null);
  async function sync() {
    setBusy(true); setError("");
    try {
      const response = await authenticatedAiFetch("/api/github/repository", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const existing = w.portfolio.find(p => p.url?.toLowerCase() === data.url.toLowerCase());
      const fields = { title: data.title, url: data.url, description: data.description, lastCommitAt: data.lastCommitAt };
      if (existing) w.updatePortfolioProject(existing.id, fields); else w.addPortfolioProject({ ...fields, id: crypto.randomUUID(), skills: [], status: "published", readmeQuality: 0, securityRelevance: 0 });
      setReadme(data.readme || "Bu repoda README bulunamadı.");
    } catch (e) { setError(e instanceof Error ? e.message : "Bağlantı kurulamadı."); } finally { setBusy(false); }
  }
  if (section === "portfolio") return <section className="surface space-y-4 p-5"><h2 className="font-medium">GitHub portföy bağlantısı</h2><p className="text-sm text-muted-foreground">Herkese açık repo adresinden açıklama, son commit ve README alınır. Yeniden eşitlemek için aynı adresi kullan.</p><div className="flex flex-wrap gap-2"><Input className="flex-1" aria-label="GitHub repo adresi" placeholder="https://github.com/kullanici/repo" value={url} onChange={e => setUrl(e.target.value)} /><Button disabled={busy || !url.trim()} onClick={() => void sync()}>{busy ? "Alınıyor…" : "GitHub’dan eşitle"}</Button></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{readme && <details><summary className="cursor-pointer text-sm">Son alınan README</summary><pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs">{readme}</pre></details>}{w.portfolio.map(p => <details key={p.id} className="border-t pt-3"><summary className="cursor-pointer text-sm">{p.title} · Beceri bağlantıları</summary><p className="my-2 text-xs text-muted-foreground">Son commit: {p.lastCommitAt ? new Date(p.lastCommitAt).toLocaleDateString("tr-TR") : "Henüz alınmadı"}</p>{p.url?.startsWith("https://") && <a className="text-sm text-primary" href={p.url} target="_blank" rel="noreferrer">Repoyu aç ↗</a>}<div className="mt-3 flex flex-wrap gap-3">{w.skills.map(s => <label key={s.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.skills.includes(s.name)} onChange={e => w.updatePortfolioProject(p.id, { skills: e.target.checked ? [...p.skills, s.name] : p.skills.filter(name => name !== s.name) })} />{s.name}</label>)}</div></details>)}</section>;
  return <section className="surface space-y-4 p-5"><div className="flex justify-between"><h2 className="font-medium">Başvuru ayrıntıları ve takip</h2><Button onClick={() => setDraft({ id: crypto.randomUUID(), company: "", position: "", stage: "saved", appliedAt: "", remote: "remote" })}>Başvuru ekle</Button></div>{draft && <div className="space-y-3"><Input aria-label="Şirket" placeholder="Şirket" value={draft.company} onChange={e => setDraft({ ...draft, company: e.target.value })} /><Input aria-label="Pozisyon" placeholder="Pozisyon" value={draft.position} onChange={e => setDraft({ ...draft, position: e.target.value })} />{([['cvVersion','CV sürümü'],['contact','İletişim'],['interviewAt','Görüşme tarihi'],['followUpAt','Takip tarihi']] as const).map(([key,label]) => <label key={key} className="block text-sm">{label}<Input type={key.endsWith('At') ? 'date' : 'text'} value={draft[key] ?? ''} onChange={e => setDraft({ ...draft, [key]: e.target.value })} /></label>)}<Textarea aria-label="Başvuru notları" placeholder="Notlar" value={draft.notes ?? ""} onChange={e => setDraft({ ...draft, notes: e.target.value })} /><Button disabled={!draft.company.trim() || !draft.position.trim()} onClick={() => { if (w.applications.some(a => a.id === draft.id)) w.updateApplication(draft.id, draft); else w.addApplication(draft); setDraft(null); }}>Kaydet</Button> <Button variant="ghost" onClick={() => setDraft(null)}>Vazgeç</Button></div>}{w.applications.map(a => <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 border-t pt-3"><div><p className="text-sm">{a.company} · {a.position}</p><p className="text-xs text-muted-foreground">CV: {a.cvVersion || 'Belirlenmedi'} · Görüşme: {a.interviewAt || 'Belirlenmedi'} · Takip: {a.followUpAt || 'Belirlenmedi'}</p>{a.followUpAt && a.followUpAt <= new Date().toISOString().slice(0,10) && !['offer','rejected'].includes(a.stage) && <p className="text-xs text-amber-400">Takip zamanı geldi</p>}</div><Button variant="outline" onClick={() => setDraft({ ...a })}>Ayrıntıları düzenle</Button></div>)}</section>;
}
