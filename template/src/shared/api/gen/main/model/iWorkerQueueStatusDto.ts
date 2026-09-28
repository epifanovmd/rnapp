import type { IWorkerInstanceDto } from "./iWorkerInstanceDto";

/**
 * Внешняя очередь: есть ли воркеры на связи.
 */
export interface IWorkerQueueStatusDto {
  queue: string;
  /** Хотя бы один воркер брал задачи в последние 90 с. */
  online: boolean;
  workers: IWorkerInstanceDto[];
}
