import type { EJobRunStatus } from "./eJobRunStatus";
import type { ENodeJobKind } from "./eNodeJobKind";
import type { INodeJobDtoError } from "./iNodeJobDtoError";

/**
 * Последняя задача установки или удаления агента.
 */
export interface INodeJobDto {
  id: string;
  kind: ENodeJobKind;
  status: EJobRunStatus;
  progress: number;
  /** @nullable */
  progressText: string | null;
  /** @nullable */
  error: INodeJobDtoError;
  createdAt: string;
  /** @nullable */
  finishedAt: string | null;
}
