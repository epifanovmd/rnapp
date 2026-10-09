/**
 * Воркер агента узла кратко.
 */
export interface INodeAgentWorkerDto {
  name: string;
  /**
   * `starting` | `running` | `invalid` | `backoff` | `stopped`.
   * @nullable
   */
  state: string | null;
  /** @nullable */
  version: string | null;
  /**
   * Последний ответ `GET /health`: `ok`; нет ответа — `null`.
   * @nullable
   */
  healthy: boolean | null;
  /** Идёт долгая работа. */
  busy: boolean;
}
