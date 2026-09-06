"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Compass, ShieldCheck, Target } from "lucide-react";
import { useWorkspace } from "@/components/features/workspace-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { calculateAssessment, getAssessmentQuestions } from "@/lib/onboarding";
import type { InitialSetupInput } from "@/lib/types";
import { cn } from "@/lib/utils";

const focusSuggestions = ["Siber güvenlik temelleri", "Ağ ve iç ağ güvenliği", "Web uygulama güvenliği", "Yabancı dil", "Matematik", "Kişisel proje"];
const trackOptions = ["Kariyer", "Eğitim", "Kişisel gelişim", "Sağlık ve yaşam", "Yaratıcı üretim", "Proje", "Siber güvenlik"];

const initialForm: InitialSetupInput = {
  fullName: "",
  goal: "",
  track: "Kişisel gelişim",
  primaryFocus: "",
  weeklyCapacityHours: 5,
  preferredSessionMinutes: 50,
  englishLevel: "working",
  labAccess: "browser",
  preferredStyle: "balanced",
  constraints: "",
  assessmentAnswers: {},
};

export default function OnboardingPage() {
  const router = useRouter();
  const workspace = useWorkspace();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<InitialSetupInput>(initialForm);
  const questions = useMemo(() => getAssessmentQuestions(form.primaryFocus), [form.primaryFocus]);
  const answered = questions.filter((question) => form.assessmentAnswers[question.id]).length;
  const assessment = useMemo(() => calculateAssessment(form.assessmentAnswers, questions), [form.assessmentAnswers, questions]);

  useEffect(() => {
    if (workspace.ready && workspace.authStatus === "signed_out") router.replace("/login");
  }, [router, workspace.authStatus, workspace.ready]);

  function chooseFocus(primaryFocus: string) {
    setForm((current) => ({ ...current, primaryFocus, assessmentAnswers: {} }));
  }

  function finish() {
    workspace.completeInitialSetup(form);
    router.replace("/");
  }

  const canContinue = step === 0 ? form.fullName.trim().length >= 2 && form.primaryFocus.trim().length >= 3 && form.goal.trim().length >= 8 : step === 1 ? answered === questions.length : true;

  return <main className="min-h-dvh bg-background px-4 py-6 sm:py-10">
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-8 flex items-center justify-center gap-3"><Image src="/north-mark.png" alt="" width={42} height={42} className="rounded-xl bg-white p-1" priority/><div><p className="font-semibold">North</p><p className="text-xs text-muted-foreground">Kişisel çalışma sistemini kur</p></div></div>
      <div className="mb-5 flex items-center justify-between text-xs text-muted-foreground"><span>Adım {step + 1} / 4</span><span>{["Hedefin", "Hedefe göre değerlendirme", "Çalışma tercihlerin", "Başlangıç planın"][step]}</span></div>
      <Progress value={(step + 1) * 25} className="mb-6" />

      {step === 0 && <Card><CardHeader><CardTitle className="flex items-center gap-2"><Target className="size-5 text-primary"/>Hedefini belirle</CardTitle><CardDescription>Hedefin sana özel olabilir. North sonraki adımda seçtiğin hedefe göre kısa bir başlangıç değerlendirmesi oluşturur.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
        <Field label="Adın"><Input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Adın" autoFocus /></Field>
        <Field label="Hedef kategorisi"><Select value={form.track} onValueChange={(track) => setForm({ ...form, track })}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{trackOptions.map((track) => <SelectItem key={track} value={track}>{track}</SelectItem>)}</SelectContent></Select></Field>
        <div className="sm:col-span-2"><Field label="İlk odak alanın"><Input value={form.primaryFocus} onChange={(event) => chooseFocus(event.target.value)} placeholder="Örn. İngilizce konuşma, matematik, ürün geliştirme…"/><div className="mt-2 flex flex-wrap gap-2">{focusSuggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => chooseFocus(suggestion)} className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">{suggestion}</button>)}</div></Field></div>
        <div className="sm:col-span-2"><Field label="90 gün sonra neyi başarmış olmak istiyorsun?"><Textarea value={form.goal} onChange={(event) => setForm({ ...form, goal: event.target.value })} placeholder="Örn. Temel web güvenliği lablarını bağımsız çözmek ve üç kaliteli rapor örneği hazırlamak." rows={3}/></Field></div>
      </CardContent></Card>}

      {step === 1 && <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary"/>{form.primaryFocus} başlangıç değerlendirmesi</CardTitle><CardDescription>Hedef alanına uygun 6 kısa soru. Bu bir sertifika sınavı değil; yalnızca ilk çalışma seviyeni belirler. Hedefini değiştirirsen sorular ve yanıtların da değişir.</CardDescription></CardHeader><CardContent className="space-y-7">
        {questions.map((question, index) => <fieldset key={question.id} className="space-y-3"><legend className="text-sm font-medium"><span className="mr-2 text-muted-foreground">{index + 1}.</span>{question.prompt}</legend><div className="grid gap-2">{question.options.map((option) => <button key={option.value} type="button" aria-pressed={form.assessmentAnswers[question.id] === option.value} onClick={() => setForm((current) => ({ ...current, assessmentAnswers: { ...current.assessmentAnswers, [question.id]: option.value } }))} className={cn("flex min-h-12 items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors", form.assessmentAnswers[question.id] === option.value ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:bg-muted/40")}><span className={cn("grid size-5 shrink-0 place-items-center rounded-full border", form.assessmentAnswers[question.id] === option.value && "border-primary bg-primary text-primary-foreground")}><Check className={cn("size-3", form.assessmentAnswers[question.id] !== option.value && "opacity-0")}/></span>{option.label}</button>)}</div></fieldset>)}
      </CardContent></Card>}

      {step === 2 && <Card><CardHeader><CardTitle className="flex items-center gap-2"><Compass className="size-5 text-primary"/>Çalışma tercihlerin</CardTitle><CardDescription>North ilk görevlerini bu gerçek kapasite ve çalışma biçimine göre oluşturur.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
        <Field label="Haftalık ayırabileceğin süre"><Select value={String(form.weeklyCapacityHours)} onValueChange={(value) => setForm({ ...form, weeklyCapacityHours: Number(value) })}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{[2,3,5,7,10,14].map((hours) => <SelectItem key={hours} value={String(hours)}>{hours} saat</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Tercih ettiğin odak oturumu"><Select value={String(form.preferredSessionMinutes)} onValueChange={(value) => setForm({ ...form, preferredSessionMinutes: Number(value) as 45 | 50 | 60 })}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="45">45 dakika</SelectItem><SelectItem value="50">50 dakika</SelectItem><SelectItem value="60">60 dakika</SelectItem></SelectContent></Select></Field>
        <Field label="Teknik İngilizce"><Select value={form.englishLevel} onValueChange={(value) => setForm({ ...form, englishLevel: value as InitialSetupInput["englishLevel"] })}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="basic">Temel</SelectItem><SelectItem value="working">Çalışma düzeyi</SelectItem><SelectItem value="comfortable">Rahat</SelectItem></SelectContent></Select></Field>
        <Field label="Pratik ortamın"><Select value={form.labAccess} onValueChange={(value) => setForm({ ...form, labAccess: value as InitialSetupInput["labAccess"] })}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="browser">Yalnızca tarayıcı tabanlı lab</SelectItem><SelectItem value="local_vm">Yerel sanal makine</SelectItem><SelectItem value="both">İkisi de</SelectItem></SelectContent></Select></Field>
        <Field label="Koçluk biçimi"><Select value={form.preferredStyle} onValueChange={(value) => setForm({ ...form, preferredStyle: value as InitialSetupInput["preferredStyle"] })}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="guided">Adım adım yönlendirme</SelectItem><SelectItem value="balanced">Dengeli</SelectItem><SelectItem value="independent">Bağımsızlığı zorlayan</SelectItem></SelectContent></Select></Field>
        <Field label="Kısıtların"><Input value={form.constraints} onChange={(event) => setForm({ ...form, constraints: event.target.value })} placeholder="Örn. Hafta içi yalnızca akşam"/></Field>
      </CardContent></Card>}

      {step === 3 && <Card><CardHeader><CardTitle>Başlangıç planın hazır</CardTitle><CardDescription>Bu plan sabit değil. Yaptıkların ve zorlandığın noktalar arttıkça North önerilerini güncelleyecek.</CardDescription></CardHeader><CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3"><Summary label="Değerlendirme" value={`${assessment.score}/${assessment.total}`} detail={`${form.primaryFocus} başlangıç puanı`}/><Summary label="İlk odak" value={form.primaryFocus} detail={form.track}/><Summary label="Kapasite" value={`${form.weeklyCapacityHours} saat/hafta`} detail={`${form.preferredSessionMinutes} dk oturum`}/></div>
        <div className="rounded-xl border bg-muted/20 p-5"><p className="text-xs text-muted-foreground">90 günlük hedefin</p><p className="mt-2 text-sm leading-6">{form.goal}</p></div>
        <div className="space-y-2 text-sm text-muted-foreground"><p>North senin için üç başlangıç görevi oluşturacak:</p><p>1. Temel haritayı çıkar</p><p>2. İlk güvenli pratiği tamamla</p><p>3. İlk doğrulanabilir kanıtını ekle</p></div>
      </CardContent></Card>}

      <div className="mt-6 flex items-center justify-between gap-3"><Button variant="ghost" disabled={step === 0} onClick={() => setStep((current) => current - 1)}><ArrowLeft/>Geri</Button>{step < 3 ? <Button disabled={!canContinue} onClick={() => setStep((current) => current + 1)}>Devam et<ArrowRight/></Button> : <Button onClick={finish}>North&apos;u başlat<ArrowRight/></Button>}</div>
      <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">Değerlendirme puanı yalnızca başlangıç seviyesini ayarlar. Gerçek beceri puanların tamamladığın çalışmalar ve eklediğin kanıtlarla değişir.</p>
    </div>
  </main>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function Summary({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-sm font-medium">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>; }
