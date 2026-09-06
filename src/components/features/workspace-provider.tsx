"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { demoState } from "@/lib/demo-data";
import { createEmptyWorkspaceState, createPersonalizedWorkspace } from "@/lib/onboarding";
import { dayKey, initializeNorth, type NorthState } from "@/lib/north";
import { getFirebase } from "@/lib/firebase/client";
import type { Certification, CoachAction, CoachMessage, CoachingOnboarding, DailyCheckin, FocusSession, InitialSetupInput, InterviewAttempt, JobApplication, JobPosting, Lab, Note, PortfolioProject, Profile, ProgressArchive, Report, ResourceRating, Review, Task, VocabularyItem, WorkspaceState } from "@/lib/types";

const STORAGE_KEY = "cybercoach:v1";
const LEGACY_STORAGE_KEY = "cyber-career-os:v1";
const WORKSPACE_ID = "cybercoach";
const LEGACY_WORKSPACE_ID = "career-os";

interface WorkspaceContextValue extends WorkspaceState {
  updateNorth: (update: (state: NorthState) => NorthState) => void;
  ready: boolean;
  syncMode: "local" | "firebase";
  authStatus: "loading" | "signed_out" | "signed_in" | "local";
  userEmail: string | null;
  updateTask: (id: string, patch: Partial<Task>) => void;
  setDailyMission: (id: string) => void;
  addFocusSession: (session: FocusSession) => void;
  addLab: (lab: Lab) => void;
  updateLab: (id: string, patch: Partial<Lab>) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  replaceTasks: (tasks: Task[], summary: string) => void;
  addReview: (review: Review) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  saveCertification: (certification: Certification) => void;
  updatePortfolioProject: (id: string, patch: Partial<PortfolioProject>) => void;
  addReport: (report: Report) => void;
  addVocabulary: (item: VocabularyItem) => void;
  addCoachMessage: (message: CoachMessage) => void;
  queueCoachActions: (messageId: string, actions: CoachAction[]) => void;
  applyPendingActions: (pendingActionId: string) => void;
  dismissPendingActions: (pendingActionId: string) => void;
  undoActionBatch: (historyId: string) => void;
  completeOnboarding: (onboarding: Omit<CoachingOnboarding, "completedAt">) => void;
  completeInitialSetup: (input: InitialSetupInput) => void;
  saveCheckin: (checkin: Omit<DailyCheckin, "id" | "date">) => void;
  updateCoachingPreferences: (patch: Partial<WorkspaceState["coaching"]["preferences"]>) => void;
  updateMilestone: (id: string, status: WorkspaceState["coaching"]["milestones"][number]["status"]) => void;
  resetProgress: (reason: ProgressArchive["reason"]) => void;
  recordResourceUse: (resourceId: string, taskId: string) => void;
  rateResource: (resourceId: string, taskId: string, rating: ResourceRating) => void;
  setSourceLock: (skill: string, resourceId: string) => void;
  addPortfolioProject: (project: PortfolioProject) => void;
  addJob: (job: JobPosting) => void;
  addApplication: (application: JobApplication) => void;
  updateApplication: (id: string, patch: Partial<JobApplication>) => void;
  addInterview: (attempt: InterviewAttempt) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function normalizeState(saved: Partial<WorkspaceState>): WorkspaceState {
  return {
    ...demoState,
    ...saved,
    certifications: saved.certifications ?? [],
    coachMessages: saved.coachMessages ?? [],
    resources: saved.resources ?? demoState.resources,
    resourceHistory: saved.resourceHistory ?? [],
    sourceLocks: saved.sourceLocks ?? demoState.sourceLocks,
    coaching: {
      ...demoState.coaching,
      ...saved.coaching,
      milestones: saved.coaching?.milestones ?? demoState.coaching.milestones,
      checkins: saved.coaching?.checkins ?? [],
      pendingActions: saved.coaching?.pendingActions ?? [],
      actionHistory: saved.coaching?.actionHistory ?? [],
      archives: saved.coaching?.archives ?? [],
      preferences: { ...demoState.coaching.preferences, ...saved.coaching?.preferences },
    },
    portfolio: saved.portfolio ?? [], jobs: saved.jobs ?? [], applications: saved.applications ?? [], interviews: saved.interviews ?? [],
  };
}

function applyActions(state: WorkspaceState, actions: CoachAction[]): WorkspaceState {
  let next = state;
  for (const action of actions) {
    if (action.type === "update_task_status") {
      next = { ...next, tasks: next.tasks.map((task) => task.id === action.taskId ? { ...task, status: action.status, completedAt: action.status === "completed" ? new Date().toISOString() : undefined } : task) };
    } else if (action.type === "edit_task") {
      next = { ...next, tasks: next.tasks.map((task) => task.id === action.taskId ? { ...task, ...action.patch } : task) };
    } else if (action.type === "create_task") {
      next = { ...next, tasks: [...next.tasks, { ...action.task, id: crypto.randomUUID(), weeklyPlanId: next.weeklyPlan.id, status: "pending", isDailyMission: false }] };
    } else if (action.type === "remove_task") {
      next = { ...next, tasks: next.tasks.filter((task) => task.id !== action.taskId) };
    } else if (action.type === "set_daily_mission") {
      next = { ...next, tasks: next.tasks.map((task) => ({ ...task, isDailyMission: task.id === action.taskId })) };
    } else if (action.type === "update_weekly_plan") {
      next = { ...next, weeklyPlan: { ...next.weeklyPlan, ...action.patch } };
    }
  }
  return next;
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WorkspaceState>(() => createEmptyWorkspaceState());
  const [ready, setReady] = useState(false);
  const [syncMode, setSyncMode] = useState<"local" | "firebase">("local");
  const [authStatus, setAuthStatus] = useState<"loading" | "signed_out" | "signed_in" | "local">("loading");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const firebase = useMemo(() => getFirebase(), []);
  const mutate = useCallback((fn: (current: WorkspaceState) => WorkspaceState) => setState(current => {
    let next = fn(current);
    if (!next.north) return next;
    if (next.north !== current.north) {
      next = { ...next, tasks: next.tasks.map(task => {
        const linked = next.north!.tasks.find(t => t.id === task.id);
        if (!linked) return task;
        return { ...task, title: linked.title, duration: linked.minutes, status: linked.status === "done" ? "completed" : linked.status === "partial" ? "partial" : linked.status === "skipped" || linked.status === "cancelled" ? "failed" : "pending", completedAt: linked.status === "done" ? task.completedAt ?? new Date().toISOString() : undefined };
      }) };
    } else if (next.tasks !== current.tasks) {
      const migrated = initializeNorth(next);
      const oldIds = new Set(current.tasks.map(t => t.id));
      next = { ...next, north: { ...next.north, tasks: [
        ...next.north.tasks.filter(t => !oldIds.has(t.id)),
        ...migrated.tasks.map(t => {
          const existing = next.north!.tasks.find(n => n.id === t.id);
          return existing ? { ...existing, title: t.title, minutes: t.minutes, status: t.status } : t;
        }),
      ] } };
    }
    if (next.focusSessions !== current.focusSessions) {
      const migrated = initializeNorth(next);
      next = { ...next, north: { ...next.north!, activities: [...next.north!.activities, ...migrated.activities.filter(a => !next.north!.activities.some(n => n.id === a.id))] } };
    }
    return next;
  }), []);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    const hydrate = async () => {
      if (!firebase) {
        const stored = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
        if (stored) try { setState(normalizeState(JSON.parse(stored))); } catch { window.localStorage.removeItem(STORAGE_KEY); }
        setAuthStatus("local");
        if (active) setReady(true);
        return;
      }
      unsubscribe = onAuthStateChanged(firebase.auth, async (user) => {
        if (!active) return;
        setReady(false);
        if (!user) {
          userIdRef.current = null;
          setUserEmail(null);
          setAuthStatus("signed_out");
          setSyncMode("local");
          setState(createEmptyWorkspaceState());
          setReady(true);
          return;
        }
        userIdRef.current = user.uid;
        setUserEmail(user.email);
        setAuthStatus("signed_in");
        setSyncMode("firebase");
        const ref = doc(firebase.db, "users", user.uid, "workspaces", WORKSPACE_ID);
        let snapshot = await getDoc(ref);
        if (!snapshot.exists()) {
          const legacy = await getDoc(doc(firebase.db, "users", user.uid, "workspaces", LEGACY_WORKSPACE_ID));
          if (legacy.exists()) {
            await setDoc(ref, legacy.data());
            snapshot = await getDoc(ref);
          }
        }
        if (!active) return;
        if (snapshot.exists()) setState(normalizeState(snapshot.data().state as Partial<WorkspaceState>));
        else {
          const emptyState = createEmptyWorkspaceState();
          setState(emptyState);
          await setDoc(ref, { state: JSON.parse(JSON.stringify(emptyState)), updatedAt: new Date().toISOString() }, { merge: true });
        }
        setReady(true);
      });
    };
    void hydrate();
    return () => { active = false; unsubscribe(); };
  }, [firebase]);

  useEffect(() => {
    if (!ready) return;
    if (!firebase || !userIdRef.current) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return;
    }
    const timeout = window.setTimeout(() => {
      if (firebase && userIdRef.current) {
        setDoc(doc(firebase.db, "users", userIdRef.current, "workspaces", WORKSPACE_ID), { state: JSON.parse(JSON.stringify(state)), updatedAt: new Date().toISOString() }, { merge: true }).catch(() => toast.error("Firebase eşitlemesi başarısız oldu. Mevcut ekranın değişmedi."));
      } else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [firebase, ready, state]);

  const value = useMemo<WorkspaceContextValue>(() => ({
    updateNorth: (update) => mutate(current => ({ ...current, north: update(current.north ?? initializeNorth(current)) })),
    ...state,
    ready,
    syncMode,
    authStatus,
    userEmail,
    updateTask: (id, patch) => mutate((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === id ? { ...task, ...patch } : task) })),
    setDailyMission: (id) => mutate((current) => ({ ...current, tasks: current.tasks.map((task) => ({ ...task, isDailyMission: task.id === id })) })),
    addFocusSession: (session) => mutate((current) => {
      const task = current.tasks.find((item) => item.id === session.taskId);
      const ids = [task?.theoryResourceId, task?.practicalResourceId].filter((id): id is string => Boolean(id));
      return { ...current, focusSessions: [session, ...current.focusSessions], resourceHistory: current.resourceHistory.map((usage) => ids.includes(usage.resourceId) && usage.taskId === session.taskId ? { ...usage, completed: session.status === "completed" } : usage), resources: current.resources.map((resource) => ids.includes(resource.id) && session.status === "completed" ? { ...resource, completedTaskCount: resource.completedTaskCount + 1 } : resource) };
    }),
    addLab: (lab) => mutate((current) => ({ ...current, labs: [lab, ...current.labs] })),
    updateLab: (id, patch) => mutate((current) => ({ ...current, labs: current.labs.map((lab) => lab.id === id ? { ...lab, ...patch } : lab) })),
    updateProfile: (patch) => mutate((current) => {
      const profile = { ...current.profile, ...patch };
      const primaryAreaId = current.north?.areas.some(area => area.id === "primary-goal") ? "primary-goal" : "cyber";
      const north = current.north ? { ...current.north, weeklyHours: patch.weeklyCapacityHours ?? current.north.weeklyHours, areas: current.north.areas.map(area => area.id === primaryAreaId ? { ...area, name: patch.primaryFocus?.trim() || area.name, goal: patch.goal ?? area.goal, weeklyMinutes: patch.weeklyCapacityHours !== undefined ? patch.weeklyCapacityHours * 60 : area.weeklyMinutes } : area) } : current.north;
      return { ...current, profile, north, weeklyPlan: patch.universityMode ? { ...current.weeklyPlan, mode: patch.universityMode, targetBlocks: patch.universityMode === "exam" ? 4 : patch.universityMode === "free" ? 14 : 10 } : current.weeklyPlan };
    }),
    replaceTasks: (tasks, summary) => mutate((current) => ({ ...current, tasks, weeklyPlan: { ...current.weeklyPlan, aiSummary: summary, targetBlocks: tasks.length } })),
    addReview: (review) => mutate((current) => ({ ...current, reviews: [review, ...current.reviews] })),
    updateNote: (id, patch) => mutate((current) => ({ ...current, notes: current.notes.map(note => note.id === id ? { ...note, ...patch } : note) })),
    saveCertification: (certification) => mutate((current) => ({ ...current, certifications: [...current.certifications.filter(item => item.id !== certification.id), certification] })),
    updatePortfolioProject: (id, patch) => mutate((current) => ({ ...current, portfolio: current.portfolio.map(item => item.id === id ? { ...item, ...patch } : item) })),
    addNote: (note) => mutate((current) => ({ ...current, notes: [note, ...current.notes] })),
    addReport: (report) => mutate((current) => ({ ...current, reports: [report, ...current.reports] })),
    addVocabulary: (item) => mutate((current) => ({ ...current, vocabulary: [item, ...current.vocabulary] })),
    addCoachMessage: (message) => mutate((current) => ({ ...current, coachMessages: [...current.coachMessages, message] })),
    queueCoachActions: (messageId, actions) => mutate((current) => actions.length ? { ...current, coaching: { ...current.coaching, pendingActions: [...current.coaching.pendingActions, { id: crypto.randomUUID(), messageId, createdAt: new Date().toISOString(), actions }] } } : current),
    applyPendingActions: (pendingActionId) => mutate((current) => {
      const pending = current.coaching.pendingActions.find((item) => item.id === pendingActionId);
      if (!pending) return current;
      const before = { tasks: current.tasks, weeklyPlan: current.weeklyPlan };
      const next = applyActions(current, pending.actions);
      return { ...next, coaching: { ...next.coaching, pendingActions: next.coaching.pendingActions.filter((item) => item.id !== pendingActionId), actionHistory: [{ id: crypto.randomUUID(), pendingActionId, appliedAt: new Date().toISOString(), summaries: pending.actions.map((action) => action.summary), before }, ...next.coaching.actionHistory] }, coachMessages: next.coachMessages.map((message) => message.id === pending.messageId ? { ...message, actionsApplied: true } : message) };
    }),
    dismissPendingActions: (pendingActionId) => mutate((current) => ({ ...current, coaching: { ...current.coaching, pendingActions: current.coaching.pendingActions.filter((item) => item.id !== pendingActionId) } })),
    undoActionBatch: (historyId) => mutate((current) => {
      const history = current.coaching.actionHistory.find((item) => item.id === historyId && !item.revertedAt);
      if (!history) return current;
      return { ...current, tasks: history.before.tasks, weeklyPlan: history.before.weeklyPlan, coaching: { ...current.coaching, actionHistory: current.coaching.actionHistory.map((item) => item.id === historyId ? { ...item, revertedAt: new Date().toISOString() } : item) } };
    }),
    completeOnboarding: (onboarding) => mutate((current) => ({ ...current, coaching: { ...current.coaching, onboarding: { ...onboarding, completedAt: new Date().toISOString() } } })),
    completeInitialSetup: (input) => setState(createPersonalizedWorkspace(input)),
    saveCheckin: (checkin) => mutate((current) => {
      const date = dayKey();
      const item: DailyCheckin = { ...checkin, id: crypto.randomUUID(), date };
      return { ...current, north: current.north ? { ...current.north, energy: { date, level: checkin.energy === "medium" ? "normal" : checkin.energy } } : current.north, coaching: { ...current.coaching, checkins: [item, ...current.coaching.checkins.filter((existing) => existing.date !== date)] } };
    }),
    updateCoachingPreferences: (patch) => mutate((current) => ({ ...current, coaching: { ...current.coaching, preferences: { ...current.coaching.preferences, ...patch } } })),
    updateMilestone: (id, status) => mutate((current) => ({ ...current, coaching: { ...current.coaching, milestones: current.coaching.milestones.map((milestone) => milestone.id === id ? { ...milestone, status } : milestone) } })),
    resetProgress: (reason) => mutate((current) => {
      const archive: ProgressArchive = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), reason, completedTasks: current.tasks.filter((task) => task.status === "completed").length, focusMinutes: current.focusSessions.reduce((sum, session) => sum + session.durationMinutes, 0), labsCompleted: current.labs.filter((lab) => lab.status === "completed").length, coachMessages: current.coachMessages.length };
      if (reason === "full_reset") return createEmptyWorkspaceState();
      const profile = current.profile;
      const onboarding = current.coaching.onboarding;
      const resetSkills = current.skills.map((skill) => ({ ...skill, score: 0, previousScore: 0, evidence: "Henüz doğrulanmış kanıt yok." }));
      return {
        ...demoState,
        profile,
        tasks: current.tasks.map((task) => ({ ...task, status: "pending", isDailyMission: false, completedAt: undefined, reflection: undefined })),
        focusSessions: [],
        labs: [],
        skills: resetSkills,
        notes: [],
        reports: [],
        portfolio: [],
        jobs: [],
        applications: [],
        interviews: [],
        sourceLocks: current.sourceLocks,
        resources: demoState.resources,
        coaching: { ...demoState.coaching, onboarding, archives: [archive, ...current.coaching.archives].slice(0, 10), preferences: current.coaching.preferences },
      };
    }),
    recordResourceUse: (resourceId, taskId) => mutate((current) => {
      const today = new Date().toISOString().slice(0, 10);
      const duplicate = current.resourceHistory.some((usage) => usage.resourceId === resourceId && usage.taskId === taskId && usage.usedAt.slice(0, 10) === today);
      if (duplicate) return current;
      return { ...current, resourceHistory: [{ id: crypto.randomUUID(), resourceId, taskId, usedAt: new Date().toISOString(), completed: false }, ...current.resourceHistory], resources: current.resources.map((resource) => resource.id === resourceId ? { ...resource, usageCount: resource.usageCount + 1, lastUsedAt: new Date().toISOString() } : resource) };
    }),
    rateResource: (resourceId, taskId, rating) => mutate((current) => ({ ...current, resourceHistory: current.resourceHistory.map((usage, index, all) => usage.resourceId === resourceId && usage.taskId === taskId && all.findIndex((item) => item.resourceId === resourceId && item.taskId === taskId) === index ? { ...usage, rating } : usage), resources: current.resources.map((resource) => resource.id === resourceId ? { ...resource, rating } : resource) })),
    setSourceLock: (skill, resourceId) => mutate((current) => ({ ...current, sourceLocks: { ...current.sourceLocks, [skill]: resourceId } })),
    addPortfolioProject: (project) => mutate((current) => ({ ...current, portfolio: [project, ...current.portfolio] })),
    addJob: (job) => mutate((current) => ({ ...current, jobs: [job, ...current.jobs] })),
    addApplication: (application) => mutate((current) => ({ ...current, applications: [application, ...current.applications] })),
    updateApplication: (id, patch) => mutate((current) => ({ ...current, applications: current.applications.map((application) => application.id === id ? { ...application, ...patch } : application) })),
    addInterview: (attempt) => mutate((current) => ({ ...current, interviews: [attempt, ...current.interviews] })),
  }), [authStatus, mutate, ready, state, syncMode, userEmail]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return context;
}
