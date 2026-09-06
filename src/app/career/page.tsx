"use client";

import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  FileText,
  FolderGit2,
  LoaderCircle,
  Plus,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { useWorkspace } from "@/components/features/workspace-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { authenticatedAiFetch } from "@/lib/ai/client";
import { CareerExtensions } from "@/components/features/career-extensions";
import type { InterviewAttempt } from "@/lib/types";

type JobAnalysis = {
  requiredSkills: string[];
  niceToHave: string[];
  missingSkills: string[];
  matchScore: number;
  analysis: string;
  gapPlan: string[];
};

const interviewQuestions: Record<InterviewAttempt["role"], string> = {
  hr: "Kendini tanıtır mısın ve neden siber güvenlik alanında çalışmak istiyorsun?",
  junior_security:
    "Şüpheli bir kullanıcı girişini incelerken hangi kanıtları toplar, hangi ilk adımları atarsın?",
  pentest:
    "Bir web uygulamasında yetkisiz erişim bulgusunu doğrulamak ve sorumlu biçimde raporlamak için nasıl ilerlersin?",
  networking:
    "Bir ağda DNS trafiğinde olağandışı davranış fark edersen bunu nasıl araştırırsın?",
  linux:
    "Linux sunucuda olası yetki yükseltme şüphesinde hangi kontrolleri yaparsın?",
  active_directory:
    "Active Directory ortamında şüpheli bir Kerberos etkinliğini nasıl değerlendirirsin?",
  cloud:
    "Bulut hesabında yanlış yapılandırılmış erişim izni tespit ettiğinde risk azaltma planın ne olur?",
};

function asErrorMessage(value: unknown) {
  return value instanceof Error ? value.message : "İşlem tamamlanamadı. Lütfen tekrar dene.";
}

