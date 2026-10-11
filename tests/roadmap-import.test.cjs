/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const crypto = require("node:crypto").webcrypto;
const load = (file, extra = {}) => {
  const out = {};
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports: out, crypto, Intl, Date, URL, require: (name) => extra[name], ...{} });
  return out;
};
const roadmap = load("src/lib/learning-roadmap.ts");
const importer = load("src/lib/roadmap-import.ts", { "./learning-roadmap": roadmap });

test("loose JSON from an assistant is accepted and completed with defaults", () => {
  const result = importer.parseRoadmapContent(JSON.stringify({ title: "Python", weeks: [{ week: 1, title: "Temel", tasks: [{ title: "Kurulum", day: "Salı", minutes: "1 saat" }, "Değişkenler"] }, { title: "İkinci", tasks: [{ name: "Döngüler", duration: 30, link: "https://example.com" }] }] }));
  assert.equal(result.ok, true, result.error);
  assert.equal(result.plan.weeks.length, 2);
  assert.equal(result.plan.weeks[0].tasks[0].minutes, 60);
  assert.equal(result.plan.weeks[0].tasks[0].day, "Salı");
  assert.equal(result.plan.weeks[1].tasks[0].resource.url, "https://example.com");
  assert.equal(roadmap.isRoadmapPlan(result.plan), true);
});

test("JSON inside a markdown code fence and a bare weeks array both work", () => {
  const fenced = "Tabii!\n```json\n" + JSON.stringify([{ week: 1, tasks: [{ title: "A" }] }]) + "\n```";
  const result = importer.parseRoadmapContent(fenced);
  assert.equal(result.ok, true, result.error);
  assert.equal(result.plan.weeks[0].tasks[0].title, "A");
});

test("Planorth backups keep their records", () => {
  const plan = roadmap.createRoadmapPlan({ title: "Plan", startDate: "2026-10-12", weekCount: 2 });
  const state = { ...roadmap.createLearningRoadmapState(), plan };
  const result = importer.parseRoadmapContent(JSON.stringify({ schema: 2, state }));
  assert.equal(result.ok, true, result.error);
  assert.ok(result.state);
});

test("CSV tables become weeks and tasks", () => {
  const csv = "Hafta;Gün;Görev;Alan;Süre\n1;Pazartesi;Ağ temelleri;Ağ;45 dk\n1;Çarşamba;Linux;Sistem;60\n3;Cuma;Proje;Pratik;90";
  const result = importer.parseRoadmapContent(csv, "plan.csv");
  assert.equal(result.ok, true, result.error);
  assert.equal(result.plan.weeks.length, 3);
  assert.equal(result.plan.weeks[0].tasks.length, 2);
  assert.equal(result.plan.weeks[2].tasks[0].minutes, 90);
});

test("markdown outlines are parsed", () => {
  const md = "# Siber plan\nKısa giriş\n## Hafta 1: Temeller\n- Pazartesi: TCP/IP oku (45 dk)\n- Linux komutları 30 dk\n## Hafta 2 - Web\n1. OWASP Top 10 https://owasp.org";
  const result = importer.parseRoadmapContent(md, "x.md");
  assert.equal(result.ok, true, result.error);
  assert.equal(result.plan.title, "Siber plan");
  assert.equal(result.plan.weeks[0].title, "Temeller");
  assert.equal(result.plan.weeks[0].tasks[0].day, "Pazartesi");
  assert.equal(result.plan.weeks[0].tasks[0].minutes, 45);
  assert.equal(result.plan.weeks[1].tasks[0].resource.url, "https://owasp.org");
});

test("unusable content returns a helpful error", () => {
  assert.equal(importer.parseRoadmapContent("merhaba dünya").ok, false);
  assert.equal(importer.parseRoadmapContent("").ok, false);
  assert.equal(importer.parseRoadmapContent('{"foo":1}').ok, false);
});
