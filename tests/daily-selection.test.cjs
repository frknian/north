/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createArea, dailySelection, dayKey, weekKey } = require("../src/lib/north.ts");

const baseState = () => ({ version: 1, areas: [], tasks: [], activities: [], events: [], energy: { date: "", level: "normal" }, weeklyHours: 20, mode: "normal", customMode: "", protection: [] });

function area(id, name) { const a = createArea("custom", id); a.name = name; a.goal = "hedef"; return a; }
function task(id, areaId, patch = {}) {
  return { id, areaId, title: id, goal: "", minutes: 40, intensity: "normal", mandatory: false, status: "pending", date: "", deadline: "", resource: "", why: "", week: weekKey(), ...patch };
}

test("roadmap work scheduled for today beats a crowd of pooled tasks from another area", () => {
  const today = dayKey();
  const state = baseState();
  state.areas = [area("a", "Sınav"), area("b", "Yol haritası")];
  state.weeklyHours = 20;
  state.tasks = [
    ...Array.from({ length: 8 }, (_, i) => task(`pool-${i}`, "a", { mandatory: i % 2 === 0 })),
    task("rm-today", "b", { date: today, roadmapPlanId: "p", roadmapTaskId: "t1" }),
    task("rm-pooled", "b", { roadmapPlanId: "p", roadmapTaskId: "t2", minutes: 15 }),
  ];
  const picked = dailySelection(state, today).map((t) => t.id);
  assert.ok(picked.includes("rm-today"), `roadmap task dated today must be selected, got ${picked}`);
  assert.equal(picked[0], "rm-today");
});

test("tasks dated for other days are still excluded", () => {
  const today = dayKey();
  const state = baseState();
  state.areas = [area("b", "Yol haritası")];
  state.tasks = [task("later", "b", { date: "2099-01-01", roadmapPlanId: "p", roadmapTaskId: "t1" })];
  assert.equal(dailySelection(state, today).length, 0);
});
