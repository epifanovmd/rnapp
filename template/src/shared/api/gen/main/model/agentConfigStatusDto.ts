import type { IAgentErrorDto } from "./iAgentErrorDto";

/**
 * Статус ключа настроек воркера на агенте.
 */
export interface AgentConfigStatusDto {
  agentId: string;
  worker: string;
  key: string;
  /**
   * Желаемая версия; `null` — ключ удалён, агент ещё не удалил.
   * @nullable
   */
  version: number | null;
  /** Версия на диске агента. */
  delivered?: number;
  /** Последняя версия, применённая воркером. */
  applied?: number;
  /**
   * `pending` | `applying` | `applied` | `failed` | `deleting`; `deleted` —
   * агент удалил ключ (только в событии сокета `agent:config`).
   */
  state: string;
  error?: IAgentErrorDto;
  updatedAt?: number;
}
