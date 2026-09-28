/**
 * Статус видимой задачи.
 */
export type EJobRunStatus = (typeof EJobRunStatus)[keyof typeof EJobRunStatus];

export const EJobRunStatus = {
  queued: "queued",
  running: "running",
  completed: "completed",
  failed: "failed",
  cancelled: "cancelled",
} as const;
