"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  Compass,
  Plus,
  Sparkles,
} from "lucide-react";
import {
  capacity,
  dayKey,
  dropTask,
  isAreaActive,
  poolTask,
  postponeTask,
  shiftDay,
  shrinkTask,
  weekKey,
  type NorthTask,
} from "@/lib/north";
import { recommendedSessionMinutes } from "@/lib/north-intelligence";
import { useNorth, Heading, Field, fieldClass } from "./shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "./progress-charts";

const phaseLabels: Record<string, { label: string; step: number; desc: string }> = {
  starter: { label: "Başlangıç & Harita", step: 1, desc: "Temel ön koşullar ve güvenilir kaynaklar" },
  mid_check: { label: "Ara Kontrol & Rutin", step: 2, desc: "İlk pratik ve ritim doğrulama" },
  application: { label: "Yoğun Uygulama", step: 3, desc: "Bağımsız problem çözme ve derin odak" },
  review: { label: "Tekrar & Pekiştirme", step: 4, desc: "Aralıklı tekrar ve zayıf konular" },
  final_proof: { label: "Final Kanıt & Zirve", step: 5, desc: "Portföy ve nihai hedef kanıtı" },
};

export function NorthWeek() {
  const { state, update, workspace } = useNorth();
  const [draft, setDraft] = useState<NorthTask | null>(null);
  const [filter, setFilter] = useState("active");
  const [week, setWeek] = useState(weekKey);

  const activeAreas = state.areas.filter(isAreaActive);
  const currentWeekTasks = state.tasks.filter((task) => task.week === week);
  const pending = currentWeekTasks.filter((task) => !["done", "cancelled"].includes(task.status));
  const completed = currentWeekTasks.filter((task) => task.status === "done");
  const planned = pending.reduce((total, task) => total + task.minutes, 0);
  const completedMinutes = completed.reduce((total, task) => total + task.minutes, 0);
  const totalPlannedMinutes = planned + completedMinutes;
  const completionPercent = totalPlannedMinutes > 0 ? Math.round((completedMinutes / totalPlannedMinutes) * 100) : 0;

  const isSunday = new Date(`${dayKey()}T12:00:00`).getDay() === 0;
  const periodMilestones = workspace.coaching.milestones.filter((m) => m.phase);
  const overdueTasks = state.tasks.filter(
    (t) => t.date && t.date < dayKey() && !["done", "cancelled"].includes(t.status)
  );

  const deadlines = [
    ...state.tasks
      .filter(
        (task) =>
          task.deadline &&
          task.deadline >= week &&
          task.deadline <= shiftDay(week, 6) &&
          !["done", "cancelled"].includes(task.status)
      )
      .map((task) => ({ id: `task-${task.id}`, date: task.deadline!, title: task.title, areaId: task.areaId })),
    ...state.events
      .filter((event) => event.kind === "deadline" && event.date >= week && event.date <= shiftDay(week, 6))
      .map((event) => ({ id: `event-${event.id}`, date: event.date, title: event.title, areaId: event.areaId })),
  ].toSorted((a, b) => a.date.localeCompare(b.date));

  // 7 Days of the selected week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = shiftDay(week, i);
    const dateObj = new Date(`${d}T12:00:00`);
    const dayName = dateObj.toLocaleDateString("tr-TR", { weekday: "short" });
    const isToday = d === dayKey();
    const tasksForDay = state.tasks.filter((t) => t.date === d && !["cancelled"].includes(t.status));
    const eventsForDay = state.events.filter((e) => e.date === d);
    return { date: d, dayName, isToday, tasks: tasksForDay, events: eventsForDay };
  });

  const addTask = () => {
    if (!activeAreas.length) return;
    const area = activeAreas[0];
    setDraft({
      id: crypto.randomUUID(),
      areaId: area.id,
      title: "",
      goal: "",
      minutes: area.preferredSessionMinutes ?? recommendedSessionMinutes(state, area.id),
      intensity: "normal",
      mandatory: true,
      status: "pending",
      date: "",
      deadline: "",
      resource: "",
      why: "Kendi hedefin için eklediğin görev.",
      week,
    });
  };

  return (
    <div className="page-content space-y-8">
      {/* HEADER & TOP CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
        <div>
          <Heading
            title="Haftalık Plan & Dönem Çizgisi"
            description="Nereye gittiğini, haftalık kapasiteni ve her gün atacağın somut adımı gör."
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={!activeAreas.length} onClick={addTask} className="rounded-xl shadow-sm">
            <Plus className="mr-1.5 size-4" />
            Görev Ekle
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/north-ai">
              <Sparkles className="mr-1.5 size-4 text-primary" />
              North&apos;a Planlat
            </Link>
          </Button>
        </div>
      </div>

      {isSunday && (
        <section className="celebrate-pop flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">PAZAR RİTÜELİ</span>
            <h2 className="mt-1 text-base font-semibold text-foreground">Önce haftayı kapat, sonra yenisini aç.</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              North tamamlananları, takıldığın noktaları ve yardım kaynaklarını değerlendirmeye hazır.
            </p>
          </div>
          <Button asChild size="sm" className="rounded-xl">
            <Link href="/reviews">Haftayı Değerlendir →</Link>
          </Button>
        </section>
      )}

      {/* OVERDUE & DYNAMIC RESCHEDULING (NO GUILT / NO DEBT) */}
      {overdueTasks.length > 0 && (
        <section className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 grid size-7 place-items-center rounded-lg bg-amber-500/15 text-amber-600">
                <AlertCircle className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Esnek Yük Düzenleme (Otomatik Borç Yok)</h3>
                <p className="mt-0.5 max-w-xl text-xs text-muted-foreground">
                  Önceki günlerden kalan {overdueTasks.length} görev var. North&apos;ta stres veya biriken borç olmaz; süreyi
                  küçültebilir, esnek havuza alabilir veya erteleyebilirsin.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg text-xs"
                onClick={() =>
                  update((current) => ({
                    ...current,
                    tasks: current.tasks.map((t) => (overdueTasks.some((o) => o.id === t.id) ? poolTask(t) : t)),
                  }))
                }
              >
                Tümünü Havuza Al
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg text-xs"
                onClick={() =>
                  update((current) => ({
                    ...current,
                    tasks: current.tasks.map((t) =>
                      overdueTasks.some((o) => o.id === t.id) ? postponeTask(t, shiftDay(t.date || dayKey(), 1)) : t
                    ),
                  }))
                }
              >
                Tümünü Yarına Ertele
              </Button>
            </div>
          </div>

          <div className="mt-4 divide-y divide-border/40 rounded-xl border bg-background/60 p-1">
            {overdueTasks.map((task) => (
              <div key={task.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-xs">
                <div>
                  <span className="font-semibold text-foreground">{task.title}</span>
                  <span className="ml-2 text-muted-foreground">
                    ({task.minutes} dk · {task.date})
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    size="xs"
                    variant="ghost"
                    className="rounded-md border text-[11px]"
                    onClick={() =>
                      update((current) => ({
                        ...current,
                        tasks: current.tasks.map((t) => (t.id === task.id ? shrinkTask(t) : t)),
                      }))
                    }
                  >
                    Küçült (½ dk)
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    className="rounded-md border text-[11px]"
                    onClick={() =>
                      update((current) => ({
                        ...current,
                        tasks: current.tasks.map((t) => (t.id === task.id ? poolTask(t) : t)),
                      }))
                    }
                  >
                    Havuza Al
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    className="rounded-md border text-[11px]"
                    onClick={() =>
                      update((current) => ({
                        ...current,
                        tasks: current.tasks.map((t) =>
                          t.id === task.id ? postponeTask(t, shiftDay(t.date || dayKey(), 1)) : t
                        ),
                      }))
                    }
                  >
                    +1 Gün
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    className="rounded-md text-[11px] text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      update((current) => ({
                        ...current,
                        tasks: current.tasks.map((t) => (t.id === task.id ? dropTask(t) : t)),
                      }))
                    }
                  >
                    Borçsuz Bırak
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5-PHASE PERIOD TIMELINE STEPPER */}
      {periodMilestones.length > 0 && (
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="size-4 text-primary" />
                <h2 className="text-sm font-semibold tracking-tight text-foreground">Dönem Planı &amp; Aşamalar</h2>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                5 yapılandırılmış aşamadan oluşan uzun vadeli stratejik yol haritası
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              {periodMilestones.length} Aşama Toplamı
            </Badge>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-5">
            {periodMilestones.map((m, idx) => {
              const isCompleted = m.status === "completed";
              const isActive = m.status === "active";
              const phaseMeta = m.phase ? phaseLabels[m.phase] : { label: `Aşama ${idx + 1}`, step: idx + 1, desc: "" };

              return (
                <div
                  key={m.id}
                  className={`relative flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                    isCompleted
                      ? "border-emerald-500/40 bg-emerald-500/5 shadow-none"
                      : isActive
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                      : "border-border/60 bg-muted/20 opacity-80"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isCompleted ? "text-emerald-600" : isActive ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {phaseMeta.step}. Aşama
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {m.targetWeek ?? Math.round(m.horizonDays / 7)}. Hafta
                      </span>
                    </div>

                    <h4 className="mt-2 text-xs font-semibold text-foreground line-clamp-1">{phaseMeta.label}</h4>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                      {m.title || phaseMeta.desc}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                        isCompleted ? "text-emerald-600" : isActive ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? <Check className="size-3" /> : null}
                      {isCompleted ? "Tamamlandı" : isActive ? "Aktif Aşama" : "Planlandı"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* WEEKLY CAPACITY & COMPLETION RING SUMMARY */}
      <section className="grid gap-6 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-2xl border bg-card p-5 shadow-sm sm:col-span-2">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Haftalık Tamamlanma</span>
            <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {completed.length} / {currentWeekTasks.length} Görev Bitti
            </h3>
            <p className="text-xs text-muted-foreground">
              Planlanan {totalPlannedMinutes} dakikanın {completedMinutes} dakikası başarıyla tamamlandı.
            </p>
          </div>
          <ProgressRing
            value={completionPercent}
            size={78}
            strokeWidth={7}
            label=""
            sublabel=""
          />
        </div>

        <div className="flex flex-col justify-between rounded-2xl border bg-card p-5 shadow-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Kapasite Durumu</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-foreground">{planned}</span>
              <span className="text-xs text-muted-foreground">/ {capacity(state)} dk</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {planned > capacity(state) ? (
                <span className="font-medium text-amber-500">Kapasite {planned - capacity(state)} dk aşıldı!</span>
              ) : (
                <span>Kapasite dengeli ve sürdürülebilir.</span>
              )}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between border-t pt-2.5 text-xs text-muted-foreground">
            <span>Hafta Modu: {state.mode === "exam" ? "Sınav Haftası" : "Normal"}</span>
            <Link href="/profile" className="text-primary hover:underline">
              Ayarlar →
            </Link>
          </div>
        </div>
      </section>

      {/* 7-DAY VISUAL WEEK FLOW */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">Haftalık Gün Akışı</h3>
            <p className="text-xs text-muted-foreground">Haftanın günlerine dağılmış görevler ve takvim blokları</p>
          </div>
          <Link href="/calendar" className="text-xs font-medium text-primary hover:underline">
            Tam Takvimi Aç →
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-7">
          {weekDays.map((day) => (
            <div
              key={day.date}
              className={`rounded-xl border p-3 text-xs transition-all ${
                day.isToday
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "bg-background hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${day.isToday ? "text-primary" : "text-foreground"}`}>
                  {day.dayName}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {day.date.slice(8)} {new Date(day.date + "T12:00:00").toLocaleDateString("tr-TR", { month: "short" })}
                </span>
              </div>

              <div className="mt-3 min-h-16 space-y-1.5">
                {day.events.map((evt) => (
                  <div
                    key={evt.id}
                    className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground truncate"
                  >
                    {evt.title}
                  </div>
                ))}

                {day.tasks.length > 0 ? (
                  day.tasks.map((t) => (
                    <div
                      key={t.id}
                      className={`rounded px-1.5 py-1 text-[11px] leading-tight truncate ${
                        t.status === "done"
                          ? "bg-emerald-500/10 text-emerald-700 line-through dark:text-emerald-400"
                          : "bg-primary/10 text-primary font-medium"
                      }`}
                    >
                      {t.title}
                    </div>
                  ))
                ) : (
                  <div className="py-2 text-center text-[10px] text-muted-foreground/60">Görev yok</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DRAFT TASK EDITOR */}
      {draft && (
        <TaskEditor
          draft={draft}
          activeAreas={activeAreas}
          state={state}
          week={week}
          onChange={setDraft}
          onCancel={() => setDraft(null)}
          onSave={() => {
            update((current) => ({
              ...current,
              tasks: current.tasks.some((task) => task.id === draft.id)
                ? current.tasks.map((task) =>
                    task.id === draft.id
                      ? {
                          ...draft,
                          rescheduledCount: (task.rescheduledCount ?? 0) + (task.date !== draft.date ? 1 : 0),
                        }
                      : task
                  )
                : [...current.tasks, draft],
            }));
            setDraft(null);
          }}
        />
      )}

      {/* TASK LIST & ACTIONS */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">Görev Havuzu &amp; Düzenleme</h3>
            <p className="text-xs text-muted-foreground">Bu haftanın planlanmış ve esnek görevleri</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Planlanacak hafta"
              className={fieldClass + " text-xs max-w-36"}
              value={week}
              onChange={(e) => setWeek(e.target.value)}
            >
              <option value={weekKey()}>Bu Hafta</option>
              <option value={shiftDay(weekKey(), 7)}>Gelecek Hafta</option>
            </select>
            <select
              aria-label="Görev filtresi"
              className={fieldClass + " text-xs max-w-32"}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="active">Aktif</option>
              <option value="all">Tümü</option>
            </select>
          </div>
        </div>

        <div className="mt-4 divide-y">
          {state.tasks
            .filter((task) => filter === "all" || (task.week === week && !["done", "cancelled"].includes(task.status)))
            .map((task) => (
              <div key={task.id} className="flex flex-wrap items-center justify-between gap-4 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-foreground">{task.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {state.areas.find((a) => a.id === task.areaId)?.name} · {task.minutes} dk ·{" "}
                    {task.date || "Esnek Havuz"} · {task.mandatory ? "Öncelikli" : "İsteğe Bağlı"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button variant="ghost" size="xs" onClick={() => setDraft({ ...task })}>
                    Düzenle
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() =>
                      update((current) => ({
                        ...current,
                        tasks: current.tasks.map((item) => (item.id === task.id ? shrinkTask(item) : item)),
                      }))
                    }
                    title="Süreyi yarıya indir"
                  >
                    Küçült
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() =>
                      update((current) => ({
                        ...current,
                        tasks: current.tasks.map((item) => (item.id === task.id ? poolTask(item) : item)),
                      }))
                    }
                    title="Günü kaldır, esnek havuza koy"
                  >
                    Havuza
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() =>
                      update((current) => ({
                        ...current,
                        tasks: current.tasks.map((item) =>
                          item.id === task.id ? postponeTask(item, shiftDay(item.date || dayKey(), 1)) : item
                        ),
                      }))
                    }
                    title="Bir gün sonraya ertele"
                  >
                    +1 Gün
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      update((current) => ({
                        ...current,
                        tasks: current.tasks.map((item) => (item.id === task.id ? dropTask(item) : item)),
                      }))
                    }
                  >
                    Bırak
                  </Button>
                </div>
              </div>
            ))}

          {!state.tasks.some(
            (task) => filter === "all" || (task.week === week && !["done", "cancelled"].includes(task.status))
          ) && <p className="py-8 text-center text-xs text-muted-foreground">Bu hafta için bekleyen görev yok.</p>}
        </div>
      </section>

      {/* DEADLINES */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between border-b pb-4">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Son Tarihler &amp; Kritik Günler</h3>
          <Link href="/calendar" className="text-xs font-medium text-primary hover:underline">
            Takvim Görünümü →
          </Link>
        </div>
        <div className="mt-3 divide-y">
          {deadlines.length ? (
            deadlines.map((dl) => (
              <div key={dl.id} className="flex items-center justify-between gap-4 py-3 text-xs">
                <div>
                  <p className="font-semibold text-foreground">{dl.title}</p>
                  <p className="text-muted-foreground">{state.areas.find((a) => a.id === dl.areaId)?.name}</p>
                </div>
                <time className="font-mono text-muted-foreground">
                  {new Date(dl.date + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                </time>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-xs text-muted-foreground">Bu hafta için yaklaşan son tarih yok.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function TaskEditor({
  draft,
  activeAreas,
  state,
  week,
  onChange,
  onCancel,
  onSave,
}: {
  draft: NorthTask;
  activeAreas: ReturnType<typeof useNorth>["state"]["areas"];
  state: ReturnType<typeof useNorth>["state"];
  week: string;
  onChange: (task: NorthTask) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <section className="rounded-2xl border border-primary/25 bg-card p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Görev Düzenle / Yeni Görev</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Alan">
          <select
            className={fieldClass}
            value={draft.areaId}
            onChange={(event) => {
              const area = activeAreas.find((item) => item.id === event.target.value);
              onChange({
                ...draft,
                areaId: event.target.value,
                minutes: area?.preferredSessionMinutes ?? recommendedSessionMinutes(state, event.target.value),
              });
            }}
          >
            {activeAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Görev Başlığı">
          <input
            className={fieldClass}
            value={draft.title}
            onChange={(event) => onChange({ ...draft, title: event.target.value })}
            placeholder="Örn. Limit ve Süreklilik Soru Çözümü"
          />
        </Field>
        <Field label="Somut Çıktı / Amaç">
          <input
            className={fieldClass}
            value={draft.goal}
            onChange={(event) => onChange({ ...draft, goal: event.target.value })}
            placeholder="Örn. 20 problem çöz, 3 kritik çıkarım not et"
          />
        </Field>
        <Field label="Süre (Dakika)">
          <input
            className={fieldClass}
            type="number"
            min="5"
            max="240"
            value={draft.minutes}
            onChange={(event) =>
              onChange({ ...draft, minutes: Math.max(5, Math.min(240, Number(event.target.value))) })
            }
          />
        </Field>
        <Field label="Planlanan Gün">
          <input
            className={fieldClass}
            type="date"
            value={draft.date}
            onChange={(event) =>
              onChange({
                ...draft,
                date: event.target.value,
                week: event.target.value ? weekKey(event.target.value) : week,
              })
            }
          />
        </Field>
        <Field label="Son Tarih (İsteğe Bağlı)">
          <input
            className={fieldClass}
            type="date"
            value={draft.deadline}
            onChange={(event) => onChange({ ...draft, deadline: event.target.value })}
          />
        </Field>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <label className="flex items-center gap-2 text-xs font-medium text-foreground">
          <input
            type="checkbox"
            checked={draft.mandatory}
            onChange={(event) => onChange({ ...draft, mandatory: event.target.checked })}
          />
          Bu hafta öncelikli
        </label>
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={!draft.title.trim() || !draft.goal.trim()}
            onClick={onSave}
          >
            Kaydet
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Vazgeç
          </Button>
        </div>
      </div>
    </section>
  );
}
