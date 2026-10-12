/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const mod = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync("src/lib/level-test.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: mod, Math, Number, Set, Map, Object, Array, Boolean });

const pool = [];
for (const [topic, base] of [["A", 0], ["B", 100], ["C", 200]]) for (const d of [1, 2, 3]) for (let i = 0; i < 2; i++) pool.push({ id: `${topic}${d}${i}`, topic, difficulty: d, prompt: "?", options: ["a", "b", "c", "d"], correctIndex: 1, explanation: "e" });

test("adaptive picker starts medium and moves with performance", () => {
  const first = mod.pickNextQuestion(pool, []);
  assert.equal(first.difficulty, 2);
  const up = mod.pickNextQuestion(pool, [{ questionId: first.id, choice: 1 }]);
  assert.equal(up.difficulty, 3);
  const down = mod.pickNextQuestion(pool, [{ questionId: first.id, choice: 0 }]);
  assert.equal(down.difficulty, 1);
});

test("test ends after the configured length and never repeats a question", () => {
  const answers = [];
  let q;
  while ((q = mod.pickNextQuestion(pool, answers))) {
    assert.ok(!answers.some((a) => a.questionId === q.id));
    answers.push({ questionId: q.id, choice: 1 });
  }
  assert.equal(answers.length, 12);
});

test("scoring weights difficulty and flags weak topics", () => {
  const answers = pool.filter((q) => q.id.endsWith("0")).map((q) => ({ questionId: q.id, choice: q.topic === "B" ? 0 : 1 }));
  const result = mod.scoreLevelTest(pool, answers);
  assert.equal(result.total, 9);
  assert.equal(result.correct, 6);
  assert.equal(result.weakTopics.join(), "B");
  assert.equal(result.level, "intermediate");
  const perfect = mod.scoreLevelTest(pool, pool.map((q) => ({ questionId: q.id, choice: 1 })));
  assert.equal(perfect.level, "advanced");
  assert.equal(mod.scoreLevelTest(pool, pool.map((q) => ({ questionId: q.id, choice: 0 }))).level, "beginner");
});

test("question validation rejects malformed AI output", () => {
  assert.equal(mod.isValidQuestion(pool[0]), true);
  assert.equal(mod.isValidQuestion({ ...pool[0], options: ["a"] }), false);
  assert.equal(mod.isValidQuestion({ ...pool[0], correctIndex: 5 }), false);
});
