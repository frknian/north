import type { ExamProfile, ExamSubjectScore, ExamType, TrialExam, WrongAnswerAnalysis } from "./types";
import { shiftDay, weekKey } from "./north";

export interface ExamSubjectDefinition {
  id: string;
  name: string;
  questionCount: number;
  topics: string[];
}

export interface ExamTemplate {
  type: ExamType;
  title: string;
  description: string;
  defaultDurationMinutes: number;
  subjects: ExamSubjectDefinition[];
}

export const examTemplates: Record<Exclude<ExamType, "other">, ExamTemplate> = {
  yks_tyt: {
    type: "yks_tyt",
    title: "YKS / TYT (Temel Yeterlilik Testi)",
    description: "Türkçe, Sosyal, Matematik ve Fen alanlarında temel yeterlilik ölçümü.",
    defaultDurationMinutes: 165,
    subjects: [
      {
        id: "tyt_turkce",
        name: "Türkçe",
        questionCount: 40,
        topics: ["Paragrafta Anlam", "Cümlede Anlam", "Sözcükte Anlam", "Yazım Kuralları", "Noktalama İşaretleri", "Dil Bilgisi (Sözcük Türleri, Ekler, Cümle Ögeleri)"],
      },
      {
        id: "tyt_matematik",
        name: "Temel Matematik",
        questionCount: 40,
        topics: ["Temel Kavramlar & Sayılar", "Rasyonel & Ondalık Sayılar", "EBOB - EKOK & Bölünebilme", "Problemler (Sayı, Kesir, Yaş, Hız, Yüzde)", "Kümeler & Mantık", "Fonksiyonlar", "Temel Geometri & Üçgenler"],
      },
      {
        id: "tyt_sosyal",
        name: "Sosyal Bilimler",
        questionCount: 20,
        topics: ["Tarih (İlk Türk Devletleri, Osmanlı, Kurtuluş Savaşı)", "Coğrafya (İklim, Yer Şekilleri, Nüfus)", "Felsefe", "Din Kültürü ve Ahlak Bilgisi"],
      },
      {
        id: "tyt_fen",
        name: "Fen Bilimleri",
        questionCount: 20,
        topics: ["Fizik (Madde ve Özellikleri, Hareket, Kuvvet, Elektrik)", "Kimya (Kimyasal Türler Arası Etkileşimler, Asit-Baz, Karışımlar)", "Biyoloji (Hücre, Canlıların Sınıflandırılması, Kalıtım)"],
      },
    ],
  },
  kpss: {
    type: "kpss",
    title: "KPSS (Kamu Personel Seçme Sınavı)",
    description: "Genel Yetenek ve Genel Kültür konuları ile kamuya hazırlık.",
    defaultDurationMinutes: 130,
    subjects: [
      {
        id: "kpss_gy_turkce",
        name: "Genel Yetenek · Türkçe",
        questionCount: 30,
        topics: ["Sözcükte & Cümlede Anlam", "Paragraf Yorumu", "Dil Bilgisi", "Sözel Mantık"],
      },
      {
        id: "kpss_gy_matematik",
        name: "Genel Yetenek · Matematik",
        questionCount: 30,
        topics: ["Sayılar & İşlemler", "Problemler", "Sayısal Mantık & Tablo Yorumlama", "Geometri"],
      },
      {
        id: "kpss_gk_tarih",
        name: "Genel Kültür · Tarih",
        questionCount: 27,
        topics: ["İslamiyet Öncesi Türk Tarihi", "Türk-İslam Devletleri", "Osmanlı Tarihi & Islahatlar", "Kurtuluş Savaşı & Atatürk İlkeleri", "Çağdaş Türk ve Dünya Tarihi"],
      },
      {
        id: "kpss_gk_cografya",
        name: "Genel Kültür · Coğrafya",
        questionCount: 18,
        topics: ["Türkiye'nin Fiziki Coğrafyası", "Türkiye'nin Beşeri & Ekonomik Coğrafyası", "Tarım, Hayvancılık & Sanayi"],
      },
      {
        id: "kpss_gk_vatandaslik",
        name: "Genel Kültür · Vatandaşlık",
        questionCount: 9,
        topics: ["Temel Hukuk Kavramları", "1982 Anayasası & Yasama-Yürütme-Yargı", "İdare Hukuku"],
      },
      {
        id: "kpss_gk_guncel",
        name: "Genel Kültür · Güncel Bilgiler",
        questionCount: 6,
        topics: ["Uluslararası Kuruluşlar", "Yılın Önemli Gelişmeleri & Kültür"],
      },
    ],
  },
  banking: {
    type: "banking",
    title: "Bankacılık Sınavları (Müfettişlik / Uzman Yrd.)",
    description: "Ekonomi, muhasebe, finans, hukuk ve analitik yetenek değerlendirmesi.",
    defaultDurationMinutes: 180,
    subjects: [
      {
        id: "bank_alan_iktisat",
        name: "İktisat",
        questionCount: 25,
        topics: ["Mikro İktisat (Fiyat, Tüketici/Üretici Teorisi)", "Makro İktisat (Milli Gelir, Enflasyon, İstihdam)", "Para-Banka & Merkez Bankacılığı", "Türkiye Ekonomisi & Dış Ticaret"],
      },
      {
        id: "bank_alan_muhasebe",
        name: "Muhasebe",
        questionCount: 25,
        topics: ["Genel Muhasebe İlkeleri & Tekdüzen Hesap Planı", "Dönem Sonu İşlemleri & Envanter", "Mali Tablolar Analizi (Rasyolar)"],
      },
      {
        id: "bank_alan_hukuk",
        name: "Hukuk",
        questionCount: 25,
        topics: ["Medeni Hukuk & Borçlar Hukuku (Sözleşmeler)", "Ticaret Hukuku (Kıymetli Evrak, Şirketler)", "İcra ve İflas Hukuku", "Bankacılık Kanunu Temelleri"],
      },
      {
        id: "bank_alan_finans",
        name: "Finans & Maliye",
        questionCount: 20,
        topics: ["Finansal Piyasalar & Araçlar", "Şirket Değerleme & Sermaye Bütçelemesi", "Kamu Gelirleri & Bütçe"],
      },
      {
        id: "bank_genel_yetenek",
        name: "Genel Yetenek & Sayısal Mantık",
        questionCount: 30,
        topics: ["Sayısal Akıl Yürütme", "Veri Analizi & Grafik Okuma", "Eleştirel Düşünme & Sözel Mantık"],
      },
    ],
  },
};

