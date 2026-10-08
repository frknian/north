/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const roadmap = {};
const source = fs.readFileSync("src/lib/learning-roadmap.ts", "utf8");
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: roadmap, crypto: require("node:crypto").webcrypto });

test("each account starts with an empty personal roadmap", () => {
  const first = roadmap.createLearningRoadmapState();
  const second = roadmap.createLearningRoadmapState();
  assert.equal(first.plan, null);
  assert.equal(second.plan, null);
  first.records.example = { status: "tamamlandı" };
  assert.equal(second.records.example, undefined);
});

test("a personal plan can be created without preset content", () => {
  const plan = roadmap.createRoadmapPlan({ title: "Kendi planım", startDate: "2026-10-12", weekCount: 12 });
  assert.equal(plan.weeks.length, 12);
  assert.ok(plan.weeks.every((week) => week.tasks.length === 0));
  assert.equal(roadmap.isRoadmapPlan(plan), true);
});

test("progress changes only after an explicit status record", () => {
  const state = roadmap.createLearningRoadmapState();
  const task = { id: "task-1", week: 1 };
  assert.equal(roadmap.roadmapStatus(state, task.id), "yapılmadı");
  assert.equal(roadmap.getScheduledWeek(state, task), 1);
  state.scheduledWeeks[task.id] = 2;
  assert.equal(roadmap.getScheduledWeek(state, task), 2);
  assert.equal(roadmap.roadmapStatus(state, task.id), "yapılmadı");
  state.records[task.id] = { status: "tamamlandı" };
  assert.equal(roadmap.roadmapStatus(state, task.id), "tamamlandı");
});

test("invalid or unsafe JSON backups are rejected", () => {
  const plan = roadmap.createRoadmapPlan({ title: "Kendi planım", startDate: "2026-10-12", weekCount: 1 });
  const backup = { schema: 2, state: { plan, records: {}, scheduledWeeks: {} } };
  assert.equal(roadmap.isRoadmapBackup(backup), true);
  assert.equal(roadmap.isRoadmapBackup({ ...backup, state: { ...backup.state, records: { unknown: { status: "tamamlandı" } } } }), false);
  plan.weeks[0].tasks.push({ id: "one", week: 1, title: "Oku", area: "Genel", minutes: 30, day: "Pazar", kind: "Çalışma", resource: { label: "Kaynak", url: "javascript:alert(1)" }, detail: "" });
  assert.equal(roadmap.isRoadmapBackup(backup), false);
});