export default function CareerPage() {
  const workspace = useWorkspace();
  const [tab, setTab] = useState("roadmap");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [jobText, setJobText] = useState("");
  const [jobBusy, setJobBusy] = useState(false);
  const [jobError, setJobError] = useState("");
  const [projectTitle, setProjectTitle] = useState("");

  const applicationKeys = useMemo(
    () => new Set(workspace.applications.map((application) => `${application.company}:${application.position}`)),
    [workspace.applications],
  );

  async function analyzeJob() {
    if (!company.trim() || !position.trim() || jobText.trim().length < 30) {
      setJobError("Şirket, pozisyon ve en az 30 karakterlik ilan metni gerekli.");
      return;
    }

    setJobBusy(true);
    setJobError("");
    try {
      const response = await authenticatedAiFetch("/api/ai/job-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: company.trim(),
          position: position.trim(),
          text: jobText.trim(),
          skills: workspace.skills.map(({ name, score }) => ({ name, score })),
        }),
      });
      const data = (await response.json()) as JobAnalysis & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "İlan analizi alınamadı.");

      workspace.addJob({
        id: crypto.randomUUID(),
        company: company.trim(),
        position: position.trim(),
        text: jobText.trim(),
        addedAt: new Date().toISOString(),
        requiredSkills: data.requiredSkills,
        niceToHave: data.niceToHave,
        missingSkills: data.missingSkills,
        matchScore: data.matchScore,
        analysis: `${data.analysis}\n\n30 günlük boşluk planı:\n${data.gapPlan.map((item) => `• ${item}`).join("\n")}`,
      });
      setCompany("");
      setPosition("");
      setJobText("");
    } catch (error) {
      setJobError(asErrorMessage(error));
    } finally {
      setJobBusy(false);
    }
  }

  function addProject() {
    if (!projectTitle.trim()) return;
    workspace.addPortfolioProject({
      id: crypto.randomUUID(),
      title: projectTitle.trim(),
      description: "North içinde eklenen portföy projesi.",
      skills: [],
      readmeQuality: 0,
      securityRelevance: 0,
      status: "idea",
    });
    setProjectTitle("");
  }

  return (
    <div className="north-career-page page-content space-y-6">
      <PageHeader
        eyebrow="Kariyer merkezi"
        title="Hedeften işe uzanan sistem"
        description="Projelerini, iş fırsatlarını, başvurularını ve AI destekli görüşme çalışmalarını tek yerde yönet."
      />

      <div className="north-internal-tabs">
        {[["roadmap", "Yol Haritası", Target], ["portfolio", "Portföy", FolderGit2], ["jobs", "İş Analizi", BriefcaseBusiness], ["applications", "Başvurular", FileText], ["interviews", "Mülakat", Users]].map(([value, label, Icon]) => {
          const TabIcon = Icon as typeof Target;
          return <Button key={value as string} variant={tab === value ? "secondary" : "ghost"} aria-pressed={tab === value} onClick={() => setTab(value as string)}><TabIcon className="size-4" />{label as string}</Button>;
        })}
      </div>

      {tab === "roadmap" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {workspace.coaching.milestones.map((milestone) => (
            <Card key={milestone.id} className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{milestone.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{milestone.description}</p>
                </div>
                <Badge variant={milestone.status === "completed" ? "default" : "secondary"}>
                  {milestone.status === "completed" ? "Tamamlandı" : "Devam ediyor"}
                </Badge>
              </div>
              <Progress value={milestone.status === "completed" ? 100 : milestone.status === "active" ? 50 : 0} />
              <p className="text-xs text-muted-foreground">{milestone.successCriteria.length} başarı ölçütü</p>
            </Card>
          ))}
        </div>
      )}

      {tab === "portfolio" && (
        <div className="space-y-4"><CareerExtensions section="portfolio" />
          <Card className="flex flex-col gap-3 p-5 sm:flex-row">
            <Input value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} placeholder="Yeni proje adı" />
            <Button onClick={addProject}><Plus className="size-4" /> Proje ekle</Button>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            {workspace.portfolio.map((project) => (
              <Card key={project.id} className="space-y-3 p-5">
                <div className="flex justify-between gap-3"><p className="font-semibold">{project.title}</p><Badge variant="secondary">{project.status}</Badge></div>
                <p className="text-sm text-muted-foreground">{project.description}</p>
                <div className="flex flex-wrap gap-2">{project.skills.map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}</div>
              </Card>
            ))}
            {!workspace.portfolio.length && <Empty text="Henüz portföy projesi yok. İlk projeni ekleyerek başla." />}
          </div>
        </div>
      )}

      {tab === "jobs" && (
        <div className="space-y-4">
          <Card className="space-y-4 p-5">
            <div><p className="font-semibold">İlanı AI ile analiz et</p><p className="text-sm text-muted-foreground">İlan metnini yapıştır; North beceri eşleşmeni ve eksik kapatma planını çıkarsın.</p></div>
            <div className="grid gap-3 sm:grid-cols-2"><Input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Şirket" /><Input value={position} onChange={(event) => setPosition(event.target.value)} placeholder="Pozisyon" /></div>
            <Textarea value={jobText} onChange={(event) => setJobText(event.target.value)} rows={7} placeholder="İlan metnini buraya yapıştır…" />
            {jobError && <p className="text-sm text-destructive">{jobError}</p>}
            <Button onClick={analyzeJob} disabled={jobBusy}>{jobBusy ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />} {jobBusy ? "AI analiz ediyor…" : "İlanı AI ile analiz et"}</Button>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            {workspace.jobs.map((job) => (
              <Card key={job.id} className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{job.position}</p><p className="text-sm text-muted-foreground">{job.company}</p></div><Badge variant={job.matchScore >= 70 ? "default" : job.matchScore >= 45 ? "secondary" : "destructive"}>%{job.matchScore} eşleşme</Badge></div>
                <div><p className="mb-1 text-xs font-medium text-muted-foreground">Aranan beceriler</p><div className="flex flex-wrap gap-1.5">{job.requiredSkills.map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}</div></div>
                <div><p className="mb-1 text-xs font-medium text-muted-foreground">Kapatılacak boşluklar</p><div className="flex flex-wrap gap-1.5">{job.missingSkills.length ? job.missingSkills.map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>) : <span className="text-sm text-muted-foreground">Belirgin boşluk yok.</span>}</div></div>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{job.analysis}</p>
                {!applicationKeys.has(`${job.company}:${job.position}`) && <Button variant="secondary" onClick={() => workspace.addApplication({ id: crypto.randomUUID(), company: job.company, position: job.position, stage: "saved", appliedAt: new Date().toISOString(), remote: "remote" })}>Başvuruyu kaydet</Button>}
              </Card>
            ))}
            {!workspace.jobs.length && <Empty text="İlan yapıştırdığında AI eşleşme analizi burada görünür." />}
          </div>
        </div>
      )}

      {tab === "applications" && (
        <div className="grid gap-4 lg:grid-cols-2"><div className="lg:col-span-2"><CareerExtensions section="applications" /></div>
          {workspace.applications.map((application) => (
            <Card key={application.id} className="space-y-3 p-5">
              <div className="flex justify-between gap-3"><div><p className="font-semibold">{application.position}</p><p className="text-sm text-muted-foreground">{application.company}</p></div><Badge variant="secondary">{application.stage}</Badge></div>
              <Select value={application.stage} onValueChange={(value) => workspace.updateApplication(application.id, { stage: value as typeof application.stage })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="saved">Kaydedildi</SelectItem><SelectItem value="applied">Başvuruldu</SelectItem><SelectItem value="interview">Mülakat</SelectItem><SelectItem value="offer">Teklif</SelectItem><SelectItem value="rejected">Olumsuz</SelectItem></SelectContent></Select>
            </Card>
          ))}
          {!workspace.applications.length && <Empty text="İlan kartındaki “Başvuruyu kaydet” seçeneğiyle takip listeni oluştur." />}
        </div>
      )}

      {tab === "interviews" && <InterviewWorkspace />}
    </div>
  );
}

