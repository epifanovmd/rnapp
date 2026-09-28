import type { RecordStringString } from "./recordStringString";

/**
 * Воркер очереди в статусе.
 */
export interface IWorkerInstanceDto {
  name: string;
  lastSeenAt: string;
  meta: RecordStringString;
}
