/** Daily AI limits shown to users. Keep in sync with the perDay values passed to secureApiRequest. */
export const AI_LIMITS = {
  roadmap: 12,
  levelTest: 6,
  /** Shared across the quick AI tools (reviewer, planner, mentor, lab summary, interview, job analysis...). */
  tools: 80,
} as const;

