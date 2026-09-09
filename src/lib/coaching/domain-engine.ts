import type { Area, NorthState, NorthTask, NorthActivity } from "@/lib/north";
import type { WorkspaceState, TrialExam, WrongAnswerAnalysis } from "@/lib/types";
import { supportedLanguages } from "@/lib/language-learning";
import { generateReviewSchedule } from "@/lib/exam-system";

export type NorthArea = Area;
export type DomainArchetype = "exam" | "tech" | "language" | "theory" | "skill";

export interface DomainDiagnosticFinding {
  id: string;
  type: "critical" | "warning" | "optimal" | "info";
  title: string;
  description: string;
  metricBadge?: string;
}

export interface DomainPrescribedAction {
  actionId: string;
  title: string;
  goal: string;
  minutes: number;
  taskType: "problem_solving" | "deep_work" | "review" | "practice" | "lab" | "reading";
  rationale: string;
}

export interface DomainDiagnosticsReport {
  areaId: string;
  areaName: string;
  archetype: DomainArchetype;
  archetypeLabel: string;
  healthScore: number; // 0 - 100
  status: "optimal" | "stagnant" | "bottleneck" | "at_risk";
  statusLabel: string;
  metrics: {
    label: string;
    value: string | number;
    change?: string;
    trend?: "up" | "down" | "neutral";
  }[];
  findings: DomainDiagnosticFinding[];
  prescribedAction?: DomainPrescribedAction;
  pedagogicalAdvice: string;
  coachingPromptContext: string;
}

/**
 * Automatically detects the coaching archetype from area name, kind, or goal.
 */
export function resolveDomainArchetype(area: Area): DomainArchetype {
  const text = `${area.name} ${area.goal} ${area.kind}`.toLocaleLowerCase("tr");

  // 1. Language detection
  const isLang =
    Object.values(supportedLanguages).some(
      (lang) =>
        text.includes(lang.name.toLocaleLowerCase("tr")) ||
        lang.aliases.some((alias) => text.includes(alias.toLocaleLowerCase("tr")))
    ) ||
    text.includes("dil öğrenim") ||
    text.includes("vocabulary") ||
    text.includes("ielts") ||
    text.includes("toefl") ||
    text.includes("ydk") ||
    text.includes("ydt");
  if (isLang) return "language";

  // 2. Exam detection
  const isExam =
    text.includes("yks") ||
    text.includes("tyt") ||
    text.includes("ayt") ||
    text.includes("kpss") ||
    text.includes("ales") ||
    text.includes("dgs") ||
    text.includes("tus") ||
    text.includes("lgs") ||
    text.includes("deneme") ||
    text.includes("sınav") ||
    text.includes("ösym") ||
    text.includes("net artış");
  if (isExam) return "exam";

  // 3. Tech & Engineering detection
  const isTech =
    text.includes("yazılım") ||
    text.includes("software") ||
    text.includes("kodlama") ||
    text.includes("developer") ||
    text.includes("siber") ||
    text.includes("cyber") ||
    text.includes("pentest") ||
    text.includes("frontend") ||
    text.includes("backend") ||
    text.includes("full stack") ||
    text.includes("devops") ||
    text.includes("cloud") ||
    text.includes("veri anali") ||
    text.includes("data science") ||
    text.includes("machine learning") ||
    text.includes("ai / llm") ||
    text.includes("yapay zeka") ||
    text.includes("robotik") ||
    text.includes("mobil") ||
    text.includes("ios") ||
    text.includes("android") ||
    text.includes("react") ||
    text.includes("python") ||
    text.includes("javascript");
  if (isTech) return "tech";

  // 4. Theory, Academic & Humanities detection
  const isTheory =
    text.includes("tıp") ||
    text.includes("hukuk") ||
    text.includes("tarih") ||
    text.includes("iktisat") ||
    text.includes("ekonomi") ||
    text.includes("felsefe") ||
    text.includes("sosyoloji") ||
    text.includes("psikoloji") ||
    text.includes("biyoloji") ||
    text.includes("kimya") ||
    text.includes("istatistik") ||
    text.includes("matematik") ||
    text.includes("makale") ||
    text.includes("tez") ||
    text.includes("doktora") ||
    text.includes("akademi") ||
    area.kind === "reading" ||
    area.kind === "math";
  if (isTheory) return "theory";

  // 5. Default to skill
  return "skill";
}

