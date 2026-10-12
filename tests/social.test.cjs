/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const mod = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync("src/lib/social.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: mod, Date, Math, Set, Array, Number });

const act = (date, minutes, outcome = "done") => ({ date, minutes, outcome });

test("weekly stats count the current Monday-Sunday week and streak", () => {
  const stats = mod.computeShareStats([act("2026-10-11", 40), act("2026-10-10", 30), act("2026-10-09", 25), act("2026-10-07", 50), act("2026-10-05", 60, "skipped"), act("2026-10-12", 45)], "2026-10-12");
  assert.equal(stats.weekKey, "2026-10-12");
  assert.equal(stats.weeklyMinutes, 45);
  assert.equal(stats.streak, 4);
  const mid = mod.computeShareStats([act("2026-10-12", 45), act("2026-10-13", 30)], "2026-10-14");
  assert.equal(mid.weeklyMinutes, 75);
  assert.equal(mid.streak, 2);
});

test("leaderboard resets stale weeks and orders by minutes", () => {
  const rows = mod.rankLeaderboard([
    { uid: "a", nickname: "Ali", weekKey: "2026-10-12", weeklyMinutes: 120, weeklyDone: 3, streak: 2, updatedAt: "" },
    { uid: "b", nickname: "Ayşe", weekKey: "2026-10-05", weeklyMinutes: 900, weeklyDone: 9, streak: 9, updatedAt: "" },
    { uid: "c", nickname: "Can", weekKey: "2026-10-12", weeklyMinutes: 200, weeklyDone: 4, streak: 1, updatedAt: "" },
  ], "2026-10-12");
  assert.equal(rows.map((r) => r.uid).join(), "c,a,b");
  assert.equal(rows[2].weeklyMinutes, 0);
  assert.equal(rows[0].rank, 1);
});

test("invite codes round-trip and reject malformed input", () => {
  const code = mod.generateInviteCode();
  assert.equal(code.length, 8);
  assert.equal(mod.normalizeInviteCode(code.toLowerCase().replace(/(.{4})/, "$1-")), code);
  assert.equal(mod.normalizeInviteCode("abc"), null);
  assert.equal(mod.normalizeInviteCode("0000O0O0"), null);
  assert.equal(mod.sanitizeNickname("  <b>Ali</b>   Veli  "), "bAli/b Veli");
});
