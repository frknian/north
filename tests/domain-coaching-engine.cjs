/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node CommonJS test runner. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');

const cache = new Map();

function loadModule(filePath) {
  const resolved = path.resolve(filePath);
  if (cache.has(resolved)) {
    return cache.get(resolved);
  }

  let code;
  if (fs.existsSync(resolved)) {
    code = fs.readFileSync(resolved, 'utf8');
  } else if (fs.existsSync(resolved + '.ts')) {
    code = fs.readFileSync(resolved + '.ts', 'utf8');
  } else if (fs.existsSync(resolved + '.tsx')) {
    code = fs.readFileSync(resolved + '.tsx', 'utf8');
  } else {
    throw new Error('File not found: ' + resolved);
  }

  const transpiled = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  const moduleExports = {};
  const moduleObj = { exports: moduleExports };
  cache.set(resolved, moduleExports);

  const customRequire = (id) => {
    if (id.startsWith('@/lib/')) {
      const subPath = path.resolve('src/lib', id.slice(6));
      return loadModule(subPath);
    }
    if (id.startsWith('./') || id.startsWith('../')) {
      const subPath = path.resolve(path.dirname(resolved), id);
      return loadModule(subPath);
    }
    return require(id);
  };

  const sandbox = {
    exports: moduleExports,
    module: moduleObj,
    require: customRequire,
    Date,
    console,
    Math,
    Object,
    Array,
    String,
    Number,
    Boolean,
    RegExp,
    Set,
    Map,
    crypto: require('node:crypto'),
  };

  vm.runInNewContext(transpiled, sandbox);
  cache.set(resolved, moduleObj.exports);
  return moduleObj.exports;
}

const engine = loadModule('src/lib/coaching/domain-engine.ts');

const {
  resolveDomainArchetype,
  diagnoseDomainState,
  diagnoseExam,
  diagnoseTech,
  diagnoseLanguage,
  diagnoseTheory,
} = engine;

console.log('--- Testing Domain Coaching Engine Archetype Resolver ---');

// 1. Archetype Resolution Tests
assert.equal(
  resolveDomainArchetype({ id: '1', name: 'YKS 2026 Sayısal', kind: 'exam', goal: 'Tıp fakültesi', status: 'active', priority: 3, weeklyMinutes: 600, preferredSessionMinutes: 50 }),
  'exam',
  'YKS should resolve to exam'
);

assert.equal(
  resolveDomainArchetype({ id: '2', name: 'KPSS Genel Yetenek', kind: 'exam', goal: '90+ puan', status: 'active', priority: 3, weeklyMinutes: 400, preferredSessionMinutes: 45 }),
  'exam',
  'KPSS should resolve to exam'
);

assert.equal(
  resolveDomainArchetype({ id: '3', name: 'Siber Güvenlik & Pentest', kind: 'project', goal: 'Junior pentester olmak', status: 'active', priority: 3, weeklyMinutes: 500, preferredSessionMinutes: 50 }),
  'tech',
  'Cyber security should resolve to tech'
);

assert.equal(
  resolveDomainArchetype({ id: '4', name: 'Full Stack React & Next.js', kind: 'project', goal: 'SaaS projesi üretmek', status: 'active', priority: 2, weeklyMinutes: 400, preferredSessionMinutes: 45 }),
  'tech',
  'Full stack development should resolve to tech'
);

assert.equal(
  resolveDomainArchetype({ id: '5', name: 'İngilizce C1 Akıcılık', kind: 'language', goal: 'IELTS 7.5', status: 'active', priority: 2, weeklyMinutes: 300, preferredSessionMinutes: 30 }),
  'language',
  'English should resolve to language'
);

assert.equal(
  resolveDomainArchetype({ id: '6', name: 'Hukuk Medeni Kanun & Yargıtay Kararları', kind: 'study', goal: 'Mevzuat ve içtihat kavramlarını özümsemek', status: 'active', priority: 2, weeklyMinutes: 350, preferredSessionMinutes: 45 }),
  'theory',
  'Law / Theory should resolve to theory'
);

console.log('✓ Archetype resolution tests passed.');

// 2. Deterministic Exam Diagnostics Tests
console.log('--- Testing Deterministic Exam Diagnostics ---');
const examArea = {
  id: 'area-yks',
  name: 'YKS 2026 Sayısal',
  kind: 'exam',
  goal: 'Netleri 95+ seviyesine çıkarmak',
  status: 'active',
  priority: 3,
  weeklyMinutes: 600,
  preferredSessionMinutes: 50,
};

