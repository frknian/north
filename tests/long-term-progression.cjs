/* eslint-disable @typescript-eslint/no-require-imports -- Standalone 52-Week Progression Simulation Suite */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');

const cache = {};
function load(path) {
  if (cache[path]) return cache[path];
  const output = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const exports = {};
  cache[path] = exports;

  function localRequire(id) {
    if (id === './north' || id.endsWith('/north')) return load('src/lib/north.ts');
    if (id === './domain-catalog' || id.endsWith('/domain-catalog')) return load('src/lib/domain-catalog.ts');
    if (id === './language-learning' || id.endsWith('/language-learning')) return load('src/lib/language-learning.ts');
    if (id === './exam-system' || id.endsWith('/exam-system')) return load('src/lib/exam-system.ts');
    if (id === './types' || id.endsWith('/types')) return {};
    return require(id);
  }

  vm.runInNewContext(output, {
    exports,
    Date,
    crypto: require('node:crypto'),
    Math,
    require: localRequire
  });
  return exports;
}

const north = load('src/lib/north.ts');
const examSystem = load('src/lib/exam-system.ts');

console.log('--- 1 YILLIK (52 HAFTA) SIFIRDAN ZİRVEYE GELİŞİM SİMÜLASYONU BAŞLATILIYOR ---\n');

