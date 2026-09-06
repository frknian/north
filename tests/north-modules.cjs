/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node CommonJS test runner. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
function load(path) {
  const output = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, Date });
  return exports;
}
const { nextRepetition } = load('src/lib/repetition.ts');
const now = new Date('2026-09-05T12:00:00Z');
assert.equal(nextRepetition(0, true, now).nextReviewAt, '2026-09-06T12:00:00.000Z');
assert.equal(nextRepetition(4, true, now).reviewIntervalDays, 8);
assert.equal(nextRepetition(30, false, now).reviewIntervalDays, 1);
assert.equal(nextRepetition(180, true, now).reviewIntervalDays, 180);
const { skillEvidence } = load('src/lib/skill-evidence.ts');
const state = {
  labs: [{ name: 'Pending lab', status: 'planned', category: 'Networking', date: '2026-09-09' }, { name: 'Completed lab', status: 'completed', category: 'Other', skillsGained: ['Networking'], date: '2026-09-04' }],
  tasks: [{ title: 'Ağ çalışması', category: 'Ağ', status: 'completed', completedAt: '2026-09-05' }, { category: 'Ağ', status: 'pending' }],
  notes: [{ title: 'DNS', category: 'Other', linkedSkill: 'Networking', updatedAt: '2026-09-03' }],
  projects: [], portfolio: [{ title: 'Parser', skills: ['Networking'], lastCommitAt: '2026-09-02' }], reports: [],
};
const result = skillEvidence(state, { name: 'Networking', category: 'Networking' });
assert.equal(result.count, 4);
assert.equal(result.labs.length, 1);
assert.equal(result.lastPracticed, '2026-09-05');
const empty = skillEvidence({labs:[], tasks:[], notes:[], portfolio:[], reports:[]}, {name:'Networking',category:'Networking'});
assert.equal(empty.count, 0);
assert.equal(empty.lastPracticed, undefined);
const onboardingSource = fs.readFileSync('src/lib/onboarding.ts', 'utf8');
assert.match(onboardingSource, /Başarıya ulaştığını gösterecek somut sonucu ne kadar net tanımladın\?/);
assert.doesNotMatch(onboardingSource, /hedefinde başarıyı hangi somut sonuçla/);
console.log('North module checks passed: repetition boundaries, linked evidence, pending exclusion, natural Turkish assessment prompts, empty state.');
