"use client";

import Image from "next/image";
import { NorthLogo } from "@/components/layout/north-logo";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Compass, DollarSign, Info, Plus, ShieldCheck, Target, Trash2, University } from "lucide-react";
import { useWorkspace } from "@/components/features/workspace-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAssessmentQuestions } from "@/lib/onboarding";
import { evaluateAdaptiveAssessment } from "@/lib/domain-catalog";
import {
  detectLanguage,
  getLanguageGoalSuggestions,
  getLanguageLevelLabel,
  type LanguageLevel,
} from "@/lib/language-learning";
import type { AgeRange, InitialSetupInput, LifeSituation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const suggestions = [
  "İngilizce",
  "Almanca",
  "Fransızca",
  "Japonca",
  "Arapça",
  "Siber Güvenlik",
  "Veri Analizi",
  "AI/LLM",
  "Mobil Uygulama Geliştirme",
  "Yazılım Geliştirme",
  "Matematik",
  "İstatistik",
  "Tıp",
  "Tarih",
  "Kalite Mühendisliği",
  "Genel Mühendislik",
  "Satranç",
  "İktisat",
  "Yabancı dil",
];

const areaAliases: Record<string, string[]> = {
  "İngilizce": ["ingilizce", "english", "ing", "ielts", "toefl", "yds"],
  "Almanca": ["almanca", "german", "deutsch", "goethe", "testdaf"],
  "Fransızca": ["fransızca", "french", "français", "delf", "dalf"],
  "Japonca": ["japonca", "japanese", "nihongo", "jlpt"],
  "Arapça": ["arapça", "arabic", "arabca", "fasih arapça"],
  "Siber Güvenlik": ["siber", "cyber", "güvenlik", "pentest", "soc"],
  "Veri Analizi": ["veri", "data", "data analyst", "veri analisti", "bi", "pandas"],
  "AI/LLM": ["ai", "llm", "yapay zeka", "machine learning", "makine öğrenmesi", "deep learning"],
  "Mobil Uygulama Geliştirme": ["mobil", "mobile", "mobile app developer", "flutter", "react native", "ios", "android"],
  "Yazılım Geliştirme": ["yazılım", "uygulama", "kod", "programlama", "dev", "frontend", "backend"],
  "Matematik": ["mat", "matem", "calculus", "cebir"],
  "İstatistik": ["istatistik", "statistics", "olasılık", "hipotez"],
  "Tıp": ["tıp", "medicine", "medikal", "klinik", "anatomi"],
  "Tarih": ["tarih", "history", "cumhuriyet", "osmanlı"],
  "Kalite Mühendisliği": ["kalite", "quality", "quality engineer", "six sigma", "dmaic", "spc"],
  "Genel Mühendislik": ["mühendislik", "engineering", "makine", "cad"],
  "Satranç": ["satranç", "satranc", "chess"],
  "İktisat": ["iktisat", "ekonomi", "mikro", "makro"],
  "Yabancı dil": ["ingilizce", "dil", "english", "almanca"],
};

const initialForm: InitialSetupInput = {
  fullName: "",
  goal: "",
  track: "Kişisel gelişim",
  primaryFocus: "",
  interests: [],
  areaGoals: {},
  ageRange: "19-24",
  lifeSituation: "university",
  learningPreferences: {
    language: "tr",
    cost: "free_only",
    format: ["practice", "reading"],
    weeklyBudget: 0,
  },
  isUniversityStudent: false,
  universitySchool: "",
  universityDepartment: "",
  universityCourses: [],
  weeklyCapacityHours: 5,
  preferredSessionMinutes: 50,
  englishLevel: "working",
  labAccess: "browser",
  preferredStyle: "balanced",
  constraints: "",
  assessmentAnswers: {},
};

const days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

export default function OnboardingPage() {
  const router = useRouter();
  const workspace = useWorkspace();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const questions = useMemo(
    () =>
      getAssessmentQuestions(
        form.interests.map(
          (area) =>
            `${area}::${form.areaGoals[area]?.goal ?? ""}::${form.areaGoals[area]?.level ?? "beginner"}`
        )
      ),
    [form.areaGoals, form.interests]
  );

  const answered = questions.filter((item) => form.assessmentAnswers[item.id] !== undefined).length;
  const adaptiveResult = useMemo(
    () => evaluateAdaptiveAssessment(form.assessmentAnswers, questions),
    [form.assessmentAnswers, questions]
  );

  useEffect(() => {
    if (workspace.ready && workspace.authStatus === "signed_out") router.replace("/login");
  }, [router, workspace.authStatus, workspace.ready]);

  function addInterest(value = draft) {
    const clean = value.trim().replace(/\s+/g, " ");
    if (!clean || form.interests.some((item) => item.localeCompare(clean, "tr", { sensitivity: "accent" }) === 0)) return;
    const lang = detectLanguage(clean);
    const initialLevel = lang ? "beginner" : undefined;
    const initialGoal = lang ? getLanguageGoalSuggestions(clean, "beginner")[0] ?? "" : "";
    setForm((current) => ({
      ...current,
      interests: [...current.interests, clean],
      primaryFocus: current.primaryFocus || clean,
      areaGoals: {
        ...current.areaGoals,
        [clean]: { goal: initialGoal, targetWeeks: 12, level: initialLevel },
      },
      assessmentAnswers: {},
    }));
    setDraft("");
  }

  function removeInterest(value: string) {
    setForm((current) => {
      const interests = current.interests.filter((item) => item !== value);
      const areaGoals = Object.fromEntries(Object.entries(current.areaGoals).filter(([key]) => key !== value));
      return { ...current, interests, primaryFocus: interests[0] ?? "", areaGoals, assessmentAnswers: {} };
    });
  }

  function addCourse() {
    setForm((current) => ({
      ...current,
      universityCourses: [...current.universityCourses, { id: crypto.randomUUID(), name: "", day: "Pazartesi", start: "09:00", minutes: 60 }],
    }));
  }

  const canContinue = step === 0 ? form.fullName.trim().length >= 2 && form.interests.length > 0 : true;

  const matchingSuggestions = Object.entries(areaAliases)
    .filter(([name, aliases]) => !form.interests.includes(name) && [name, ...aliases].some((term) => term.toLocaleLowerCase("tr").includes(draft.trim().toLocaleLowerCase("tr"))))
    .map(([name]) => name);

  async function finish() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const areaGoals = Object.fromEntries(
        form.interests.map((area) => [
          area,
          {
            goal: form.areaGoals[area]?.goal.trim() || `${area} için düzenli ve ölçülebilir bir çalışma planı kurmak`,
            targetWeeks: form.areaGoals[area]?.targetWeeks ?? 12,
            level: form.areaGoals[area]?.level,
          },
        ])
      );
      await workspace.completeInitialSetup({
        ...form,
        areaGoals,
        goal: areaGoals[form.interests[0]]?.goal ?? form.goal,
        primaryFocus: form.interests[0],
      });
      router.replace("/");
    } catch (err) {
      console.error("Onboarding tamamlanırken hata:", err);
      toast.error("Plan kaydedilirken bir sorun oluştu, lütfen tekrar deneyin.");
      setSubmitting(false);
    }
  }

  async function quickStart() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const areaGoals = Object.fromEntries(
        form.interests.map((area) => [
          area,
          {
            goal: form.areaGoals[area]?.goal.trim() || `${area} için düzenli bir çalışma düzeni kurmak`,
            targetWeeks: form.areaGoals[area]?.targetWeeks ?? 12,
            level: form.areaGoals[area]?.level,
          },
        ])
      );
      const firstGoal = areaGoals[form.interests[0]]?.goal ?? "Bugün tek bir anlamlı adım atmak";
      await workspace.completeInitialSetup({
        ...form,
        areaGoals,
        goal: firstGoal,
        primaryFocus: form.interests[0],
        assessmentAnswers: {},
      });
      router.replace("/");
    } catch (err) {
      console.error("Hızlı başlatma hatası:", err);
      toast.error("Hızlı başlatma sırasında bir sorun oluştu.");
      setSubmitting(false);
    }
  }

  const primaryTargetWeeks = form.areaGoals[form.interests[0]]?.targetWeeks ?? 12;

  return (
    <main className="min-h-dvh bg-background px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 flex items-center justify-center gap-3">
          <NorthLogo size={42} priority />
          <div>
            <p className="font-planorth text-base tracking-[0.04em]">PLANORTH</p>
            <p className="text-xs text-muted-foreground">Kişisel uzun vadeli gelişim koçun</p>
          </div>
        </div>

        <div className="mb-5 flex items-center justify-between text-xs text-muted-foreground">
          <span>Adım {step + 1} / 4</span>
          <span>{["Seni ve alanını tanıyalım", "Uyarlanabilir başlangıç değerlendirmesi", "Zamanın ve kaynak tercihlerin", "Dönem planın hazır"][step]}</span>
        </div>
        <Progress value={(step + 1) * 25} className="mb-6" />

        {/* STEP 0: SENİ VE ALANINI TANIYALIM */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-5 text-primary" />
                Hedefini ve profilini belirle
              </CardTitle>
              <CardDescription>
                Yaş ve yaşam durumun yalnızca sana en uygun plan yoğunluğunu ve takvim ritmini sunmak için kullanılır.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <Field label="Ad soyad">
                <Input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Adın ve soyadın" autoFocus />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Yaş aralığın">
                  <Select value={form.ageRange ?? "19-24"} onValueChange={(val) => setForm({ ...form, ageRange: val as AgeRange })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16-18">16 – 18 yaş</SelectItem>
                      <SelectItem value="19-24">19 – 24 yaş</SelectItem>
                      <SelectItem value="25-32">25 – 32 yaş</SelectItem>
                      <SelectItem value="33-40">33 – 40 yaş</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Yaşam durumun">
                  <Select
                    value={form.lifeSituation ?? "university"}
                    onValueChange={(val) => {
                      const sit = val as LifeSituation;
                      setForm({
                        ...form,
                        lifeSituation: sit,
                        isUniversityStudent: sit === "university",
                      });
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high_school">Lise öğrencisi</SelectItem>
                      <SelectItem value="university">Üniversite öğrencisi</SelectItem>
                      <SelectItem value="working">Çalışan</SelectItem>
                      <SelectItem value="career_changer">Kariyer değiştiren</SelectItem>
                      <SelectItem value="other">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="İlgi ve gelişim alanların">
                <div className="flex gap-2">
                  <Input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addInterest();
                      }
                    }}
                    placeholder="Örn. Veri Analizi, Tıp, AI/LLM, Tarih veya YKS/TYT..."
                  />
                  <Button type="button" variant="outline" onClick={() => addInterest()}>
                    <Plus />Ekle
                  </Button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {form.interests.map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-sm text-primary">
                      {item}
                      <button type="button" onClick={() => removeInterest(item)} aria-label={`${item} alanını kaldır`} className="rounded-full p-0.5 hover:bg-primary/15">
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(draft.trim() ? matchingSuggestions : suggestions.filter((item) => !form.interests.includes(item))).map((item) => (
                    <button type="button" key={item} onClick={() => addInterest(item)} className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground">
                      + {item}
                    </button>
                  ))}
                  {draft.trim() && matchingSuggestions.length === 0 && !suggestions.some((item) => item.localeCompare(draft.trim(), "tr", { sensitivity: "accent" }) === 0) ? (
                    <button type="button" onClick={() => addInterest()} className="rounded-full border border-primary/40 px-3 py-1 text-xs text-primary">
                      + “{draft.trim()}” ekle
                    </button>
                  ) : null}
                </div>
              </Field>

              {form.interests.map((area) => {
                const lang = detectLanguage(area);
                const currentLevel = (form.areaGoals[area]?.level as LanguageLevel) || "beginner";
                return (
                  <div key={area} className="rounded-xl border bg-muted/20 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {lang && <span className="text-xl" role="img" aria-label={lang.name}>{lang.flag}</span>}
                        <p className="font-medium">{area}</p>
                        {lang && (
                          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                            {lang.nativeName}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">Hedef Dönemi</span>
                    </div>

                    {lang && (
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-foreground">Mevcut Dil Seviyeniz</Label>
                          <span className="text-[11px] text-muted-foreground">Bu seviyeye göre 3-4 soruluk teşhis testi sunulur</span>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {(["beginner", "intermediate", "advanced"] as LanguageLevel[]).map((lvl) => {
                            const meta = lang.levels[lvl];
                            const isSelected = currentLevel === lvl;
                            return (
                              <button
                                type="button"
                                key={lvl}
                                className={cn(
                                  "rounded-xl border p-2.5 text-left transition-all",
                                  isSelected
                                    ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary"
                                    : "border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                )}
                                onClick={() => {
                                  const newGoals = getLanguageGoalSuggestions(area, lvl);
                                  const shouldUpdateGoal =
                                    !form.areaGoals[area]?.goal ||
                                    getLanguageGoalSuggestions(area, currentLevel).includes(form.areaGoals[area]?.goal);
                                  setForm((current) => ({
                                    ...current,
                                    areaGoals: {
                                      ...current.areaGoals,
                                      [area]: {
                                        ...current.areaGoals[area],
                                        goal: shouldUpdateGoal ? (newGoals[0] ?? current.areaGoals[area]?.goal) : current.areaGoals[area]?.goal,
                                        targetWeeks: current.areaGoals[area]?.targetWeeks ?? 12,
                                        level: lvl,
                                      },
                                    },
                                    goal: current.interests[0] === area && shouldUpdateGoal ? (newGoals[0] ?? current.goal) : current.goal,
                                    assessmentAnswers: {},
                                  }));
                                }}
                              >
                                <div className="text-xs font-semibold">{meta.label}</div>
                                <div className="mt-0.5 text-[10px] leading-tight opacity-80">{meta.description}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {goalSuggestions(area, currentLevel).map((goal) => (
                        <button
                          type="button"
                          key={goal}
                          className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              areaGoals: {
                                ...current.areaGoals,
                                [area]: {
                                  ...current.areaGoals[area],
                                  goal,
                                  targetWeeks: current.areaGoals[area]?.targetWeeks ?? 12,
                                  level: current.areaGoals[area]?.level ?? (lang ? "beginner" : undefined),
                                },
                              },
                              goal: current.interests[0] === area ? goal : current.goal,
                            }))
                          }
                        >
                          {goal}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_190px]">
                      <Input
                        value={form.areaGoals[area]?.goal ?? ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            areaGoals: {
                              ...current.areaGoals,
                              [area]: {
                                ...current.areaGoals[area],
                                goal: event.target.value,
                                targetWeeks: current.areaGoals[area]?.targetWeeks ?? 12,
                                level: current.areaGoals[area]?.level ?? (lang ? "beginner" : undefined),
                              },
                            },
                            goal: current.interests[0] === area ? event.target.value : current.goal,
                          }))
                        }
                        placeholder={`${area} alanında hangi somut sonuca ulaşmak istiyorsun?`}
                      />
                      <Select
                        value={String(form.areaGoals[area]?.targetWeeks ?? 12)}
                        onValueChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            areaGoals: {
                              ...current.areaGoals,
                              [area]: {
                                ...current.areaGoals[area],
                                goal: current.areaGoals[area]?.goal ?? "",
                                targetWeeks: Number(value),
                                level: current.areaGoals[area]?.level ?? (lang ? "beginner" : undefined),
                              },
                            },
                          }))
                        }
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4">4 hafta (Hızlı döngü)</SelectItem>
                          <SelectItem value="8">8 hafta (2 aylık odak)</SelectItem>
                          <SelectItem value="12">12 hafta (Dönem planı)</SelectItem>
                          <SelectItem value="16">16 hafta (4 aylık program)</SelectItem>
                          <SelectItem value="24">24 hafta (Kapsamlı hazırlık)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* STEP 1: UYARLANABİLİR BAŞLANGIÇ DEĞERLENDİRMESİ */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                Uyarlanabilir başlangıç değerlendirmesi
              </CardTitle>
              <CardDescription>
                Bu sorular kesin bir yeterlilik iddiası değil; North’un ilk görevlerini ve zorluk seviyeni doğru ayarlaması için bir <strong>başlangıç sinyalidir</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-7">
              {questions.map((question, index) => (
                <fieldset key={question.id} className="space-y-3">
                  <legend className="text-sm font-medium">
                    <span className="mr-2 text-muted-foreground">{index + 1}.</span>
                    {question.prompt}
                  </legend>
                  <div className="grid gap-2">
                    {question.options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={form.assessmentAnswers[question.id] === option.value}
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            assessmentAnswers: { ...current.assessmentAnswers, [question.id]: option.value },
                          }))
                        }
                        className={cn(
                          "flex min-h-12 items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                          form.assessmentAnswers[question.id] === option.value
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border text-muted-foreground hover:bg-muted/40"
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-5 shrink-0 place-items-center rounded-full border",
                            form.assessmentAnswers[question.id] === option.value && "border-primary bg-primary text-primary-foreground"
                          )}
                        >
                          <Check className={cn("size-3", form.assessmentAnswers[question.id] !== option.value && "opacity-0")} />
                        </span>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              ))}

              {answered > 0 && adaptiveResult.subTopicDeficiencies.length > 0 && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Info className="size-4" />
                    <span>Tespit Edilen Öncelikli Tekrar Başlıkları</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cevaplarına göre aşağıdaki alt konularda başlangıç tekrarı planına dahil edilecek:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {adaptiveResult.subTopicDeficiencies.map((topic) => (
                      <span key={topic} className="rounded-md border bg-background px-2.5 py-1 text-xs font-medium">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 2: ZAMANIN, TAKVİMİN VE KAYNAK TERCİHLERİN */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Compass className="size-5 text-primary" />
                Zamanını ve kaynak tercihlerini koruyalım
              </CardTitle>
              <CardDescription>
                Gerçek takvimin planın sınırıdır. Ders, iş vardiyası ve kişisel blokların çalışma süresiyle çakışmaz.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <Field label="Haftalık ayırabileceğin süre">
                <Select value={String(form.weeklyCapacityHours)} onValueChange={(value) => setForm({ ...form, weeklyCapacityHours: Number(value) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[2, 3, 5, 7, 10, 14, 20].map((hours) => (
                      <SelectItem key={hours} value={String(hours)}>{hours} saat / hafta</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Tercih ettiğin odak oturumu">
                <Select value={String(form.preferredSessionMinutes)} onValueChange={(value) => setForm({ ...form, preferredSessionMinutes: Number(value) as 45 | 50 | 60 })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="45">45 dakika (Tavsiye edilen)</SelectItem>
                    <SelectItem value="50">50 dakika</SelectItem>
                    <SelectItem value="60">60 dakika</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {/* KAYNAK VE FORMAT TERCİHLERİ (Gereksinim 7) */}
              <div className="sm:col-span-2 rounded-xl border p-4 space-y-4">
                <p className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="size-4 text-primary" />
                  Kişisel Kaynak ve Bütçe Tercihlerin
                </p>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Dil tercihi">
                    <Select
                      value={form.learningPreferences?.language ?? "tr"}
                      onValueChange={(v) =>
                        setForm({
                          ...form,
                          learningPreferences: {
                            language: v as "tr" | "en" | "both",
                            cost: form.learningPreferences?.cost ?? "free_only",
                            format: form.learningPreferences?.format ?? ["practice", "reading"],
                            weeklyBudget: form.learningPreferences?.weeklyBudget ?? 0,
                          },
                        })
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tr">Türkçe öncelikli</SelectItem>
                        <SelectItem value="en">İngilizce öncelikli</SelectItem>
                        <SelectItem value="both">Her ikisi de uygun</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Maliyet tercihi">
                    <Select
                      value={form.learningPreferences?.cost ?? "free_only"}
                      onValueChange={(v) =>
                        setForm({
                          ...form,
                          learningPreferences: {
                            language: form.learningPreferences?.language ?? "tr",
                            cost: v as "free_only" | "paid_allowed",
                            format: form.learningPreferences?.format ?? ["practice", "reading"],
                            weeklyBudget: form.learningPreferences?.weeklyBudget ?? 0,
                          },
                        })
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free_only">Yalnızca ücretsiz kaynaklar</SelectItem>
                        <SelectItem value="paid_allowed">Ücretli kaynaklar da olabilir</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Haftalık bütçe">
                    <Select
                      value={String(form.learningPreferences?.weeklyBudget ?? 0)}
                      onValueChange={(v) =>
                        setForm({
                          ...form,
                          learningPreferences: {
                            language: form.learningPreferences?.language ?? "tr",
                            cost: form.learningPreferences?.cost ?? "free_only",
                            format: form.learningPreferences?.format ?? ["practice", "reading"],
                            weeklyBudget: Number(v),
                          },
                        })
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0 ₺ (Tamamen ücretsiz)</SelectItem>
                        <SelectItem value="150">150 ₺ / hafta</SelectItem>
                        <SelectItem value="350">350 ₺ / hafta</SelectItem>
                        <SelectItem value="750">750+ ₺ / hafta</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>

              {/* DERS PROGRAMI / ÜNİVERSİTE / OKUL / VARDİYA */}
              <div className="sm:col-span-2 rounded-xl border p-4">
                <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.isUniversityStudent}
                    onChange={(event) => setForm({ ...form, isUniversityStudent: event.target.checked })}
                  />
                  <University className="size-4 text-primary" />
                  Ders programım veya düzenli derslerim var
                </label>

                {form.isUniversityStudent && (
                  <div className="mt-4 grid gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Okul / Üniversite">
                        <Input
                          value={form.universitySchool}
                          onChange={(event) => setForm({ ...form, universitySchool: event.target.value })}
                          placeholder="Okul adı"
                        />
                      </Field>
                      <Field label="Bölüm / Alan">
                        <Input
                          value={form.universityDepartment}
                          onChange={(event) => setForm({ ...form, universityDepartment: event.target.value })}
                          placeholder="Bölüm veya sınıf"
                        />
                      </Field>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Haftalık ders blokları</p>
                        <Button type="button" size="sm" variant="outline" onClick={addCourse}>
                          <Plus />Ders ekle
                        </Button>
                      </div>
                      <div className="mt-3 space-y-2">
                        {form.universityCourses.map((course) => (
                          <div key={course.id} className="grid grid-cols-[1fr_120px_90px_36px] gap-2">
                            <Input
                              value={course.name}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  universityCourses: current.universityCourses.map((item) =>
                                    item.id === course.id ? { ...item, name: event.target.value } : item
                                  ),
                                }))
                              }
                              placeholder="Ders adı"
                            />
                            <Select
                              value={course.day}
                              onValueChange={(day) =>
                                setForm((current) => ({
                                  ...current,
                                  universityCourses: current.universityCourses.map((item) =>
                                    item.id === course.id ? { ...item, day } : item
                                  ),
                                }))
                              }
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {days.map((day) => (
                                  <SelectItem key={day} value={day}>{day}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="time"
                              value={course.start}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  universityCourses: current.universityCourses.map((item) =>
                                    item.id === course.id ? { ...item, start: event.target.value } : item
                                  ),
                                }))
                              }
                            />
                            <button
                              type="button"
                              className="grid place-items-center rounded-md border text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                setForm((current) => ({
                                  ...current,
                                  universityCourses: current.universityCourses.filter((item) => item.id !== course.id),
                                }))
                              }
                              aria-label="Dersi kaldır"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        ))}
                        {!form.universityCourses.length && (
                          <p className="text-xs text-muted-foreground">Ders ekle; North bu zamanları boş bırakır ve takvimde gösterir.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Field label="Kişisel zaman kısıtların">
                <Input
                  value={form.constraints}
                  onChange={(event) => setForm({ ...form, constraints: event.target.value })}
                  placeholder="Örn. Hafta içi yalnızca akşam 20:00 sonrası, hafta sonu sabahları"
                />
              </Field>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: DÖNEM VE BAŞLANGIÇ PLANI ÖZETİ */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Kişisel Dönem Planın Hazır</CardTitle>
              <CardDescription>
                Sabit günler yerine seçtiğin {primaryTargetWeeks} haftalık hedefe göre 5 aşamalı gelişim yolu oluşturuldu.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-4">
                <Summary label="Başlangıç Sinyali" value={`${adaptiveResult.score}/${adaptiveResult.total}`} detail="Giriş göstergesi" />
                <Summary label="Dönem Süresi" value={`${primaryTargetWeeks} Hafta`} detail="5 aşamalı yol haritası" />
                <Summary label="Haftalık Yük" value={`${form.weeklyCapacityHours} saat/hf`} detail={`${form.preferredSessionMinutes} dk oturum`} />
                <Summary label="Kaynak Tercihi" value={form.learningPreferences?.cost === "free_only" ? "Ücretsiz" : "Esnek"} detail={form.learningPreferences?.language === "tr" ? "Türkçe" : "İngilizce/İki Dilli"} />
              </div>

              <div className="rounded-xl border bg-muted/20 p-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">5 Aşamalı Dönem Yol Haritası ({primaryTargetWeeks} Hafta)</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="size-6 rounded-full bg-primary/20 text-primary grid place-items-center text-xs font-bold">1</span>
                    <div><strong>Başlangıç:</strong> Temel ön koşul haritası ve ilk güvenilir kaynaklar</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="size-6 rounded-full bg-primary/20 text-primary grid place-items-center text-xs font-bold">2</span>
                    <div><strong>Ara Kontrol:</strong> İlk pratik çıktılar ve zayıf alt konu analizi</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="size-6 rounded-full bg-primary/20 text-primary grid place-items-center text-xs font-bold">3</span>
                    <div><strong>Uygulama:</strong> Yoğun pratik ve derin çalışma oturumları</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="size-6 rounded-full bg-primary/20 text-primary grid place-items-center text-xs font-bold">4</span>
                    <div><strong>Tekrar:</strong> Aralıklı tekrar ve simülasyon/deneme uygulaması</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="size-6 rounded-full bg-primary/20 text-primary grid place-items-center text-xs font-bold">5</span>
                    <div><strong>Final Kanıt:</strong> Doğrulanabilir portföy veya sınav sonucu çıktısı</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border p-4 text-xs text-muted-foreground">
                <strong>İlk hedefin:</strong> {form.goal || form.interests[0]}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button variant="ghost" disabled={step === 0 || submitting} onClick={() => setStep((current) => current - 1)}>
            <ArrowLeft />Geri
          </Button>
          <div className="flex gap-2">
            {step === 0 && (
              <Button variant="outline" disabled={form.fullName.trim().length < 2 || !form.interests.length || submitting} onClick={quickStart}>
                {submitting ? "Başlatılıyor..." : "Hızlı başlat"}
              </Button>
            )}
            {step < 3 ? (
              <Button disabled={!canContinue || submitting} onClick={() => setStep((current) => current + 1)}>
                {step === 1 && answered < questions.length ? "Değerlendirmeyi sonra yap" : "Devam et"}
                <ArrowRight />
              </Button>
            ) : (
              <Button onClick={finish} disabled={submitting}>
                {submitting ? "Planorth hazırlanıyor..." : <>Planorth&apos;u başlat <ArrowRight /></>}
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Summary({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function goalSuggestions(area: string, level: LanguageLevel = "beginner") {
  const lang = detectLanguage(area);
  if (lang) return getLanguageGoalSuggestions(area, level);
  if (/siber|güvenlik/i.test(area)) return ["Network temellerini öğrenmek", "Web güvenliği lablarını çözmek", "SOC analizi öğrenmek"];
  if (/veri/i.test(area)) return ["SQL ve veri temizleme öğrenmek", "Keşifsel veri analizi notebook'u hazırlamak", "İlk dashboard'u yayınlamak"];
  if (/ai|llm/i.test(area)) return ["Prompt mühendisliği ve eval kurmak", "RAG prototipi geliştirmek", "LLM deneyi tamamlamak"];
  if (/mobil/i.test(area)) return ["İlk mobil ekranı kodlamak", "State management mimarisi kurmak", "Çalışan prototip yayınlamak"];
  if (/tıp/i.test(area)) return ["Fizyoloji ve patoloji mekanizmalarını pekiştirmek", "Haftada 3 vaka özeti incelemek", "Klinik kılavuz notu çıkarmak"];
  if (/tarih/i.test(area)) return ["Dönem kaynakça haritası çıkarmak", "Birincil metin tenkiti yapmak", "Tarihsel analiz raporu yazmak"];
  if (/kalite/i.test(area)) return ["DMAIC süreç haritası çıkarmak", "FMEA tablosu hazırlamak", "Kök neden analizi çözmek"];
  if (/mühendislik/i.test(area)) return ["Mühendislik hesaplama şablonu hazırlamak", "CAD çizimi tamamlamak", "Tasarım kriterlerini doğrulamak"];
  if (/istatistik/i.test(area)) return ["Hipotez testi çözümleri yapmak", "Regresyon modeli kurmak", "Veri dağılım analizleri tamamlamak"];
  if (/matematik/i.test(area)) return ["Ders ortalamamı yükseltmek", "Türev ve integral temelini güçlendirmek", "Her hafta 50 problem çözmek"];
  if (/uygulama|yazılım|geliştirme|kod/i.test(area)) return ["İlk uygulamamı yayınlamak", "React ile proje geliştirmek", "Portföy projesi tamamlamak"];
  if (/iktisat|ekonomi/i.test(area)) return ["Mikro iktisat temelini öğrenmek", "Ders ortalamamı yükseltmek", "Her hafta konu tekrarı yapmak"];
  if (/satranç/i.test(area)) return ["Taktik çözme düzeni kurmak", "Açılış repertuarı oluşturmak", "Online puanımı yükseltmek"];
  return ["Temel bilgileri öğrenmek", "Düzenli çalışma alışkanlığı kurmak", "Somut bir çıktı üretmek"];
}
