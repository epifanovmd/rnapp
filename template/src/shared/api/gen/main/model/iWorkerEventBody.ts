/**
 * Событие воркера.
 */
export interface IWorkerEventBody {
  /** Тип события в пределах очереди: `epoch`. */
  type: string;
  data?: unknown;
}
