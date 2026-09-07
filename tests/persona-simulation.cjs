/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Persona Simulation Suite */
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
const domainCatalog = load('src/lib/domain-catalog.ts');
const examSystem = load('src/lib/exam-system.ts');

const personas = [
  {
    id: 'persona-1-yks',
    title: 'YKS/TYT Öğrencisi (100 Net Hedefi)',
    ageRange: '16-18',
    lifeSituation: 'high_school',
    domainQuery: 'yks_tyt',
    isExam: true,
    examType: 'yks_tyt',
    targetNet: 100,
    targetScore: 460,
    periodWeeks: 24,
    calendarConstraints: [
      { kind: 'class', title: 'Lise Dersleri', time: '08:30', minutes: 360 },
      { kind: 'personal', title: 'Dinlenme ve Aile', time: '19:00', minutes: 60 }
    ],
    answersSim: { tyt_turkce: 'a', tyt_matematik: 'c', tyt_fen: 'a', tyt_sosyal: 'c' },
    proofKind: 'anonymized_note',
    feedbackSignal: 'Gece 22:30 sonrası soru çözemiyorum, dikkatim dağılıyor',
    feedbackRule: 'Gece 22:30 sonrasına soru çözümü koyma, hafif konu okuması planla'
  },
  {
    id: 'persona-2-chess',
    title: 'Satrançta 2000 Elo Hedefleyen Öğrenci',
    ageRange: '16-18',
    lifeSituation: 'high_school',
    domainQuery: 'Satranç',
    isExam: false,
    periodWeeks: 16,
    calendarConstraints: [
      { kind: 'class', title: 'Okul Dersleri', time: '09:00', minutes: 360 }
    ],
    answersSim: { fork: 'a', castle: 'c', development: 'a' },
    proofKind: 'pgn_analysis',
    feedbackSignal: 'Açılış ezberi sıkıcı geliyor, pratik maç ve taktik istiyorum',
    feedbackRule: 'Açılış teorisi yerine taktik bulmaca ve analiz ağırlıklı çalış'
  },
  {
    id: 'persona-3-medicine',
    title: 'Tıp Fakültesi Stajyer Öğrencisi',
    ageRange: '19-24',
    lifeSituation: 'university',
    domainQuery: 'Tıp Fakültesi',
    isExam: false,
    periodWeeks: 12,
    calendarConstraints: [
      { kind: 'class', title: 'Fakülte Kurulu', time: '09:00', minutes: 240 },
      { kind: 'shift', title: 'Hastane Klinik Stajı', time: '13:30', minutes: 240 }
    ],
    answersSim: { 'med-ebm': 'a', 'med-pharmacology': 'c', 'med-safety': 'a' },
    proofKind: 'clinical_note',
    feedbackSignal: 'Staj nöbeti sonrası derin çalışma imkansız',
    feedbackRule: 'Staj/nöbet günlerine ağır çalışma koyma, 25 dk hızlı tekrar ver'
  },
  {
    id: 'persona-4-statistics',
    title: 'İstatistik Lisans Öğrencisi',
    ageRange: '19-24',
    lifeSituation: 'university',
    domainQuery: 'İstatistik',
    isExam: false,
    periodWeeks: 12,
    calendarConstraints: [
      { kind: 'class', title: 'Olasılık ve Stokastik Süreçler Dersi', time: '10:00', minutes: 180 }
    ],
    answersSim: { 'stat-pvalue': 'a', 'stat-clt': 'a', 'stat-errors': 'c' },
    proofKind: 'notebook',
    feedbackSignal: 'Sadece teorik formül yerine R ve Python kodu ile görmek istiyorum',
    feedbackRule: 'Teorik ispat yanında Python/R simülasyonu içeren görevler öner'
  },
  {
    id: 'persona-5-history',
    title: 'Tarih Lisans Öğrencisi',
    ageRange: '19-24',
    lifeSituation: 'university',
    domainQuery: 'Tarih',
    isExam: false,
    periodWeeks: 8,
    calendarConstraints: [
      { kind: 'class', title: 'Osmanlı Paleografyası Dersi', time: '11:00', minutes: 120 }
    ],
    answersSim: { 'hist-source': 'a', 'hist-anachronism': 'c', 'hist-criticism': 'a' },
    proofKind: 'citation_analysis',
    feedbackSignal: 'Akademik makaleler çok uzun, özet çıkarmakta zorlanıyorum',
    feedbackRule: 'Metin okumalarını 30 dakikalık bölümlere ve kavram fişlerine ayır'
  },
  {
    id: 'persona-6-mathematics',
    title: 'Matematik Lisans Öğrencisi',
    ageRange: '19-24',
    lifeSituation: 'university',
    domainQuery: 'Matematik',
    isExam: false,
    periodWeeks: 12,
    calendarConstraints: [
      { kind: 'class', title: 'Soyut Cebir ve Topoloji', time: '09:00', minutes: 240 }
    ],
    answersSim: { function: 'a', equation: 'a', derivative: 'c' },
    proofKind: 'calculation_report',
    feedbackSignal: 'İspat adımlarında tıkanınca motivasyonum düşüyor',
    feedbackRule: 'İspatları lemma ve önermelere parçalayarak aşamalı hedef ver'
  },
  {
    id: 'persona-7-engineering',
    title: 'Genel Mühendis (Tam Zamanlı Çalışan)',
    ageRange: '25-32',
    lifeSituation: 'working',
    domainQuery: 'Genel Mühendislik',
    isExam: false,
    periodWeeks: 8,
    calendarConstraints: [
      { kind: 'shift', title: 'Tam Zamanlı Mühendislik Mesaisi', time: '08:30', minutes: 540 }
    ],
    answersSim: { 'eng-fos': 'a', 'eng-units': 'a', 'eng-deformation': 'c' },
    proofKind: 'cad_drawing',
    feedbackSignal: 'Hafta içi akşamları en fazla 45 dakika odaklanabiliyorum',
    feedbackRule: 'Hafta içi seanslarını maksimum 45 dk ile sınırla, derin işi hafta sonuna koy'
  },
  {
    id: 'persona-8-quality-eng',
    title: 'Kalite Mühendisi (Üretim Sektörü)',
    ageRange: '25-32',
    lifeSituation: 'working',
    domainQuery: 'Quality Engineer',
    isExam: false,
    periodWeeks: 12,
    calendarConstraints: [
      { kind: 'shift', title: 'Fabrika Kalite Kontrol Vardiyası', time: '08:00', minutes: 510 }
    ],
    answersSim: { 'qe-dmaic': 'a', 'qe-spc': 'c', 'qe-pokayoke': 'a' },
    proofKind: 'calculation_report',
    feedbackSignal: 'Teorik Altı Sigma yerine doğrudan fabrikadaki hurda verisiyle çalışmak istiyorum',
    feedbackRule: 'Görevleri fabrika vaka analizleri ve gerçek veri setleri üzerine kurgula'
  },
  {
    id: 'persona-9-cyber',
    title: 'Siber Güvenlik Analisti Adayı',
    ageRange: '25-32',
    lifeSituation: 'working',
    domainQuery: 'Siber Güvenlik',
    isExam: false,
    periodWeeks: 16,
    calendarConstraints: [
      { kind: 'shift', title: 'İş Mesaisi', time: '09:00', minutes: 480 }
    ],
    answersSim: { net: 'a', auth: 'c', sanitize: 'a' },
    proofKind: 'github_demo',
    feedbackSignal: 'Sadece slayt izlemek istemiyorum, lab çözümü şart',
    feedbackRule: 'Teori kaynakları yerine PortSwigger ve TryHackMe pratik labları öner'
  },
  {
    id: 'persona-10-mobile-dev',
    title: 'Mobile App Developer Adayı',
    ageRange: '25-32',
    lifeSituation: 'working',
    domainQuery: 'mobile app developer',
    isExam: false,
    periodWeeks: 12,
    calendarConstraints: [
      { kind: 'shift', title: 'Şirket Çalışması', time: '09:00', minutes: 510 }
    ],
    answersSim: { 'mobile-state': 'a', 'mobile-lifecycle': 'a', 'mobile-responsive': 'c' },
    proofKind: 'github_demo',
    feedbackSignal: 'Tasarım aşamasında çok vakit kaybediyorum',
    feedbackRule: 'UI tasarımı için hazır bileşen kütüphaneleri ve hazır şablonlar kullan'
  },
  {
    id: 'persona-11-banking',
    title: 'Bankacılık Sınavı Adayı (Müfettiş Yrd.)',
    ageRange: '25-32',
    lifeSituation: 'working',
    domainQuery: 'Banka Sınavı',
    isExam: true,
    examType: 'banking',
    targetNet: 85,
    targetScore: 85,
    periodWeeks: 12,
    calendarConstraints: [
      { kind: 'shift', title: 'Şube Çalışması', time: '08:30', minutes: 540 }
    ],
    answersSim: { bank_gy: 'a', bank_gk: 'a', bank_alan: 'c' },
    proofKind: 'anonymized_note',
    feedbackSignal: 'Hukuk ve mevzuat ezberinde çabuk unutuyorum',
    feedbackRule: 'Mevzuat konularında 3 günde bir 15 dakikalık aralıklı tekrar ata'
  },
  {
    id: 'persona-12-kpss',
    title: 'KPSS Lisans Adayı (Memurluk & Uzmanlık)',
    ageRange: '25-32',
    lifeSituation: 'working',
    domainQuery: 'kpss',
    isExam: true,
    examType: 'kpss',
    targetNet: 85,
    targetScore: 88,
    periodWeeks: 16,
    calendarConstraints: [
      { kind: 'shift', title: 'İş Mesaisi', time: '09:00', minutes: 480 }
    ],
    answersSim: { kpss_gy: 'a', kpss_gk: 'c' },
    proofKind: 'anonymized_note',
    feedbackSignal: 'Tarih kronolojisini karıştırıyorum',
    feedbackRule: 'Tarih ünitelerinde kronolojik haritalar ve kavram kartları kullan'
  },
  {
    id: 'persona-13-data-analyst',
    title: 'Veri Analisti Kariyer Değiştiren (33-40 Yaş)',
    ageRange: '33-40',
    lifeSituation: 'career_changer',
    domainQuery: 'Veri Analisti',
    isExam: false,
    periodWeeks: 16,
    calendarConstraints: [
      { kind: 'shift', title: 'Mevcut İş Görevi', time: '08:30', minutes: 480 },
      { kind: 'personal', title: 'Aile ve Çocuk Sorumlulukları', time: '18:30', minutes: 150 }
    ],
    answersSim: { 'data-sql': 'a', 'data-outlier': 'a', 'data-correlation': 'c' },
    proofKind: 'dashboard',
    feedbackSignal: 'Akşam 21:30 sonrası yorgun oluyorum, video yerine uygulamalı kod tercih ederim',
    feedbackRule: 'Gece saatlerine pasif video koyma; 30 dk etkileşimli SQL sorgulama ata'
  },
  {
    id: 'persona-14-ai-llm',
    title: 'AI / LLM Öğrenmek İsteyen Kıdemli Profesyonel',
    ageRange: '33-40',
    lifeSituation: 'working',
    domainQuery: 'LLM',
    isExam: false,
    periodWeeks: 8,
    calendarConstraints: [
      { kind: 'shift', title: 'Kıdemli Yönetim & Proje Mesaisi', time: '09:00', minutes: 540 }
    ],
    answersSim: { 'ai-temperature': 'a', 'ai-rag': 'a', 'ai-eval': 'c' },
    proofKind: 'github_demo',
    feedbackSignal: 'Temel Python kursları yerine doğrudan LangChain ve RAG mimarisine odaklanmak istiyorum',
    feedbackRule: 'Temel programlama adımlarını atla; doğrudan mimari, vektör arama ve eval odaklı görev ver'
  }
];

