/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const mod = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync("src/lib/reminders.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: mod, Boolean, Number, JSON, Event: class {}, window: {} });

const at = (h, m) => new Date(2026, 9, 11, h, m);
const base = { settings: { enabled: true, time: "09:00" }, today: "2026-10-11", lastSent: null, pendingCount: 2 };

test("reminder fires after the chosen time once per day", () => {
  assert.equal(mod.reminderDue({ ...base, now: at(8, 59) }), false);
  assert.equal(mod.reminderDue({ ...base, now: at(9, 0) }), true);
  assert.equal(mod.reminderDue({ ...base, now: at(20, 0), lastSent: "2026-10-11" }), false);
  assert.equal(mod.reminderDue({ ...base, now: at(20, 0), lastSent: "2026-10-10" }), true);
});

test("no reminder when disabled or nothing is pending", () => {
  assert.equal(mod.reminderDue({ ...base, now: at(12, 0), settings: { enabled: false, time: "09:00" } }), false);
  assert.equal(mod.reminderDue({ ...base, now: at(12, 0), pendingCount: 0 }), false);
});