function InterviewWorkspace() {
  const workspace = useWorkspace();
  const [role, setRole] = useState<InterviewAttempt["role"]>("pentest");
  const [language, setLanguage] = useState<"tr" | "en">("tr");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<null | { score: number; technicalAccuracy: string; completeness: string; communication: string; nextAttempt: string }>(null);
  const question = interviewQuestions[role];

  async function evaluateAnswer() {
    if (answer.trim().length < 10) { setError("Değerlendirme için en az birkaç cümlelik yanıt yaz."); return; }
    setBusy(true); setError("");
    try {
      const response = await authenticatedAiFetch("/api/ai/interview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role, language, question, answer: answer.trim() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Mülakat yanıtı değerlendirilemedi.");
      setFeedback(data);
      workspace.addInterview({ id: crypto.randomUUID(), role, language, question, answer: answer.trim(), score: data.score, feedback: `Teknik doğruluk: ${data.technicalAccuracy}\nKapsam: ${data.completeness}\nİletişim: ${data.communication}\nSonraki deneme: ${data.nextAttempt}`, createdAt: new Date().toISOString() });
    } catch (value) { setError(asErrorMessage(value)); } finally { setBusy(false); }
  }

  return <div className="grid gap-4 xl:grid-cols-[1.3fr_.7fr]">
    <Card className="space-y-4 p-5"><div><p className="font-semibold">Yanıtı AI ile değerlendir</p><p className="text-sm text-muted-foreground">Geri bildirim teknik doğruluk, kapsam ve iletişim odağında gelir.</p></div><div className="grid gap-3 sm:grid-cols-2"><Select value={role} onValueChange={(value) => setRole(value as InterviewAttempt["role"])}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="hr">İK</SelectItem><SelectItem value="junior_security">Junior Security</SelectItem><SelectItem value="pentest">Pentest</SelectItem><SelectItem value="networking">Network</SelectItem><SelectItem value="linux">Linux</SelectItem><SelectItem value="active_directory">Active Directory</SelectItem><SelectItem value="cloud">Cloud</SelectItem></SelectContent></Select><Select value={language} onValueChange={(value) => setLanguage(value as "tr" | "en")}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="tr">Türkçe</SelectItem><SelectItem value="en">English</SelectItem></SelectContent></Select></div><div className="rounded-xl border border-border bg-muted/35 p-4 text-sm font-medium">{question}</div><Textarea value={answer} onChange={(event) => setAnswer(event.target.value)} rows={7} placeholder="Mülakat yanıtını yaz…" />{error && <p className="text-sm text-destructive">{error}</p>}<Button onClick={evaluateAnswer} disabled={busy}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}{busy ? "AI değerlendiriyor…" : "Yanıtı AI ile değerlendir"}</Button></Card>
    <div className="space-y-4">{feedback ? <Card className="space-y-3 p-5"><div className="flex justify-between"><p className="font-semibold">Son değerlendirme</p><Badge variant={feedback.score >= 70 ? "default" : "secondary"}>{feedback.score}/100</Badge></div><Feedback label="Teknik doğruluk" text={feedback.technicalAccuracy} /><Feedback label="Kapsam" text={feedback.completeness} /><Feedback label="İletişim" text={feedback.communication} /><Feedback label="Sonraki deneme" text={feedback.nextAttempt} /></Card> : <Empty text="AI değerlendirmesi burada görünür." />}{workspace.interviews.slice(0, 3).map((attempt) => <Card key={attempt.id} className="p-4"><div className="flex justify-between gap-3"><p className="text-sm font-medium">{attempt.role}</p><Badge variant="secondary">{attempt.score ?? "–"}/100</Badge></div><p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{attempt.feedback}</p></Card>)}</div>
  </div>;
}

function Feedback({ label, text }: { label: string; text: string }) { return <div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-sm">{text}</p></div>; }
function Empty({ text }: { text: string }) { return <Card className="flex min-h-36 items-center justify-center p-6 text-center text-sm text-muted-foreground">{text}</Card>; }
