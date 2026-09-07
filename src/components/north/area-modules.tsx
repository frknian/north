"use client";

import { useMemo, useState } from "react";
import { Award, BookOpen, Clock, ExternalLink, Plus, ShieldCheck, TrendingUp } from "lucide-react";
import { areaModules, dayKey, type Area, type AreaRecord } from "@/lib/north";
import { useNorth, Field, fieldClass } from "./shared";
import { useWorkspace } from "@/components/features/workspace-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { examTemplates, calculateNet, calculateEstimatedScore, generateReviewSchedule, getWeeklyTrendPoints } from "@/lib/exam-system";
import type { DomainProof, DomainProofKind, ExamSubjectScore, ExamType, TrialExam, WrongAnswerAnalysis } from "@/lib/types";

export function AreaModules({ area }: { area: Area }) {
  const { state, update } = useNorth();
  const workspace = useWorkspace();

  const isExamArea = useMemo(
    () => /yks|tyt|kpss|banka|sınav|ayt|ales|dgs/i.test(area.name) || /sınav/i.test(area.goal),
    [area.name, area.goal]
  );

  const defaultExamType: Exclude<ExamType, "other"> = useMemo(() => {
    const n = `${area.name} ${area.goal}`.toLowerCase();
    if (n.includes("kpss")) return "kpss";
    if (n.includes("banka") || n.includes("müfettiş")) return "banking";
    return "yks_tyt";
  }, [area.name, area.goal]);

  const modules = areaModules[area.kind] ?? [];
  const [activeTab, setActiveTab] = useState<string>(isExamArea ? "exam" : "proofs");
  const [moduleName, setModuleName] = useState(modules[0]?.name ?? "");
  const [draft, setDraft] = useState<AreaRecord | null>(null);

  // PROOF DRAFT
  const [proofDraft, setProofDraft] = useState<Partial<DomainProof> | null>(null);

  // EXAM TRIAL DRAFT
  const [trialDraft, setTrialDraft] = useState<{
    examType: Exclude<ExamType, "other">;
    title: string;
    date: string;
    scores: Record<string, { correct: number; incorrect: number; empty: number }>;
    wrongAnalyses: { subjectId: string; topic: string; reason: WrongAnswerAnalysis["reason"]; notes: string }[];
  } | null>(null);

  // CUSTOM METRIC LOG DRAFT
  const [metricLogDraft, setMetricLogDraft] = useState<{ amount: number; notes: string } | null>(null);

  const config = modules.find((m) => m.name === moduleName);
  const rows = (state.records ?? []).filter((r) => r.areaId === area.id && r.module === moduleName);

  const areaProofs = (workspace.domainProofs ?? []).filter((p) => p.areaId === area.id);
  const areaMetricLogs = (workspace.customMetricEntries ?? []).filter((m) => m.areaId === area.id);

  // EXAM DATA
  const currentExamProfile = (workspace.examProfiles ?? []).find((p) => p.id === `exam-${area.id}`) ?? {
    id: `exam-${area.id}`,
    examType: defaultExamType,
    title: examTemplates[defaultExamType].title,
    examDate: new Date(new Date().getFullYear() + 1, 5, 20).toISOString().slice(0, 10),
    targetNet: defaultExamType === "kpss" ? 75 : defaultExamType === "banking" ? 80 : 85,
    targetScore: defaultExamType === "kpss" ? 85 : 420,
    trials: [],
    activeSubjects: examTemplates[defaultExamType].subjects.map((s) => s.id),
  };

  const today = dayKey();
  const daysRemaining = useMemo(() => {
    const targetTime = new Date(`${currentExamProfile.examDate}T00:00:00`).getTime();
    const todayTime = new Date(`${today}T00:00:00`).getTime();
    return Math.max(0, Math.ceil((targetTime - todayTime) / (1000 * 3600 * 24)));
  }, [currentExamProfile.examDate, today]);

  const trendPoints = getWeeklyTrendPoints(currentExamProfile.trials);
  const reviewSchedule = generateReviewSchedule(currentExamProfile.trials.flatMap((t) => t.wrongAnalyses));

  function saveProof() {
    if (!proofDraft?.title?.trim()) return;
    const item: DomainProof = {
      id: crypto.randomUUID(),
      areaId: area.id,
      title: proofDraft.title.trim(),
      kind: proofDraft.kind ?? defaultProofKind(area.name),
      description: proofDraft.description?.trim() || "",
      url: proofDraft.url?.trim() || undefined,
      notes: proofDraft.notes?.trim() || undefined,
      fileSummary: proofDraft.fileSummary?.trim() || undefined,
      screenshotNote: proofDraft.screenshotNote?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    workspace.addDomainProof(item);
    setProofDraft(null);
  }

  function saveTrial() {
    if (!trialDraft?.title?.trim()) return;
    const template = examTemplates[trialDraft.examType];
    const subjectScores: ExamSubjectScore[] = template.subjects.map((s) => {
      const user = trialDraft.scores[s.id] ?? { correct: 0, incorrect: 0, empty: 0 };
      const net = calculateNet(user.correct, user.incorrect);
      return {
        subjectId: s.id,
        subjectName: s.name,
        correct: user.correct,
        incorrect: user.incorrect,
        empty: user.empty,
        net,
      };
    });

    const totalNet = Math.round(subjectScores.reduce((sum, item) => sum + item.net, 0) * 100) / 100;
    const estimatedScore = calculateEstimatedScore(trialDraft.examType, subjectScores);

    const trial: TrialExam = {
      id: crypto.randomUUID(),
      title: trialDraft.title.trim(),
      date: trialDraft.date || new Date().toISOString().slice(0, 10),
      examType: trialDraft.examType,
      totalNet,
      estimatedScore,
      subjectScores,
      wrongAnalyses: trialDraft.wrongAnalyses.map((wa) => ({
        id: crypto.randomUUID(),
        subjectId: wa.subjectId,
        topic: wa.topic,
        reason: wa.reason,
        notes: wa.notes,
        reviewDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
        reviewed: false,
      })),
    };

    workspace.saveExamProfile({
      ...currentExamProfile,
      trials: [trial, ...currentExamProfile.trials],
    });
    setTrialDraft(null);
  }

  function logMetric() {
    if (!metricLogDraft || metricLogDraft.amount <= 0) return;
    workspace.addCustomMetricEntry({
      id: crypto.randomUUID(),
      areaId: area.id,
      date: new Date().toISOString().slice(0, 10),
      metricName: area.metric,
      amount: metricLogDraft.amount,
      unit: "adet",
      notes: metricLogDraft.notes.trim() || undefined,
    });
    setMetricLogDraft(null);
  }

  return (
    <section className="surface space-y-5 p-5">
      {/* MODULE HEADER TABS */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={activeTab === "proofs" ? "default" : "outline"} onClick={() => setActiveTab("proofs")}>
            <ShieldCheck className="size-4" />
            Kanıt ve Portföy ({areaProofs.length})
          </Button>

          <Button size="sm" variant={activeTab === "metrics" ? "default" : "outline"} onClick={() => setActiveTab("metrics")}>
            <Award className="size-4" />
            Metrik Takibi ({area.metric})
          </Button>

          {(isExamArea || currentExamProfile.trials.length > 0 || activeTab === "exam") && (
            <Button size="sm" variant={activeTab === "exam" ? "default" : "outline"} onClick={() => setActiveTab("exam")}>
              <TrendingUp className="size-4" />
              Sınav & Deneme Planı
            </Button>
          )}

          {modules.length > 0 && (
            <Button size="sm" variant={activeTab === "records" ? "default" : "outline"} onClick={() => setActiveTab("records")}>
              <BookOpen className="size-4" />
              Alan Kayıtları
            </Button>
          )}
        </div>
      </div>

      {/* TAB 1: KANIT VE PORTFÖY SİSTEMİ (Gereksinim 9) */}
      {activeTab === "proofs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Doğrulanabilir Çıktılar ve Portföy</h3>
              <p className="text-xs text-muted-foreground">
                Veri notebook’u, klinik özet, kaynakça analizi, teknik hesap veya GitHub çıktısı ekle.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() =>
                setProofDraft({
                  title: "",
                  kind: defaultProofKind(area.name),
                  description: "",
                  url: "",
                  notes: "",
                  fileSummary: "",
                  screenshotNote: "",
                })
              }
            >
              <Plus />Yeni Kanıt Ekle
            </Button>
          </div>

          {proofDraft && (
            <Card className="border-primary/30 bg-muted/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Yeni Kanıt Kaydı</CardTitle>
                <CardDescription className="text-xs">Çalışmanı somut, incelenebilir bir kanıta dönüştür.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <Field label="Kanıt Başlığı">
                  <input
                    className={fieldClass}
                    value={proofDraft.title ?? ""}
                    onChange={(e) => setProofDraft({ ...proofDraft, title: e.target.value })}
                    placeholder="Örn. EDA Analiz Raporu v1 veya Vaka Çalışması"
                  />
                </Field>

                <Field label="Kanıt Türü">
                  <select
                    className={fieldClass}
                    value={proofDraft.kind ?? "notebook"}
                    onChange={(e) => setProofDraft({ ...proofDraft, kind: e.target.value as DomainProofKind })}
                  >
                    <option value="notebook">Jupyter / Python Notebook</option>
                    <option value="dashboard">Gösterge Paneli (Dashboard)</option>
                    <option value="clinical_note">Anonim Klinik Çalışma Notu</option>
                    <option value="case_summary">Vaka Özeti</option>
                    <option value="citation_analysis">Kaynakça & Metin Analizi</option>
                    <option value="calculation">Mühendislik Hesabı</option>
                    <option value="drawing">CAD / Teknik Çizim</option>
                    <option value="technical_report">Teknik Rapor / Makale</option>
                    <option value="github_link">GitHub Deposu / Kod</option>
                    <option value="game_analysis">Satranç Oyun / PGN Analizi</option>
                    <option value="exam_trial">Deneme Sınavı Karnesi</option>
                    <option value="other">Diğer Somut Çıktı</option>
                  </select>
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Çıktı Açıklaması">
                    <textarea
                      className={fieldClass}
                      value={proofDraft.description ?? ""}
                      onChange={(e) => setProofDraft({ ...proofDraft, description: e.target.value })}
                      placeholder="Bu çıktıda ne yapıldı, ne kanıtlandı?"
                    />
                  </Field>
                </div>

                <Field label="Bağlantı URL (GitHub, Kaggle, Lichess vb.)">
                  <input
                    className={fieldClass}
                    type="url"
                    value={proofDraft.url ?? ""}
                    onChange={(e) => setProofDraft({ ...proofDraft, url: e.target.value })}
                    placeholder="https://..."
                  />
                </Field>

                <Field label="Dosya Özeti / Metrik Özeti">
                  <input
                    className={fieldClass}
                    value={proofDraft.fileSummary ?? ""}
                    onChange={(e) => setProofDraft({ ...proofDraft, fileSummary: e.target.value })}
                    placeholder="Örn. 12 sayfalık PDF, 450 satır SQL kodu"
                  />
                </Field>

                <div className="sm:col-span-2 flex gap-2">
                  <Button size="sm" disabled={!proofDraft.title?.trim()} onClick={saveProof}>
                    Kanıtı Kaydet
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setProofDraft(null)}>
                    Vazgeç
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-3">
            {areaProofs.map((p) => (
              <article key={p.id} className="rounded-xl border p-4 transition-colors hover:bg-muted/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary font-medium">
                      {proofKindLabel(p.kind)}
                    </span>
                    <h4 className="mt-1 font-medium">{p.title}</h4>
                  </div>
                  {p.url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={p.url} target="_blank" rel="noreferrer">
                        Bağlantı <ExternalLink className="size-3" />
                      </a>
                    </Button>
                  )}
                </div>
                {p.description && <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>}
                {p.fileSummary && <p className="mt-2 text-xs font-mono text-muted-foreground">📁 {p.fileSummary}</p>}
                <p className="mt-2 text-[10px] text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("tr-TR")}</p>
              </article>
            ))}

            {!areaProofs.length && !proofDraft && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Bu alanda henüz kanıt kaydedilmedi. Tamamladığın bir çalışmayı, notebook&apos;u veya raporu ekleyerek başla.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: METRİK TAKİBİ VE ÖZEL METRİK (Gereksinim 5) */}
      {activeTab === "metrics" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Başarı Metriği: {area.metric}</h3>
              <p className="text-xs text-muted-foreground">Hedefin doğrultusunda tamamlanan birimleri kaydet.</p>
            </div>
            <Button size="sm" onClick={() => setMetricLogDraft({ amount: 1, notes: "" })}>
              <Plus />Giriş Ekle
            </Button>
          </div>

          {metricLogDraft && (
            <Card className="border-primary/30 bg-muted/20">
              <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
                <Field label={`Eklenen Miktar (${area.metric})`}>
                  <input
                    className={fieldClass}
                    type="number"
                    min="1"
                    value={metricLogDraft.amount}
                    onChange={(e) => setMetricLogDraft({ ...metricLogDraft, amount: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Kısa Not">
                  <input
                    className={fieldClass}
                    value={metricLogDraft.notes}
                    onChange={(e) => setMetricLogDraft({ ...metricLogDraft, notes: e.target.value })}
                    placeholder="Hangi çalışma yapıldı?"
                  />
                </Field>
                <div className="sm:col-span-2 flex gap-2">
                  <Button size="sm" onClick={logMetric}>
                    Kaydet
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setMetricLogDraft(null)}>
                    Vazgeç
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-2">
            {areaMetricLogs.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <span>
                  <strong>+{m.amount}</strong> {m.metricName} {m.notes ? `· ${m.notes}` : ""}
                </span>
                <span className="text-xs text-muted-foreground">{m.date}</span>
              </div>
            ))}
            {!areaMetricLogs.length && !metricLogDraft && (
              <p className="py-6 text-center text-sm text-muted-foreground">Henüz kayıtlı metrik girişi yok.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SINAV VE DENEME PLANLAYICI (Gereksinim 2) */}
      {activeTab === "exam" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Sınav Tarihi</p>
                <p className="mt-1 text-lg font-semibold">{currentExamProfile.examDate}</p>
                <p className="text-xs text-muted-foreground">Kalan: {daysRemaining} gün</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Hedef Net / Puan</p>
                <p className="mt-1 text-lg font-semibold">
                  {currentExamProfile.targetNet ?? 80} Net / {currentExamProfile.targetScore ?? 400} Puan
                </p>
                <p className="text-xs text-muted-foreground">Son Deneme: {currentExamProfile.trials[0]?.totalNet ?? "—"} Net</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Tamamlanan Deneme</p>
                <p className="mt-1 text-lg font-semibold">{currentExamProfile.trials.length} Adet</p>
                <Button
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() =>
                    setTrialDraft({
                      examType: currentExamProfile.examType === "other" ? "yks_tyt" : currentExamProfile.examType,
                      title: `Deneme ${currentExamProfile.trials.length + 1}`,
                      date: new Date().toISOString().slice(0, 10),
                      scores: {},
                      wrongAnalyses: [],
                    })
                  }
                >
                  <Plus className="size-3" /> Deneme Sonucu Ekle
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* DENEME GİRİŞ FORMU */}
          {trialDraft && (
            <Card className="border-primary/40 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-base">Yeni Deneme Sonucu Girişi</CardTitle>
                <CardDescription className="text-xs">Ders bazında doğru ve yanlış sayılarını gir. Netler 4 yanlış 1 doğru kuralıyla hesaplanır.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Deneme Başlığı">
                    <input
                      className={fieldClass}
                      value={trialDraft.title}
                      onChange={(e) => setTrialDraft({ ...trialDraft, title: e.target.value })}
                      placeholder="Örn. Özdebir TYT 1 veya Türkiye Geneli"
                    />
                  </Field>
                  <Field label="Tarih">
                    <input
                      className={fieldClass}
                      type="date"
                      value={trialDraft.date}
                      onChange={(e) => setTrialDraft({ ...trialDraft, date: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="divide-y rounded-xl border bg-background">
                  {examTemplates[trialDraft.examType].subjects.map((sub) => {
                    const current = trialDraft.scores[sub.id] ?? { correct: 0, incorrect: 0, empty: 0 };
                    const net = calculateNet(current.correct, current.incorrect);
                    return (
                      <div key={sub.id} className="grid grid-cols-[1fr_80px_80px_70px] items-center gap-2 p-3 text-xs">
                        <div>
                          <p className="font-medium">{sub.name}</p>
                          <p className="text-[10px] text-muted-foreground">{sub.questionCount} soru</p>
                        </div>
                        <div>
                          <Label className="text-[10px]">Doğru</Label>
                          <input
                            type="number"
                            min="0"
                            max={sub.questionCount}
                            className={fieldClass + " h-8 text-xs"}
                            value={current.correct}
                            onChange={(e) =>
                              setTrialDraft({
                                ...trialDraft,
                                scores: {
                                  ...trialDraft.scores,
                                  [sub.id]: { ...current, correct: Number(e.target.value) },
                                },
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-[10px]">Yanlış</Label>
                          <input
                            type="number"
                            min="0"
                            max={sub.questionCount}
                            className={fieldClass + " h-8 text-xs"}
                            value={current.incorrect}
                            onChange={(e) =>
                              setTrialDraft({
                                ...trialDraft,
                                scores: {
                                  ...trialDraft.scores,
                                  [sub.id]: { ...current, incorrect: Number(e.target.value) },
                                },
                              })
                            }
                          />
                        </div>
                        <div className="text-right font-semibold text-primary">{net} Net</div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <Button size="sm" onClick={saveTrial} disabled={!trialDraft.title.trim()}>
                    Denemeyi Kaydet
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setTrialDraft(null)}>
                    Vazgeç
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* HAFTALIK NET GELİŞİM GRAFİĞİ (Gereksinim 2) */}
          {trendPoints.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" />
                  Haftalık Net Gelişim Trendi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 pt-2">
                  {trendPoints.map((pt) => (
                    <div key={pt.week} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Hafta: {pt.week} ({pt.trialCount} Deneme)</span>
                        <span className="font-semibold text-primary">Ortalama: {pt.averageNet} Net (En Yüksek: {pt.maxNet})</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (pt.averageNet / (currentExamProfile.targetNet ?? 100)) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* TEKRAR TAKVİMİ (Gereksinim 2) */}
          {reviewSchedule.length > 0 && (
            <div className="rounded-xl border p-4 space-y-3 bg-muted/10">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Clock className="size-4" />
                <span>Denemelerden Çıkarılan Tekrar Takvimi</span>
              </div>
              <div className="space-y-2">
                {reviewSchedule.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg border bg-background p-2.5 text-xs">
                    <div>
                      <span className="font-medium">{item.topic}</span>
                      <p className="text-[11px] text-muted-foreground">{item.reason}</p>
                    </div>
                    <span className="rounded bg-muted px-2 py-1 text-muted-foreground">{item.reviewDate}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DENEME LİSTESİ */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Kayıtlı Denemeler</h4>
            {currentExamProfile.trials.map((trial) => (
              <div key={trial.id} className="flex items-center justify-between rounded-xl border p-3.5 text-sm">
                <div>
                  <p className="font-medium">{trial.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {trial.date} · {trial.estimatedScore ? `Tahmini Puan: ${trial.estimatedScore}` : ""}
                  </p>
                </div>
                <span className="text-base font-bold text-primary">{trial.totalNet} Net</span>
              </div>
            ))}
            {!currentExamProfile.trials.length && (
              <p className="py-4 text-center text-xs text-muted-foreground">Henüz kaydedilmiş deneme sınavı yok.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ALAN KAYITLARI (MODÜLLER) */}
      {activeTab === "records" && config && (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between gap-2">
            <div className="flex gap-2">
              {modules.map((m) => (
                <Button key={m.name} size="sm" variant={moduleName === m.name ? "default" : "outline"} onClick={() => { setModuleName(m.name); setDraft(null); }}>
                  {m.name}
                </Button>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={() => setDraft({ id: crypto.randomUUID(), areaId: area.id, module: moduleName, title: "", values: {}, notes: "" })}>
              Kayıt ekle
            </Button>
          </div>

          {draft && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Ad / başlık">
                <input className={fieldClass} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </Field>
              {config.fields.map((f) => (
                <Field key={f.key} label={f.label}>
                  <input
                    className={fieldClass}
                    type={f.type}
                    min={f.type === "number" ? 0 : undefined}
                    value={draft.values[f.key] ?? ""}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        values: { ...draft.values, [f.key]: f.type === "number" ? String(Math.max(0, Number(e.target.value))) : e.target.value },
                      })
                    }
                  />
                </Field>
              ))}
              <div className="sm:col-span-2">
                <Field label="Not / analiz">
                  <textarea className={fieldClass} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
                </Field>
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button disabled={!draft.title.trim()} onClick={() => { update((s) => ({ ...s, records: [...(s.records ?? []).filter((r) => r.id !== draft.id), draft] })); setDraft(null); }}>
                  Kaydet
                </Button>
                <Button variant="ghost" onClick={() => setDraft(null)}>
                  Vazgeç
                </Button>
              </div>
            </div>
          )}

          {rows.map((r) => (
            <article key={r.id} className="border-t pt-3">
              <div className="flex justify-between gap-4">
                <h4 className="font-medium">{r.title}</h4>
                <Button size="sm" variant="ghost" onClick={() => setDraft({ ...r, values: { ...r.values } })}>
                  Düzenle
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                {config.fields.map((f) => (
                  <span key={f.key}>
                    {f.label}: {r.values[f.key] || "—"}
                  </span>
                ))}
              </div>
              {r.notes && <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">{r.notes}</p>}
            </article>
          ))}
          {!rows.length && !draft && <p className="text-sm text-muted-foreground">Henüz bu modülde kayıt yok.</p>}
        </div>
      )}
    </section>
  );
}

function proofKindLabel(kind: DomainProofKind): string {
  const map: Record<DomainProofKind, string> = {
    notebook: "Jupyter / Notebook",
    dashboard: "Dashboard / Gösterge Paneli",
    clinical_note: "Anonim Klinik Not",
    case_summary: "Vaka Özeti",
    citation_analysis: "Kaynakça Analizi",
    calculation: "Mühendislik Hesabı",
    drawing: "CAD / Çizim",
    technical_report: "Teknik Rapor",
    github_link: "GitHub / Kod Deposu",
    game_analysis: "Oyun / PGN Analizi",
    exam_trial: "Deneme Karnesi",
    other: "Teknik Kanıt",
  };
  return map[kind] ?? "Kanıt";
}

function defaultProofKind(areaName: string): DomainProofKind {
  const n = areaName.toLowerCase();
  if (n.includes("veri") || n.includes("data")) return "notebook";
  if (n.includes("tıp") || n.includes("med")) return "clinical_note";
  if (n.includes("tarih") || n.includes("history")) return "citation_analysis";
  if (n.includes("mühendis") || n.includes("engineer")) return "calculation";
  if (n.includes("yazılım") || n.includes("mobil") || n.includes("ai")) return "github_link";
  if (n.includes("satranç") || n.includes("chess")) return "game_analysis";
  if (n.includes("sınav") || n.includes("tyt") || n.includes("kpss")) return "exam_trial";
  return "other";
}
