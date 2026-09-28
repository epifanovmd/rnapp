import type { IWorkerInfoBody } from "./iWorkerInfoBody";

/**
 * Запрос задач внешним воркером.
 */
export interface IClaimJobsBody {
  /** Очереди, из которых воркер готов брать задачи. */
  queues: string[];
  /** Сколько задач взять за раз (1..10, по умолчанию 1). */
  max?: number;
  /** Long-poll: сколько ждать задач, если их нет (0..25 с). */
  waitSeconds?: number;
  /** Кто берёт задачи — для статуса воркеров. */
  worker?: IWorkerInfoBody;
}
