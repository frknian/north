export type UniversityMode = "normal" | "exam" | "free";
export type TaskStatus = "pending" | "in_progress" | "completed" | "partial" | "failed";
export type LabStatus = "planned" | "attempted" | "completed";
export type Difficulty = "easy" | "medium" | "hard";
export type ResourceType = "documentation" | "course" | "lab" | "challenge" | "vulnerable-machine" | "tool" | "article" | "reference";
export type ResourcePriority = "primary" | "secondary" | "optional";
export type ResourceRating = "very_useful" | "useful" | "neutral" | "not_useful";
export type EnergyLevel = "low" | "medium" | "high";
export type CheckinOutcome = "ready" | "stuck" | "rest" | "completed";

export interface Profile {
  id: string;
  fullName: string;
  goal: string;
  track: string;
  primaryFocus: string;
  secondaryFocus: string;
  futureFocus: string;
  universityMode: UniversityMode;
  preferredSessionMinutes: 45 | 50 | 60;
  weeklyCapacityHours: number;
}

export interface Task {
  id: string;
  weeklyPlanId: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  difficulty: Difficulty;
  objectives: string[];
  successCriteria: string[];
  recommendedResources: string[];
  theoryResourceId?: string;
  practicalResourceId?: string;
  optionalReferenceId?: string;
  outputRequirement: string;
  aiHelpLimit: 0 | 1 | 2 | 3 | 4;
  status: TaskStatus;
  isDailyMission: boolean;
  completedAt?: string;
  reflection?: Reflection;
}

export interface Reflection {
  completed: string;
  struggled: string;
  usedAi: boolean;
  aiLevel: 0 | 1 | 2 | 3 | 4;
  walkthroughUsed: boolean;
  learned: string;
}

export interface WeeklyPlan {
  id: string;
  weekStart: string;
  mode: UniversityMode;
  targetBlocks: number;
  aiSummary: string;
}

export interface FocusSession {
  id: string;
  taskId: string;
  durationMinutes: number;
  status: TaskStatus;
  notes: string;
  completedAt: string;
}

export interface Lab {
  id: string;
  name: string;
  platform: string;
  difficulty: Difficulty;
  category: string;
  date: string;
  duration: number;
  status: LabStatus;
  target: string;
  recon: string;
  enumeration: string;
  attackSurface: string;
  attempts: string;
  exploitation: string;
  privilegeEscalation: string;
  result: string;
  stuck: string;
  learned: string;
  aiAssistanceLevel: 0 | 1 | 2 | 3 | 4;
  walkthroughUsed: boolean;
  notes: string;
  keyLearnings: string[];
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  score: number;
  previousScore: number;
  evidence: string;
  weight: number;
}

export interface Review {
  id: string;
  period: "weekly" | "monthly";
  title: string;
  date: string;
  summary: string;
  strongestArea: string;
  weakestArea: string;
  totalMinutes: number;
  completedTasks: number;
  labsCompleted: number;
  independentSolveRate: number;
}

export interface Note {
  id: string;
  title: string;
  category: string;
  content: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  title: string;
  severity: "Info" | "Low" | "Medium" | "High" | "Critical";
  description: string;
  evidence: string;
  impact: string;
  steps: string;
  remediation: string;
  updatedAt: string;
}

export interface VocabularyItem {
  id: string;
  term: string;
  meaning: string;
  example: string;
}

export interface Resource {
  id: string;
  title: string;
  provider: string;
  category: string;
  subcategory: string;
  url: string;
  resourceType: ResourceType;
  difficulty: Difficulty;
  estimatedTime: string;
  isFree: boolean;
  language: string;
  description: string;
  tags: string[];
  recommendedForSkills: string[];
  active: boolean;
  priority: ResourcePriority;
  usageCount: number;
  completedTaskCount: number;
  rating?: ResourceRating;
  lastUsedAt?: string;
}

export interface ResourceUsage {
  id: string;
  resourceId: string;
  taskId: string;
  usedAt: string;
  completed: boolean;
  rating?: ResourceRating;
}

