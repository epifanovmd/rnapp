import type { IWorkerEventBody } from "./iWorkerEventBody";

export interface IHeartbeatJobBody {
  attempt?: number;
  /** Прогресс 0..1. */
  progress?: number;
  text?: string;
  /** Новые строки лога. */
  log?: string[];
  /** События для хука очереди (`onEvent`): метрики эпохи и т. п. */
  events?: IWorkerEventBody[];
}
