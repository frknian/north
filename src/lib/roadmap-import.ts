import { isRoadmapPlan, normalizeLearningRoadmapState, isRoadmapBackup } from "./learning-roadmap";
import type { LearningRoadmapState, RoadmapPlan, RoadmapTask, RoadmapWeek } from "./learning-roadmap";

export type RoadmapImportResult =
  | { ok: true; plan: RoadmapPlan; state?: LearningRoadmapState; source: string; notes: string[] }
  | { ok: false; error: string };

type Loose = Record<string, unknown>;
const MAX_WEEKS = 156;
const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const DAY_ALIASES: Record<string, string> = {
  pazartesi: "Pazartesi", pzt: "Pazartesi", monday: "Pazartesi", mon: "Pazartesi",
  sali: "Salı", "salı": "Salı", sal: "Salı", tuesday: "Salı", tue: "Salı",
  carsamba: "Çarşamba", "çarşamba": "Çarşamba", car: "Çarşamba", "çar": "Çarşamba", wednesday: "Çarşamba", wed: "Çarşamba",
  persembe: "Perşembe", "perşembe": "Perşembe", per: "Perşembe", thursday: "Perşembe", thu: "Perşembe",
  cuma: "Cuma", cum: "Cuma", friday: "Cuma", fri: "Cuma",
  cumartesi: "Cumartesi", cmt: "Cumartesi", saturday: "Cumartesi", sat: "Cumartesi",
  pazar: "Pazar", paz: "Pazar", sunday: "Pazar", sun: "Pazar",
};

const isObject = (value: unknown): value is Loose => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown, fallback = "") => (typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : fallback);
const pick = (source: Loose, keys: string[]) => {
  const lower = new Map(Object.keys(source).map((key) => [key.toLocaleLowerCase("tr").replace(/[\s_-]/g, ""), key]));
  for (const key of keys) {
    const real = lower.get(key.toLocaleLowerCase("tr").replace(/[\s_-]/g, ""));
    if (real !== undefined && source[real] !== undefined && source[real] !== null && source[real] !== "") return source[real];
  }
  return undefined;
};

export function normalizeDay(value: unknown, fallbackIndex = 0): string {
  const raw = text(value).toLocaleLowerCase("tr").replace(/\.$/, "");
  if (raw && DAY_ALIASES[raw]) return DAY_ALIASES[raw];
  const first = raw.split(/[\s,/-]+/)[0];
  if (first && DAY_ALIASES[first]) return DAY_ALIASES[first];
  return DAYS[((fallbackIndex % 7) + 7) % 7];
}

export function parseMinutes(value: unknown, fallback = 45): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.round(value));
  const raw = text(value).toLocaleLowerCase("tr");
  if (!raw) return fallback;
  const hours = /(\d+(?:[.,]\d+)?)\s*(saat|sa|hours?|hrs?|h)\b/.exec(raw);
  const minutes = /(\d+)\s*(dakika|dk|minutes?|mins?|m)\b/.exec(raw);
  if (hours || minutes) return Math.round((hours ? Number(hours[1].replace(",", ".")) * 60 : 0) + (minutes ? Number(minutes[1]) : 0));
  const bare = Number(raw.replace(",", "."));
  return Number.isFinite(bare) && bare > 0 ? Math.round(bare) : fallback;
}

function todayIso() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
}

function validDate(value: unknown) {
  const raw = text(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) && !Number.isNaN(Date.parse(`${raw}T00:00:00Z`)) ? raw : "";
}

