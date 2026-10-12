"use client";

import { useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import { Check, ClipboardCopy, FileUp, Loader2, PenLine, RefreshCw, Sparkles, Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authenticatedAiFetch } from "@/lib/ai/client";
import { AiQuotaHint, notifyAiUsed } from "@/components/features/ai-quota";
import { cn } from "@/lib/utils";
import { externalAssistantPrompt, parseRoadmapContent } from "@/lib/roadmap-import";
import type { LearningRoadmapState, RoadmapPlan } from "@/lib/learning-roadmap";

type Method = "coach" | "file" | "assistant" | "manual";
type Draft = { plan: RoadmapPlan; state?: LearningRoadmapState; source: string; notes: string[] };
type Props = {
  onApply: (plan: RoadmapPlan, state?: LearningRoadmapState) => void;
  onCreateBlank: (input: { title: string; startDate: string; weekCount: number; description: string }) => void;
  today: string;
};

const methods: { id: Method; label: string; hint: string; icon: typeof Sparkles }[] = [
  { id: "coach", label: "Koç ile oluştur", hint: "Hedefini anlat, Planorth Koç planı yazsın", icon: Sparkles },
  { id: "file", label: "Dosya veya metin", hint: "JSON, CSV, Markdown, TXT ya da yapıştır", icon: FileUp },
  { id: "assistant", label: "ChatGPT / Gemini", hint: "İstemi kopyala, yanıtı yapıştır", icon: Wand2 },
  { id: "manual", label: "Boş plan", hint: "Haftaları kendin doldur", icon: PenLine },
];

const accept = ".json,.csv,.tsv,.md,.markdown,.txt,application/json,text/csv,text/plain,text/markdown";

export function RoadmapSetup({ onApply, onCreateBlank, today }: Props) {
  const [method, setMethod] = useState<Method>("coach");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("");
  const [weeks, setWeeks] = useState(12);
  const [hours, setHours] = useState(6);
  const [startDate, setStartDate] = useState(today);
  const [targetDate, setTargetDate] = useState("");
  const [constraints, setConstraints] = useState("");
  const [feedback, setFeedback] = useState("");
  const [pasted, setPasted] = useState("");
  const [pendingText, setPendingText] = useState("");
  const [copied, setCopied] = useState(false);
  const [blank, setBlank] = useState({ title: "", description: "", startDate: today, weekCount: 12 });
  const fileRef = useRef<HTMLInputElement>(null);

  const weeksFromTarget = targetDate && targetDate > startDate ? Math.min(26, Math.max(2, Math.ceil((Date.parse(`${targetDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 604_800_000))) : null;
  const effectiveWeeks = weeksFromTarget ?? weeks;
  const reset = () => { setDraft(null); setError(""); setPendingText(""); };

  async function askCoach(extra?: { sourceText?: string; feedback?: string }) {
    const goalText = goal.trim() || (extra?.sourceText ? "Yüklenen içeriği haftalık yol haritasına dönüştür" : "");
    if (goalText.length < 3) { setError("Önce hedefini yaz (en az 3 karakter)."); return; }
    setBusy(true); setError("");
    try {
      const response = await authenticatedAiFetch("/api/ai/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goalText, level: level.trim() || undefined, weeks: effectiveWeeks, hoursPerWeek: hours, startDate, constraints: constraints.trim() || undefined, sourceText: extra?.sourceText?.slice(0, 24_000), feedback: extra?.feedback }),
      });
      notifyAiUsed();
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Koç yanıt veremedi.");
      const result = parseRoadmapContent(JSON.stringify(data.plan));
      if (!result.ok) throw new Error(result.error);
      setDraft({ plan: result.plan, source: "Planorth Koç", notes: [] });
      setFeedback("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Koç yanıt veremedi.");
    } finally { setBusy(false); }
  }

  function readContent(content: string, filename = "") {
    const result = parseRoadmapContent(content, filename);
    if (!result.ok) { setError(result.error); setPendingText(content); return; }
    setError(""); setPendingText("");
    setDraft({ plan: result.plan, state: result.state, source: result.source, notes: result.notes });
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 2_000_000) { setError("Dosya çok büyük (en fazla 2 MB)."); return; }
    if (/\.(pdf|docx?|xlsx?|png|jpe?g)$/i.test(file.name)) { setError("Bu dosya türü doğrudan okunamıyor. İçeriğini kopyalayıp aşağıya yapıştır; Koç düzenler."); return; }
    readContent(await file.text(), file.name);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function copyPrompt() {
    try { await navigator.clipboard.writeText(externalAssistantPrompt(goal, weeks, hours)); setCopied(true); window.setTimeout(() => setCopied(false), 2000); }
    catch { setError("Panoya kopyalanamadı; metni elle seçip kopyala."); }
  }

  if (draft) return <DraftPreview draft={draft} busy={busy} feedback={feedback} setFeedback={setFeedback} error={error} canRevise={draft.source === "Planorth Koç"} onRevise={() => askCoach({ feedback })} onBack={reset} onApply={() => onApply(draft.plan, draft.state)} />;

  return (
    <div className="space-y-5">
      <header>
        <p className="north-eyebrow">Yol Haritam</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Yol haritanı oluştur</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Sıfırdan yazmana gerek yok. Koç’a hedefini anlat, hazır bir planı yükle ya da başka bir yapay zekânın hazırladığı planı yapıştır. Sonra her haftayı ve görevi düzenleyebilirsin.</p>
      </header>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" role="tablist" aria-label="Yol haritası oluşturma yöntemi">
        {methods.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={method === item.id} onClick={() => { setMethod(item.id); setError(""); }} className={cn("rounded-2xl border p-3.5 text-left transition", method === item.id ? "border-primary/60 bg-primary/10" : "bg-card hover:border-primary/30")}>
            <item.icon size={18} className="text-primary" />
            <b className="mt-2 block text-sm">{item.label}</b>
            <span className="mt-0.5 block text-xs text-muted-foreground">{item.hint}</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        {method === "coach" && (
          <div className="grid gap-4">
            <Field label="Hedefin ne? *"><textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={3} maxLength={600} placeholder="Örn. 3 ayda sıfırdan Python öğrenip küçük bir veri analizi projesi çıkarmak" className="rounded-lg border bg-background p-3 text-sm" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Şu anki seviyen"><input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Örn. hiç bilmiyorum / temel düzey" className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field>
              <Field label="Başlangıç tarihi"><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field>
              <Field label="Hedef tarih (sınav / teslim, isteğe bağlı)"><input type="date" min={startDate} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field>
              <Field label={weeksFromTarget ? `Süre: ${weeksFromTarget} hafta (hedef tarihe göre)` : `Süre: ${weeks} hafta`}><input type="range" min={2} max={26} value={effectiveWeeks} disabled={Boolean(weeksFromTarget)} onChange={(e) => setWeeks(Number(e.target.value))} className="h-10 accent-[var(--primary)]" /></Field>
              <Field label={`Haftalık süre: ${hours} saat`}><input type="range" min={1} max={30} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="h-10 accent-[var(--primary)]" /></Field>
            </div>
            <Field label="Tercih ve kısıtların (isteğe bağlı)"><input value={constraints} onChange={(e) => setConstraints(e.target.value)} maxLength={800} placeholder="Örn. hafta içi akşamları, ücretsiz kaynaklar, Türkçe öncelikli" className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field>
            <div className="flex flex-wrap items-center gap-3"><Button disabled={busy || goal.trim().length < 3} onClick={() => askCoach()}>{busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}{busy ? "Koç planı hazırlıyor…" : "Planı oluştur"}</Button><span className="text-xs text-muted-foreground">Taslağı kaydetmeden önce görüp değiştirebilirsin.</span><AiQuotaHint kind="roadmap" /></div>
          </div>
        )}

        {method === "file" && (
          <div className="grid gap-4">
            <div onDragOver={(e: DragEvent) => e.preventDefault()} onDrop={(e: DragEvent) => { e.preventDefault(); void onFile(e.dataTransfer.files?.[0]); }} className="grid place-items-center gap-2 rounded-xl border border-dashed p-6 text-center">
              <Upload size={22} className="text-primary" />
              <p className="text-sm font-medium">Dosyayı buraya bırak ya da seç</p>
              <p className="text-xs text-muted-foreground">JSON, CSV, Markdown (.md) veya düz metin (.txt) · en fazla 2 MB</p>
              <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>) => void onFile(e.target.files?.[0])} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>Dosya seç</Button>
            </div>
            <Field label="Ya da metni yapıştır"><textarea value={pasted} onChange={(e) => setPasted(e.target.value)} rows={7} placeholder={"Hafta 1: Temeller\n- Pazartesi: Ağ temellerini oku (45 dk)\n- Linux komutlarını dene (30 dk)\nHafta 2: ...\n\n(JSON ya da CSV de olabilir)"} className="rounded-lg border bg-background p-3 font-mono text-xs" /></Field>
            <div className="flex flex-wrap gap-2"><Button disabled={!pasted.trim()} onClick={() => readContent(pasted)}>Oku ve önizle</Button><Button variant="outline" disabled={!pasted.trim() || busy} onClick={() => { setGoal((g) => g || "Yapıştırılan içeriği yol haritasına dönüştür"); void askCoach({ sourceText: pasted }); }}><Sparkles size={15} />Koç düzenlesin</Button></div>
            <p className="text-xs text-muted-foreground">PDF, Word veya Excel dosyalarının içeriğini kopyalayıp buraya yapıştırabilirsin; “Koç düzenlesin” biçimi kendisi çözer.</p>
          </div>
        )}

        {method === "assistant" && (
          <div className="grid gap-4">
            <p className="text-sm text-muted-foreground">Kendi ChatGPT veya Gemini hesabını kullanabilirsin; Planorth hesabına bağlamak gerekmez. İstemi kopyala, yapay zekâya yapıştır, gelen yanıtı buraya geri yapıştır.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Hedefin" ><input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Örn. IELTS 7.0" className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field>
              <Field label={`Süre: ${weeks} hafta`}><input type="range" min={2} max={52} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} className="h-10 accent-[var(--primary)]" /></Field>
              <Field label={`Haftalık: ${hours} saat`}><input type="range" min={1} max={30} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="h-10 accent-[var(--primary)]" /></Field>
            </div>
            <div className="flex flex-wrap items-center gap-2"><Button type="button" variant="outline" onClick={copyPrompt}>{copied ? <Check size={15} /> : <ClipboardCopy size={15} />}{copied ? "Kopyalandı" : "1. İstemi kopyala"}</Button><a href="https://chatgpt.com" target="_blank" rel="noreferrer" className="text-xs text-primary underline-offset-2 hover:underline">ChatGPT’yi aç</a><a href="https://gemini.google.com" target="_blank" rel="noreferrer" className="text-xs text-primary underline-offset-2 hover:underline">Gemini’yi aç</a></div>
            <Field label="2. Yapay zekânın yanıtını yapıştır"><textarea value={pasted} onChange={(e) => setPasted(e.target.value)} rows={7} placeholder='{"title": "...", "weeks": [ ... ]}' className="rounded-lg border bg-background p-3 font-mono text-xs" /></Field>
            <div><Button disabled={!pasted.trim()} onClick={() => readContent(pasted)}>3. Oku ve önizle</Button></div>
          </div>
        )}

        {method === "manual" && (
          <div className="grid gap-4">
            <Field label="Plan adı"><input value={blank.title} onChange={(e) => setBlank({ ...blank, title: e.target.value })} placeholder="Örn. Siber güvenlik temelleri" className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field>
            <Field label="Kısa açıklama"><input value={blank.description} onChange={(e) => setBlank({ ...blank, description: e.target.value })} placeholder="Bu planın amacı" className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Başlangıç tarihi"><input type="date" value={blank.startDate} onChange={(e) => setBlank({ ...blank, startDate: e.target.value })} className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field>
              <Field label="Hafta sayısı (1–156)"><input type="number" min={1} max={156} value={blank.weekCount} onChange={(e) => setBlank({ ...blank, weekCount: Number(e.target.value) })} className="h-10 rounded-lg border bg-background px-3 text-sm" /></Field>
            </div>
            <div><Button disabled={!blank.title.trim() || !blank.startDate || blank.weekCount < 1 || blank.weekCount > 156} onClick={() => onCreateBlank(blank)}>Boş planı oluştur</Button></div>
          </div>
        )}

        {error && (
          <div role="alert" className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
            <p>{error}</p>
            {pendingText && <Button className="mt-2" size="sm" variant="outline" disabled={busy} onClick={() => { setGoal((g) => g || "Yüklenen içeriği yol haritasına dönüştür"); void askCoach({ sourceText: pendingText }); }}>{busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}Koç içeriği plana çevirsin</Button>}
          </div>
        )}
      </div>
    </div>
  );
}

function DraftPreview({ draft, busy, feedback, setFeedback, error, canRevise, onRevise, onBack, onApply }: { draft: Draft; busy: boolean; feedback: string; setFeedback: (value: string) => void; error: string; canRevise: boolean; onRevise: () => void; onBack: () => void; onApply: () => void }) {
  const { plan } = draft;
  const taskCount = plan.weeks.reduce((sum, week) => sum + week.tasks.length, 0);
  const minutes = plan.weeks.reduce((sum, week) => sum + week.tasks.reduce((s, task) => s + task.minutes, 0), 0);
  return (
    <div className="space-y-5">
      <header>
        <p className="north-eyebrow">Önizleme · {draft.source}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{plan.title}</h1>
        {plan.description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{plan.description}</p>}
      </header>
      <div className="grid grid-cols-3 gap-3">
        {[["Hafta", String(plan.weeks.length)], ["Görev", String(taskCount)], ["Toplam süre", `${Math.round(minutes / 6) / 10} sa`]].map(([label, value]) => (
          <div key={label} className="rounded-2xl border bg-card p-3.5"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>
        ))}
      </div>
      {draft.notes.map((note) => <p key={note} className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">{note}</p>)}
      <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-2xl border bg-card p-3">
        {plan.weeks.slice(0, 8).map((week) => (
          <details key={week.week} open={week.week === 1} className="rounded-xl border p-3">
            <summary className="cursor-pointer text-sm font-medium">Hafta {week.week} · {week.title} <span className="text-xs font-normal text-muted-foreground">({week.tasks.length} görev)</span></summary>
            {week.goal && <p className="mt-2 text-xs text-muted-foreground">{week.goal}</p>}
            <ul className="mt-2 space-y-1 text-xs">{week.tasks.map((task) => <li key={task.id} className="flex justify-between gap-3"><span>{task.day} · {task.title}</span><span className="shrink-0 text-muted-foreground">{task.minutes} dk</span></li>)}</ul>
          </details>
        ))}
        {plan.weeks.length > 8 && <p className="p-2 text-center text-xs text-muted-foreground">… ve {plan.weeks.length - 8} hafta daha. Kaydettikten sonra hepsini düzenleyebilirsin.</p>}
      </div>
      {canRevise && (
        <div className="grid gap-2 rounded-2xl border bg-card p-4">
          <label className="grid gap-1.5 text-xs text-muted-foreground"><span>Taslağı beğenmedin mi? Koç’tan değişiklik iste</span><input value={feedback} onChange={(e) => setFeedback(e.target.value)} maxLength={800} placeholder="Örn. daha az teori, hafta sonu görevleri hafif olsun" className="h-10 rounded-lg border bg-background px-3 text-sm" /></label>
          <div><Button variant="outline" size="sm" disabled={busy || !feedback.trim()} onClick={onRevise}>{busy ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}Değişikliği uygula</Button></div>
        </div>
      )}
      {error && <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</p>}
      <div className="flex flex-wrap gap-2"><Button onClick={onApply}><Check size={15} />Bu planı kullan</Button><Button variant="outline" onClick={onBack}>Geri dön</Button></div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1.5 text-xs text-muted-foreground"><span>{label}</span>{children}</label>;
}