export function getArchetypeLabel(archetype: DomainArchetype): string {
  switch (archetype) {
    case "exam":
      return "Sınav & Hazırlık Koçluğu";
    case "tech":
      return "Yazılım & Mühendislik Koçluğu";
    case "language":
      return "Dil Edinimi & Akıcılık Koçluğu";
    case "theory":
      return "Teorik & Akademik Koçluk";
    case "skill":
      return "Beceri & Strateji Koçluğu";
  }
}

/**
 * 1. EXAM COACHING DIAGNOSTICS ENGINE
 */
function diagnoseExam(area: Area, state: NorthState, workspace: WorkspaceState): DomainDiagnosticsReport {
  const profile =
    workspace.examProfiles?.find(
      (p) =>
        p.id === area.id ||
        p.title.toLocaleLowerCase("tr").includes(area.name.toLocaleLowerCase("tr"))
    ) ?? workspace.examProfiles?.[0];

  const legacyTrials = ((workspace as unknown) as { trialExams?: TrialExam[] })?.trialExams ?? [];
  const trials: TrialExam[] = profile?.trials ?? (legacyTrials.length > 0 ? legacyTrials : []);
  const wrongAnalyses: WrongAnswerAnalysis[] = [
    ...(profile?.trials?.flatMap((t) => t.wrongAnalyses) ?? []),
    ...(((workspace as unknown) as { wrongAnalyses?: WrongAnswerAnalysis[] })?.wrongAnalyses ?? []),
  ];

  const findings: DomainDiagnosticFinding[] = [];
  const metrics: DomainDiagnosticsReport["metrics"] = [];
  let healthScore = 80;
  let status: DomainDiagnosticsReport["status"] = "optimal";

  // Net Trend Calculation
  let netTrendLabel = "Henüz deneme kaydı yok";
  let netTrend: "up" | "down" | "neutral" = "neutral";
  if (trials.length >= 2) {
    const last = trials[trials.length - 1].totalNet;
    const prev = trials[trials.length - 2].totalNet;
    const diff = last - prev;
    if (diff > 2) {
      netTrendLabel = `+${diff.toFixed(1)} net artış`;
      netTrend = "up";
      findings.push({
        id: "exam-trend-up",
        type: "optimal",
        title: "Net Trendi Yükseliyor",
        description: `Son denemede netin ${prev} seviyesinden ${last} seviyesine çıktı. Temponu koru.`,
        metricBadge: `+${diff.toFixed(1)} Net`,
      });
    } else if (diff < -2) {
      netTrendLabel = `${diff.toFixed(1)} net düşüş`;
      netTrend = "down";
      healthScore -= 20;
      status = "at_risk";
      findings.push({
        id: "exam-trend-down",
        type: "critical",
        title: "Netlerde Ani Dalgalanma",
        description: `Son denemede ${Math.abs(diff).toFixed(1)} netlik bir gerileme var. Deneme zorluğu veya zayıf konu kümelenmesi incelenmeli.`,
        metricBadge: `${diff.toFixed(1)} Net`,
      });
    } else {
      netTrendLabel = "Netler yatay seyrediyor (Plato)";
      netTrend = "neutral";
      healthScore -= 10;
      status = "stagnant";
      findings.push({
        id: "exam-plateau",
        type: "warning",
        title: "Net Platosu / Tıkanma Tespiti",
        description:
          "Netlerin aynı bantta takıldı. Sürekli genel deneme yerine zayıf alt-konulara özel soru kampları yapılmalı.",
      });
    }
  }

  // Spaced Repetition Due Checks
  const dueReviews = generateReviewSchedule(wrongAnalyses);
  const today = new Date().toISOString().slice(0, 10);
  const overdueOrToday = dueReviews.filter((r) => r.reviewDate <= today);

  if (overdueOrToday.length > 0) {
    healthScore -= Math.min(25, overdueOrToday.length * 5);
    findings.push({
      id: "exam-reviews-due",
      type: overdueOrToday.length >= 3 ? "critical" : "warning",
      title: "Gecikmiş / Bekleyen Yanlış Tekrarları",
      description: `Hata defterinde bugün aralıklı tekrar tarihi gelmiş ${overdueOrToday.length} konu var (${overdueOrToday.slice(0, 2).map((r) => r.topic).join(", ")}).`,
      metricBadge: `${overdueOrToday.length} Tekrar`,
    });
  }

  // Root Cause Breakdown
  const reasonsCount: Record<string, number> = {
    concept: 0,
    calculation: 0,
    time: 0,
    carelessness: 0,
  };
  for (const w of wrongAnalyses) {
    const rawReason = String(w.reason || "");
    const mappedReason =
      rawReason === "knowledge_gap" || rawReason === "concept"
        ? "concept"
        : rawReason === "time_pressure" || rawReason === "time"
        ? "time"
        : rawReason === "careless_mistake" || rawReason === "carelessness"
        ? "carelessness"
        : rawReason === "misread" || rawReason === "calculation"
        ? "calculation"
        : "concept";
    reasonsCount[mappedReason] = (reasonsCount[mappedReason] || 0) + 1;
  }
  const primaryReason = Object.entries(reasonsCount).sort((a, b) => b[1] - a[1])[0];
  if (primaryReason && primaryReason[1] >= 3) {
    const reasonText =
      primaryReason[0] === "concept"
        ? "Bilgi / Kavram Eksikliği"
        : primaryReason[0] === "calculation"
        ? "İşlem Hatası"
        : primaryReason[0] === "time"
        ? "Süre Baskısı & Panik"
        : "Dikkatsizlik";
    findings.push({
      id: "exam-primary-fault",
      type: "warning",
      title: `Baskın Hata Kök Nedeni: ${reasonText}`,
      description: `Yanlışlarının çoğunluğu (${primaryReason[1]} soru) ${reasonText} kaynaklı. Çözüm tekniğini bu yönde güncellemelisin.`,
    });
  }

  const latestNet = trials.length > 0 ? trials[trials.length - 1].totalNet : 0;
  const targetNet = profile?.targetNet ?? 75;

  metrics.push({
    label: "Son Deneme Neti",
    value: latestNet ? `${latestNet} Net` : "Kayıt yok",
    change: netTrendLabel,
    trend: netTrend,
  });
  metrics.push({ label: "Hedef Net", value: `${targetNet} Net` });
  metrics.push({ label: "Kayıtlı Yanlış Analizi", value: wrongAnalyses.length });
  metrics.push({ label: "Bekleyen Tekrar", value: overdueOrToday.length });

  // Generate Prescribed Action
  let prescribedAction: DomainPrescribedAction;
  if (overdueOrToday.length > 0) {
    const focusTopic = overdueOrToday[0].topic;
    prescribedAction = {
      actionId: "exam-action-review",
      title: `Yanlış Defteri Tekrarı: ${focusTopic}`,
      goal: `Hata defterindeki ${focusTopic} sorularını baştan çöz, kavram açığını kapat ve 20 hedefli soruyla sabitle.`,
      minutes: 45,
      taskType: "problem_solving",
      rationale:
        "Aralıklı tekrar zamanı gelen yanlış sorular üzerinde çalışmak net artışının en hızlı yoludur.",
    };
  } else {
    prescribedAction = {
      actionId: "exam-action-drill",
      title: "Süre Baskılı 30 Soru Odak Seansı",
      goal: "En çok takıldığın konuda kronometre tutarak 30 soru çöz ve boş bıraktıklarını analiz et.",
      minutes: 40,
      taskType: "problem_solving",
      rationale:
        "Süre baskısıyla yapılan soru çözümleri sınav anındaki panik ve işlem hatalarını bertaraf eder.",
    };
  }

  return {
    areaId: area.id,
    areaName: area.name,
    archetype: "exam",
    archetypeLabel: getArchetypeLabel("exam"),
    healthScore: Math.max(20, Math.min(100, healthScore)),
    status,
    statusLabel:
      status === "optimal"
        ? "İlerleme İstikrarlı"
        : status === "stagnant"
        ? "Plato Tespiti (Netler Tıkandı)"
        : "Acil Müdahale Gerekiyor",
    metrics,
    findings,
    prescribedAction,
    pedagogicalAdvice:
      "Sınav hazırlığında en büyük yanılgı sürekli yeni deneme çözmektir. Neti asıl artıran 'Altın Üçlü'dür: zayıf konu kavram tekrarı + yanlış defteri aralıklı tekrarı + süre baskılı soru pratikleri.",
    coachingPromptContext: `[SINAV KOÇLUĞU TEŞHİS RAPORU]\nAlan: ${area.name}\nSon Net: ${latestNet} (Hedef: ${targetNet})\nNet Trendi: ${netTrendLabel}\nBekleyen Tekrar: ${overdueOrToday.length} konu\nBaskın Hata Sebebi: ${primaryReason?.[0] ?? "Belirtilmedi"}\nÖnerilen Müdahale: ${prescribedAction.title}`,
  };
}