function toResource(source: Loose): { label: string; url: string } {
  const nested = pick(source, ["resource", "kaynak", "source"]);
  let label = "";
  let url = "";
  if (isObject(nested)) {
    label = text(pick(nested, ["label", "name", "title", "ad", "baslik", "başlık"]));
    url = text(pick(nested, ["url", "link", "href", "bağlantı", "baglanti"]));
  } else if (typeof nested === "string") {
    if (/^https?:\/\//i.test(nested.trim())) url = nested.trim(); else label = nested.trim();
  }
  if (!url) url = text(pick(source, ["url", "link", "resourceUrl", "kaynakUrl", "bağlantı", "baglanti"]));
  if (!label) label = text(pick(source, ["resourceLabel", "kaynakAdı", "kaynakAdi"])) || (url ? "Kaynak" : "");
  if (url && !/^https?:\/\//i.test(url)) url = "";
  return { label, url };
}

function toTask(raw: unknown, week: number, index: number): RoadmapTask | null {
  if (typeof raw === "string") {
    const title = raw.trim();
    if (!title) return null;
    return { id: crypto.randomUUID(), week, title, area: "Genel", minutes: 45, day: DAYS[index % 7], kind: "Çalışma", resource: { label: "", url: "" }, detail: "" };
  }
  if (!isObject(raw)) return null;
  const title = text(pick(raw, ["title", "name", "task", "görev", "gorev", "başlık", "baslik", "konu", "topic"]));
  if (!title) return null;
  return {
    id: crypto.randomUUID(),
    week,
    title,
    area: text(pick(raw, ["area", "alan", "category", "kategori", "subject", "ders"])) || "Genel",
    minutes: parseMinutes(pick(raw, ["minutes", "dakika", "dk", "süre", "sure", "duration", "time", "estimatedMinutes"])),
    day: normalizeDay(pick(raw, ["day", "gün", "gun", "weekday"]), index),
    kind: text(pick(raw, ["kind", "type", "tür", "tur"])) || "Çalışma",
    resource: toResource(raw),
    detail: text(pick(raw, ["detail", "details", "description", "açıklama", "aciklama", "notes", "not", "outcome", "çıktı"])),
  };
}

function buildPlan(input: { title: string; description?: string; startDate?: string; scheduleNote?: string; weeks: Map<number, { phase?: string; title?: string; goal?: string; gate?: string; hours?: number; tasks: RoadmapTask[] }>; milestones?: RoadmapPlan["milestones"] }): RoadmapPlan | null {
  const numbers = [...input.weeks.keys()].filter((week) => week >= 1 && week <= MAX_WEEKS);
  if (!numbers.length) return null;
  const count = Math.max(...numbers);
  const weeks: RoadmapWeek[] = Array.from({ length: count }, (_, i) => {
    const number = i + 1;
    const source = input.weeks.get(number);
    const tasks = (source?.tasks ?? []).map((task) => ({ ...task, week: number }));
    const hours = source?.hours && Number.isFinite(source.hours) ? source.hours : Math.round((tasks.reduce((sum, task) => sum + task.minutes, 0) / 60) * 10) / 10;
    return { week: number, phase: source?.phase || "Kişisel plan", title: source?.title || `${number}. hafta`, goal: source?.goal ?? "", hours, gate: source?.gate ?? "", tasks };
  });
  const phases: RoadmapPlan["phases"] = [];
  for (const week of weeks) {
    const last = phases[phases.length - 1];
    if (last && last.title === week.phase) last.end = week.week; else phases.push({ title: week.phase, start: week.week, end: week.week });
  }
  const milestones = (input.milestones ?? []).filter((m) => m.week >= 1 && m.week <= count);
  const plan: RoadmapPlan = {
    id: crypto.randomUUID(),
    title: input.title.trim() || "İçe aktarılan yol haritası",
    description: input.description?.trim() ?? "",
    startDate: validDate(input.startDate) || todayIso(),
    scheduleNote: input.scheduleNote?.trim() ?? "",
    weeks,
    phases,
    milestones,
  };
  return isRoadmapPlan(plan) ? plan : null;
}

function fromLooseObject(root: Loose, fallbackTitle: string): RoadmapPlan | null {
  const container = isObject(root.plan) ? root.plan : isObject(root.roadmap) ? root.roadmap : root;
  const weeksRaw = pick(container, ["weeks", "haftalar", "schedule", "plan"]);
  const weeks = new Map<number, { phase?: string; title?: string; goal?: string; gate?: string; hours?: number; tasks: RoadmapTask[] }>();
  if (Array.isArray(weeksRaw)) {
    weeksRaw.forEach((entry, position) => {
      if (!isObject(entry)) return;
      const rawNumber = Number(pick(entry, ["week", "hafta", "number", "no", "index"]));
      const number = Number.isInteger(rawNumber) && rawNumber >= 1 ? rawNumber : position + 1;
      const tasksRaw = pick(entry, ["tasks", "görevler", "gorevler", "items", "activities", "etkinlikler", "days", "günler"]);
      const flat: unknown[] = [];
      if (Array.isArray(tasksRaw)) {
        for (const item of tasksRaw) {
          if (isObject(item) && Array.isArray(pick(item, ["tasks", "görevler", "gorevler"]))) {
            const day = pick(item, ["day", "gün", "gun"]);
            for (const inner of pick(item, ["tasks", "görevler", "gorevler"]) as unknown[]) flat.push(isObject(inner) && day && !pick(inner, ["day", "gün", "gun"]) ? { ...inner, day } : inner);
          } else flat.push(item);
        }
      } else if (isObject(tasksRaw)) {
        for (const [day, list] of Object.entries(tasksRaw)) for (const inner of Array.isArray(list) ? list : [list]) flat.push(isObject(inner) ? { day, ...inner } : { title: text(inner), day });
      }
      const tasks = flat.map((item, i) => toTask(item, number, i)).filter((task): task is RoadmapTask => Boolean(task));
      const existing = weeks.get(number);
      weeks.set(number, {
        phase: text(pick(entry, ["phase", "aşama", "asama", "stage"])) || existing?.phase,
        title: text(pick(entry, ["title", "name", "başlık", "baslik", "theme", "tema"])) || existing?.title,
        goal: text(pick(entry, ["goal", "hedef", "objective", "focus", "odak"])) || existing?.goal,
        gate: text(pick(entry, ["gate", "criterion", "geçiş", "gecis", "ölçüt", "olcut"])) || existing?.gate,
        hours: Number(pick(entry, ["hours", "saat"])) || existing?.hours,
        tasks: [...(existing?.tasks ?? []), ...tasks],
      });
    });
  }
  if (!weeks.size) {
    const flatTasks = pick(container, ["tasks", "görevler", "gorevler"]);
    if (!Array.isArray(flatTasks)) return null;
    flatTasks.forEach((item, i) => {
      const number = isObject(item) ? Number(pick(item, ["week", "hafta"])) : NaN;
      const week = Number.isInteger(number) && number >= 1 ? number : 1;
      const task = toTask(item, week, i);
      if (!task) return;
      const entry = weeks.get(week) ?? { tasks: [] };
      entry.tasks.push(task);
      weeks.set(week, entry);
    });
  }
  const milestonesRaw = pick(container, ["milestones", "kilometretaşları", "kilometretaslari"]);
  const milestones = Array.isArray(milestonesRaw)
    ? milestonesRaw.filter(isObject).map((m, i) => ({ month: Math.max(1, Math.round(Number(pick(m, ["month", "ay"])) || 1)), week: Math.max(1, Math.round(Number(pick(m, ["week", "hafta"])) || i + 1)), title: text(pick(m, ["title", "name", "başlık", "baslik"])), criterion: text(pick(m, ["criterion", "criteria", "ölçüt", "olcut", "description"])) })).filter((m) => m.title)
    : [];
  return buildPlan({
    title: text(pick(container, ["title", "name", "ad", "başlık", "baslik"])) || fallbackTitle,
    description: text(pick(container, ["description", "açıklama", "aciklama", "summary", "özet"])),
    startDate: text(pick(container, ["startDate", "start", "başlangıç", "baslangic"])),
    scheduleNote: text(pick(container, ["scheduleNote", "note", "not"])),
    weeks,
    milestones,
  });
}

function splitCsvLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') { if (quoted && line[i + 1] === '"') { current += '"'; i++; } else quoted = !quoted; }
    else if (char === delimiter && !quoted) { cells.push(current.trim()); current = ""; }
    else current += char;
  }
  cells.push(current.trim());
  return cells;
}