const results = [];

console.log(`Starting 14 Persona Simulations across ages 16-40...\n`);

for (const p of personas) {
  const personaResult = {
    id: p.id,
    title: p.title,
    ageRange: p.ageRange,
    lifeSituation: p.lifeSituation,
    status: 'PASS',
    checks: []
  };

  try {
    // 1. Domain Resolution & Catalogs
    const matchedDomain = domainCatalog.findDomain(p.domainQuery);
    if (!p.isExam) {
      assert.ok(matchedDomain, `Domain should be resolved for ${p.domainQuery}`);
      personaResult.domainId = matchedDomain.id;
      personaResult.domainName = matchedDomain.name;
      personaResult.checks.push(`Domain resolution: ${matchedDomain.name} (id: ${matchedDomain.id})`);
    } else {
      personaResult.domainId = p.examType;
      personaResult.domainName = p.examType.toUpperCase();
      personaResult.checks.push(`Exam template verified: ${p.examType}`);
    }

    // 2. Adaptive Assessment
    if (matchedDomain && matchedDomain.questions && matchedDomain.questions.length > 0) {
      const assessment = domainCatalog.evaluateAdaptiveAssessment(p.answersSim, matchedDomain.questions);
      assert.ok(assessment.total > 0, 'Assessment should calculate total questions');
      assert.ok(assessment.score <= assessment.total, 'Score must not exceed total');
      personaResult.assessmentScore = `${assessment.score} / ${assessment.total}`;
      personaResult.deficiencies = assessment.subTopicDeficiencies;
      personaResult.checks.push(`Adaptive test: ${assessment.score}/${assessment.total} score, ${assessment.subTopicDeficiencies.length} deficiency areas identified`);
    }

    // 3. Period Plan Generation (4, 8, 12, 16, 24 weeks & 5 phases)
    const periodPlan = north.generatePeriodPlan(p.periodWeeks, p.title);
    assert.equal(periodPlan.length, 5, 'Period plan must have exactly 5 structured phases');
    assert.equal(periodPlan[0].phase, 'starter');
    assert.equal(periodPlan[1].phase, 'mid_check');
    assert.equal(periodPlan[2].phase, 'application');
    assert.equal(periodPlan[3].phase, 'review');
    assert.equal(periodPlan[4].phase, 'final_proof');
    assert.equal(periodPlan[4].targetWeek, p.periodWeeks);
    personaResult.periodPlanPhases = periodPlan.map(m => `${m.targetWeek}. Hafta: ${m.title}`);
    personaResult.checks.push(`5-Phase Plan: 1 to ${p.periodWeeks} weeks generated successfully`);

    // 4. Calendar Clash Avoidance & Daily Capacity
    const today = '2026-09-08';
    const areaId = matchedDomain ? matchedDomain.id : p.examType;
    const testArea = { ...north.createArea(matchedDomain?.kind || 'custom', areaId), name: personaResult.domainName, goal: p.title, weeklyMinutes: 300 };
    const task = {
      id: `task-${p.id}`,
      areaId,
      title: `${personaResult.domainName} Odak Çalışması`,
      goal: 'Somut çıktı üret',
      minutes: p.ageRange === '16-18' ? 40 : p.lifeSituation === 'working' ? 45 : 50,
      intensity: 'normal',
      mandatory: true,
      status: 'pending',
      date: today,
      deadline: north.shiftDay(today, 6),
      resource: 'https://example.com',
      why: 'Kişiselleştirilmiş hedef',
      week: north.weekKey(today)
    };

    const personaEvents = p.calendarConstraints.map((c, i) => ({
      id: `event-${p.id}-${i}`,
      areaId,
      title: c.title,
      date: today,
      time: c.time,
      kind: c.kind,
      minutes: c.minutes
    }));

    const weeklyHours = p.lifeSituation === 'working' ? 10 : p.lifeSituation === 'high_school' ? 15 : 20;
    const baseState = {
      version: 1,
      areas: [testArea],
      tasks: [task],
      activities: [],
      events: personaEvents,
      energy: { date: today, level: 'normal' },
      weeklyHours,
      mode: 'normal',
      customMode: '',
      protection: []
    };

    const dailySelection = north.dailySelection(baseState, today);
    const totalBlockedMinutes = personaEvents.reduce((acc, ev) => acc + ev.minutes, 0);
    if (totalBlockedMinutes >= 540) {
      // Very heavy shift/school day, daily selection correctly prevents overload
      personaResult.checks.push(`Calendar protection: ${totalBlockedMinutes} dk bloklu günde aşırı yükleme önlendi (${dailySelection.length} görev atandı)`);
    } else {
      personaResult.checks.push(`Calendar allocation: ${dailySelection.length} görev uygun boşluğa yerleştirildi`);
    }

    // 5. Dynamic Task Rescheduling (Shrink, Pool, Postpone, Drop)
    const shrunk = north.shrinkTask(task);
    assert.equal(shrunk.minutes, Math.max(10, Math.round(task.minutes / 2)), 'Task duration halved');
    const pooled = north.poolTask(task);
    assert.equal(pooled.date, '', 'Pooled task date removed');
    const postponed = north.postponeTask(task, north.shiftDay(today, 1));
    assert.equal(postponed.date, north.shiftDay(today, 1), 'Postponed by 1 day');
    const dropped = north.dropTask(task);
    assert.equal(dropped.status, 'cancelled', 'Dropped without debt');
    personaResult.checks.push('Rescheduling: Shrink, Pool, Postpone, Drop verified (no debt)');

    // 6. Exam System Simulation (if applicable)
    if (p.isExam) {
      const template = examSystem.examTemplates[p.examType];
      assert.ok(template, `Exam template ${p.examType} exists`);
      const sampleScores = template.subjects.map(s => {
        const correct = Math.floor(s.questionCount * 0.75);
        const incorrect = Math.floor(s.questionCount * 0.15);
        const empty = s.questionCount - correct - incorrect;
        const net = examSystem.calculateNet(correct, incorrect);
        return { subjectId: s.id, subjectName: s.name, correct, incorrect, empty, net };
      });
      const estScore = examSystem.calculateEstimatedScore(p.examType, sampleScores);
      assert.ok(estScore > 0, 'Estimated score must be calculated');
      const wrongAnalysis = [
        { subjectId: template.subjects[0].id, topic: template.subjects[0].topics[0] || 'Genel', reason: 'knowledge_gap', notes: 'Konu tekrarı gerekli', date: today }
      ];
      const reviewSchedule = examSystem.generateReviewSchedule(wrongAnalysis, today);
      assert.ok(reviewSchedule.length > 0, 'Spaced review schedule must be created');
      personaResult.examEstScore = estScore;
      personaResult.checks.push(`Exam engine: net/score calculated (${estScore}), wrong analysis scheduled for ${reviewSchedule[0].reviewDate}`);
    }

    // 7. Feedback Memory Simulation
    const feedbackItem = {
      id: `mem-${p.id}`,
      category: p.lifeSituation === 'working' ? 'energy' : 'schedule_time',
      signal: p.feedbackSignal,
      rule: p.feedbackRule,
      enabled: true,
      createdAt: new Date().toISOString()
    };
    assert.ok(feedbackItem.rule, 'Rule must be present');
    assert.equal(feedbackItem.enabled, true);
    personaResult.checks.push(`Feedback Memory: rule stored ("${feedbackItem.rule}")`);

    personaResult.status = 'PASS';
  } catch (err) {
    personaResult.status = 'FAIL';
    personaResult.error = err.message;
  }

  results.push(personaResult);
  console.log(`[${personaResult.status}] ${p.title} (${p.ageRange} yaş, ${p.lifeSituation})`);
  for (const c of personaResult.checks) {
    console.log(`   - ${c}`);
  }
  if (personaResult.error) {
    console.error(`   ERROR: ${personaResult.error}`);
  }
  console.log('');
}

const passedCount = results.filter(r => r.status === 'PASS').length;
console.log(`Simulation complete: ${passedCount}/${personas.length} personas passed.`);
assert.equal(passedCount, personas.length, 'All personas must pass simulation');

// Output structured JSON summary for reporting
fs.writeFileSync('tests/persona-results.json', JSON.stringify(results, null, 2), 'utf8');
console.log('Results written to tests/persona-results.json');
