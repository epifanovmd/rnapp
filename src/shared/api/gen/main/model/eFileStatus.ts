/**
 * Состояние файла.
 */
export type EFileStatus = (typeof EFileStatus)[keyof typeof EFileStatus];

export const EFileStatus = {
  pending: "pending",
  processing: "processing",
  ready: "ready",
  failed: "failed",
} as const;