/**
 * 2. TECH & ENGINEERING COACHING DIAGNOSTICS ENGINE
 */
function diagnoseTech(area: Area, state: NorthState, workspace: WorkspaceState): DomainDiagnosticsReport {
  const areaTasks = state.tasks.filter((t) => t.areaId === area.id);
  const completedTasks = areaTasks.filter((t) => t.status === "done");
  const labs = workspace.labs ?? [];
  const completedLabs = labs.filter((l) => l.status === "completed");

  const findings: DomainDiagnosticFinding[] = [];
  const metrics: DomainDiagnosticsReport["metrics"] = [];
  let healthScore = 85;
  let status: DomainDiagnosticsReport["status"] = "optimal";

  // Independence Rate
  const independentLabs = completedLabs.filter(
    (l) => !l.walkthroughUsed && l.aiAssistanceLevel <= 1
  ).length;
  const independenceRate =
    completedLabs.length > 0
      ? Math.round((independentLabs / completedLabs.length) * 100)
      : 0;

  if (completedLabs.length >= 3 && independenceRate < 40) {
    healthScore -= 20;
    status = "bottleneck";
    findings.push({
      id: "tech-walkthrough-reliance",
      type: "warning",
      title: "Çözüm / Walkthrough Bağımlılığı Riski",
      description: `Tamamlanan labların %${100 - independenceRate} kısmında çözüm rehberi veya yüksek AI yardımı kullanıldı. Kendi başına hata ayıklama kasın gelişmeli.`,
      metricBadge: `%${independenceRate} Bağımsız`,
    });
  } else if (completedLabs.length > 0 && independenceRate >= 70) {
    findings.push({
      id: "tech-high-independence",
      type: "optimal",
      title: "Yüksek Bağımsızlık Oranı",
      description: `Labların %${independenceRate} kısmını yardım almadan kendi çabanla çözdün. Problem çözme becerin güçlü.`,
      metricBadge: `%${independenceRate} Bağımsız`,
    });
  }

  // Tutorial Hell Detection
  const recentDone = completedTasks.slice(-4);
  const passiveCount = recentDone.filter(
    (t) =>
      t.taskType === "reading" ||
      t.title.toLocaleLowerCase("tr").includes("video") ||
      t.title.toLocaleLowerCase("tr").includes("izle") ||
      t.title.toLocaleLowerCase("tr").includes("oku")
  ).length;

  if (recentDone.length >= 3 && passiveCount >= 3) {
    healthScore -= 25;
    status = "bottleneck";
    findings.push({
      id: "tech-tutorial-hell",
      type: "critical",
      title: "Pasif Tüketim (Tutorial Hell) Tespiti",
      description:
        "Son görevlerin tamamen video izleme ve doküman okumadan ibaret. Çalışan bir kod veya pratik çıktı üretilmedi. Kod yazmadan mühendislik öğrenilmez.",
      metricBadge: "Acil Kod Çıktısı",
    });
  }

  // Active Portfolio Commit
  const activeProjects = (workspace.portfolio ?? []).filter((p) => p.status === "building");
  metrics.push({
    label: "Bağımsızlık Oranı",
    value: completedLabs.length ? `%${independenceRate}` : "Lab yok",
    trend: independenceRate >= 60 ? "up" : "down",
  });
  metrics.push({ label: "Tamamlanan Lab", value: completedLabs.length });
  metrics.push({ label: "Aktif Proje", value: activeProjects.length });
  metrics.push({ label: "Bitirilen Görev", value: completedTasks.length });

  // Generate Prescribed Action
  let prescribedAction: DomainPrescribedAction;
  if (passiveCount >= 3) {
    prescribedAction = {
      actionId: "tech-action-code-breakout",
      title: "Tutorial Kırıcı: Çalışan Tek Bir Fonksiyon Yaz",
      goal: "Hiç video açmadan, son öğrendiğin konuyu uygulayan tek bir çalışan fonksiyon veya test yazıp GitHub'a commit et.",
      minutes: 45,
      taskType: "practice",
      rationale:
        "Tutorial Hell'den çıkmanın tek yolu, sıfırdan boş bir editör açıp çalışan kod derlemektir.",
    };
  } else {
    prescribedAction = {
      actionId: "tech-action-lab",
      title: "Bağımsız Lab / Senaryo Çözümü",
      goal: "Rehbere bakmadan bir pratik lab seç, önce kendi yöntemlerinle dene, çözümü sadece takıldığında referans al.",
      minutes: 50,
      taskType: "lab",
      rationale:
        "Yardımsız kod yazmak ve hata ayıklamak (debugging) sektördeki en değerli yetkinliktir.",
    };
  }

  return {
    areaId: area.id,
    areaName: area.name,
    archetype: "tech",
    archetypeLabel: getArchetypeLabel("tech"),
    healthScore: Math.max(20, Math.min(100, healthScore)),
    status,
    statusLabel:
      status === "optimal"
        ? "Pratik Odaklı & Sağlıklı"
        : status === "bottleneck"
        ? "Darboğaz / Tutorial Hell Tespiti"
        : "Gelişim Desteği Gerekli",
    metrics,
    findings,
    prescribedAction,
    pedagogicalAdvice:
      "Yazılım ve siber güvenlikte '2 saat teoriye 1 saat çalışan kod' altın kuraldır. İzlenen video bilgi vermez, yalnızca çalışan kod ve çözülen lab kalıcı yetkinlik sağlar.",
    coachingPromptContext: `[YAZILIM/MÜHENDİSLİK KOÇLUĞU TEŞHİS RAPORU]\nAlan: ${area.name}\nBağımsızlık Oranı: %${independenceRate}\nTamamlanan Lab: ${completedLabs.length}\nTutorial Hell Durumu: ${passiveCount >= 3 ? "Var (Pasif Tüketim)" : "Yok"}\nÖnerilen Müdahale: ${prescribedAction.title}`,
  };
}

