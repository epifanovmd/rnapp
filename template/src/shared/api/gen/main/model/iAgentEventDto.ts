/**
 * Событие воркера.
 */
export interface IAgentEventDto {
  /** Id сообщения агента. */
  id: string;
  agentId: string;
  worker: string;
  type: string;
  data?: unknown;
  /** Когда случилось на узле, мс. */
  at: number;
  /** Когда принято, мс. */
  receivedAt: number;
  /** `data` не подошло под схему события из манифеста воркера: замечания. */
  problems?: string[];
}