function fromCsv(content: string, fallbackTitle: string): RoadmapPlan | null {
  const lines = content.replace(/^﻿/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return null;
  const delimiter = [";", "\t", ","].map((d) => [d, lines[0].split(d).length] as const).sort((a, b) => b[1] - a[1])[0][0];
  const headers = splitCsvLine(lines[0], delimiter);
  if (headers.length < 2) return null;
  const rows = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line, delimiter);
    return Object.fromEntries(headers.map((header, i) => [header, cells[i] ?? ""])) as Loose;
  });
  const weeks = new Map<number, { phase?: string; title?: string; goal?: string; tasks: RoadmapTask[] }>();
  rows.forEach((row, i) => {
    const number = Math.round(Number(pick(row, ["week", "hafta", "hf"])) || 0) || 1;
    const task = toTask(row, number, i);
    if (!task) return;
    const entry = weeks.get(number) ?? { tasks: [] };
    entry.phase ||= text(pick(row, ["phase", "aşama", "asama"])) || undefined;
    entry.title ||= text(pick(row, ["weekTitle", "haftaBaşlığı", "haftaBasligi"])) || undefined;
    entry.goal ||= text(pick(row, ["goal", "hedef", "weekGoal"])) || undefined;
    entry.tasks.push(task);
    weeks.set(number, entry);
  });
  return buildPlan({ title: fallbackTitle, weeks });
}

