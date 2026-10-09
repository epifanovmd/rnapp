/**
 * Проблема агента.
 */
export interface AgentAlertDto {
  /** Ключ в пределах агента: `offline`, `workerDown:<воркер>`, … */
  key: string;
  agentId: string;
  agentName: string;
  /** `offline` | `workerDown` | `workerInvalid` | `workerUnhealthy` | `configFailed`. */
  type: string;
  worker?: string;
  configKey?: string;
  message: string;
  /** С какого времени, мс. */
  since: number;
  /** В событии: `true` — началась, `false` — закончилась. */
  active?: boolean;
}
