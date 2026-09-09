const assert = require("node:assert/strict");

// Mock or require needed parts
const {
  createArea,
  createSprintTasks,
  getActiveSprint,
  updateSprintModuleStatus,
  dayKey,
  shiftDay,
} = require("../src/lib/north.ts");

console.log("--- Testing Topic Sprint & Exam Hub Logic ---");

const today = dayKey();
const examDay = shiftDay(today, 7);

const sampleArea = createArea("math", "area-math-1");
sampleArea.name = "Matematik";
sampleArea.level = "Lisans Seviyesi";

const sampleSprint = {
  id: "sprint-diff-eq",
  areaId: sampleArea.id,
  title: "Diferansiyel Sistemler (Lisans Seviyesi)",
  level: "Üniversite Vize Kampı",
  targetDate: examDay,
  dailyMinutesTarget: 50,
  sourceType: "pdf",
  fileName: "Diferansiyel_Denklemler_Vize_Notlari.pdf",
  notesContent: "Homojen denklemler, lineer sistemler, integral çarpanı ve sınav çıkmış soruları.",
  status: "active",
  createdAt: new Date().toISOString(),
  modules: [
    {
      id: "mod-1",
      title: "1. Aşama: 1. Derece Ayrılabilir Denklemler",
      summary: "Değişkenlerine ayrılabilen formlar ve integral alma adımları.",
      estimatedMinutes: 50,
      targetDate: today,
      status: "pending",
    },
    {
      id: "mod-2",
      title: "2. Aşama: Homojen Denklemler ve İntegral Çarpanı",
      summary: "Tam diferansiyel testi ve integral çarpanı bulma yöntemleri.",
      estimatedMinutes: 50,
      targetDate: shiftDay(today, 2),
      status: "pending",
    },
    {
      id: "mod-3",
      title: "3. Aşama: Yüksek Dereceden Lineer Denklemler",
      summary: "Karakteristik polinom kökleri ve Wronskian determinantı.",
      estimatedMinutes: 50,
      targetDate: shiftDay(today, 4),
      status: "pending",
    },
    {
      id: "mod-4",
      title: "4. Aşama: Vize Simülasyonu & Çıkmış Sınav Soruları",
      summary: "Zaman sınırlı soru çözümü ve hata analizi.",
      estimatedMinutes: 60,
      targetDate: examDay,
      status: "pending",
    },
  ],
};

const initialState = {
  version: 1,
  areas: [sampleArea],
  tasks: [],
  activities: [],
  events: [],
  energy: { date: today, level: "normal" },
  weeklyHours: 10,
  mode: "normal",
  customMode: "",
  protection: [],
  sprints: [],
};

// 1. Test createSprintTasks
const { updatedState, createdTasks } = createSprintTasks(initialState, sampleSprint);

assert.equal(createdTasks.length, 4, "4 adet odak görevi üretilmeli");
assert.equal(updatedState.tasks.length, 4, "State tasks listesine 4 görev eklenmeli");
assert.equal(updatedState.sprints.length, 1, "State sprints listesine sprint eklenmeli");
assert.equal(updatedState.events.length, 1, "Hedef sınav tarihi bir NorthEvent olarak eklenmeli");
assert.equal(updatedState.events[0].kind, "exam", "Event türü 'exam' olmalı");
assert.equal(updatedState.events[0].date, examDay, "Sınav tarihi targetDate ile eşleşmeli");

// Task properties check
const task1 = createdTasks[0];
assert.equal(task1.areaId, sampleArea.id, "Görev doğru alana atanmalı");
assert.equal(task1.sprintId, sampleSprint.id, "Görev sprintId taşımalı");
assert.equal(task1.sprintModuleId, "mod-1", "Görev modül id'si ile eşleşmeli");
assert.equal(task1.minutes, 50, "Süre eşleşmeli");
assert.equal(task1.mandatory, true, "Sprint görevleri öncelikli işaretlenmeli");
assert.ok(task1.resource.includes("Diferansiyel_Denklemler_Vize_Notlari.pdf"), "Kaynak bilgisi döküman adını taşımalı");

console.log("✓ createSprintTasks: Görevler, takvim sınav etkinliği ve döküman referansı başarıyla doğrulandı.");

// 2. Test getActiveSprint
const activeSprint = getActiveSprint(updatedState, sampleArea.id);
assert.ok(activeSprint, "Alanın aktif sprinti bulunabilmeli");
assert.equal(activeSprint.title, "Diferansiyel Sistemler (Lisans Seviyesi)");
assert.equal(activeSprint.status, "active");

const globalActive = getActiveSprint(updatedState);
assert.ok(globalActive, "Global aktif sprint bulunabilmeli");
assert.equal(globalActive.id, sampleSprint.id);

console.log("✓ getActiveSprint: Alan bazlı ve global aktif sprint sorguları başarıyla doğrulandı.");

// 3. Test updateSprintModuleStatus
let workingState = updateSprintModuleStatus(updatedState, sampleSprint.id, "mod-1", "done");
let currentSprint = workingState.sprints.find((s) => s.id === sampleSprint.id);
assert.equal(currentSprint.modules[0].status, "done", "mod-1 done olarak güncellenmeli");
assert.equal(currentSprint.status, "active", "Henüz tüm modüller bitmediği için sprint active kalmalı");

// Task status synchronization
const syncedTask1 = workingState.tasks.find((t) => t.sprintModuleId === "mod-1");
assert.equal(syncedTask1.status, "done", "Eşleşen NorthTask status de 'done' olarak senkronize edilmeli");
assert.ok(syncedTask1.completedAt, "completedAt damgası basılmalı");

// Complete remaining modules to test full sprint completion
workingState = updateSprintModuleStatus(workingState, sampleSprint.id, "mod-2", "done");
workingState = updateSprintModuleStatus(workingState, sampleSprint.id, "mod-3", "done");
workingState = updateSprintModuleStatus(workingState, sampleSprint.id, "mod-4", "done");

currentSprint = workingState.sprints.find((s) => s.id === sampleSprint.id);
assert.equal(currentSprint.status, "completed", "Tüm modüller bitince sprint 'completed' olmalı");

console.log("✓ updateSprintModuleStatus: Modül tamamlanması, task senkronizasyonu ve kamp bitişi başarıyla doğrulandı.");

console.log("\n=========================================");
console.log("ALL TOPIC SPRINT & EXAM TESTS PASSED! 🎉");
console.log("=========================================\n");
