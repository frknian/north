/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const mod = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync("src/lib/ics.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: mod, Date, String, Number, Math });

test("planned tasks and events become VEVENTs; finished tasks are skipped", () => {
  const ics = mod.buildIcs({
    now: new Date("2026-10-11T08:00:00Z"),
    tasks: [
      { id: "a", title: "Ağ; temelleri, oku", minutes: 45, date: "2026-10-12", status: "pending", plannedStart: "09:30" },
      { id: "b", title: "Tarihsiz saat", minutes: 30, date: "2026-10-13", status: "pending" },
      { id: "c", title: "Bitti", minutes: 30, date: "2026-10-13", status: "done" },
    ],
    events: [{ id: "e", title: "Ders", date: "2026-10-14", time: "23:30", kind: "class", minutes: 90 }],
  });
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 3);
  assert.match(ics, /DTSTART:20261012T093000/);
  assert.match(ics, /DTEND:20261012T101500/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261013/);
  assert.match(ics, /SUMMARY:Ağ\; temelleri\\, oku/);
  assert.match(ics, /DTEND:20261015T010000/);
  assert.ok(!ics.includes("Bitti"));
});