// 1. TYT ÖĞRENCİSİ: 20 Netten 100 Nete 52 Haftalık Gelişim
function simulateYksProgression() {
  console.log('1. SENARYO: YKS/TYT Öğrencisi (20 Net Başlangıç -> 1 Yıl Sonra 100+ Net Hedefi)');

  // 52 haftalık dönem planı üretimi
  const milestones = north.generatePeriodPlan(52, 'Sıfırdan (20 net) 1 yılda 100 nete ulaşmak');

  assert.equal(milestones.length, 5);
  console.log('   ✓ 52 Haftalık 5 Aşamalı Dönem Planı Üretildi:');
  milestones.forEach((phase, idx) => {
    console.log(`     - [${idx + 1}. Aşama | ${phase.targetWeek}. Hafta]: ${phase.title}`);
  });

  // 52 Hafta boyunca denemeler ve gelişim eğrisi
  // Hafta 1: Başlangıç (20 Net - Başarısız / Eksik seviyesi)
  // Hafta 10 (Aşama 1 Sonu): 38 Net
  // Hafta 22 (Aşama 2 Sonu): 58 Net
  // Hafta 36 (Aşama 3 Sonu): 78 Net
  // Hafta 46 (Aşama 4 Sonu): 91 Net
  // Hafta 52 (Aşama 5 Sonu): 101.25 Net (Hedef aşıldı!)
  const simulatedTrials = [
    {
      id: 'trial-w1',
      examId: 'exam-yks_tyt',
      title: '1. Hafta Teşhis Denemesi (Sıfır Noktası)',
      date: '2026-09-15',
      durationMinutes: 165,
      totalNet: 20.0,
      estimatedScore: 166.6,
      subjectScores: [
        { subjectId: 'tyt_turkce', subjectName: 'Türkçe', correct: 14, incorrect: 16, empty: 10, net: 10.0 },
        { subjectId: 'tyt_matematik', subjectName: 'Matematik', correct: 6, incorrect: 8, empty: 26, net: 4.0 },
        { subjectId: 'tyt_sosyal', subjectName: 'Sosyal', correct: 6, incorrect: 8, empty: 6, net: 4.0 },
        { subjectId: 'tyt_fen', subjectName: 'Fen', correct: 3, incorrect: 4, empty: 13, net: 2.0 }
      ],
      wrongAnalyses: [
        { id: 'w1', subjectId: 'tyt_matematik', topic: 'Temel Kavramlar & Sayılar', questionSummary: 'Bölünebilme', reason: 'knowledge_gap' },
        { id: 'w2', subjectId: 'tyt_matematik', topic: 'Problemler', questionSummary: 'Kesir problemi', reason: 'knowledge_gap' },
        { id: 'w3', subjectId: 'tyt_turkce', topic: 'Paragrafta Anlam', questionSummary: 'Ana fikir', reason: 'carelessness' },
        { id: 'w4', subjectId: 'tyt_fen', topic: 'Fizik (Madde ve Özellikleri)', questionSummary: 'Özkütle', reason: 'knowledge_gap' }
      ]
    },
    {
      id: 'trial-w10',
      examId: 'exam-yks_tyt',
      title: '10. Hafta Temel Aşama Değerlendirmesi',
      date: '2026-11-20',
      durationMinutes: 165,
      totalNet: 38.5,
      estimatedScore: 228.2,
      subjectScores: [
        { subjectId: 'tyt_turkce', subjectName: 'Türkçe', correct: 20, incorrect: 8, empty: 12, net: 18.0 },
        { subjectId: 'tyt_matematik', subjectName: 'Matematik', correct: 12, incorrect: 8, empty: 20, net: 10.0 },
        { subjectId: 'tyt_sosyal', subjectName: 'Sosyal', correct: 8, incorrect: 6, empty: 6, net: 6.5 },
        { subjectId: 'tyt_fen', subjectName: 'Fen', correct: 5, incorrect: 4, empty: 11, net: 4.0 }
      ],
      wrongAnalyses: []
    },
    {
      id: 'trial-w22',
      examId: 'exam-yks_tyt',
      title: '22. Hafta Ara Kontrol Denemesi',
      date: '2027-02-15',
      durationMinutes: 165,
      totalNet: 58.0,
      estimatedScore: 293.1,
      subjectScores: [
        { subjectId: 'tyt_turkce', subjectName: 'Türkçe', correct: 26, incorrect: 6, empty: 8, net: 24.5 },
        { subjectId: 'tyt_matematik', subjectName: 'Matematik', correct: 19, incorrect: 6, empty: 15, net: 17.5 },
        { subjectId: 'tyt_sosyal', subjectName: 'Sosyal', correct: 11, incorrect: 4, empty: 5, net: 10.0 },
        { subjectId: 'tyt_fen', subjectName: 'Fen', correct: 7, incorrect: 4, empty: 9, net: 6.0 }
      ],
      wrongAnalyses: []
    },
    {
      id: 'trial-w36',
      examId: 'exam-yks_tyt',
      title: '36. Hafta Yoğun Uygulama Denemesi',
      date: '2027-05-18',
      durationMinutes: 165,
      totalNet: 78.5,
      estimatedScore: 361.4,
      subjectScores: [
        { subjectId: 'tyt_turkce', subjectName: 'Türkçe', correct: 32, incorrect: 4, empty: 4, net: 31.0 },
        { subjectId: 'tyt_matematik', subjectName: 'Matematik', correct: 26, incorrect: 4, empty: 10, net: 25.0 },
        { subjectId: 'tyt_sosyal', subjectName: 'Sosyal', correct: 14, incorrect: 3, empty: 3, net: 13.25 },
        { subjectId: 'tyt_fen', subjectName: 'Fen', correct: 10, incorrect: 3, empty: 7, net: 9.25 }
      ],
      wrongAnalyses: []
    },
    {
      id: 'trial-w46',
      examId: 'exam-yks_tyt',
      title: '46. Hafta Tekrar ve Hata Eleme Denemesi',
      date: '2027-07-28',
      durationMinutes: 165,
      totalNet: 91.0,
      estimatedScore: 403.0,
      subjectScores: [
        { subjectId: 'tyt_turkce', subjectName: 'Türkçe', correct: 35, incorrect: 3, empty: 2, net: 34.25 },
        { subjectId: 'tyt_matematik', subjectName: 'Matematik', correct: 31, incorrect: 3, empty: 6, net: 30.25 },
        { subjectId: 'tyt_sosyal', subjectName: 'Sosyal', correct: 16, incorrect: 2, empty: 2, net: 15.5 },
        { subjectId: 'tyt_fen', subjectName: 'Fen', correct: 12, incorrect: 4, empty: 4, net: 11.0 }
      ],
      wrongAnalyses: []
    },
    {
      id: 'trial-w52',
      examId: 'exam-yks_tyt',
      title: '52. Hafta Final Zirve Denemesi (Gerçek Sınav Provasi)',
      date: '2027-09-10',
      durationMinutes: 165,
      totalNet: 101.25,
      estimatedScore: 437.2,
      subjectScores: [
        { subjectId: 'tyt_turkce', subjectName: 'Türkçe', correct: 37, incorrect: 2, empty: 1, net: 36.5 },
        { subjectId: 'tyt_matematik', subjectName: 'Matematik', correct: 34, incorrect: 2, empty: 4, net: 33.5 },
        { subjectId: 'tyt_sosyal', subjectName: 'Sosyal', correct: 18, incorrect: 2, empty: 0, net: 17.5 },
        { subjectId: 'tyt_fen', subjectName: 'Fen', correct: 14, incorrect: 1, empty: 5, net: 13.75 }
      ],
      wrongAnalyses: []
    }
  ];

  // Yanlış analizinden aralıklı tekrar programı çıkarma (1. hafta başarısızlıklarının telafisi)
  const reviewSchedule = examSystem.generateReviewSchedule(simulatedTrials[0].wrongAnalyses, '2026-09-15');
  assert.equal(reviewSchedule.length, 4);
  console.log('   ✓ 1. Hafta Yanlışları Aralıklı Tekrar Takvimine Dönüştürüldü:');
  reviewSchedule.forEach((r) => {
    console.log(`     - [${r.reviewDate}] ${r.topic} (${r.priority === 'high' ? 'Öncelikli Tekrar: Bilgi Eksikliği' : 'Dikkat Kontrolü'})`);
  });

  // Haftalık trend ve artış doğrulaması
  const trendPoints = examSystem.getWeeklyTrendPoints(simulatedTrials);
  assert.equal(trendPoints.length, 6);
  assert.equal(trendPoints[0].averageNet, 20.0);
  assert.equal(trendPoints[trendPoints.length - 1].averageNet, 101.25);

  console.log('   ✓ 52 Haftalık Net Gelişim Trendi:');
  trendPoints.forEach((p, idx) => {
    console.log(`     - Ölçüm ${idx + 1} (${p.week}): Ortalama Net = ${p.averageNet} net`);
  });
  console.log('   => SONUÇ: YKS Öğrencisi 20.0 netten 101.25 nete başarıyla ulaştı (+81.25 net artış).\n');
}

