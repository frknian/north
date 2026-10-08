"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Clock3, Edit3, Layers3, Plus, Search, Sparkles } from "lucide-react";
import { useWorkspace } from "@/components/features/workspace-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { nextRepetition } from "@/lib/repetition";
import type { Note } from "@/lib/types";

const displayDate = (date: string) => new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Istanbul" }).format(new Date(date));

export default function KnowledgePage() {
  const workspace = useWorkspace();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tümü");
  const [dueOnly, setDueOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Note | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [now] = useState(() => Date.now());
  const isDue = (note: Note) => !note.nextReviewAt || Date.parse(note.nextReviewAt) <= now;
  const categories = useMemo(() => ["Tümü", ...new Set(workspace.notes.map(note => note.category.trim()).filter(Boolean))], [workspace.notes]);
  const notes = useMemo(() => workspace.notes.filter(note =>
    (category === "Tümü" || note.category === category) &&
    (!dueOnly || isDue(note)) &&
    `${note.title} ${note.category} ${note.content} ${note.linkedSkill ?? ""}`.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr"))
  ).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [workspace.notes, category, dueOnly, query, now]);
  const selected = workspace.notes.find(note => note.id === selectedId);
  const dueCount = workspace.notes.filter(isDue).length;

  function save() {
    if (!draft?.title.trim() || !draft.content.trim()) return;
    const note = { ...draft, title: draft.title.trim(), category: draft.category.trim(), content: draft.content.trim(), updatedAt: new Date().toISOString() };
    if (workspace.notes.some(item => item.id === note.id)) workspace.updateNote(note.id, note);
    else workspace.addNote(note);
    setSelectedId(note.id);
    setDraft(null);
  }

  function review(note: Note, remembered: boolean) {
    workspace.updateNote(note.id, { ...nextRepetition(note.reviewIntervalDays ?? 0, remembered), reviewCount: (note.reviewCount ?? 0) + 1 });
    setRevealed(false);
  }

  return <div className="page-content knowledge-page pb-28 md:pb-12">
    <header className="knowledge-hero">
      <div><p className="north-eyebrow">KİŞİSEL BİLGİ ALANI</p><h1>Kütüphane &amp; bilişsel kaynaklar</h1><p>Öğrendiklerini kaydet, geri çağır ve tekrarlarını yönet.</p></div>
      <Button onClick={() => { setSelectedId(null); setDraft({ id: crypto.randomUUID(), title: "", category: "", content: "", updatedAt: new Date().toISOString() }); }}><Plus size={16} /> Yeni not</Button>
    </header>
    <div className="knowledge-stats" aria-label="Kütüphane özeti">
      <div className="surface"><BookOpen size={18} /><span>Toplam not</span><strong>{workspace.notes.length}</strong></div>
      <div className="surface"><Clock3 size={18} /><span>Bugünkü tekrarlar</span><strong>{dueCount}</strong></div>
      <div className="surface"><Layers3 size={18} /><span>Kategoriler</span><strong>{categories.length - 1}</strong></div>
    </div>
    {draft ? <section className="surface knowledge-editor" aria-label="Not düzenleyici">
      <div className="knowledge-section-heading"><div><p className="north-eyebrow">NOT EDİTÖRÜ</p><h2>{workspace.notes.some(note => note.id === draft.id) ? "Notu düzenle" : "Yeni not oluştur"}</h2></div><Button variant="ghost" onClick={() => setDraft(null)}>Vazgeç</Button></div>
      <Input aria-label="Not başlığı" placeholder="Not başlığı" value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} />
      <div className="knowledge-editor-fields"><Input aria-label="Not kategorisi" placeholder="Kategori" value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value })} /><select aria-label="Bağlı beceri" className="rounded-lg border border-border bg-background px-3 text-sm" value={draft.linkedSkill ?? ""} onChange={event => setDraft({ ...draft, linkedSkill: event.target.value })}><option value="">Bağlı beceri seçilmedi</option>{workspace.skills.map(skill => <option key={skill.id} value={skill.name}>{skill.name}</option>)}</select></div>
      <Textarea aria-label="Not içeriği" rows={8} placeholder="Öğrendiğin bilgiyi kendi cümlelerinle yaz…" value={draft.content} onChange={event => setDraft({ ...draft, content: event.target.value })} />
      <div className="flex justify-end"><Button disabled={!draft.title.trim() || !draft.content.trim()} onClick={save}>Notu kaydet</Button></div>
    </section> : selected ? <section className="surface knowledge-detail" aria-label="Not ayrıntısı">
      <Button variant="ghost" size="sm" onClick={() => { setSelectedId(null); setRevealed(false); }}><ArrowLeft size={15} /> Kütüphaneye dön</Button>
      <div className="knowledge-detail-heading"><div><p className="north-eyebrow">{selected.category || "KATEGORİSİZ"}</p><h2>{selected.title}</h2><p>{selected.linkedSkill || "Bağlı beceri yok"} · {displayDate(selected.updatedAt)} · {selected.reviewCount ?? 0} tekrar</p></div><Button variant="outline" onClick={() => setDraft({ ...selected })}><Edit3 size={15} /> Düzenle</Button></div>
      <div className="knowledge-recall"><Sparkles size={18} /><div><strong>{isDue(selected) ? "Tekrar zamanı geldi" : `Sonraki tekrar: ${displayDate(selected.nextReviewAt!)}`}</strong><p>Notu açmadan önce ana fikrini hatırlamayı dene.</p></div></div>
      {revealed ? <><div className="knowledge-note-content">{selected.content}</div><div className="knowledge-review-actions"><Button onClick={() => review(selected, true)}>Hatırladım</Button><Button variant="outline" onClick={() => review(selected, false)}>Tekrar çalışmalıyım</Button></div></> : <Button variant="outline" onClick={() => setRevealed(true)}>Notu göster</Button>}
    </section> : <>
      <div className="knowledge-toolbar"><div className="knowledge-search"><Search size={17} /><Input aria-label="Notlarda ara" placeholder="Konu, beceri veya not ara…" value={query} onChange={event => setQuery(event.target.value)} /></div><Button variant={dueOnly ? "default" : "outline"} onClick={() => setDueOnly(!dueOnly)}>Tekrar zamanı ({dueCount})</Button></div>
      <div className="knowledge-categories" aria-label="Kategori filtresi">{categories.map(item => <button key={item} type="button" className={item === category ? "is-active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
      <div className="knowledge-grid">{notes.map(note => <button key={note.id} type="button" className="surface knowledge-card" onClick={() => { setSelectedId(note.id); setRevealed(false); }}><span className="knowledge-card-top"><span className="knowledge-category">{note.category || "Genel"}</span>{isDue(note) && <span className="knowledge-due">Tekrar zamanı</span>}</span><strong>{note.title}</strong><span className="knowledge-card-preview">{note.content}</span><span className="knowledge-card-meta"><span>{note.linkedSkill || "Kişisel not"}</span><span>{displayDate(note.updatedAt)}</span></span></button>)}</div>
      {!notes.length && <div className="surface knowledge-empty"><BookOpen size={27} /><h2>{workspace.notes.length ? "Bu filtrede not bulunamadı" : "Kütüphanen henüz boş"}</h2><p>{workspace.notes.length ? "Arama veya filtreyi değiştirebilirsin." : "İlk notunu ekleyerek öğrendiklerini biriktirmeye başla."}</p></div>}
    </>}
  </div>;
}
