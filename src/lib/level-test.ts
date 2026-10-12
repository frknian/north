import type { LevelTestResult } from "./types";

export type Difficulty = 1 | 2 | 3;
export interface LevelTestQuestion { id: string; topic: string; difficulty: Difficulty; prompt: string; options: string[]; correctIndex: number; explanation: string }
export interface LevelTestAnswer { questionId: string; choice: number | null }

export const LEVEL_TEST_LENGTH = 12;

/**
 * Adaptive selection: starts at medium difficulty, steps up after a correct answer and down after a wrong one,
 * preferring topics that have been asked the least so far.
 */
export function pickNextQuestion(pool: LevelTestQuestion[], answers: LevelTestAnswer[]): LevelTestQuestion | null {
  const asked = new Set(answers.map((answer) => answer.questionId));
  const remaining = pool.filter((question) => !asked.has(question.id));
  if (!remaining.length || answers.length >= LEVEL_TEST_LENGTH) return null;
  let target: number = 2;
  const last = answers[answers.length - 1];
  if (last) {
    const lastQuestion = pool.find((question) => question.id === last.questionId);
    const wasCorrect = lastQuestion ? last.choice === lastQuestion.correctIndex : false;
    target = Math.min(3, Math.max(1, (lastQuestion?.difficulty ?? 2) + (wasCorrect ? 1 : -1)));
  }
  const topicCount = new Map<string, number>();
  for (const answer of answers) {
    const topic = pool.find((question) => question.id === answer.questionId)?.topic;
    if (topic) topicCount.set(topic, (topicCount.get(topic) ?? 0) + 1);
  }
  return [...remaining].sort((a, b) =>
    Math.abs(a.difficulty - target) - Math.abs(b.difficulty - target) ||
    (topicCount.get(a.topic) ?? 0) - (topicCount.get(b.topic) ?? 0))[0];
}

export function scoreLevelTest(pool: LevelTestQuestion[], answers: LevelTestAnswer[]): Pick<LevelTestResult, "level" | "percent" | "correct" | "total" | "byTopic" | "weakTopics"> {
  const byTopic: LevelTestResult["byTopic"] = {};
  let earned = 0;
  let possible = 0;
  let correct = 0;
  for (const answer of answers) {
    const question = pool.find((item) => item.id === answer.questionId);
    if (!question) continue;
    const right = answer.choice === question.correctIndex;
    possible += question.difficulty;
    if (right) { earned += question.difficulty; correct += 1; }
    const topic = byTopic[question.topic] ?? { correct: 0, total: 0 };
    topic.total += 1;
    if (right) topic.correct += 1;
    byTopic[question.topic] = topic;
  }
  const percent = possible ? Math.round((earned / possible) * 100) : 0;
  const level = percent < 40 ? "beginner" : percent < 75 ? "intermediate" : "advanced";
  const weakTopics = Object.entries(byTopic).filter(([, value]) => value.correct / value.total < 0.5).map(([topic]) => topic);
  return { level, percent, correct, total: answers.length, byTopic, weakTopics };
}

export function isValidQuestion(value: unknown): value is LevelTestQuestion {
  const q = value as LevelTestQuestion;
  return Boolean(q) && typeof q.id === "string" && typeof q.topic === "string" && typeof q.prompt === "string" && [1, 2, 3].includes(q.difficulty)
    && Array.isArray(q.options) && q.options.length === 4 && q.options.every((option) => typeof option === "string" && option.trim())
    && Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex <= 3 && typeof q.explanation === "string";
}

export const levelLabels = { beginner: "Başlangıç", intermediate: "Orta", advanced: "İleri" } as const;