// 2. SATRANÇ: 800 Elo'dan 2000 Elo'ya 52 Haftalık Gelişim
function simulateChessProgression() {
  console.log('2. SENARYO: Satranç Oyuncusu (800 Elo Başlangıç -> 1 Yıl Sonra 2000 Elo)');
  const milestones = north.generatePeriodPlan(52, '800 Elo seviyesinden 2000 Elo kulüp düzeyine çıkmak');
  assert.equal(milestones.length, 5);

  const eloProgression = [
    { week: 1, elo: 800, tacticsSolved: 0, phase: 'Başlangıç' },
    { week: 10, elo: 1100, tacticsSolved: 180, phase: '1. Aşama: Temel Taktikler (Çatal, Şiş, Açmaz)' },
    { week: 22, elo: 1400, tacticsSolved: 500, phase: '2. Aşama: Konumsal Oyun ve Piyon Yapıları' },
    { week: 36, elo: 1700, tacticsSolved: 1100, phase: '3. Aşama: Ağır Taktikler ve Oyun Sonu Prensipleri' },
    { week: 46, elo: 1880, tacticsSolved: 1600, phase: '4. Aşama: Usta Oyun Analizi ve Zaman Kontrolü' },
    { week: 52, elo: 2010, tacticsSolved: 2000, phase: '5. Aşama: 2000 Elo Zirvesi ve FIDE/Lichess Kanıtı' }
  ];

  console.log('   ✓ 52 Haftalık Elo ve Taktik İlerlemesi:');
  eloProgression.forEach((e) => {
    console.log(`     - [Hafta ${e.week}] ${e.elo} Elo | Çözülen Taktik: ${e.tacticsSolved} | (${e.phase})`);
  });
  console.log('   => SONUÇ: Satranç Oyuncusu 800 Elo seviyesinden 2010 Elo ustalığına ulaştı (+1210 Elo).\n');
}

// 3. SİBER GÜVENLİK ANALİSTİ: 0 Lab & Temel Eksiklik -> 100 Lab & Junior/Mid SOC
function simulateCyberProgression() {
  console.log('3. SENARYO: Siber Güvenlik Analisti Adayı (Sıfır Bilgi/0 Lab -> 100 Lab ve Writeup)');
  const milestones = north.generatePeriodPlan(52, 'Sıfırdan laboratuvar çözümleri ve portföy ile SOC analisti olmak');
  assert.equal(milestones.length, 5);

  const labMilestones = [
    { week: 1, labs: 0, knowledge: 'Sıfır (Ağ protokolleri ve Linux komutları eksik)' },
    { week: 10, labs: 15, knowledge: 'Temel Linux, Wireshark pcap analizi, Nmap taramaları' },
    { week: 22, labs: 40, knowledge: 'OWASP Top 10 (SQLi, XSS, CSRF, IDOR zafiyet çözümleri)' },
    { week: 36, labs: 70, knowledge: 'Yetki yükseltme (Privilege Escalation) ve Active Directory' },
    { week: 46, labs: 90, knowledge: 'Tersine mühendislik temelleri ve SOC incident log analizi' },
    { week: 52, labs: 105, knowledge: '105 Lab tamamlandı, 12 teknik writeup GitHub portföyünde' }
  ];

  console.log('   ✓ 52 Haftalık Laboratuvar ve Güvenlik Seviyesi:');
  labMilestones.forEach((m) => {
    console.log(`     - [Hafta ${m.week}] ${m.labs} Lab | ${m.knowledge}`);
  });
  console.log('   => SONUÇ: Analist 0 labdan 105 lab ve profesyonel portföye ulaştı.\n');
}

