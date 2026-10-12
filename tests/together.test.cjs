/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const mod = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync("src/lib/together.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: mod, Math, Number, Array, String });

const t0 = 1_800_000_000_000;
const room = (patch = {}) => ({ id: "ABC234", hostUid: "h", hostNickname: "Ali", title: "Çalışma", durationMin: 25, status: "waiting", startedAt: null, createdAt: t0, ...patch });

test("room phases follow the host's actions and the clock", () => {
  assert.equal(mod.roomPhase(room(), t0 + 1000), "lobby");
  const running = room({ status: "running", startedAt: t0 + 1000 });
  assert.equal(mod.roomPhase(running, t0 + 2000), "running");
  assert.equal(mod.roomPhase(running, t0 + 1000 + 25 * 60_000), "finished");
  assert.equal(mod.roomPhase(room({ status: "ended" }), t0), "ended");
  assert.equal(mod.roomPhase(room(), t0 + 9 * 3_600_000), "expired");
});

test("countdown is derived from the shared start time", () => {
  const running = room({ status: "running", startedAt: t0 });
  assert.equal(mod.remainingMs(running, t0 + 60_000), 24 * 60_000);
  assert.equal(mod.remainingMs(running, t0 + 99 * 60_000), 0);
  assert.equal(mod.formatClock(24 * 60_000 + 1), "24:01");
  assert.equal(mod.formatClock(0), "00:00");
  assert.equal(mod.remainingMs(room(), t0), 25 * 60_000);
});

test("codes are six safe characters and normalise user input", () => {
  const code = mod.generateRoomCode();
  assert.equal(code.length, 6);
  assert.equal(mod.normalizeRoomCode(code.toLowerCase().slice(0, 3) + "-" + code.slice(3)), code);
  assert.equal(mod.normalizeRoomCode("abc"), null);
  assert.equal(mod.normalizeRoomCode("ABCDE0"), null);
});

test("member summary ignores people who left", () => {
  const s = mod.memberSummary([{ state: "focusing" }, { state: "done" }, { state: "left" }, { state: "done" }]);
  assert.equal(s.total, 3);
  assert.equal(s.done, 2);
  assert.equal(s.focusing, 1);
});