const baseWorkspace = {
  profile: { fullName: 'Furkan', goal: 'YKS Başarısı', universityMode: 'exam', weeklyCapacityHours: 15, primaryFocus: 'YKS' },
  trialExams: [
    { id: 'te1', title: 'TYT Deneme 1', date: '2026-08-15', totalNet: 75, targetNet: 95, correctAnswers: 80, wrongAnswers: 20, emptyAnswers: 20 },
    { id: 'te2', title: 'TYT Deneme 2', date: '2026-08-25', totalNet: 74, targetNet: 95, correctAnswers: 79, wrongAnswers: 20, emptyAnswers: 21 },
    { id: 'te3', title: 'TYT Deneme 3', date: '2026-09-02', totalNet: 72, targetNet: 95, correctAnswers: 78, wrongAnswers: 24, emptyAnswers: 18 },
  ],
  wrongAnalyses: [
    { id: 'w1', examId: 'te3', questionNumber: 14, lesson: 'Matematik', topic: 'Türev', rootCause: 'time', notes: 'Süre yetmediği için panik yapıldı' },
    { id: 'w2', examId: 'te3', questionNumber: 19, lesson: 'Matematik', topic: 'İntegral', rootCause: 'time', notes: 'Süre baskısı' },
    { id: 'w3', examId: 'te3', questionNumber: 22, lesson: 'Fizik', topic: 'Elektrik', rootCause: 'time', notes: 'Süre bitti' },
  ],
  skills: [],
  tasks: [],
  notes: [],
  projects: [],
  portfolio: [],
  reports: [],
  resources: [],
  resourceHistory: [],
  sourceLocks: {},
  coaching: { preferences: { aiUsage: { date: '2026-09-09', count: 0 }, dailyAiLimit: 20 }, milestones: [], checkins: [] },
};

const northState = {
  version: 1,
  areas: [examArea],
  tasks: [],
  activities: [],
  events: [],
  energy: { date: '2026-09-09', level: 'normal' },
  weeklyHours: 15,
  mode: 'exam',
  customMode: '',
  protection: [],
};

const examReport = diagnoseDomainState(examArea, northState, baseWorkspace);
assert.equal(examReport.archetype, 'exam');
assert.ok(['bottleneck', 'at_risk', 'stagnant'].includes(examReport.status), 'Net drop should trigger bottleneck or stagnant status');
assert.ok(examReport.metrics.some(m => m.label.includes('Net')), 'Should compute Net metric');
assert.ok(examReport.findings.some(f => f.id === 'exam-trend-down' || f.id === 'exam-plateau' || f.id === 'exam-primary-fault'), 'Should detect net drop or primary fault');
assert.ok(examReport.prescribedAction, 'Should prescribe an intervention action');
assert.ok(examReport.coachingPromptContext.includes('[SINAV KOÇLUĞU TEŞHİS RAPORU]'), 'Coaching prompt context should contain structured diagnosis');

console.log('✓ Exam diagnostics tests passed.');

// 3. Deterministic Tech Diagnostics Tests (Tutorial Hell Detection)
console.log('--- Testing Deterministic Tech Diagnostics (Tutorial Hell) ---');
const techArea = {
  id: 'area-tech',
  name: 'Siber Güvenlik & Lab Pratiği',
  kind: 'tech',
  goal: 'Bağımsız pentester olmak',
  status: 'active',
  priority: 3,
  weeklyMinutes: 500,
  preferredSessionMinutes: 50,
};

const techTasks = [
  { id: 'tt1', areaId: techArea.id, title: 'Web Security video izle', goal: 'Video izleme', minutes: 45, status: 'done', mandatory: false, date: '2026-09-05', deadline: '', why: '', week: '2026-W36', taskType: 'reading' },
  { id: 'tt2', areaId: techArea.id, title: 'SQLi makalesi oku', goal: 'Makale okuma', minutes: 40, status: 'done', mandatory: false, date: '2026-09-06', deadline: '', why: '', week: '2026-W36', taskType: 'reading' },
  { id: 'tt3', areaId: techArea.id, title: 'XSS cheat sheet incele', goal: 'İnceleme', minutes: 35, status: 'done', mandatory: false, date: '2026-09-07', deadline: '', why: '', week: '2026-W36', taskType: 'reading' },
  { id: 'tt4', areaId: techArea.id, title: 'Network Security doküman oku', goal: 'Doküman', minutes: 50, status: 'done', mandatory: false, date: '2026-09-08', deadline: '', why: '', week: '2026-W36', taskType: 'reading' },
];

