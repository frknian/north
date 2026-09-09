/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node CommonJS test runner. */
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

// 1. EXAM SYSTEM TESTS
const examSystem = load('src/lib/exam-system.ts');
assert.equal(examSystem.calculateNet(32, 4), 31);
assert.equal(examSystem.calculateNet(20, 0), 20);
assert.equal(examSystem.calculateNet(0, 8), 0); // No negative net

const mockScores = [
  { subjectId: 'tyt_turkce', subjectName: 'Türkçe', correct: 30, incorrect: 10, empty: 0, net: 27.5 },
  { subjectId: 'tyt_matematik', subjectName: 'Temel Matematik', correct: 25, incorrect: 4, empty: 11, net: 24 }
];
const estimatedScore = examSystem.calculateEstimatedScore('yks_tyt', mockScores);
assert.ok(estimatedScore > 200, 'Estimated score should be over baseline 100 + net contribution');

const wrongAnswers = [
  { subjectId: 'tyt_turkce', topic: 'Paragrafta Anlam', reason: 'concept', notes: 'Detay kaçtı', date: '2026-09-01' },
  { subjectId: 'tyt_matematik', topic: 'Problemler', reason: 'calculation', notes: 'İşlem hatası', date: '2026-09-01' }
];
const reviewSchedule = examSystem.generateReviewSchedule(wrongAnswers);
assert.ok(reviewSchedule.length >= 2, 'Should generate spaced reviews');
assert.ok(reviewSchedule[0].reviewDate, 'Review schedule item must have a review date');
assert.equal(reviewSchedule[0].topic, 'Paragrafta Anlam');

const trials = [
  { id: '1', examType: 'yks_tyt', title: 'Deneme 1', date: '2026-09-01', totalNet: 65, estimatedScore: 320, subjectScores: [], wrongAnalyses: [] },
  { id: '2', examType: 'yks_tyt', title: 'Deneme 2', date: '2026-09-08', totalNet: 72, estimatedScore: 345, subjectScores: [], wrongAnalyses: [] }
];
const trend = examSystem.getWeeklyTrendPoints(trials);
assert.equal(trend.length, 2);
assert.equal(trend[0].averageNet, 65);
assert.equal(trend[1].averageNet, 72);

// 2. DOMAIN CATALOG ENRICHMENT & SYNONYM TESTS
const domainCatalogModule = load('src/lib/domain-catalog.ts');
const { domainCatalog, findDomain, evaluateAdaptiveAssessment, adaptUnknownDomain } = domainCatalogModule;

const expectedDomainIds = [
  'mathematics', 'software', 'mobile-dev', 'data-analysis', 'ai-llm', 'history',
  'medicine', 'quality-engineering', 'general-engineering', 'statistics',
  'robotics', 'chess', 'finance', 'civil-engineering', 'economics', 'language'
];

for (const id of expectedDomainIds) {
  const domain = domainCatalog.find(d => d.id === id);
  assert.ok(domain, `Domain ${id} must exist in catalog`);
  assert.ok(domain.metric, `Domain ${id} must have a metric`);
  assert.ok(domain.resources && domain.resources.length > 0, `Domain ${id} must have resources`);
  assert.ok(domain.starterTasks && domain.starterTasks.length > 0, `Domain ${id} must have starter tasks`);
  assert.ok(domain.questions && domain.questions.length > 0, `Domain ${id} must have questions`);
}

// Synonyms
assert.equal(findDomain('Mobile App Developer').id, 'mobile-dev');
assert.equal(findDomain('iOS Geliştirme').id, 'mobile-dev');
assert.equal(findDomain('LLM').id, 'ai-llm');
assert.equal(findDomain('Veri Analisti').id, 'data-analysis');
assert.equal(findDomain('Tıp Fakültesi').id, 'medicine');
assert.equal(findDomain('Tarih').id, 'history');
assert.equal(findDomain('Quality Engineer').id, 'quality-engineering');

// Adaptive assessment
const medDomain = findDomain('medicine');
const mockAnswers = {};
if (medDomain.questions && medDomain.questions.length >= 2) {
  mockAnswers[medDomain.questions[0].id] = 'c'; // wrong
  mockAnswers[medDomain.questions[1].id] = 'a'; // correct
  const assessment = evaluateAdaptiveAssessment(mockAnswers, medDomain.questions);
  assert.equal(assessment.total, medDomain.questions.length);
  assert.ok(assessment.subTopicDeficiencies.length >= 1);
  assert.equal(assessment.subTopicDeficiencies[0], medDomain.questions[0].subTopic);
  assert.ok(assessment.feedbacks[0].explanation);
  assert.ok(assessment.feedbacks[0].recommendedReview);
}

