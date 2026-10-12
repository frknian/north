/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const mod = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync("src/lib/exam-calendar.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: mod, Date, Math, Number, Object, Array, Record: undefined });

const subjects = [{ id: "mat", name: "Matematik", questionCount: 40 }, { id: "tr", name: "Türkçe", questionCount: 40 }, { id: "fen", name: "Fen", questionCount: 20 }];
const base = { today: "2026-10-12", weeklyMinutes: 600, subjects };

test("long runway produces all four phases ending in the exam week", () => {
  const cal = mod.buildExamCalendar({ ...base, examDate: "2027-01-10" });
  assert.equal(cal.expired, false);
  assert.ok(cal.weeksLeft >= 12);
  assert.equal(cal.phases.map((p) => p.id).join(), "foundation,practice,trial,final");
  const last = cal.weeks[cal.weeks.length - 1];
  assert.equal(last.containsExam, true);
  assert.equal(last.trial, undefined);
  assert.ok(last.studyMinutes <= 600 * 0.3 + 5);
});

test("weak subjects get more minutes than strong ones", () => {
  const trials = [{ date: "2026-10-01", subjectScores: [{ subjectId: "mat", net: 38 }, { subjectId: "tr", net: 8 }, { subjectId: "fen", net: 10 }] }];
  const cal = mod.buildExamCalendar({ ...base, examDate: "2026-12-20", trials });
  const week = cal.weeks[0];
  const minutes = Object.fromEntries(week.subjects.map((s) => [s.subjectId, s.minutes]));
  assert.ok(minutes.tr > minutes.mat, "weak Türkçe should get more time than strong Matematik");
  assert.ok(cal.weakSubjects.includes("Türkçe"));
});

test("short runways and past exam dates are handled", () => {
  assert.equal(mod.buildExamCalendar({ ...base, examDate: "2026-10-12" }).weeksLeft, 1);
  assert.equal(mod.buildExamCalendar({ ...base, examDate: "2026-09-01" }).expired, true);
  const two = mod.buildExamCalendar({ ...base, examDate: "2026-10-20" });
  assert.equal(two.phases.map((p) => p.id).join(), "practice,final");
});

test("tasks are chunked and mock exams carry a date", () => {
  const cal = mod.buildExamCalendar({ ...base, examDate: "2027-01-10" });
  const tasks = mod.examCalendarToTasks(cal, "exam-x");
  assert.ok(tasks.every((t) => t.id.startsWith("examplan-exam-x-")));
  assert.ok(tasks.filter((t) => t.kind === "study").every((t) => t.minutes <= 65));
  assert.ok(tasks.some((t) => t.kind === "trial" && /^\d{4}-\d{2}-\d{2}$/.test(t.date)));
  assert.equal(new Set(tasks.map((t) => t.id)).size, tasks.length);
});

test("only the near horizon is turned into tasks", () => {
  const cal = mod.buildExamCalendar({ ...base, examDate: "2027-06-19" });
  const tasks = mod.examCalendarToTasks(cal, "x");
  const weeks = new Set(tasks.filter((t) => t.kind === "study").map((t) => t.week));
  assert.ok(weeks.size <= 4);
  assert.ok(tasks.length < 60);
});
