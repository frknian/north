import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(5), description: z.string().min(10), category: z.string().min(2),
  duration: z.union([z.literal(45), z.literal(50), z.literal(60)]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  objectives: z.array(z.string()).min(1).max(4), successCriteria: z.array(z.string()).min(1).max(4),
  recommendedResources: z.array(z.string()).max(4), aiHelpLimit: z.number().int().min(0).max(4),
  theoryResourceId: z.string().optional(), practicalResourceId: z.string().optional(), optionalReferenceId: z.string().optional(),
  outputRequirement: z.string().min(5),
});

export const plannerInputSchema = z.object({
  profile: z.object({ mode: z.enum(["normal", "exam", "free"]), primaryFocus: z.string(), weeklyCapacityHours: z.number() }),
  skills: z.array(z.object({ name: z.string(), score: z.number(), evidence: z.string() })).max(20),
  recentLabs: z.array(z.object({ name: z.string(), status: z.string(), aiLevel: z.number(), stuck: z.string() })).max(5),
  unfinishedTasks: z.array(z.string()).max(10), lastReview: z.string().max(1800).optional(),
  resources: z.array(z.object({ id: z.string(), title: z.string(), provider: z.string(), category: z.string(), subcategory: z.string(), resourceType: z.string(), priority: z.enum(["primary", "secondary", "optional"]), recommendedForSkills: z.array(z.string()), rating: z.string().optional() })).max(30),
  resourceHistory: z.array(z.object({ resourceId: z.string(), completed: z.boolean(), rating: z.string().optional() })).max(30),
  sourceLocks: z.record(z.string(), z.string()),
});

export const plannerOutputSchema = z.object({ summary: z.string().max(500), tasks: z.array(taskSchema).min(3).max(16) });

export const mentorInputSchema = z.object({
  requestedLevel: z.number().int().min(0).max(4), question: z.string().min(2).max(3000),
  lab: z.object({ name: z.string(), platform: z.string(), target: z.string(), recon: z.string(), enumeration: z.string(), attempts: z.string(), stuck: z.string() }),
});

export const reviewInputSchema = z.object({
  period: z.enum(["weekly", "monthly"]), completedTasks: z.number(), totalTasks: z.number(), totalMinutes: z.number(),
  labsAttempted: z.number(), labsCompleted: z.number(), independentSolves: z.number(), aiLevels: z.record(z.string(), z.number()),
  missedTasks: z.array(z.string()).max(16), skillChanges: z.array(z.string()).max(20),
});

export const reviewOutputSchema = z.object({ summary: z.string().max(1400), strongestArea: z.string(), weakestArea: z.string(), nextFocus: z.string().max(400) });

export const skillEvaluationInputSchema = z.object({
  skill: z.string(), currentScore: z.number().min(0).max(10), completedTasks: z.number(), labCompletions: z.number(), independentSolves: z.number(), repeatedExposure: z.number(), averageAiLevel: z.number().min(0).max(4),
});

export const skillEvaluationOutputSchema = z.object({ suggestedScore: z.number().min(0).max(10), reason: z.string().max(500) });

export const reportReviewInputSchema = z.object({ title: z.string().min(3), severity: z.string(), description: z.string(), evidence: z.string(), impact: z.string(), steps: z.string(), remediation: z.string() });
export const reportReviewOutputSchema = z.object({ clarity: z.number().int().min(0).max(10), technicalAccuracy: z.number().int().min(0).max(10), impactExplanation: z.number().int().min(0).max(10), remediationQuality: z.number().int().min(0).max(10), feedback: z.array(z.string()).min(1).max(4) });

export const labSummaryInputSchema = z.object({ name: z.string(), recon: z.string(), enumeration: z.string(), attempts: z.string(), result: z.string(), stuck: z.string(), learned: z.string() });
export const labSummaryOutputSchema = z.object({ keyLearnings: z.array(z.string()).min(1).max(3) });