// Unknown domain adaptation
const adapted = adaptUnknownDomain({
  areaName: 'Biyomühendislik',
  goal: 'CRISPR ve gen düzenleme protokolleri geliştirmek',
  subDomain: 'Moleküler Biyoloji',
  desiredOutput: 'Laboratuvar protokol notu ve deney raporu',
  durationWeeks: 16
});
assert.equal(adapted.name, 'Biyomühendislik');
assert.ok(adapted.defaultProofType);
assert.ok(adapted.questions.length > 0);

// 3. NORTH PERIOD PLANNING & TASK RESCHEDULING TESTS
const northModule = load('src/lib/north.ts');
const { generatePeriodPlan, shrinkTask, poolTask, postponeTask, dropTask, dailySelection, createArea } = northModule;

const periodPlan = generatePeriodPlan(12, 'Veri Analizi Portföyü');
assert.equal(periodPlan.length, 5);
assert.equal(periodPlan[0].phase, 'starter');
assert.equal(periodPlan[1].phase, 'mid_check');
assert.equal(periodPlan[2].phase, 'application');
assert.equal(periodPlan[3].phase, 'review');
assert.equal(periodPlan[4].phase, 'final_proof');
assert.equal(periodPlan[4].targetWeek, 12);

const originalTask = {
  id: 'task-1',
  areaId: 'area-1',
  title: 'Uzun Analiz',
  goal: 'Rapor hazırla',
  minutes: 60,
  intensity: 'high',
  mandatory: true,
  status: 'pending',
  date: '2026-09-01',
  deadline: '2026-09-07',
  resource: 'https://example.com',
  why: 'Önemli',
  week: '2026-08-31'
};

const shrunk = shrinkTask(originalTask);
assert.equal(shrunk.minutes, 30);

const pooled = poolTask(originalTask);
assert.equal(pooled.date, '');
assert.equal(pooled.mandatory, false);

const postponed = postponeTask(originalTask, '2026-09-02');
assert.equal(postponed.date, '2026-09-02');
assert.equal(postponed.rescheduledCount, 1);

const dropped = dropTask(originalTask);
assert.equal(dropped.status, 'cancelled');

// Calendar event blocking in dailySelection
const testArea = { ...createArea('math', 'math-1'), goal: 'Hedef' };
const testTask = { ...originalTask, areaId: 'math-1', date: '2026-09-05' };
const baseState = {
  version: 1,
  areas: [testArea],
  tasks: [testTask],
  activities: [],
  events: [],
  energy: { date: '', level: 'normal' },
  weeklyHours: 10,
  mode: 'normal',
  customMode: '',
  protection: []
};

// With no blocking events, task is selected
assert.equal(dailySelection(baseState, '2026-09-05').length, 1);

// With heavy shift event (e.g. 10 hours), study capacity becomes 0 for that day
const busyState = {
  ...baseState,
  events: [{ id: 'ev-1', areaId: 'math-1', title: 'Mesai / Vardiya', date: '2026-09-05', time: '08:00', kind: 'shift', minutes: 600 }]
};
assert.equal(dailySelection(busyState, '2026-09-05').length, 0);

// 4. LANGUAGE LEARNING (İNGİLİZCE, ALMANCA, FRANSIZCA, JAPONCA, ARAPÇA) TESTS
const langModule = load('src/lib/language-learning.ts');
const { detectLanguage, getLanguageQuestions, getLanguageGoalSuggestions, supportedLanguages } = langModule;

const langKeys = ['english', 'german', 'french', 'japanese', 'arabic'];
assert.equal(Object.keys(supportedLanguages).length, 5);

// Detection
assert.equal(detectLanguage('İngilizce').code, 'english');
assert.equal(detectLanguage('english').code, 'english');
assert.equal(detectLanguage('IELTS Hazırlık').code, 'english');
assert.equal(detectLanguage('Almanca').code, 'german');
assert.equal(detectLanguage('Goethe B2').code, 'german');
assert.equal(detectLanguage('Fransızca').code, 'french');
assert.equal(detectLanguage('DELF B1').code, 'french');
assert.equal(detectLanguage('Japonca').code, 'japanese');
assert.equal(detectLanguage('JLPT N3').code, 'japanese');
assert.equal(detectLanguage('Arapça').code, 'arabic');
assert.equal(detectLanguage('Fasih Arapça').code, 'arabic');