/**
 * 3. LANGUAGE COACHING DIAGNOSTICS ENGINE
 */
function diagnoseLanguage(area: Area, state: NorthState, workspace: WorkspaceState): DomainDiagnosticsReport {
  const vocabCount = workspace.vocabulary?.length ?? 0;
  const areaActivities = state.activities.filter((a) => {
    const task = state.tasks.find((t) => t.id === a.taskId);
    return a.areaId === area.id || task?.areaId === area.id;
  });

  const findings: DomainDiagnosticFinding[] = [];
  const metrics: DomainDiagnosticsReport["metrics"] = [];
  let healthScore = 85;
  let status: DomainDiagnosticsReport["status"] = "optimal";

  // Check Speaking / Shadowing vs Passive Reading/Vocab
  const speakingSessions = areaActivities.filter((a) => {
    const ref = (a.reflection || "").toLocaleLowerCase("tr");
    const proof = (a.proofContent || "").toLocaleLowerCase("tr");
    return (
      ref.includes("shadowing") ||
      ref.includes("konuşma") ||
      ref.includes("gölgeleme") ||
      proof.includes("shadowing") ||
      proof.includes("konuşma")
    );
  }).length;

  if ((vocabCount >= 20 || areaActivities.length >= 3) && speakingSessions === 0) {
    healthScore -= 30;
    status = "bottleneck";
    findings.push({
      id: "lang-silent-learner",
      type: "critical",
      title: "Sessiz Öğrenici Sendromu (Silent Learner)",
      description:
        "Kelime ve gramer havuzun gelişiyor fakat sesli konuşma / gölgeleme (shadowing) pratiği yapılmadı. Dil konuşulmadan akıcılık kazanılmaz.",
      metricBadge: "0 Sesli Seans",
    });
  } else if (speakingSessions >= 3) {
    findings.push({
      id: "lang-active-speaking",
      type: "optimal",
      title: "Aktif Konuşma Ritmi Mevcut",
      description: `Haftada ${speakingSessions} sesli gölgeleme seansı gerçekleştirdin. Ağız kasların ve telaffuz refleksin gelişiyor.`,
      metricBadge: `${speakingSessions} Seans`,
    });
  }

  metrics.push({ label: "Kelime Havuzu", value: `${vocabCount} Kelime` });
  metrics.push({ label: "Sesli Üretim (Shadowing)", value: `${speakingSessions} Seans` });
  metrics.push({ label: "Çalışma Seansı", value: areaActivities.length });

  const prescribedAction: DomainPrescribedAction = {
    actionId: "lang-action-shadowing",
    title: "15 Dk Sesli Gölgeleme (Shadowing) Seansı",
    goal: "Seviyene uygun 2 dakikalık bir ses kaydını dinle ve konuşmacıyla eş zamanlı olarak sesli tekrar et.",
    minutes: 25,
    taskType: "practice",
    rationale:
      "Gölgeleme tekniği aksan, tonlama ve akıcılık refleksini en hızlı geliştiren bilimsel yöntemdir.",
  };

  return {
    areaId: area.id,
    areaName: area.name,
    archetype: "language",
    archetypeLabel: getArchetypeLabel("language"),
    healthScore: Math.max(20, Math.min(100, healthScore)),
    status,
    statusLabel: status === "optimal" ? "Akıcı ve Dengeli" : "Sessiz Öğrenici Uyarısı",
    metrics,
    findings,
    prescribedAction,
    pedagogicalAdvice:
      "Yabancı dil öğreniminde kelime ezberlemek tek başına konuşmayı sağlamaz. 4 temel sütun (Gölgeleme, Dinleme, Okuma, Cümle Üretimi) eşit beslenmelidir.",
    coachingPromptContext: `[DİL EDİNİMİ KOÇLUĞU TEŞHİS RAPORU]\nAlan: ${area.name}\nKelime Sayısı: ${vocabCount}\nSesli Seans: ${speakingSessions}\nTeşhis: ${status === "bottleneck" ? "Sessiz Öğrenici (Konuşma Eksik)" : "Dengeli"}\nÖnerilen Müdahale: ${prescribedAction.title}`,
  };
}

