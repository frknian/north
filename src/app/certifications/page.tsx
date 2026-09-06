"use client";
import { useState } from "react";
import { useWorkspace } from "@/components/features/workspace-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Certification } from "@/lib/types";

export default function CertificationsPage() {
  const w = useWorkspace();
  const [draft, setDraft] = useState<Certification | null>(null);
  const [topics, setTopics] = useState("");
  function save() {
    if (!draft?.title.trim() || !topics.trim()) return;
    const lines = [...new Set(topics.split("\n").map(s => s.trim()).filter(Boolean))];
    w.saveCertification({ ...draft, topics: lines.map(title => draft.topics.find(t => t.title === title) ?? { id: crypto.randomUUID(), title, completed: false }) });
    setDraft(null);
  }
  return <><PageHeader title="Sertifika planlayıcı" description="Hedefini, sınav konularını ve çalışma durumunu birlikte takip et." action={<Button onClick={() => { setDraft({ id: crypto.randomUUID(), title: "", targetDate: "", sourceUrl: "", topics: [] }); setTopics(""); }}>Hedef ekle</Button>} /><div className="page-content space-y-5">{draft && <section className="surface space-y-3 p-5"><Input aria-label="Sertifika adı" placeholder="Sertifika adı" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /><label className="block text-sm">Hedef tarih<Input type="date" value={draft.targetDate} onChange={e => setDraft({ ...draft, targetDate: e.target.value })} /></label><Input aria-label="Resmî çalışma kaynağı" placeholder="Resmî çalışma kaynağı (https://…)" value={draft.sourceUrl} onChange={e => setDraft({ ...draft, sourceUrl: e.target.value })} /><Textarea aria-label="Sınav konuları" placeholder="Her satıra bir çalışma konusu" rows={6} value={topics} onChange={e => setTopics(e.target.value)} /><Button disabled={!draft.title.trim() || !topics.trim() || (!!draft.sourceUrl && !/^https:\/\//.test(draft.sourceUrl))} onClick={save}>Kaydet</Button> <Button variant="ghost" onClick={() => setDraft(null)}>Vazgeç</Button></section>}{w.certifications.map(c => <section key={c.id} className="surface space-y-4 p-5"><div className="flex justify-between"><div><h2 className="font-medium">{c.title}</h2><p className="text-sm text-muted-foreground">{c.topics.filter(t => t.completed).length}/{c.topics.length} konu · {c.targetDate || "Tarih belirlenmedi"}</p></div><Button variant="ghost" onClick={() => { setDraft(c); setTopics(c.topics.map(t => t.title).join("\n")); }}>Düzenle</Button></div>{c.sourceUrl.startsWith("https://") && <a className="text-sm text-primary" href={c.sourceUrl} target="_blank" rel="noreferrer">Çalışma kaynağını aç ↗</a>}<div className="divide-y">{c.topics.map(t => <label key={t.id} className="flex min-h-11 items-center gap-3 py-2"><input type="checkbox" checked={t.completed} onChange={e => w.saveCertification({ ...c, topics: c.topics.map(topic => topic.id === t.id ? { ...topic, completed: e.target.checked } : topic) })} />{t.title}</label>)}</div></section>)}{!w.certifications.length && <p className="py-10 text-center text-muted-foreground">İlk sertifika hedefini ve çalışma konularını ekle.</p>}</div></>;
}