function fromOutline(content: string, fallbackTitle: string): RoadmapPlan | null {
  const weekLine = /^\s*(?:#{1,6}\s*|\*\*)?\s*(?:hafta|week|hf\.?)\s*(\d{1,3})\s*(?:\*\*)?\s*[:.\-–—)]?\s*(.*?)(?:\*\*)?\s*$/i;
  const bullet = /^\s*(?:[-*•▪◦]|\d{1,3}[.)])\s+(.*\S)\s*$/;
  const weeks = new Map<number, { title?: string; goal?: string; tasks: RoadmapTask[] }>();
  const intro: string[] = [];
  let title = "";
  let current: number | null = null;
  for (const line of content.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const heading = /^\s*#\s+(.+?)\s*$/.exec(line);
    if (heading && !weekLine.test(line) && current === null && !title) { title = heading[1]; continue; }
    const week = weekLine.exec(line);
    if (week) {
      current = Number(week[1]);
      if (current < 1 || current > MAX_WEEKS) { current = null; continue; }
      const entry = weeks.get(current) ?? { tasks: [] };
      if (week[2]) entry.title = week[2].replace(/^[\s:–—-]+/, "").trim();
      weeks.set(current, entry);
      continue;
    }
    if (current === null) { intro.push(line.trim()); continue; }
    const entry = weeks.get(current)!;
    const item = bullet.exec(line);
    if (item) {
      let body = item[1].replace(/\*\*/g, "").trim();
      let day: string | undefined;
      const dayMatch = /^([A-Za-zÇĞİÖŞÜçğıöşü]{3,10})\s*[:\-–]\s*(.+)$/.exec(body);
      if (dayMatch && DAY_ALIASES[dayMatch[1].toLocaleLowerCase("tr")]) { day = DAY_ALIASES[dayMatch[1].toLocaleLowerCase("tr")]; body = dayMatch[2]; }
      const minutesMatch = /\(?\b(\d+(?:[.,]\d+)?)\s*(dk|dakika|min|minutes|saat|sa|h)\b\)?/i.exec(body);
      const minutes = minutesMatch ? parseMinutes(minutesMatch[0].replace(/[()]/g, "")) : 45;
      if (minutesMatch) body = body.replace(minutesMatch[0], "").replace(/\s{2,}/g, " ").replace(/[\s,;-]+$/, "").trim();
      const url = /(https?:\/\/[^\s)]+)/.exec(body)?.[1] ?? "";
      if (url) body = body.replace(url, "").replace(/[()\s-]+$/, "").trim();
      const taskTitle = body || "Görev";
      entry.tasks.push({ id: crypto.randomUUID(), week: current, title: taskTitle, area: "Genel", minutes, day: day ?? DAYS[entry.tasks.length % 7], kind: "Çalışma", resource: { label: url ? "Kaynak" : "", url }, detail: "" });
    } else if (!entry.goal) entry.goal = line.trim().replace(/^[>*_]+|[*_]+$/g, "");
  }
  return buildPlan({ title: title || fallbackTitle, description: intro.join(" ").slice(0, 400), weeks });
}