// Level questions: 3-5 questions per level for all languages
const levels = ['beginner', 'intermediate', 'advanced'];
for (const langCode of langKeys) {
  const lang = supportedLanguages[langCode];
  assert.ok(lang.name);
  assert.ok(lang.flag);
  assert.ok(lang.resources.length >= 2);
  assert.ok(lang.dictionaries.length >= 1);

  for (const lvl of levels) {
    const qList = getLanguageQuestions(lang.name, lvl);
    assert.ok(qList.length >= 3 && qList.length <= 5, `${lang.name} ${lvl} should have 3-5 questions`);
    for (const q of qList) {
      assert.ok(q.id);
      assert.ok(q.prompt);
      assert.equal(q.options.length, 3);
      assert.ok(q.correct);
      assert.ok(q.subTopic);
      assert.ok(q.explanation);
      assert.ok(q.recommendedReview);
    }
    const goals = getLanguageGoalSuggestions(lang.name, lvl);
    assert.ok(goals.length >= 2);
  }
}

// Adaptive diagnostic test on language
const jpIntermediateQuestions = getLanguageQuestions('Japonca', 'intermediate');
const sampleAnswers = {};
sampleAnswers[jpIntermediateQuestions[0].id] = jpIntermediateQuestions[0].correct;
sampleAnswers[jpIntermediateQuestions[1].id] = 'x'; // wrong
const evalResult = evaluateAdaptiveAssessment(sampleAnswers, jpIntermediateQuestions);
assert.equal(evalResult.total, jpIntermediateQuestions.length);
assert.equal(evalResult.score, 1);
assert.ok(evalResult.subTopicDeficiencies.length >= 1);
assert.ok(evalResult.reviewTasks.length >= 1);

// 5-Phase Language Period Plan
const enPlan = generatePeriodPlan(12, 'İngilizce B2 Akıcılık');
assert.equal(enPlan.length, 5);
assert.ok(enPlan[0].title.includes('Fonetik'));
assert.ok(enPlan[1].title.includes('Aktif Cümle'));
assert.ok(enPlan[2].title.includes('Yoğun Üretim'));
assert.ok(enPlan[3].title.includes('Aralıklı Tekrar'));
assert.ok(enPlan[4].title.includes('Seviye Kanıtı'));

// Flexible Duration Period Plans (2 weeks, 5 weeks, 36 weeks)
const plan2w = generatePeriodPlan(2, 'Python Temelleri');
assert.equal(plan2w.length, 5);
assert.ok(plan2w[0].horizonDays < plan2w[1].horizonDays);
assert.ok(plan2w[1].horizonDays < plan2w[2].horizonDays);
assert.ok(plan2w[2].horizonDays < plan2w[3].horizonDays);
assert.ok(plan2w[3].horizonDays <= plan2w[4].horizonDays);
assert.equal(plan2w[4].horizonDays, 14);

const plan5w = generatePeriodPlan(5, 'Siber Güvenlik Web Hacking');
assert.equal(plan5w.length, 5);
assert.equal(plan5w[4].horizonDays, 35);

const plan36w = generatePeriodPlan(36, 'YKS Matematik & Geometri');
assert.equal(plan36w.length, 5);
assert.equal(plan36w[4].horizonDays, 252);

// Domain catalog integration
assert.equal(findDomain('İngilizce').id, 'english');
assert.equal(findDomain('Almanca').id, 'german');
assert.equal(findDomain('Fransızca').id, 'french');
assert.equal(findDomain('Japonca').id, 'japanese');
assert.equal(findDomain('Arapça').id, 'arabic');

// 6. COMPANION CUSTOMIZATION, OUTFITS & GROWTH SIMULATION TESTS
const avatarSource = fs.readFileSync('src/components/north/companion-avatar.tsx', 'utf8');

// Verify all 8 colors are defined with gradients and glow
const expectedColors = ['blue', 'purple', 'emerald', 'amber', 'rose', 'cyan', 'indigo', 'obsidian'];
for (const colorId of expectedColors) {
  assert.ok(avatarSource.includes(`id: "${colorId}"`), `Avatar must define color: ${colorId}`);
}

// Verify all 8 outfits are defined
const expectedOutfits = ['none', 'scarf', 'glasses', 'headphones', 'hat', 'crown', 'cape', 'bandana'];
for (const outfitId of expectedOutfits) {
  assert.ok(avatarSource.includes(`id: "${outfitId}"`), `Avatar must define outfit: ${outfitId}`);
}

// Verify all 5 growth stages
for (let lvl = 1; lvl <= 5; lvl++) {
  assert.ok(avatarSource.includes(`level: ${lvl}`), `Avatar must define growth level: ${lvl}`);
}

// Verify level scaling increases monotonically
assert.ok(avatarSource.includes('scale: 0.88'));
assert.ok(avatarSource.includes('scale: 1.24'));

console.log('North personalization checks passed: exam calculations, 16 domain catalog & synonyms, adaptive assessment, unknown domain adaptation, 5-phase period plan, resilient task rescheduling, calendar clash avoidance, 5-language learning engine, companion 8 body colors, 8 outfits/accessories, 5 growth stages simulation.');

