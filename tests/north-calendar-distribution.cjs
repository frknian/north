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
  const mod = { exports };
  vm.runInNewContext(output, {
    exports,
    module: mod,
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
  return mod.exports;
}

const { distributeTasksAcrossMonth, distributePlanTasksToCalendar, shiftDay } = load('src/lib/north.ts');

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
// Test 5: 7-day automatic planning default (includes weekends Saturday & Sunday)
const monday = '2026-09-07';
const saturday = shiftDay(monday, 5);
const sunday = shiftDay(monday, 6);

const weekTasks7 = Array.from({ length: 7 }, (_, i) => ({
  id: `task-${i + 1}`,
  areaId: `area-${(i % 3) + 1}`,
  title: `Task ${i + 1}`,
  minutes: 60,
  status: 'todo',
  date: '',
  week: monday,
}));

const result7 = distributePlanTasksToCalendar(weekTasks7, {
  week: monday,
  forceRedistribute: true,
});

const dates7 = result7.map((t) => t.date);
assert.equal(dates7.length, 7);
assert(dates7.includes(saturday), 'Saturday must have a task assigned in 7-day default');
assert(dates7.includes(sunday), 'Sunday must have a task assigned in 7-day default');
console.log('✓ 7-gün otomatik planlama: Görevler Cumartesi ve Pazar dahil 7 güne yayıldı.');

// Test 6: Balanced spread with few tasks (3 tasks spread across 7 days reaching weekend)
const weekTasks3 = [
  { id: 't1', areaId: 'a1', title: 'Task 1', minutes: 60, status: 'todo', date: '', week: monday },
  { id: 't2', areaId: 'a2', title: 'Task 2', minutes: 60, status: 'todo', date: '', week: monday },
  { id: 't3', areaId: 'a1', title: 'Task 3', minutes: 60, status: 'todo', date: '', week: monday },
];

const result3 = distributePlanTasksToCalendar(weekTasks3, {
  week: monday,
  forceRedistribute: true,
});
const dates3 = result3.map((t) => t.date);
assert.equal(dates3.length, 3);
assert(dates3.includes(sunday), `Expected tasks to reach the weekend; got: ${dates3.join(', ')}`);
console.log('✓ Az sayıda görev bile (3 görev) haftaya dengeli yayılarak hafta sonunu kapsadı.');

// Test 7: User selected custom rest days (weekdays only [0, 1, 2, 3, 4])
const resultWeekdaysOnly = distributePlanTasksToCalendar(weekTasks7, {
  week: monday,
  forceRedistribute: true,
  activeDayIndices: [0, 1, 2, 3, 4],
});
for (const t of resultWeekdaysOnly) {
  assert(t.date !== saturday && t.date !== sunday, `Weekend should be excluded when user chooses weekdays only! Got: ${t.date}`);
}
console.log('✓ Kullanıcı hafta içi seçtiğinde hafta sonu tatili başarıyla korundu.');

console.log('🎉 ALL CALENDAR DISTRIBUTION & 7-DAY PLANNING TESTS PASSED!');

