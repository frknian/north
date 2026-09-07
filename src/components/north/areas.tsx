"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, ArrowDown, ArrowUp, CirclePause, CirclePlay, Pencil, Plus, Trash2 } from "lucide-react";
import { AreaModules } from "./area-modules";
import { allocation, areaAccents, areaStatus, createArea, dayKey, isAreaActive, kindLabels, weekKey, type Area, type AreaKind } from "@/lib/north";
import { useNorth, Heading, Field, fieldClass } from "./shared";
import { Button } from "@/components/ui/button";

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
    update((workspace) => ({ ...workspace, areas: workspace.areas.some((area) => area.id === normalized.id) ? workspace.areas.map((area) => area.id === normalized.id ? normalized : area) : [...workspace.areas, normalized] }));
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
    update((workspace) => ({ ...workspace, areas: workspace.areas.map((area) => area.id === areaId ? { ...area, status, archived: status === "archived" } : area) }));
  }

  if (!ready) return <div className="page-content" aria-busy="true">Alanlar yükleniyor…</div>;
  if (id && !current) return <div className="page-content">Alan bulunamadı. <Link className="text-primary" href="/areas">Alanlara dön</Link></div>;

  if (current) return <AreaWorkspace area={current} tab={tab} setTab={setTab} onEdit={() => setDraft({ ...current })} draft={draft} setDraft={setDraft} saveArea={saveArea} />;

  const visibleAreas = state.areas.filter((area) => showInactive || isAreaActive(area));
  return <div className="page-content space-y-6">
    <Heading title="Alanların" description="Şu anda zamanını ve dikkatini nereye yatırdığını gör.">
      <Button variant={managing ? "secondary" : "default"} onClick={() => { setManaging((value) => !value); setDraft(null); }}>{managing ? "Düzenlemeyi bitir" : "Alanları Düzenle"}</Button>
    </Heading>

    {managing ? <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 p-4">
        <div><h2 className="font-medium">Alan yönetimi</h2><p className="mt-1 text-sm text-muted-foreground">Sırala, önceliklendir, duraklat veya yeni bir alan oluştur.</p></div>
        <Button onClick={() => setDraft(createArea("custom", crypto.randomUUID()))}><Plus />Yeni alan</Button>
      </div>
      {draft ? <AreaEditor draft={draft} setDraft={setDraft} onSave={saveArea} onCancel={() => setDraft(null)} /> : null}
      <div className="surface divide-y px-5">
        {state.areas.map((area, index) => {
          const status = areaStatus(area);
          const hasRecords = state.tasks.some((task) => task.areaId === area.id) || state.activities.some((activity) => activity.areaId === area.id) || state.events.some((event) => event.areaId === area.id);
          return <div key={area.id} className="flex flex-wrap items-center gap-3 py-4">
            <span className="grid size-9 place-items-center rounded-lg border text-lg" style={{ borderColor: area.accent ?? areaAccents[0] }}>{area.icon}</span>
            <div className="min-w-48 flex-1"><p className="font-medium">{area.name}</p><p className="text-xs text-muted-foreground">{priorityLabels[area.priority] ?? "Orta"} öncelik · {status === "active" ? "Aktif" : status === "paused" ? "Duraklatıldı" : "Arşivlendi"} · {area.weeklyMinutes} dk/hafta</p></div>
            <div className="flex flex-wrap gap-1">
              <Button size="icon-sm" variant="ghost" aria-label={`${area.name} yukarı taşı`} disabled={index === 0} onClick={() => moveArea(area.id, -1)}><ArrowUp /></Button>
              <Button size="icon-sm" variant="ghost" aria-label={`${area.name} aşağı taşı`} disabled={index === state.areas.length - 1} onClick={() => moveArea(area.id, 1)}><ArrowDown /></Button>
              <Button size="sm" variant="ghost" onClick={() => setDraft({ ...area })}><Pencil />Düzenle</Button>
              <Button size="sm" variant="ghost" onClick={() => setStatus(area.id, status === "paused" ? "active" : "paused")}>{status === "paused" ? <><CirclePlay />Başlat</> : <><CirclePause />Duraklat</>}</Button>
              <Button size="sm" variant="ghost" onClick={() => setStatus(area.id, status === "archived" ? "active" : "archived")}><Archive />{status === "archived" ? "Geri al" : "Arşivle"}</Button>
              <Button size="icon-sm" variant="ghost" aria-label={`${area.name} alanını sil`} title={hasRecords ? "Kayıt içeren alan silinemez; arşivleyebilirsin." : "Alanı sil"} disabled={hasRecords} onClick={() => update((workspace) => ({ ...workspace, areas: workspace.areas.filter((item) => item.id !== area.id) }))}><Trash2 /></Button>
            </div>
          </div>;
        })}
      </div>
    </section> : <>
      <div className="grid gap-4 md:grid-cols-2">{visibleAreas.map((area) => <AreaCard key={area.id} area={area} />)}</div>
      <label className="flex w-fit items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />Duraklatılan ve arşivlenen alanları göster</label>
    </>}
  </div>;
}