const techWorkspace = {
  ...baseWorkspace,
  labs: [
    { id: 'l1', name: 'DVWA SQLi', status: 'completed', category: 'Web', aiAssistanceLevel: 3, walkthroughUsed: true, date: '2026-09-04' },
  ],
  tasks: [],
};

const techState = {
  ...northState,
  areas: [techArea],
  tasks: techTasks,
  activities: [],
};

const techReport = diagnoseDomainState(techArea, techState, techWorkspace);
assert.equal(techReport.archetype, 'tech');
assert.ok(techReport.findings.some(f => f.id === 'tech-tutorial-hell'), 'Should detect Tutorial Hell when reading tasks dominate without code/lab');
assert.equal(techReport.status, 'bottleneck');
assert.ok(
  techReport.prescribedAction.title.includes('Tutorial') ||
  techReport.prescribedAction.title.includes('Bağımsız') ||
  techReport.prescribedAction.title.includes('Lab'),
  'Action should prescribe independent code/lab breakout'
);

console.log('✓ Tech tutorial hell diagnostics tests passed.');

// 4. Deterministic Language Diagnostics Tests (Silent Learner Detection)
console.log('--- Testing Deterministic Language Diagnostics (Silent Learner) ---');
const langArea = {
  id: 'area-lang',
  name: 'İngilizce Akıcılık B2',
  kind: 'language',
  goal: 'Akıcı konuşma seviyesine gelmek',
  status: 'active',
  priority: 2,
  weeklyMinutes: 300,
  preferredSessionMinutes: 30,
};

const langActivities = [
  { id: 'la1', taskId: 'lt1', areaId: langArea.id, date: '2026-09-06', minutes: 25, outcome: 'done', difficulty: 'normal', reflection: 'Vocab anki ezber', amount: 30, metric: 'Kelime', endedAt: '2026-09-06T10:00:00Z' },
  { id: 'la2', taskId: 'lt1', areaId: langArea.id, date: '2026-09-07', minutes: 25, outcome: 'done', difficulty: 'normal', reflection: 'Vocab quiz', amount: 25, metric: 'Kelime', endedAt: '2026-09-07T10:00:00Z' },
  { id: 'la3', taskId: 'lt1', areaId: langArea.id, date: '2026-09-08', minutes: 25, outcome: 'done', difficulty: 'normal', reflection: 'Kelime listesi', amount: 20, metric: 'Kelime', endedAt: '2026-09-08T10:00:00Z' },
];

const langState = {
  ...northState,
  areas: [langArea],
  tasks: [],
  activities: langActivities,
};

const langReport = diagnoseDomainState(langArea, langState, baseWorkspace);
assert.equal(langReport.archetype, 'language');
assert.ok(langReport.findings.some(f => f.id === 'lang-silent-learner'), 'Should detect Silent Learner (vocab without speaking/shadowing)');
assert.ok(langReport.prescribedAction.title.includes('Gölgeleme') || langReport.prescribedAction.title.includes('Shadowing'), 'Should prescribe Shadowing/Speaking');

console.log('✓ Language diagnostics tests passed.');

// 5. Deterministic Theory Diagnostics Tests (Feynman Technique)
console.log('--- Testing Deterministic Theory Diagnostics ---');
const theoryArea = {
  id: 'area-theory',
  name: 'Ceza Hukuku Genel Hükümler',
  kind: 'study',
  goal: 'Kavramları ve suç teorisini özümsemek',
  status: 'active',
  priority: 2,
  weeklyMinutes: 300,
  preferredSessionMinutes: 40,
};

const theoryReport = diagnoseDomainState(theoryArea, northState, baseWorkspace);
assert.equal(theoryReport.archetype, 'theory');
assert.ok(theoryReport.prescribedAction.title.includes('Feynman'), 'Theory should prescribe Feynman technique synthesis');
assert.ok(
  theoryReport.pedagogicalAdvice.toLocaleLowerCase('tr').includes('feynman') ||
  theoryReport.pedagogicalAdvice.toLocaleLowerCase('tr').includes('aktif hatırlama'),
  'Advice should emphasize active recall'
);

console.log('✓ Theory diagnostics tests passed.');

console.log('\n=========================================');
console.log('ALL DOMAIN COACHING ENGINE TESTS PASSED! 🎉');
console.log('=========================================');