/**
 * 4. THEORY & ACADEMIC COACHING DIAGNOSTICS ENGINE
 */
function diagnoseTheory(area: Area, state: NorthState, workspace: WorkspaceState): DomainDiagnosticsReport {
  const notesCount = workspace.notes?.length ?? 0;
  const areaTasks = state.tasks.filter((t) => t.areaId === area.id);

  const findings: DomainDiagnosticFinding[] = [];
  const metrics: DomainDiagnosticsReport["metrics"] = [];
  let healthScore = 85;
  let status: DomainDiagnosticsReport["status"] = "optimal";

  metrics.push({ label: "Kavram / Çalışma Notu", value: notesCount });
  metrics.push({
    label: "Tamamlanan Ünite",
    value: areaTasks.filter((t) => t.status === "done").length,
  });

  findings.push({
    id: "theory-feynman-rule",
    type: "info",
    title: "Feynman Sentez Kuralı",
    description:
      "Okunan her konunun ardından notlara bakmadan 3 maddelik zihinsel özet çıkarma pratiği uygulayarak kalıcı kavrayış sağla.",
  });

  const prescribedAction: DomainPrescribedAction = {
    actionId: "theory-action-feynman",
    title: "Feynman Tekniği: Kavramı Kendi Cümlelerinle Açıkla",
    goal: "Son çalıştığın konuyu hiç bilmeyen birine anlatıyormuş gibi 1 sayfada sadeleştirerek özetle.",
    minutes: 35,
    taskType: "deep_work",
    rationale: "Basit dille anlatamadığın bir konuyu tam olarak kavramamışsındır.",
  };

  return {
    areaId: area.id,
    areaName: area.name,
    archetype: "theory",
    archetypeLabel: getArchetypeLabel("theory"),
    healthScore,
    status,
    statusLabel: "Teorik Ritim İyi",
    metrics,
    findings,
    prescribedAction,
    pedagogicalAdvice:
      "Teorik ve akademik alanlarda pasif altını çizme yöntemi yanıltıcı öğrenme hissi yaratır. Aktif hatırlama ve vaka analizi uygulanmalıdır.",
    coachingPromptContext: `[TEORİK/AKADEMİK KOÇLUK TEŞHİS RAPORU]\nAlan: ${area.name}\nNot Sayısı: ${notesCount}\nÖnerilen Müdahale: ${prescribedAction.title}`,
  };
}

/**
 * MASTER DETERMINISTIC DIAGNOSTICS ROUTER
 */
export function diagnoseDomainState(
  area: Area,
  state: NorthState,
  workspace: WorkspaceState
): DomainDiagnosticsReport {
  const archetype = resolveDomainArchetype(area);
  switch (archetype) {
    case "exam":
      return diagnoseExam(area, state, workspace);
    case "tech":
      return diagnoseTech(area, state, workspace);
    case "language":
      return diagnoseLanguage(area, state, workspace);
    case "theory":
    case "skill":
    default:
      return diagnoseTheory(area, state, workspace);
  }
}