function AreaCard({ area }: { area: Area }) {
  const { state } = useNorth();
  const minutes = state.activities.filter((activity) => activity.areaId === area.id && activity.date >= weekKey() && activity.date <= dayKey()).reduce((total, activity) => total + activity.minutes, 0);
  const nextTask = state.tasks.find((task) => task.areaId === area.id && ["pending", "partial"].includes(task.status));
  const status = areaStatus(area);
  return <article className="surface north-area-card" style={{ borderTopColor: area.accent ?? areaAccents[0], borderTopWidth: 2 }}>
    <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="text-xl">{area.icon}</span><div><Link href={`/areas/${area.id}`} className="text-lg font-medium tracking-tight hover:text-primary">{area.name}</Link><p className="mt-1 text-xs text-muted-foreground">{status === "paused" ? "Duraklatıldı" : status === "archived" ? "Arşivlendi" : `${priorityLabels[area.priority] ?? "Orta"} öncelik`}</p></div></div><span className="text-xs text-muted-foreground">{minutes} / {allocation(state, area)} dk</span></div>
    <p className="mt-5 text-xs text-muted-foreground">Ana hedef</p><p className="mt-1 text-sm leading-6">{area.goal || "Bu alan için henüz hedef belirlenmedi."}</p>
    <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${Math.min(100, allocation(state, area) ? minutes / allocation(state, area) * 100 : 0)}%`, backgroundColor: area.accent ?? areaAccents[0] }} /></div>
    <div className="mt-5 flex items-center justify-between gap-3"><p className="truncate text-xs text-muted-foreground">{nextTask ? `Sıradaki: ${nextTask.title}` : "Sıradaki adımı planla"}</p><Button size="sm" variant="ghost" asChild><Link href={nextTask ? `/focus/${nextTask.id}` : `/areas/${area.id}`}>{nextTask ? "Başla →" : "Alanı aç →"}</Link></Button></div>
  </article>;
}

function AreaEditor({ draft, setDraft, onSave, onCancel }: { draft: Area; setDraft: (area: Area) => void; onSave: () => void; onCancel: () => void }) {
  return <section className="surface grid gap-4 p-5 sm:grid-cols-2">
    <Field label="Alan adı"><input className={fieldClass} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></Field>
    <Field label="Alan türü"><select className={fieldClass} value={draft.kind} onChange={(event) => { const base = createArea(event.target.value as AreaKind, draft.id); setDraft({ ...draft, kind: base.kind, metric: base.metric, icon: base.icon }); }}>{Object.entries(kindLabels).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></Field>
    <Field label="Simge"><select className={fieldClass} value={draft.icon} onChange={(event) => setDraft({ ...draft, icon: event.target.value })}>{icons.map((icon) => <option key={icon}>{icon}</option>)}</select></Field>
    <Field label="Vurgu"><select className={fieldClass} value={draft.accent ?? areaAccents[0]} onChange={(event) => setDraft({ ...draft, accent: event.target.value })}>{areaAccents.map((accent, index) => <option key={accent} value={accent}>Ton {index + 1}</option>)}</select></Field>
    <Field label="Ana hedef"><input className={fieldClass} value={draft.goal} onChange={(event) => setDraft({ ...draft, goal: event.target.value })} placeholder="Bu alanda ulaşmak istediğin sonuç" /></Field>
    <Field label="Açıklama"><input className={fieldClass} value={draft.description ?? ""} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Bu alan neden önemli?" /></Field>
    <Field label="Öncelik"><select className={fieldClass} value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: Number(event.target.value) })}><option value="3">Yüksek</option><option value="2">Orta</option><option value="1">Düşük</option><option value="0">Bakım</option></select></Field>
    <Field label="Haftalık süre hedefi"><input type="number" min="0" max="10080" className={fieldClass} value={draft.weeklyMinutes} onChange={(event) => setDraft({ ...draft, weeklyMinutes: Math.max(0, Math.min(10080, Number(event.target.value))) })} /></Field>
    <Field label="Tercih edilen oturum"><select className={fieldClass} value={draft.preferredSessionMinutes ?? 50} onChange={(event) => setDraft({ ...draft, preferredSessionMinutes: Number(event.target.value) })}><option value="25">25 dakika</option><option value="45">45 dakika</option><option value="50">50 dakika</option><option value="60">60 dakika</option><option value="90">90 dakika</option></select></Field>
    <Field label="Tercih edilen ölçüm"><input className={fieldClass} value={draft.metric} onChange={(event) => setDraft({ ...draft, metric: event.target.value })} /></Field>
    <Field label="Ölçüm hedefi"><input type="number" min="0" className={fieldClass} value={draft.target} onChange={(event) => setDraft({ ...draft, target: Math.max(0, Number(event.target.value)) })} /></Field>
    <div className="flex gap-2 sm:col-span-2"><Button disabled={!draft.name.trim() || !draft.metric.trim()} onClick={onSave}>Kaydet</Button><Button variant="ghost" onClick={onCancel}>Vazgeç</Button></div>
  </section>;
}

function AreaWorkspace({ area, tab, setTab, onEdit, draft, setDraft, saveArea }: { area: Area; tab: string; setTab: (tab: string) => void; onEdit: () => void; draft: Area | null; setDraft: (area: Area | null) => void; saveArea: () => void }) {
  const { state, update } = useNorth();
  const tasks = state.tasks.filter((task) => task.areaId === area.id);
  const deadlines = [...state.events.filter((event) => event.areaId === area.id && ["deadline", "exam"].includes(event.kind)), ...tasks.filter((task) => task.deadline).map((task) => ({ id: task.id, title: task.title, date: task.deadline, time: "", kind: "deadline" as const, minutes: task.minutes, areaId: area.id }))].toSorted((a, b) => a.date.localeCompare(b.date));
  return <div className="page-content space-y-6">
    <Heading title={`${area.icon} ${area.name}`} description={area.description || area.goal || "Bu alanın yönünü ve planını yönet."}><Button variant="outline" onClick={onEdit}>Alanı düzenle</Button></Heading>
    {draft ? <AreaEditor draft={draft} setDraft={setDraft} onSave={saveArea} onCancel={() => setDraft(null)} /> : null}
    <div className="north-internal-tabs" aria-label="Alan bölümleri">{[["overview", "Genel bakış"], ["plan", "Plan"], ["progress", "İlerleme"], ["resources", "Kaynaklar"], ["notes", "Notlar"]].map(([key, label]) => <Button key={key} variant={tab === key ? "secondary" : "ghost"} aria-pressed={tab === key} onClick={() => setTab(key)}>{label}</Button>)}</div>
    {tab === "overview" ? <section className="grid gap-4 md:grid-cols-2"><div className="surface space-y-4 p-6"><p className="text-xs text-muted-foreground">Ana hedef</p><h2 className="text-xl font-medium">{area.goal || "Henüz hedef belirlenmedi"}</h2><p className="text-sm text-muted-foreground">{priorityLabels[area.priority] ?? "Orta"} öncelik · {area.weeklyMinutes} dk/hafta · {area.preferredSessionMinutes ?? 50} dk oturum</p><Button asChild><Link href="/week">Bu alanı planla</Link></Button></div><div className="surface space-y-3 p-6"><p className="text-xs text-muted-foreground">Aktif işler ve tarihler</p><p className="text-2xl">{tasks.filter((task) => ["pending", "partial"].includes(task.status)).length} görev</p>{deadlines.slice(0, 3).map((deadline) => <p key={deadline.id} className="text-sm text-muted-foreground">{deadline.date} · {deadline.title}</p>)}{!deadlines.length ? <p className="text-sm text-muted-foreground">Yaklaşan son tarih yok.</p> : null}</div></section> : null}
    {tab === "overview" && area.kind === "cyber" ? <div className="surface flex flex-wrap gap-4 p-5 text-sm text-primary">{[["/labs", "Lablar"], ["/skills", "Beceriler"], ["/certifications", "Sertifikalar"], ["/evidence", "Kanıtlar"]].map(([url, label]) => <Link key={url} href={url}>{label} →</Link>)}</div> : null}
    {tab === "overview" && area.kind !== "cyber" ? <details className="north-disclosure"><summary>{area.kind === "math" ? "Dersler ve konular" : area.kind === "reading" ? "Kitaplar" : area.kind === "chess" ? "Oyunlar ve bulmacalar" : "Alan kayıtları"}</summary><div className="mt-4"><AreaModules key={area.id + area.kind} area={area} /></div></details> : null}
    {tab === "plan" ? <div className="surface divide-y px-5">{tasks.map((task) => <div className="flex items-center justify-between gap-4 py-4" key={task.id}><div><p>{task.title}</p><p className="mt-1 text-xs text-muted-foreground">{task.goal} · {task.minutes} dk</p></div><Button size="sm" variant="ghost" asChild><Link href={task.status === "done" ? "/week" : `/focus/${task.id}`}>{task.status === "done" ? "Tamamlandı" : "Başla →"}</Link></Button></div>)}<Link href="/week" className="block py-4 text-primary">Haftalık planı düzenle →</Link></div> : null}
    {(tab === "notes" || tab === "resources") ? <AreaText key={tab + area.id} area={area} field={tab} onSave={(text) => update((workspace) => ({ ...workspace, areas: workspace.areas.map((item) => item.id === area.id ? { ...item, [tab]: text } : item) }))} /> : null}
    {tab === "progress" ? <section className="surface space-y-3 p-6"><h2 className="text-lg">{area.metric}</h2><p className="text-3xl">{state.activities.filter((activity) => activity.areaId === area.id && activity.metric === area.metric).reduce((total, activity) => total + activity.amount, 0)} {area.target > 0 ? `/ ${area.target}` : ""}</p><p className="text-sm text-muted-foreground">{allocation(state, area)} dk haftalık hedef · kayıtlı gerçek çalışma üzerinden hesaplanır.</p><Link href="/progress" className="text-primary">Genel ilerlemeye git →</Link></section> : null}
  </div>;
}

function AreaText({ area, field, onSave }: { area: Area; field: "notes" | "resources"; onSave: (text: string) => void }) {
  const [text, setText] = useState(area[field]);
  const [saved, setSaved] = useState(false);
  const recommendations = field === "resources" ? resourceRecommendations(area) : [];
  return <section className="surface space-y-4 p-5">{recommendations.length ? <div className="rounded-xl border bg-muted/20 p-4"><p className="text-sm font-medium">Başlangıç kaynakları</p><p className="mt-1 text-xs text-muted-foreground">Alanına göre seçilmiş güvenilir başlangıç kaynakları. İstersen birini notlarına ekleyebilir veya kendi kaynağını yazabilirsin.</p><div className="mt-3 flex flex-wrap gap-2">{recommendations.map(item => <button type="button" key={item.url} onClick={() => { setText(current => `${current}${current ? "\n" : ""}${item.title} — ${item.url}`); setSaved(false); }} className="rounded-full border px-3 py-1 text-xs text-primary hover:bg-primary/5">+ {item.title}</button>)}</div></div> : null}<Field label={field === "notes" ? "Alan notları" : "Kaynak adları ve bağlantılar"}><textarea className={`${fieldClass} min-h-60`} value={text} onChange={(event) => { setText(event.target.value); setSaved(false); }} placeholder={field === "resources" ? "Kendi kaynaklarını veya bağlantılarını ekle…" : undefined} /></Field><Button onClick={() => { onSave(text); setSaved(true); }}>{saved ? "Kaydedildi" : "Kaydet"}</Button></section>;
}

function resourceRecommendations(area: Area) {
  if (area.kind === "math") return [{ title: "Khan Academy Matematik", url: "https://www.khanacademy.org/math" }, { title: "MIT OpenCourseWare", url: "https://ocw.mit.edu/" }];
  if (area.kind === "cyber") return [{ title: "OWASP Web Security Testing Guide", url: "https://owasp.org/www-project-web-security-testing-guide/" }, { title: "PortSwigger Web Security Academy", url: "https://portswigger.net/web-security" }];
  if (area.kind === "projects") return [{ title: "MDN Web Docs", url: "https://developer.mozilla.org/" }, { title: "The Odin Project", url: "https://www.theodinproject.com/" }];
  if (area.kind === "reading") return [{ title: "Goodreads", url: "https://www.goodreads.com/" }];
  return [{ title: "Kendi güvenilir kaynağını ekle", url: "" }].filter(item => item.url);
}