const coachTaskSchema = taskSchema.pick({ title: true, description: true, category: true, duration: true, difficulty: true, objectives: true, successCriteria: true, recommendedResources: true, aiHelpLimit: true, theoryResourceId: true, practicalResourceId: true, optionalReferenceId: true, outputRequirement: true });
const coachActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("update_task_status"), taskId: z.string(), status: z.enum(["pending", "in_progress", "completed", "partial", "failed"]), summary: z.string().max(160) }),
  z.object({ type: z.literal("edit_task"), taskId: z.string(), patch: z.object({ title: z.string().min(3).optional(), description: z.string().min(5).optional(), duration: z.union([z.literal(45), z.literal(50), z.literal(60)]).optional(), difficulty: z.enum(["easy", "medium", "hard"]).optional(), theoryResourceId: z.string().optional(), practicalResourceId: z.string().optional(), optionalReferenceId: z.string().optional(), outputRequirement: z.string().min(5).optional(), aiHelpLimit: z.number().int().min(0).max(4).optional() }), summary: z.string().max(160) }),
  z.object({ type: z.literal("create_task"), task: coachTaskSchema, summary: z.string().max(160) }),
  z.object({ type: z.literal("remove_task"), taskId: z.string(), summary: z.string().max(160) }),
  z.object({ type: z.literal("set_daily_mission"), taskId: z.string(), summary: z.string().max(160) }),
  z.object({ type: z.literal("update_weekly_plan"), patch: z.object({ mode: z.enum(["normal", "exam", "free"]).optional(), targetBlocks: z.number().int().min(1).max(18).optional(), aiSummary: z.string().max(500).optional() }), summary: z.string().max(160) }),
]);

export const coachInputSchema = z.object({
  generationId: z.string().min(8),
  message: z.string().min(1).max(4000),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(5000) })).max(20),
  workspace: z.object({
    profile: z.object({ fullName: z.string(), goal: z.string(), universityMode: z.enum(["normal", "exam", "free"]), weeklyCapacityHours: z.number(), primaryFocus: z.string() }),
    weeklyPlan: z.object({ mode: z.enum(["normal", "exam", "free"]), targetBlocks: z.number(), aiSummary: z.string() }),
    tasks: z.array(z.object({ id: z.string(), title: z.string(), description: z.string(), category: z.string(), duration: z.number(), difficulty: z.enum(["easy", "medium", "hard"]), status: z.enum(["pending", "in_progress", "completed", "partial", "failed"]), isDailyMission: z.boolean() })).max(30),
    metrics: z.object({ totalFocusMinutes: z.number(), labsAttempted: z.number(), labsCompleted: z.number(), independentLabs: z.number(), averageAiLevel: z.number(), completedTasks: z.number() }),
    recentLabs: z.array(z.object({ name: z.string(), status: z.string(), aiAssistanceLevel: z.number(), walkthroughUsed: z.boolean(), stuck: z.string(), learned: z.string() })).max(8),
    skills: z.array(z.object({ name: z.string(), score: z.number(), evidence: z.string() })).max(20),
    resources: z.array(z.object({ id: z.string(), title: z.string(), provider: z.string(), category: z.string(), subcategory: z.string(), resourceType: z.string(), priority: z.enum(["primary", "secondary", "optional"]), recommendedForSkills: z.array(z.string()), rating: z.string().optional() })).max(30),
    resourceHistory: z.array(z.object({ resourceId: z.string(), completed: z.boolean(), rating: z.string().optional() })).max(30),
    sourceLocks: z.record(z.string(), z.string()),
  }),
});

export const coachOutputSchema = z.object({
  reply: z.string().min(1).max(5000),
  actions: z.array(coachActionSchema).max(12),
  analysis: z.object({ strongestSignal: z.string().max(240), bottleneck: z.string().max(240), nextPriority: z.string().max(240) }).optional(),
});
