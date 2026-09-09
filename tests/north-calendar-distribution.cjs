/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node CommonJS test runner. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');

function load(path) {
  const fileContent = fs.readFileSync(path, 'utf8');
  const output = ts.transpileModule(fileContent, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  const module = { exports };
  vm.runInNewContext(output, {
    exports,
    module,
    require: (id) => {
      if (id === '@/lib/utils' || id.endsWith('/utils')) {
        return { cn: (...args) => args.filter(Boolean).join(' ') };
      }
      return require(id);
    },
    Date,
    Math,
    String,
    Number,
    Set,
    Map,
    Object,
    Array,
    console,
  });
  return module.exports;
}

const { distributeTasksAcrossMonth } = load('src/lib/north.ts');

console.log('Testing distributeTasksAcrossMonth with custom day options...');

const sampleTasks = [
  { id: 't1', title: 'Task 1', areaId: 'a1', minutes: 30, status: 'todo', date: '' },
  { id: 't2', title: 'Task 2', areaId: 'a1', minutes: 45, status: 'todo', date: '' },
  { id: 't3', title: 'Task 3', areaId: 'a2', minutes: 60, status: 'todo', date: '' },
  { id: 't4', title: 'Task 4', areaId: 'a2', minutes: 30, status: 'todo', date: '' },
  { id: 't5', title: 'Task 5', areaId: 'a1', minutes: 45, status: 'todo', date: '' },
  { id: 't6', title: 'Task 6', areaId: 'a2', minutes: 30, status: 'todo', date: '' },
];

// Test 1: Sadece Hafta Sonu (Cumartesi: 6, Pazar: 0)
const weekendResult = distributeTasksAcrossMonth(sampleTasks, {
  monthKey: '2026-09',
  strategy: 'all_pool',
  allowedDaysOfWeek: [0, 6],
  today: '2026-09-01',
  startFromToday: true,
  maxDailyTasks: 2,
  maxDailyMinutes: 90,
});

assert.equal(weekendResult.distributedCount, 6, 'All 6 tasks should be distributed');
for (const task of weekendResult.tasks) {
  assert(task.date, 'Task must have an assigned date');
  const d = new Date(`${task.date}T12:00:00`).getDay();
  assert(d === 0 || d === 6, `Expected weekend (0 or 6), but got day ${d} for date ${task.date}`);
}
console.log('✓ Hafta sonları seçimi (Cumartesi & Pazar) başarıyla doğrulandı: Tüm görevler sadece hafta sonuna yerleşti.');

// Test 2: Sadece Hafta İçi (Pzt: 1, Sal: 2, Çar: 3, Per: 4, Cum: 5)
const weekdayResult = distributeTasksAcrossMonth(sampleTasks, {
  monthKey: '2026-09',
  strategy: 'all_pool',
  allowedDaysOfWeek: [1, 2, 3, 4, 5],
  today: '2026-09-01',
  startFromToday: true,
  maxDailyTasks: 2,
  maxDailyMinutes: 90,
});

assert.equal(weekdayResult.distributedCount, 6, 'All 6 tasks should be distributed');
for (const task of weekdayResult.tasks) {
  assert(task.date, 'Task must have an assigned date');
  const d = new Date(`${task.date}T12:00:00`).getDay();
  assert(d >= 1 && d <= 5, `Expected weekday (1-5), but got day ${d} for date ${task.date}`);
}
console.log('✓ Hafta içi seçimi (Pzt - Cuma) başarıyla doğrulandı: Hafta sonları tamamen boş bırakıldı.');

// Test 3: Özel Günler (Sadece Pazartesi ve Çarşamba: [1, 3])
const customDaysResult = distributeTasksAcrossMonth(sampleTasks, {
  monthKey: '2026-09',
  strategy: 'all_pool',
  allowedDaysOfWeek: [1, 3],
  today: '2026-09-01',
  startFromToday: true,
  maxDailyTasks: 2,
  maxDailyMinutes: 90,
});

assert.equal(customDaysResult.distributedCount, 6);
for (const task of customDaysResult.tasks) {
  assert(task.date, 'Task must have an assigned date');
  const d = new Date(`${task.date}T12:00:00`).getDay();
  assert(d === 1 || d === 3, `Expected Monday (1) or Wednesday (3), but got day ${d} for date ${task.date}`);
}
console.log('✓ Özel gün kombinasyonu ([Pzt, Çar]) başarıyla doğrulandı: Yalnızca seçilen günlere yerleştirildi.');

// Test 4: Boş gün eşleşmesi durumu
const emptyResult = distributeTasksAcrossMonth(sampleTasks, {
  monthKey: '2026-09',
  strategy: 'all_pool',
  allowedDaysOfWeek: [0, 6],
  today: '2026-09-30',
  startFromToday: true,
});
assert.equal(emptyResult.distributedCount, 0);
assert(emptyResult.summary.includes('uygun boş gün bulunamadı'));
console.log('✓ Uygun gün kalmama durumu ve nazik bilgilendirme mesajı başarıyla doğrulandı.');

console.log('🎉 ALL CALENDAR DISTRIBUTION DAY SELECTION TESTS PASSED!');