export function parseRoadmapContent(content: string, filename = ""): RoadmapImportResult {
  const trimmed = content.replace(/^﻿/, "").trim();
  if (!trimmed) return { ok: false, error: "İçerik boş." };
  const base = filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  const fallbackTitle = base ? base.charAt(0).toLocaleUpperCase("tr") + base.slice(1) : "İçe aktarılan yol haritası";
  const notes: string[] = [];
  const jsonText = /^```/.test(trimmed) ? trimmed.replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/, "").trim() : trimmed;
  const jsonSlice = jsonText.startsWith("{") || jsonText.startsWith("[") ? jsonText : (/```json\s*([\s\S]*?)```/i.exec(trimmed)?.[1] ?? "").trim();
  if (jsonSlice.startsWith("{") || jsonSlice.startsWith("[")) {
    try {
      const value: unknown = JSON.parse(jsonSlice);
      if (isRoadmapBackup(value)) {
        const state = normalizeLearningRoadmapState((value as { state: unknown }).state);
        return { ok: true, plan: state.plan!, state, source: "Planorth yedeği", notes };
      }
      const root: Loose = Array.isArray(value) ? { weeks: value } : isObject(value) ? value : {};
      if (isRoadmapPlan(root)) return { ok: true, plan: root as unknown as RoadmapPlan, source: "Planorth planı", notes };
      const plan = fromLooseObject(root, fallbackTitle);
      if (plan) { notes.push("Eksik alanlar (gün, süre, alan, kaynak) varsayılanlarla tamamlandı."); return { ok: true, plan, source: "JSON", notes }; }
      return { ok: false, error: "JSON okundu ama içinde hafta veya görev listesi bulunamadı. 'weeks' (haftalar) altında 'tasks' (görevler) olmalı." };
    } catch {
      if (!/^\s*[\[{]/.test(trimmed)) { /* continue to text parsers */ } else notes.push("JSON biçimi bozuk görünüyor; metin olarak okunmaya çalışıldı.");
    }
  }
  const firstLine = trimmed.split(/\r?\n/, 1)[0];
  const looksCsv = /\.(csv|tsv)$/i.test(filename) || (/(hafta|week)/i.test(firstLine) && /[,;\t]/.test(firstLine) && /(görev|gorev|task|başlık|baslik|title)/i.test(firstLine));
  if (looksCsv) {
    const plan = fromCsv(trimmed, fallbackTitle);
    if (plan) return { ok: true, plan, source: "CSV / tablo", notes };
  }
  const outline = fromOutline(trimmed, fallbackTitle);
  if (outline) { notes.push("Metindeki 'Hafta N' başlıkları ve maddeler görev olarak okundu."); return { ok: true, plan: outline, source: "Metin / Markdown", notes }; }
  return { ok: false, error: "Hafta yapısı bulunamadı. 'Hafta 1' gibi başlıklar altında maddeler, CSV tablosu ya da JSON kullan; ya da Koç ile oluştur." };
}

/** Prompt users can paste into ChatGPT, Gemini or any assistant; the answer is pasted back into Planorth. */
export function externalAssistantPrompt(goal = "", weeks = 12, hoursPerWeek = 6): string {
  return `Aşağıdaki hedef için ${weeks} haftalık, haftada yaklaşık ${hoursPerWeek} saatlik kişisel bir yol haritası hazırla.
Hedef: ${goal || "[hedefini buraya yaz]"}

Yanıtın YALNIZCA geçerli JSON olsun (açıklama, markdown veya kod bloğu yazma). Biçim:
{
  "title": "Plan adı",
  "description": "Kısa açıklama",
  "weeks": [
    {
      "week": 1,
      "phase": "Aşama adı",
      "title": "Haftanın başlığı",
      "goal": "Bu haftanın hedefi",
      "gate": "Sonraki haftaya geçiş ölçütü",
      "tasks": [
        { "title": "Görev", "day": "Pazartesi", "minutes": 45, "area": "Alan", "detail": "Ne yapılacak ve çıktısı ne", "resource": { "label": "Kaynak adı", "url": "https://..." } }
      ]
    }
  ],
  "milestones": [ { "week": 4, "title": "Kilometre taşı", "criterion": "Başarı ölçütü" } ]
}
Kurallar: Her hafta 3-6 görev olsun; day alanı Pazartesi-Pazar arasından olsun; minutes sayı olsun; yalnızca gerçek ve ücretsiz kaynak bağlantıları ver, emin değilsen url alanını boş bırak.`;
}
