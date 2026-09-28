import type { EJobRunStatus } from "./eJobRunStatus";
import type { IJobRunError } from "./iJobRunError";

export interface JobRunDto {
  /** Id задачи (совпадает с id pg-boss). */
  id: string;
  queue: string;
  status: EJobRunStatus;
  title: string;
  /** Прогресс 0..1. */
  progress: number;
  /** @nullable */
  progressText: string | null;
  /** Последние строки лога. */
  logTail: string[];
  result: unknown;
  error: IJobRunError | null;
  /** @nullable */
  ownerId: string | null;
  /** @nullable */
  scopeType: string | null;
  /** @nullable */
  scopeId: string | null;
  /** Номер попытки, с 0. */
  attempt: number;
  cancelRequested: boolean;
  /** Запрошена штатная досрочная остановка. */
  stopRequested: boolean;
  /** @nullable */
  startedAt: string | null;
  /** @nullable */
  finishedAt: string | null;
  createdAt: string;
}