export type CoachAction =
  | { type: "update_task_status"; taskId: string; status: TaskStatus; summary: string }
  | { type: "edit_task"; taskId: string; patch: Partial<Pick<Task, "title" | "description" | "duration" | "difficulty" | "theoryResourceId" | "practicalResourceId" | "optionalReferenceId" | "outputRequirement" | "aiHelpLimit">>; summary: string }
  | { type: "create_task"; task: Pick<Task, "title" | "description" | "category" | "duration" | "difficulty" | "objectives" | "successCriteria" | "recommendedResources" | "theoryResourceId" | "practicalResourceId" | "optionalReferenceId" | "outputRequirement" | "aiHelpLimit">; summary: string }
  | { type: "remove_task"; taskId: string; summary: string }
  | { type: "set_daily_mission"; taskId: string; summary: string }
  | { type: "update_weekly_plan"; patch: Partial<Pick<WeeklyPlan, "mode" | "targetBlocks" | "aiSummary">>; summary: string };

export interface CoachMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  generationId?: string;
  model?: string;
  totalTokens?: number;
  actions?: CoachAction[];
  actionsApplied?: boolean;
  failed?: boolean;
}

export interface CoachingOnboarding {
  completedAt: string;
  currentLevel: "beginner" | "foundation" | "intermediate";
  englishLevel: "basic" | "working" | "comfortable";
  labAccess: "browser" | "local_vm" | "both";
  preferredStyle: "guided" | "balanced" | "independent";
  constraints: string;
}

export interface Milestone {
  id: string;
  title: string;
  horizonDays: 30 | 60 | 90;
  description: string;
  successCriteria: string[];
  status: "upcoming" | "active" | "completed";
}

export interface DailyCheckin {
  id: string;
  date: string;
  availableMinutes: 30 | 45 | 60 | 90;
  energy: EnergyLevel;
  outcome: CheckinOutcome;
  blocker?: string;
  note?: string;
}

export interface PendingCoachAction {
  id: string;
  messageId: string;
  createdAt: string;
  actions: CoachAction[];
}

export interface CoachActionHistory {
  id: string;
  pendingActionId: string;
  appliedAt: string;
  summaries: string[];
  before: Pick<WorkspaceState, "tasks" | "weeklyPlan">;
  revertedAt?: string;
}

export interface ProgressArchive {
  id: string;
  createdAt: string;
  reason: "progress_reset" | "full_reset";
  completedTasks: number;
  focusMinutes: number;
  labsCompleted: number;
  coachMessages: number;
}

export interface CoachingPreferences {
  dailyReminderEnabled: boolean;
  weeklyReviewReminderEnabled: boolean;
  dailyAiLimit: number;
  aiUsage: { date: string; count: number };
}

export interface CoachingState {
  onboarding?: CoachingOnboarding;
  milestones: Milestone[];
  checkins: DailyCheckin[];
  pendingActions: PendingCoachAction[];
  actionHistory: CoachActionHistory[];
  archives: ProgressArchive[];
  preferences: CoachingPreferences;
}

export interface PortfolioProject { id: string; title: string; url?: string; description: string; skills: string[]; readmeQuality: 0 | 1 | 2 | 3 | 4 | 5; securityRelevance: 0 | 1 | 2 | 3 | 4 | 5; lastCommitAt?: string; status: "idea" | "building" | "published"; }
export interface JobPosting { id: string; company: string; position: string; url?: string; text: string; addedAt: string; requiredSkills: string[]; niceToHave: string[]; matchScore: number; missingSkills: string[]; analysis?: string; }
export interface JobApplication { id: string; company: string; position: string; url?: string; appliedAt: string; stage: "saved" | "applied" | "interview" | "offer" | "rejected"; remote: "remote" | "hybrid" | "onsite"; salary?: string; contact?: string; notes?: string; rejectionReason?: string; }
export interface InterviewAttempt { id: string; role: "hr" | "junior_security" | "pentest" | "networking" | "linux" | "active_directory" | "cloud"; language: "tr" | "en"; question: string; answer: string; score?: number; feedback?: string; createdAt: string; }

export interface WorkspaceState {
  profile: Profile;
  weeklyPlan: WeeklyPlan;
  tasks: Task[];
  focusSessions: FocusSession[];
  labs: Lab[];
  skills: Skill[];
  reviews: Review[];
  notes: Note[];
  reports: Report[];
  vocabulary: VocabularyItem[];
  coachMessages: CoachMessage[];
  resources: Resource[];
  resourceHistory: ResourceUsage[];
  sourceLocks: Record<string, string>;
  coaching: CoachingState;
  portfolio: PortfolioProject[];
  jobs: JobPosting[];
  applications: JobApplication[];
  interviews: InterviewAttempt[];
}