export function calculateNet(correct: number, incorrect: number, penaltyFactor = 0.25): number {
  const net = correct - incorrect * penaltyFactor;
  return Math.max(0, Math.round(net * 100) / 100);
}

export function calculateEstimatedScore(examType: ExamType, subjectScores: ExamSubjectScore[]): number {
  const totalNet = subjectScores.reduce((sum, item) => sum + item.net, 0);
  if (examType === "yks_tyt") {
    return Math.min(500, Math.round((100 + totalNet * 3.33) * 10) / 10);
  }
  if (examType === "kpss") {
    return Math.min(100, Math.round((40 + totalNet * 0.5) * 10) / 10);
  }
  if (examType === "banking") {
    const totalQuestions = subjectScores.reduce((sum, item) => sum + item.correct + item.incorrect + item.empty, 0) || 125;
    return Math.min(100, Math.round((totalNet / totalQuestions * 100) * 10) / 10);
  }
  return Math.round(totalNet * 10) / 10;
}

export function generateReviewSchedule(
  wrongAnalyses: WrongAnswerAnalysis[],
  baseDate = new Date().toISOString().slice(0, 10)
): { topic: string; subjectId: string; reviewDate: string; reason: string; priority: "high" | "normal" }[] {
  const topicMap = new Map<string, { subjectId: string; count: number; hasKnowledgeGap: boolean }>();
  for (const analysis of wrongAnalyses) {
    const existing = topicMap.get(analysis.topic) ?? { subjectId: analysis.subjectId, count: 0, hasKnowledgeGap: false };
    existing.count += 1;
    if (analysis.reason === "knowledge_gap") existing.hasKnowledgeGap = true;
    topicMap.set(analysis.topic, existing);
  }

  const schedule: { topic: string; subjectId: string; reviewDate: string; reason: string; priority: "high" | "normal" }[] = [];
  let dayOffset = 1;

  for (const [topic, meta] of topicMap.entries()) {
    const priority = meta.hasKnowledgeGap || meta.count > 1 ? "high" : "normal";
    const reviewDate = shiftDay(baseDate, dayOffset);
    schedule.push({
      topic,
      subjectId: meta.subjectId,
      reviewDate,
      reason: meta.hasKnowledgeGap
        ? "Denemede bilgi eksikliğinden kaynaklanan yanlış tespit edildi."
        : "Denemede dikkat/süre nedeniyle yanlış yapılan konu tekrarı.",
      priority,
    });
    dayOffset += priority === "high" ? 2 : 3;
  }

  return schedule;
}

export function getWeeklyTrendPoints(trials: TrialExam[]): { week: string; averageNet: number; trialCount: number; maxNet: number }[] {
  const byWeek = new Map<string, number[]>();
  for (const trial of trials) {
    const week = weekKey(trial.date);
    const list = byWeek.get(week) ?? [];
    list.push(trial.totalNet);
    byWeek.set(week, list);
  }

  const sortedWeeks = Array.from(byWeek.keys()).sort();
  return sortedWeeks.map((week) => {
    const nets = byWeek.get(week)!;
    const averageNet = Math.round((nets.reduce((sum, val) => sum + val, 0) / nets.length) * 100) / 100;
    const maxNet = Math.max(...nets);
    return {
      week,
      averageNet,
      trialCount: nets.length,
      maxNet,
    };
  });
}

export function createInitialExamProfile(examType: Exclude<ExamType, "other">, targetNet?: number, targetScore?: number): ExamProfile {
  const template = examTemplates[examType];
  const nextYear = new Date().getFullYear() + 1;
  const defaultDates: Record<Exclude<ExamType, "other">, string> = {
    yks_tyt: `${nextYear}-06-20`,
    kpss: `${nextYear}-07-15`,
    banking: `${nextYear}-05-10`,
  };

  return {
    id: `exam-${examType}`,
    examType,
    title: template.title,
    examDate: defaultDates[examType],
    targetNet: targetNet ?? (examType === "yks_tyt" ? 85 : examType === "kpss" ? 75 : 80),
    targetScore: targetScore ?? (examType === "yks_tyt" ? 420 : examType === "kpss" ? 85 : 85),
    trials: [],
    activeSubjects: template.subjects.map((s) => s.id),
  };
}
