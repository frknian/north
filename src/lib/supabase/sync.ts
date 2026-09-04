import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkspaceState } from "@/lib/types";

export async function loadWorkspaceState(
  supabase: SupabaseClient,
  fallback: WorkspaceState,
): Promise<WorkspaceState | null> {
  const [profile, plan, tasks, sessions, labs, skills, reviews, notes, reports, vocabulary] = await Promise.all([
    supabase.from("profiles").select("*").maybeSingle(),
    supabase.from("weekly_plans").select("*").order("week_start", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("tasks").select("*").order("created_at"),
    supabase.from("focus_sessions").select("*").order("completed_at", { ascending: false }),
    supabase.from("labs").select("*").order("lab_date", { ascending: false }),
    supabase.from("skills").select("*").order("name"),
    supabase.from("reviews").select("*").order("review_date", { ascending: false }),
    supabase.from("notes").select("*").order("updated_at", { ascending: false }),
    supabase.from("reports").select("*").order("updated_at", { ascending: false }),
    supabase.from("vocabulary").select("*").order("created_at", { ascending: false }),
  ]);
  if (!profile.data || !plan.data) return null;
  const p = profile.data;
  const w = plan.data;
  return {
    profile: { id: p.id, fullName: p.full_name, goal: p.goal, track: p.track, primaryFocus: p.primary_focus, secondaryFocus: p.secondary_focus, futureFocus: p.future_focus, universityMode: p.university_mode, preferredSessionMinutes: p.preferred_session_minutes, weeklyCapacityHours: p.weekly_capacity_hours },
    weeklyPlan: { id: w.id, weekStart: w.week_start, mode: w.mode, targetBlocks: w.target_blocks, aiSummary: w.ai_summary },
    tasks: (tasks.data ?? []).map((t) => ({ id: t.id, weeklyPlanId: t.weekly_plan_id, title: t.title, description: t.description, category: t.category, duration: t.duration_minutes, difficulty: t.difficulty, objectives: t.objectives ?? [], successCriteria: t.success_criteria ?? [], recommendedResources: t.recommended_resources ?? [], outputRequirement: "Çalışma sonunda ölçülebilir bir çıktı üret.", aiHelpLimit: t.ai_help_limit, status: t.status, isDailyMission: t.is_daily_mission, completedAt: t.completed_at ?? undefined, reflection: t.reflection ?? undefined })),
    focusSessions: (sessions.data ?? []).map((s) => ({ id: s.id, taskId: s.task_id, durationMinutes: s.duration_minutes, status: s.status, notes: s.notes ?? "", completedAt: s.completed_at })),
    labs: (labs.data ?? []).map((l) => ({ id: l.id, name: l.name, platform: l.platform, difficulty: l.difficulty, category: l.category, date: l.lab_date, duration: l.duration_minutes, status: l.status, target: l.target ?? "", recon: l.recon ?? "", enumeration: l.enumeration ?? "", attackSurface: l.attack_surface ?? "", attempts: l.attempts ?? "", exploitation: l.exploitation ?? "", privilegeEscalation: l.privilege_escalation ?? "", result: l.result ?? "", stuck: l.stuck ?? "", learned: l.learned ?? "", aiAssistanceLevel: l.ai_assistance_level, walkthroughUsed: l.walkthrough_used, notes: l.notes ?? "", keyLearnings: l.key_learnings ?? [] })),
    skills: (skills.data?.length ? skills.data : fallback.skills).map((s) => ({ id: s.id, name: s.name, category: s.category, score: Number(s.score), previousScore: Number(s.previous_score), evidence: s.evidence, weight: Number(s.weight) })),
    reviews: (reviews.data ?? []).map((r) => ({ id: r.id, period: r.period, title: r.title, date: r.review_date, summary: r.summary, strongestArea: r.strongest_area, weakestArea: r.weakest_area, totalMinutes: r.metrics?.totalMinutes ?? 0, completedTasks: r.metrics?.completedTasks ?? 0, labsCompleted: r.metrics?.labsCompleted ?? 0, independentSolveRate: r.metrics?.independentSolveRate ?? 0 })),
    notes: (notes.data ?? []).map((n) => ({ id: n.id, title: n.title, category: n.category, content: n.content, updatedAt: n.updated_at })),
    reports: (reports.data ?? []).map((r) => ({ id: r.id, title: r.title, severity: r.severity, description: r.description, evidence: r.evidence, impact: r.impact, steps: r.steps_to_reproduce, remediation: r.remediation, updatedAt: r.updated_at })),
    vocabulary: (vocabulary.data ?? []).map((v) => ({ id: v.id, term: v.term, meaning: v.meaning, example: v.example_sentence })),
    coachMessages: [],
    resources: [],
    resourceHistory: [],
    sourceLocks: {},
    coaching: fallback.coaching,
    portfolio: [], jobs: [], applications: [], interviews: [],
  };
}

export async function saveWorkspaceState(
  supabase: SupabaseClient,
  userId: string,
  state: WorkspaceState,
) {
  const profile = {
    id: state.profile.id,
    user_id: userId,
    full_name: state.profile.fullName,
    goal: state.profile.goal,
    track: state.profile.track,
    primary_focus: state.profile.primaryFocus,
    secondary_focus: state.profile.secondaryFocus,
    future_focus: state.profile.futureFocus,
    university_mode: state.profile.universityMode,
    preferred_session_minutes: state.profile.preferredSessionMinutes,
    weekly_capacity_hours: state.profile.weeklyCapacityHours,
  };

  const plan = {
    id: state.weeklyPlan.id,
    user_id: userId,
    week_start: state.weeklyPlan.weekStart,
    mode: state.weeklyPlan.mode,
    target_blocks: state.weeklyPlan.targetBlocks,
    ai_summary: state.weeklyPlan.aiSummary,
  };

  const tasks = state.tasks.map((task) => ({
    id: task.id, user_id: userId, weekly_plan_id: task.weeklyPlanId,
    title: task.title, description: task.description, category: task.category,
    duration_minutes: task.duration, difficulty: task.difficulty,
    objectives: task.objectives, success_criteria: task.successCriteria,
    recommended_resources: task.recommendedResources, ai_help_limit: task.aiHelpLimit,
    status: task.status, is_daily_mission: task.isDailyMission,
    completed_at: task.completedAt ?? null, reflection: task.reflection ?? null,
  }));

  const [profileResult, planResult] = await Promise.all([
    supabase.from("profiles").upsert(profile),
    supabase.from("weekly_plans").upsert(plan),
  ]);
  if (profileResult.error) throw profileResult.error;
  if (planResult.error) throw planResult.error;

  const results = await Promise.all([
    tasks.length ? supabase.from("tasks").upsert(tasks) : Promise.resolve({ error: null }),
    state.focusSessions.length ? supabase.from("focus_sessions").upsert(state.focusSessions.map((s) => ({ id: s.id, user_id: userId, task_id: s.taskId, duration_minutes: s.durationMinutes, status: s.status, notes: s.notes, completed_at: s.completedAt }))) : Promise.resolve({ error: null }),
    state.labs.length ? supabase.from("labs").upsert(state.labs.map((l) => ({ id: l.id, user_id: userId, name: l.name, platform: l.platform, difficulty: l.difficulty, category: l.category, lab_date: l.date, duration_minutes: l.duration, status: l.status, target: l.target, recon: l.recon, enumeration: l.enumeration, attack_surface: l.attackSurface, attempts: l.attempts, exploitation: l.exploitation, privilege_escalation: l.privilegeEscalation, result: l.result, stuck: l.stuck, learned: l.learned, ai_assistance_level: l.aiAssistanceLevel, walkthrough_used: l.walkthroughUsed, notes: l.notes, key_learnings: l.keyLearnings }))) : Promise.resolve({ error: null }),
    state.notes.length ? supabase.from("notes").upsert(state.notes.map((n) => ({ id: n.id, user_id: userId, title: n.title, category: n.category, content: n.content, updated_at: n.updatedAt }))) : Promise.resolve({ error: null }),
    state.reports.length ? supabase.from("reports").upsert(state.reports.map((r) => ({ id: r.id, user_id: userId, title: r.title, severity: r.severity, description: r.description, evidence: r.evidence, impact: r.impact, steps_to_reproduce: r.steps, remediation: r.remediation, updated_at: r.updatedAt }))) : Promise.resolve({ error: null }),
    state.vocabulary.length ? supabase.from("vocabulary").upsert(state.vocabulary.map((v) => ({ id: v.id, user_id: userId, term: v.term, meaning: v.meaning, example_sentence: v.example }))) : Promise.resolve({ error: null }),
    state.reviews.length ? supabase.from("reviews").upsert(state.reviews.map((r) => ({ id: r.id, user_id: userId, period: r.period, title: r.title, review_date: r.date, summary: r.summary, strongest_area: r.strongestArea, weakest_area: r.weakestArea, metrics: { totalMinutes: r.totalMinutes, completedTasks: r.completedTasks, labsCompleted: r.labsCompleted, independentSolveRate: r.independentSolveRate } }))) : Promise.resolve({ error: null }),
    state.skills.length ? supabase.from("skills").upsert(state.skills.map((s) => ({ id: s.id, user_id: userId, name: s.name, category: s.category, score: s.score, previous_score: s.previousScore, evidence: s.evidence, weight: s.weight }))) : Promise.resolve({ error: null }),
  ]);
  const failure = results.find((result) => result.error);
  if (failure?.error) throw failure.error;
}
