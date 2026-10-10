/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, imports = {}) {
  const exports = {};
  const source = fs.readFileSync(file, "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(compiled, { exports, require: (name) => imports[name], crypto: require("node:crypto").webcrypto, Intl, Date, Math, Set, Map }, { filename: file });
  return exports;
}

const roadmap = load("src/lib/learning-roadmap.ts");
const northLib = load("src/lib/north.ts");
const scheduler = load("src/lib/roadmap-scheduling.ts", { "./learning-roadmap": roadmap, "./north": northLib });
const areaSync = load("src/lib/roadmap-areas.ts", { "./learning-roadmap": roadmap, "./north": northLib });

function fixture() {
  const plan = roadmap.createRoadmapPlan({ title: "Kişisel plan", startDate: "2026-10-12", weekCount: 1 });
  plan.weeks[0].tasks.push({ id: "lab-1", week: 1, title: "İlk lab", area: "Siber", minutes: 90, day: "Perşembe", kind: "Lab", detail: "Kanıt al", resource: { label: "Kaynak", url: "https://example.org" } });
  const state = { ...roadmap.createLearningRoadmapState(), plan, areaLinks: { Siber: "cyber" } };
  const north = { weeklyHours: 11.25, mode: "normal", areas: [{ id: "cyber", name: "Siber Güvenlik", goal: "", status: "active", archived: false }], tasks: [], events: [], protection: [] };
  return { state, north };
}

test("starting a week schedules linked tasks and does not duplicate them", () => {
  const { state, north } = fixture();
  const first = scheduler.activateRoadmapWeek(state, north, 1, "2026-10-08");
  assert.equal(first.created, 1);
  assert.equal(first.scheduled, 1);
  assert.equal(first.north.tasks[0].date, "2026-10-15");
  assert.equal(first.north.tasks[0].roadmapTaskId, "lab-1");
  const second = scheduler.activateRoadmapWeek(state, first.north, 1, "2026-10-08");
  assert.equal(second.created, 0);
  assert.equal(second.alreadyActive, 1);
});

test("unmapped, completed, and protected tasks are not put on a day", () => {
  const { state, north } = fixture();
  const unmapped = scheduler.activateRoadmapWeek({ ...state, areaLinks: { Siber: "-" } }, north, 1, "2026-10-08");
  assert.equal(unmapped.created, 0);
  assert.equal(unmapped.unmapped[0], "Siber");
  const complete = scheduler.activateRoadmapWeek({ ...state, records: { "lab-1": { status: "tamamlandı" } } }, north, 1, "2026-10-08");
  assert.equal(complete.created, 0);
  north.protection = Array.from({ length: 7 }, (_, index) => ({ areaId: "cyber", date: new Date(Date.UTC(2026, 9, 12 + index)).toISOString().slice(0, 10) }));
  const protectedWeek = scheduler.activateRoadmapWeek(state, north, 1, "2026-10-08");
  assert.equal(protectedWeek.pooled, 1);
  assert.equal(protectedWeek.north.tasks[0].date, "");
});

test("loading a roadmap creates its missing Areas once and links them", () => {
  const { state, north } = fixture();
  state.areaLinks = {};
  north.areas = [];
  const first = areaSync.syncRoadmapAreas(state, north);
  assert.equal(first.north.areas.length, 1);
  assert.equal(first.north.areas[0].name, "Siber");
  assert.equal(first.roadmap.areaLinks.Siber, first.north.areas[0].id);
  const second = areaSync.syncRoadmapAreas(first.roadmap, first.north);
  assert.equal(second.north, first.north);
  assert.equal(second.roadmap, first.roadmap);
});

test("a deliberately removed roadmap Area is not recreated", () => {
  const { state, north } = fixture();
  state.areaLinks = { Siber: "-" };
  north.areas = [];
  const result = areaSync.syncRoadmapAreas(state, north);
  assert.equal(result.north.areas.length, 0);
});