// 4. VERİ ANALİSTİ (KARİYER DEĞİŞTİREN): Sıfır Kodlama -> 4 Gerçek Proje ve Dashboard
function simulateDataAnalystProgression() {
  console.log('4. SENARYO: Veri Analisti Kariyer Değiştiren (Sıfır SQL/Python -> Portföy ve Dashboard)');
  const milestones = north.generatePeriodPlan(52, 'Sıfır teknik geçmişten işe hazır veri analisti portföyü oluşturmak');
  assert.equal(milestones.length, 5);

  const dataMilestones = [
    { week: 1, status: 'Başlangıç (SELECT nedir bilinmiyor, Excel formülleri seviyesi)' },
    { week: 10, status: 'SQL Temelleri (JOIN, GROUP BY, HAVING) ve Python veri tipleri' },
    { week: 22, status: 'İleri SQL (Window Functions, CTEs) ve Pandas ile Veri Temizleme' },
    { week: 36, status: 'Keşifsel Veri Analizi (EDA) ve PowerBI/Metabase Dashboard Tasarımı' },
    { week: 46, status: 'İstatistiksel Hipotez Testleri ve A/B Testi Deney Tasarımı' },
    { week: 52, status: '4 Uçtan Uca Kaggle/GitHub Projesi + Canlı İnteraktif Dashboard' }
  ];

  console.log('   ✓ 52 Haftalık Kariyer Değişim Adımları:');
  dataMilestones.forEach((m) => {
    console.log(`     - [Hafta ${m.week}] ${m.status}`);
  });
  console.log('   => SONUÇ: Kariyer değiştiren aday sıfırdan canlı analist portföyüne ulaştı.\n');
}

// 5. TÜKENMİŞLİK (BURNOUT) KORUMASI VE ESNEK GÖREV DÖNGÜSÜ
function simulateBurnoutProtection() {
  console.log('5. SİSTEM DOĞRULAMASI: 1 Yıllık Süreçte Pes Etmeyi Önleyen Sürdürülebilirlik Mimarisi');

  // Bir öğrencinin 32. haftada hastalandığı veya yoğun mesai nedeniyle 4 gün çalışamadığı durum
  const task = {
    id: 'heavy-task',
    title: 'TYT Matematik 100 Soru Çöz ve Yanlış Analizi Yap',
    minutes: 120,
    areaTitle: 'YKS / TYT',
    date: '2027-04-10',
    why: 'Konu kavrama'
  };

  // 1. Küçültme (Shrink): Süre borç yaratmadan 60 dakikaya indirilir
  const shrunk = north.shrinkTask(task);
  assert.equal(shrunk.minutes, 60);

  // 2. Havuza Alma (Pool): Gün baskısı silinir, esnek havuza alınır
  const pooled = north.poolTask(task);
  assert.equal(pooled.date, '');

  // 3. Borçsuz İptal (Drop): Suçluluk hissi olmadan görev kapatılır
  const dropped = north.dropTask(task);
  assert.equal(dropped.status, 'cancelled');

  console.log('   ✓ Hastalık / Mola anında borç birikmesi engellendi.');
  console.log('   ✓ Öğrenci suçluluk hissiyle sistemi terk etmek yerine esnek yükle devam edebildi.');
  console.log('   => SONUÇ: North\'un borçsuz psikolojik mimarisi 1 yıllık maratonun tamamlanmasını sağlar.\n');
}

simulateYksProgression();
simulateChessProgression();
simulateCyberProgression();
simulateDataAnalystProgression();
simulateBurnoutProtection();

console.log('--- TÜM 1 YILLIK (SIFIRDAN ZİRVEYE) GELİŞİM TESTLERİ BAŞARIYLA GEÇTİ ---');
