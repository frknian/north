"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { demoState } from "@/lib/demo-data";
import { getFirebase } from "@/lib/firebase/client";
import type { CoachAction, CoachMessage, CoachingOnboarding, DailyCheckin, FocusSession, Lab, Note, Profile, ProgressArchive, Report, ResourceRating, Review, Task, VocabularyItem, WorkspaceState } from "@/lib/types";

const STORAGE_KEY = "cybercoach:v1";
const LEGACY_STORAGE_KEY = "cyber-career-os:v1";
const WORKSPACE_ID = "cybercoach";
const LEGACY_WORKSPACE_ID = "career-os";

interface WorkspaceContextValue extends WorkspaceState {
  ready: boolean;
  syncMode: "local" | "firebase";
  updateTask: (id: string, patch: Partial<Task>) => void;
  setDailyMission: (id: string) => void;
  addFocusSession: (session: FocusSession) => void;
  addLab: (lab: Lab) => void;
  updateLab: (id: string, patch: Partial<Lab>) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  replaceTasks: (tasks: Task[], summary: string) => void;
  addReview: (review: Review) => void;
  addNote: (note: Note) => void;
  addReport: (report: Report) => void;
  addVocabulary: (item: VocabularyItem) => void;
  addCoachMessage: (message: CoachMessage) => void;
  queueCoachActions: (messageId: string, actions: CoachAction[]) => void;
  applyPendingActions: (pendingActionId: string) => void;
  dismissPendingActions: (pendingActionId: string) => void;
  undoActionBatch: (historyId: string) => void;
  completeOnboarding: (onboarding: Omit<CoachingOnboarding, "completedAt">) => void;
  saveCheckin: (checkin: Omit<DailyCheckin, "id" | "date">) => void;
  updateCoachingPreferences: (patch: Partial<WorkspaceState["coaching"]["preferences"]>) => void;
  resetProgress: (reason: ProgressArchive["reason"]) => void;
  recordResourceUse: (resourceId: string, taskId: string) => void;
  rateResource: (resourceId: string, taskId: string, rating: ResourceRating) => void;
  setSourceLock: (skill: string, resourceId: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function normalizeState(saved: Partial<WorkspaceState>): WorkspaceState {
  return {
    ...demoState,
    ...saved,
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
  const [state, setState] = useState<WorkspaceState>(demoState);
  const [ready, setReady] = useState(false);
  const [syncMode, setSyncMode] = useState<"local" | "firebase">("local");
  const userIdRef = useRef<string | null>(null);
  const firebase = useMemo(() => getFirebase(), []);
  const mutate = useCallback((fn: (current: WorkspaceState) => WorkspaceState) => setState(fn), []);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    const hydrate = async () => {
      if (!firebase) {
        const stored = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
        if (stored) try { setState(normalizeState(JSON.parse(stored))); } catch { window.localStorage.removeItem(STORAGE_KEY); }
        if (active) setReady(true);
        return;
      }
      unsubscribe = onAuthStateChanged(firebase.auth, async (user) => {
        if (!active) return;
        if (!user) {
          userIdRef.current = null;
          setSyncMode("local");
          const stored = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
          if (stored) try { setState(normalizeState(JSON.parse(stored))); } catch { window.localStorage.removeItem(STORAGE_KEY); }
          setReady(true);
          return;
        }
        userIdRef.current = user.uid;
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
        else await setDoc(ref, { state: JSON.parse(JSON.stringify(demoState)), updatedAt: new Date().toISOString() });
        setReady(true);
      });
    };
    void hydrate();
    return () => { active = false; unsubscribe(); };
  }, [firebase]);

  useEffect(() => {
    if (!ready) return;
    const timeout = window.setTimeout(() => {
      if (firebase && userIdRef.current) {
        setDoc(doc(firebase.db, "users", userIdRef.current, "workspaces", WORKSPACE_ID), { state: JSON.parse(JSON.stringify(state)), updatedAt: new Date().toISOString() }, { merge: true }).catch(() => toast.error("Firebase eşitlemesi başarısız oldu. Mevcut ekranın değişmedi."));
      } else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [firebase, ready, state]);

  const value = useMemo<WorkspaceContextValue>(() => ({
    ...state,
    ready,
    syncMode,
    updateTask: (id, patch) => mutate((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === id ? { ...task, ...patch } : task) })),
    setDailyMission: (id) => mutate((current) => ({ ...current, tasks: current.tasks.map((task) => ({ ...task, isDailyMission: task.id === id })) })),
    addFocusSession: (session) => mutate((current) => {
      const task = current.tasks.find((item) => item.id === session.taskId);
      const ids = [task?.theoryResourceId, task?.practicalResourceId].filter((id): id is string => Boolean(id));
      return { ...current, focusSessions: [session, ...current.focusSessions], resourceHistory: current.resourceHistory.map((usage) => ids.includes(usage.resourceId) && usage.taskId === session.taskId ? { ...usage, completed: session.status === "completed" } : usage), resources: current.resources.map((resource) => ids.includes(resource.id) && session.status === "completed" ? { ...resource, completedTaskCount: resource.completedTaskCount + 1 } : resource) };
    }),
    addLab: (lab) => mutate((current) => ({ ...current, labs: [lab, ...current.labs] })),
    updateLab: (id, patch) => mutate((current) => ({ ...current, labs: current.labs.map((lab) => lab.id === id ? { ...lab, ...patch } : lab) })),
    updateProfile: (patch) => mutate((current) => ({ ...current, profile: { ...current.profile, ...patch }, weeklyPlan: patch.universityMode ? { ...current.weeklyPlan, mode: patch.universityMode, targetBlocks: patch.universityMode === "exam" ? 4 : patch.universityMode === "free" ? 14 : 10 } : current.weeklyPlan })),
    replaceTasks: (tasks, summary) => mutate((current) => ({ ...current, tasks, weeklyPlan: { ...current.weeklyPlan, aiSummary: summary, targetBlocks: tasks.length } })),
    addReview: (review) => mutate((current) => ({ ...current, reviews: [review, ...current.reviews] })),
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
    saveCheckin: (checkin) => mutate((current) => {
      const date = new Date().toISOString().slice(0, 10);
      const item: DailyCheckin = { ...checkin, id: crypto.randomUUID(), date };
      return { ...current, coaching: { ...current.coaching, checkins: [item, ...current.coaching.checkins.filter((existing) => existing.date !== date)] } };
    }),
    updateCoachingPreferences: (patch) => mutate((current) => ({ ...current, coaching: { ...current.coaching, preferences: { ...current.coaching.preferences, ...patch } } })),
    resetProgress: (reason) => mutate((current) => {
      const archive: ProgressArchive = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), reason, completedTasks: current.tasks.filter((task) => task.status === "completed").length, focusMinutes: current.focusSessions.reduce((sum, session) => sum + session.durationMinutes, 0), labsCompleted: current.labs.filter((lab) => lab.status === "completed").length, coachMessages: current.coachMessages.length };
      const profile = reason === "full_reset" ? demoState.profile : current.profile;
      const onboarding = reason === "full_reset" ? undefined : current.coaching.onboarding;
      return { ...demoState, profile, tasks: current.tasks.map((task) => ({ ...task, status: "pending", isDailyMission: false, completedAt: undefined, reflection: undefined })), sourceLocks: current.sourceLocks, resources: demoState.resources, coaching: { ...demoState.coaching, onboarding, archives: [archive, ...current.coaching.archives].slice(0, 10), preferences: current.coaching.preferences } };
    }),
    recordResourceUse: (resourceId, taskId) => mutate((current) => {
      const today = new Date().toISOString().slice(0, 10);
      const duplicate = current.resourceHistory.some((usage) => usage.resourceId === resourceId && usage.taskId === taskId && usage.usedAt.slice(0, 10) === today);
      if (duplicate) return current;
      return { ...current, resourceHistory: [{ id: crypto.randomUUID(), resourceId, taskId, usedAt: new Date().toISOString(), completed: false }, ...current.resourceHistory], resources: current.resources.map((resource) => resource.id === resourceId ? { ...resource, usageCount: resource.usageCount + 1, lastUsedAt: new Date().toISOString() } : resource) };
    }),
    rateResource: (resourceId, taskId, rating) => mutate((current) => ({ ...current, resourceHistory: current.resourceHistory.map((usage, index, all) => usage.resourceId === resourceId && usage.taskId === taskId && all.findIndex((item) => item.resourceId === resourceId && item.taskId === taskId) === index ? { ...usage, rating } : usage), resources: current.resources.map((resource) => resource.id === resourceId ? { ...resource, rating } : resource) })),
    setSourceLock: (skill, resourceId) => mutate((current) => ({ ...current, sourceLocks: { ...current.sourceLocks, [skill]: resourceId } })),
  }), [mutate, ready, state, syncMode]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return context;
}
