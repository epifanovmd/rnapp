/**
 * Тело перезапуска и обновления воркера.
 */
export interface IAgentWorkerActionBody {
  /** Заменить сразу, не дожидаясь окончания работы воркера (`busy`). */
  force?: boolean;
}
