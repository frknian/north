export type UniversityMode = "normal" | "exam" | "free";
export type TaskStatus = "pending" | "in_progress" | "completed" | "partial" | "failed";
export type LabStatus = "planned" | "attempted" | "completed";
export type Difficulty = "easy" | "medium" | "hard";
export type ResourceType = "documentation" | "course" | "lab" | "challenge" | "vulnerable-machine" | "tool" | "article" | "reference";
export type ResourcePriority = "primary" | "secondary" | "optional";
export type ResourceRating = "very_useful" | "useful" | "neutral" | "not_useful";
export type EnergyLevel = "low" | "medium" | "high";
export type CheckinOutcome = "ready" | "stuck" | "rest" | "completed";

export type AgeRange = "16-18" | "19-24" | "25-32" | "33-40";
export type LifeSituation = "high_school" | "university" | "working" | "career_changer" | "other";

export function calculateAgeFromBirthDate(birthDate?: string | null): number {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

export function birthDateToAgeRange(birthDate?: string | null): AgeRange {
  const age = calculateAgeFromBirthDate(birthDate);
  if (age <= 18) return "16-18";
  if (age <= 24) return "19-24";
  if (age <= 32) return "25-32";
  return "33-40";
}

export interface LearningPreferences {
  language: "tr" | "en" | "both";
  cost: "free_only" | "paid_allowed";
  format: ("video" | "reading" | "practice" | "interactive")[];
  weeklyBudget: number;
}

export type DurationUnit = "day" | "week" | "month" | "year";

export interface AreaGoalSetting {
  goal: string;
  targetWeeks: number;
  durationValue?: number;
  durationUnit?: DurationUnit;
  level?: string;
  levelRating?: number;
}

export function durationToTargetWeeks(value: number, unit: DurationUnit): number {
  const safeVal = Math.max(1, value);
  switch (unit) {
    case "day":
      return Math.max(1, Math.round(safeVal / 7));
    case "week":
      return safeVal;
    case "month":
      return Math.max(1, Math.round(safeVal * 4.33));
    case "year":
      return Math.max(1, Math.round(safeVal * 52));
    default:
      return safeVal;
  }
}

export function formatDurationSummary(value?: number, unit?: DurationUnit, fallbackWeeks?: number): string {
  if (value && unit) {
    const targetW = durationToTargetWeeks(value, unit);
    if (unit === "week") {
      return `${value} hafta (~${value * 7} gün)`;
    }
    if (unit === "day") {
      return `${value} gün (~${targetW} hafta)`;
    }
    if (unit === "month") {
      return `${value} ay (~${targetW} hafta)`;
    }
    if (unit === "year") {
      return `${value} yıl (~${targetW} hafta)`;
    }
    return `${value} ${unit}`;
  }
  const w = fallbackWeeks ?? 12;
  return `${w} hafta (~${w * 7} gün)`;
}

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
  birthDate?: string;
  ageRange?: AgeRange;
  lifeSituation?: LifeSituation;
  learningPreferences?: LearningPreferences;
  interests?: string[];
  areaGoals?: Record<string, AreaGoalSetting>;
  university?: {
    isStudent: boolean;
    school?: string;
    department?: string;
    courses: { id: string; name: string; day: string; start: string; minutes: number }[];
  };
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
  taskType?: "deep_work" | "practice" | "problem_solving" | "lab" | "review" | "reading" | "creative" | "administrative" | "light";
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
  targetOs?: string;
  initialAccess?: string;
  retryAt?: string;
  missedPoints?: string[];
  skillsGained?: string[];
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
  nextReviewAt?: string;
  reviewIntervalDays?: number;
  reviewCount?: number;
  linkedSkill?: string;
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

export interface CoachResource {
  title: string;
  url: string;
  type: "video" | "article" | "documentation" | "course" | "practice" | "tool" | "book" | "other";
  description: string;
  isFree?: boolean;
  source?: string;
}

export interface CoachMessageAttachment {
  id: string;
  name: string;
  type: "image" | "pdf";
  url: string;
  size?: number;
}

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
  attachments?: CoachMessageAttachment[];
  resources?: CoachResource[];
}

export interface CoachingOnboarding {
  completedAt: string;
  currentLevel: "beginner" | "foundation" | "intermediate";
  englishLevel: "basic" | "working" | "comfortable";
  labAccess: "browser" | "local_vm" | "both";
  preferredStyle: "guided" | "balanced" | "independent";
  constraints: string;
  assessmentScore?: number;
  assessmentTotal?: number;
  assessmentBySkill?: Record<string, { correct: number; total: number }>;
}

export interface InitialSetupInput {
  fullName: string;
  goal: string;
  track: string;
  primaryFocus: string;
  interests: string[];
  areaGoals: Record<string, AreaGoalSetting>;
  isUniversityStudent: boolean;
  universitySchool: string;
  universityDepartment: string;
  universityCourses: { id: string; name: string; day: string; start: string; minutes: number }[];
  weeklyCapacityHours: number;
  preferredSessionMinutes: 45 | 50 | 60;
  englishLevel: CoachingOnboarding["englishLevel"];
  labAccess: CoachingOnboarding["labAccess"];
  preferredStyle: CoachingOnboarding["preferredStyle"];
  constraints: string;
  assessmentAnswers: Record<string, string>;
  birthDate?: string;
  ageRange?: AgeRange;
  lifeSituation?: LifeSituation;
  learningPreferences?: LearningPreferences;
}

export type MilestonePhase = "starter" | "mid_check" | "application" | "review" | "final_proof";

export interface Milestone {
  id: string;
  title: string;
  horizonDays: number;
  description: string;
  successCriteria: string[];
  status: "upcoming" | "active" | "completed";
  phase?: MilestonePhase;
  targetWeek?: number;
}

