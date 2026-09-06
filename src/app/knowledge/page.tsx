"use client";
import { useState } from "react";
import { useWorkspace } from "@/components/features/workspace-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { nextRepetition } from "@/lib/repetition";
import type { Note } from "@/lib/types";

export default function KnowledgePage() {
  const w = useWorkspace();
  const [query, setQuery] = useState("");
  const [dueOnly, setDueOnly] = useState(false);
  const [draft, setDraft] = useState<Note | null>(null);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [now] = useState(() => Date.now());
  const due = (n: Note) => !n.nextReviewAt || Date.parse(n.nextReviewAt) <= now;
  const notes = w.notes.filter(n => (!dueOnly || due(n)) && `${n.title} ${n.category} ${n.content} ${n.linkedSkill ?? ""}`.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr")));
  function save() {
    if (!draft?.title.trim() || !draft.content.trim()) return;
    const note = { ...draft, updatedAt: new Date().toISOString() };
    if (w.notes.some(n => n.id === note.id)) w.updateNote(note.id, note); else w.addNote(note);
    setDraft(null);
  }
  function review(note: Note, remembered: boolean) {
    w.updateNote(note.id, { ...nextRepetition(note.reviewIntervalDays ?? 0, remembered), reviewCount: (note.reviewCount ?? 0) + 1 });
    setRevealed(ids => ids.filter(id => id !== note.id));
  }
  return <><PageHeader title="Bilgi bankası" description="Notlarını bul, öğrendiklerini hatırla ve tekrar zamanını takip et." action={<Button onClick={() => setDraft({ id: crypto.randomUUID(), title: "", category: "", content: "", updatedAt: new Date().toISOString() })}>Yeni not</Button>} /><div className="page-content space-y-5">
    <div className="flex flex-wrap gap-3"><Input aria-label="Notlarda ara" placeholder="Konu, beceri veya not ara…" value={query} onChange={e => setQuery(e.target.value)} className="flex-1" /><Button variant={dueOnly ? "default" : "outline"} onClick={() => setDueOnly(!dueOnly)}>Tekrar zamanı ({w.notes.filter(due).length})</Button></div>
    {draft && <section className="surface space-y-3 p-5"><Input aria-label="Not başlığı" placeholder="Başlık" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /><Input aria-label="Not kategorisi" placeholder="Kategori" value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })} /><label className="block text-sm">Bağlı beceri<select className="mt-2 block w-full rounded border bg-background p-2" value={draft.linkedSkill ?? ""} onChange={e => setDraft({ ...draft, linkedSkill: e.target.value })}><option value="">Seçilmedi</option>{w.skills.map(s => <option key={s.id}>{s.name}</option>)}</select></label><Textarea aria-label="Not içeriği" rows={6} value={draft.content} onChange={e => setDraft({ ...draft, content: e.target.value })} /><Button disabled={!draft.title.trim() || !draft.content.trim()} onClick={save}>Kaydet</Button> <Button variant="ghost" onClick={() => setDraft(null)}>Vazgeç</Button></section>}
    {notes.map(n => <article key={n.id} className="surface space-y-3 p-5"><div className="flex justify-between gap-3"><div><h2 className="font-medium">{n.title}</h2><p className="text-xs text-muted-foreground">{n.category} · {n.linkedSkill} · {n.reviewCount ?? 0} tekrar</p></div><Button variant="ghost" onClick={() => setDraft({ ...n })}>Düzenle</Button></div><p className="text-xs text-muted-foreground">{due(n) ? "Tekrar zamanı geldi" : `Sonraki tekrar: ${new Date(n.nextReviewAt!).toLocaleDateString("tr-TR")}`}</p>{revealed.includes(n.id) ? <><p className="whitespace-pre-wrap text-sm leading-6">{n.content}</p><div className="flex gap-2"><Button onClick={() => review(n, true)}>Hatırladım</Button><Button variant="outline" onClick={() => review(n, false)}>Tekrar çalışmalıyım</Button></div></> : <Button variant="outline" onClick={() => setRevealed(ids => [...ids, n.id])}>Önce hatırla, sonra notu göster</Button>}</article>)}
    {!notes.length && <p className="py-10 text-center text-muted-foreground">Bu görünümde not yok.</p>}
  </div></>;
}
