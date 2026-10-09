import type { EJobRunStatus } from "./eJobRunStatus";
import type { IJobRunError } from "./iJobRunError";
import type { IJobRunOutputDto } from "./iJobRunOutputDto";

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
  /**
   * Агент, у воркера которого выполняется внешняя задача.
   * @nullable
   */
  agentId: string | null;
  /**
   * Воркер агента, выполняющий внешнюю задачу.
   * @nullable
   */
  worker: string | null;
  /**
   * Тип задачи воркера внешней задачи (`echo.long`).
   * @nullable
   */
  jobType: string | null;
  /**
   * Файлы итога внешней задачи — ссылки на скачивание; нет файлов — `null`.
   * @nullable
   */
  outputs: IJobRunOutputDto[] | null;
  /**
   * Срок внешней задачи.
   * @nullable
   */
  deadlineAt: string | null;
  /** @nullable */
  startedAt: string | null;
  /** @nullable */
  finishedAt: string | null;
  createdAt: string;
}