export interface FeedbackMemoryItem {
  id: string;
  category: "difficulty" | "resource" | "schedule_time" | "format" | "energy" | "other";
  signal: string;
  rule: string;
  enabled: boolean;
  createdAt: string;
}

export type DomainProofKind =
  | "notebook"
  | "dashboard"
  | "clinical_note"
  | "case_summary"
  | "citation_analysis"
  | "calculation"
  | "drawing"
  | "technical_report"
  | "github_link"
  | "game_analysis"
  | "exam_trial"
  | "other";

export interface DomainProof {
  id: string;
  areaId: string;
  title: string;
  kind: DomainProofKind;
  description: string;
  url?: string;
  notes?: string;
  fileSummary?: string;
  screenshotNote?: string;
  createdAt: string;
}

export type ExamType = "yks_tyt" | "kpss" | "banking" | "other";

export interface ExamSubjectScore {
  subjectId: string;
  subjectName: string;
  correct: number;
  incorrect: number;
  empty: number;
  net: number;
}

export interface WrongAnswerAnalysis {
  id: string;
  subjectId: string;
  topic: string;
  reason: "knowledge_gap" | "careless_mistake" | "time_pressure" | "misread";
  notes?: string;
  reviewDate?: string;
  reviewed?: boolean;
}

export interface TrialExam {
  id: string;
  title: string;
  date: string;
  examType: ExamType;
  totalNet: number;
  estimatedScore?: number;
  subjectScores: ExamSubjectScore[];
  wrongAnalyses: WrongAnswerAnalysis[];
  durationMinutes?: number;
  notes?: string;
}

export interface ExamProfile {
  id: string;
  examType: ExamType;
  title: string;
  examDate: string;
  targetScore?: number;
  targetNet?: number;
  trials: TrialExam[];
  activeSubjects: string[];
}

export interface CustomMetricEntry {
  id: string;
  areaId: string;
  date: string;
  metricName: string;
  amount: number;
  unit: string;
  notes?: string;
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

export interface CoachSessionArchive {
  id: string;
  startedAt: string;
  endedAt?: string;
  topic: string;
  messages: CoachMessage[];
}

export interface CoachingPreferences {
  dailyReminderEnabled: boolean;
  weeklyReviewReminderEnabled: boolean;
  dailyAiLimit: number;
  aiUsage: { date: string; count: number };
  clearChatOnClose?: boolean;
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
export interface JobApplication { cvVersion?: string; interviewAt?: string; followUpAt?: string; id: string; company: string; position: string; url?: string; appliedAt: string; stage: "saved" | "applied" | "interview" | "offer" | "rejected"; remote: "remote" | "hybrid" | "onsite"; salary?: string; contact?: string; notes?: string; rejectionReason?: string; }
export interface InterviewAttempt { id: string; role: "hr" | "junior_security" | "pentest" | "networking" | "linux" | "active_directory" | "cloud"; language: "tr" | "en"; question: string; answer: string; score?: number; feedback?: string; createdAt: string; }

export interface Certification { id: string; title: string; targetDate: string; sourceUrl: string; topics: { id: string; title: string; completed: boolean }[]; }

export interface WorkspaceState {
  north?: import("./north").NorthState;
  certifications: Certification[];
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
  coachSessionArchives?: CoachSessionArchive[];
  resources: Resource[];
  resourceHistory: ResourceUsage[];
  sourceLocks: Record<string, string>;
  coaching: CoachingState;
  portfolio: PortfolioProject[];
  jobs: JobPosting[];
  applications: JobApplication[];
  interviews: InterviewAttempt[];
  feedbackMemory?: FeedbackMemoryItem[];
  domainProofs?: DomainProof[];
  examProfiles?: ExamProfile[];
  customMetricEntries?: CustomMetricEntry[];
  companionSettings?: CompanionSettings;
}

export type CompanionColor =
  | "blue"
  | "purple"
  | "emerald"
  | "amber"
  | "rose"
  | "cyan"
  | "indigo"
  | "obsidian";

export type CompanionOutfit =
  | "none"
  | "scarf"
  | "glasses"
  | "headphones"
  | "hat"
  | "crown"
  | "cape"
  | "bandana";

export interface CompanionSettings {
  name: string;
  color: CompanionColor;
  outfit?: CompanionOutfit;
}

export interface PasswordRequirement {
  id: "length" | "upper" | "lower" | "special";
  label: string;
  met: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  hasMinLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasSpecial: boolean;
  score: number;
  requirements: PasswordRequirement[];
  errorMessage?: string;
}

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-ZÇĞİÖŞÜ]/.test(password);
  const hasLower = /[a-zçğıöşü]/.test(password);
  const hasSpecial = /[^A-Za-z0-9ÇĞİÖŞÜçğıöşü]/.test(password);

  const requirements: PasswordRequirement[] = [
    { id: "length", label: "En az 8 karakter", met: hasMinLength },
    { id: "upper", label: "Büyük harf (A-Z)", met: hasUpper },
    { id: "lower", label: "Küçük harf (a-z)", met: hasLower },
    { id: "special", label: "Özel karakter (!@#$% vb.)", met: hasSpecial },
  ];

  const score = requirements.filter((r) => r.met).length;
  const isValid = hasMinLength && hasUpper && hasLower && hasSpecial;

  let errorMessage: string | undefined;
  if (!isValid) {
    const missing = requirements.filter((r) => !r.met).map((r) => r.label);
    errorMessage = `Şifreniz şunları içermelidir: ${missing.join(", ")}.`;
  }

  return {
    isValid,
    hasMinLength,
    hasUpper,
    hasLower,
    hasSpecial,
    score,
    requirements,
    errorMessage,
  };
}
